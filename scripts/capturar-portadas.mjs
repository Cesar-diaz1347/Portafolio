#!/usr/bin/env node
/**
 * Capturas uniformes de las demos para las tarjetas de «Proyectos».
 *
 * Abre cada demo en Edge headless sobre `vite preview` (puerto 4173), a 1280×800 y con
 * un perfil aislado, espera con un presupuesto de tiempo virtual de 8 s (lo mismo que
 * --virtual-time-budget=8000, pero vía CDP) y guarda dos tamaños por demo:
 *
 *   src/assets/proyectos/<slug>.webp      1280×800
 *   src/assets/proyectos/<slug>-800.webp   800×500 (para srcset)
 *
 * Requisitos: `npm run build:all` antes (necesita dist/ con las demos compiladas).
 *
 * Uso:
 *   npm run capturas
 *   npm run capturas -- --solo=calculos-sql --escenario=original --paso=5
 *   npm run capturas -- --salida=ruta/temporal --formato=png
 *
 * Opciones:
 *   --solo=a,b        Solo esos slugs (de demos.config.json).
 *   --escenario=X     Escenario de la demo SQL (por defecto «original»).
 *   --paso=N          Paso de la demo SQL, desde 1 (por defecto 15).
 *   --salida=DIR      Carpeta de destino (por defecto src/assets/proyectos).
 *   --formato=F       webp (por defecto) o png.
 *   EDGE_PATH         Variable de entorno con la ruta de Edge/Chromium si no está en la ruta habitual.
 *
 * Las capturas no se enlazan solas: después hay que apuntar src/data/proyectos.ts a los
 * archivos nuevos.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { setTimeout as esperar } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUERTO_PREVIEW = 4173
const BASE = `http://localhost:${PUERTO_PREVIEW}/`
const ANCHO = 1280
const ALTO = 800
const ANCHO_REDUCIDO = 800
const PRESUPUESTO_VIRTUAL_MS = 8000
/** Tope en tiempo real por demo (p. ej. si PokeAPI no responde). */
const TOPE_REAL_MS = 45_000
const CALIDAD = 82

/**
 * Escenario y paso por defecto de la demo SQL: el paso 15 («Relleno») junta el ranking de candidatos,
 * «¿Cubre?», la fila resaltada, #filtrado con su primera cuenta y el bloque activo en el código.
 */
const SQL_POR_DEFECTO = { escenario: 'original', paso: '15' }

/**
 * Preferencias que se guardan antes de cargar cada demo para que todas salgan en
 * tema oscuro. Pokédex y Reservas siguen prefers-color-scheme (emulado en oscuro); Control de
 * cuentas arranca en claro salvo que tenga su clave guardada (controlPagos.colorScheme).
 */
const PREPARACION = {
  'control-cuentas': { 'controlPagos.colorScheme': 'dark' },
}

/**
 * Antes de capturar, algunas demos necesitan dejar a la vista su parte principal. En la demo SQL la
 * cabecera y los controles ocupan la primera pantalla: se baja hasta «Recorre el script».
 */
/** Vista de cada demo que sale en su portada (las demás usan la pantalla de inicio). */
const VISTA_PORTADA = {
  'control-cuentas': '#/deudas',
}

const ENCUADRE = {
  'calculos-sql': "document.getElementById('titulo-simulador')?.scrollIntoView({ block: 'start', behavior: 'instant' })",
}

const RUTAS_EDGE = [
  process.env.EDGE_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/microsoft-edge',
  '/usr/bin/microsoft-edge-stable',
]

function fallar(mensaje) {
  console.error(`\n✗ ${mensaje}`)
  process.exitCode = 1
}

function leerOpciones() {
  const { values } = parseArgs({
    options: {
      solo: { type: 'string' },
      escenario: { type: 'string', default: SQL_POR_DEFECTO.escenario },
      paso: { type: 'string', default: SQL_POR_DEFECTO.paso },
      salida: { type: 'string', default: join(RAIZ, 'src', 'assets', 'proyectos') },
      formato: { type: 'string', default: 'webp' },
    },
  })
  if (values.formato !== 'webp' && values.formato !== 'png') {
    throw new Error(`--formato debe ser webp o png (recibido: ${values.formato}).`)
  }
  if (!/^\d+$/.test(values.paso)) throw new Error(`--paso debe ser un número entero (recibido: ${values.paso}).`)
  return values
}

/** Slugs de demos.config.json (fuente única), filtrados por --solo. */
function leerDemos(solo) {
  const demos = JSON.parse(readFileSync(join(RAIZ, 'demos.config.json'), 'utf8'))
  if (!Array.isArray(demos)) throw new Error('demos.config.json debe ser una lista.')
  const slugs = demos.map((demo) => demo.slug)
  if (!solo) return slugs
  const pedidos = solo.split(',').map((slug) => slug.trim()).filter(Boolean)
  const desconocidos = pedidos.filter((slug) => !slugs.includes(slug))
  if (desconocidos.length > 0) throw new Error(`Slugs desconocidos en --solo: ${desconocidos.join(', ')}`)
  return pedidos
}

function rutaDemo(slug, opciones) {
  const consulta =
    slug === 'calculos-sql'
      ? `?escenario=${encodeURIComponent(opciones.escenario)}&paso=${encodeURIComponent(opciones.paso)}`
      : ''
  return `demos/${slug}/index.html${consulta}${VISTA_PORTADA[slug] ?? ''}`
}

function buscarEdge() {
  const ruta = RUTAS_EDGE.find((candidata) => candidata && existsSync(candidata))
  if (!ruta) throw new Error('No se encontró Microsoft Edge. Indica su ruta con la variable EDGE_PATH.')
  return ruta
}

function terminar(proceso) {
  if (!proceso?.pid || proceso.exitCode !== null) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(proceso.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    proceso.kill('SIGTERM')
  }
}

async function responde(url) {
  try {
    return (await fetch(url)).ok
  } catch {
    return false
  }
}

async function esperarHasta(condicion, msMax, descripcion) {
  const limite = Date.now() + msMax
  while (Date.now() < limite) {
    if (await condicion()) return
    await esperar(150)
  }
  throw new Error(`Tiempo agotado esperando ${descripcion}.`)
}

/** Usa el preview que ya corre en :4173 o lanza uno propio (sin shell: la ruta tiene espacios). */
async function asegurarPreview() {
  if (await responde(BASE)) {
    console.log(`· Usando el preview que ya corre en ${BASE}`)
    return null
  }
  const vite = join(RAIZ, 'node_modules', 'vite', 'bin', 'vite.js')
  const preview = spawn(process.execPath, [vite, 'preview', '--port', String(PUERTO_PREVIEW), '--strictPort'], {
    cwd: RAIZ,
    stdio: 'ignore',
  })
  await esperarHasta(() => responde(BASE), 30_000, `vite preview en ${BASE}`)
  console.log(`· vite preview iniciado en ${BASE}`)
  return preview
}

/** Cliente CDP mínimo sobre el WebSocket nativo de Node. */
function conectarCdp(url) {
  const socket = new WebSocket(url)
  let ultimoId = 0
  const pendientes = new Map()
  const oyentes = new Map()

  socket.addEventListener('message', (evento) => {
    const mensaje = JSON.parse(String(evento.data))
    if (mensaje.id !== undefined) {
      const pendiente = pendientes.get(mensaje.id)
      pendientes.delete(mensaje.id)
      if (mensaje.error) pendiente?.reject(new Error(`${mensaje.error.message} (${mensaje.error.code})`))
      else pendiente?.resolve(mensaje.result)
      return
    }
    for (const oyente of oyentes.get(mensaje.method) ?? []) oyente(mensaje.params)
  })

  return {
    abierto: new Promise((resolver, rechazar) => {
      socket.addEventListener('open', resolver)
      socket.addEventListener('error', rechazar)
    }),
    enviar(metodo, parametros = {}) {
      const id = ++ultimoId
      socket.send(JSON.stringify({ id, method: metodo, params: parametros }))
      return new Promise((resolver, rechazar) => pendientes.set(id, { resolve: resolver, reject: rechazar }))
    },
    escuchar(metodo, oyente) {
      oyentes.set(metodo, [...(oyentes.get(metodo) ?? []), oyente])
    },
    unaVez(metodo, msMax) {
      return Promise.race([
        new Promise((resolver) => {
          const oyente = (parametros) => {
            oyentes.set(metodo, (oyentes.get(metodo) ?? []).filter((o) => o !== oyente))
            resolver(parametros ?? true)
          }
          oyentes.set(metodo, [...(oyentes.get(metodo) ?? []), oyente])
        }),
        esperar(msMax).then(() => null),
      ])
    },
    cerrar() {
      socket.close()
    },
  }
}

async function abrirEdge(rutaEdge, perfil) {
  const edge = spawn(
    rutaEdge,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${perfil}`,
      `--window-size=${ANCHO},${ALTO}`,
      '--force-device-scale-factor=1',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-sync',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  // Con el puerto 0, Edge escribe en DevToolsActivePort el puerto elegido y la ruta del navegador.
  const archivoPuerto = join(perfil, 'DevToolsActivePort')
  await esperarHasta(async () => existsSync(archivoPuerto), 20_000, 'el puerto de depuración de Edge')
  const [puerto, rutaNavegador] = readFileSync(archivoPuerto, 'utf8').split('\n').map((linea) => linea.trim())
  const objetivos = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()
  const pagina = objetivos.find((objetivo) => objetivo.type === 'page')
  if (!pagina) throw new Error('Edge no expuso ninguna pestaña para depurar.')
  return {
    edge,
    urlPagina: pagina.webSocketDebuggerUrl,
    urlNavegador: `ws://127.0.0.1:${puerto}${rutaNavegador}`,
  }
}

/** Cierra Edge por CDP (también sus procesos hijos); si no responde, se mata el proceso. */
async function cerrarEdge(urlNavegador) {
  if (!urlNavegador) return
  try {
    const navegador = conectarCdp(urlNavegador)
    await Promise.race([navegador.abierto, esperar(3000).then(() => Promise.reject(new Error('sin conexión')))])
    await Promise.race([navegador.enviar('Browser.close'), esperar(3000)])
    navegador.cerrar()
  } catch {
    // Se resuelve con terminar(edge).
  }
}

/** Carga la URL y espera el presupuesto de tiempo virtual (con respaldo en tiempo real). */
async function cargar(cdp, url) {
  try {
    await cdp.enviar('Emulation.setVirtualTimePolicy', { policy: 'pause' })
    await cdp.enviar('Page.navigate', { url })
    const agotado = cdp.unaVez('Emulation.virtualTimeBudgetExpired', TOPE_REAL_MS)
    await cdp.enviar('Emulation.setVirtualTimePolicy', {
      policy: 'pauseIfNetworkFetchesPending',
      budget: PRESUPUESTO_VIRTUAL_MS,
    })
    if ((await agotado) !== null) return 'tiempo virtual'
    console.warn(`  ! El presupuesto virtual no se agotó en ${TOPE_REAL_MS / 1000} s; se captura igual.`)
    return 'tope real'
  } catch (error) {
    // Respaldo: tiempo real, hasta el evento load más un cuarto del presupuesto.
    console.warn(`  ! Sin tiempo virtual (${error.message}); se espera en tiempo real.`)
    await cdp.enviar('Emulation.setVirtualTimePolicy', { policy: 'advance' }).catch(() => {})
    const cargado = cdp.unaVez('Page.loadEventFired', TOPE_REAL_MS)
    await cdp.enviar('Page.navigate', { url })
    await cargado
    await esperar(PRESUPUESTO_VIRTUAL_MS / 4)
    return 'tiempo real'
  }
}

async function capturar(cdp, formato, escala, desplazamientoY) {
  const { data } = await cdp.enviar('Page.captureScreenshot', {
    format: formato,
    ...(formato === 'webp' ? { quality: CALIDAD } : {}),
    clip: { x: 0, y: desplazamientoY, width: ANCHO, height: ALTO, scale: escala },
  })
  return Buffer.from(data, 'base64')
}

async function principal() {
  const opciones = leerOpciones()
  const slugs = leerDemos(opciones.solo)

  const faltantes = slugs.filter((slug) => !existsSync(join(RAIZ, 'dist', 'demos', slug, 'index.html')))
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan demos compiladas en dist/ (${faltantes.join(', ')}). Corre «npm run build:all» antes de capturar.`,
    )
  }

  mkdirSync(opciones.salida, { recursive: true })
  const perfil = mkdtempSync(join(tmpdir(), 'capturas-portafolio-'))
  let preview = null
  let edge = null
  let urlNavegador = null
  let cdp = null

  try {
    preview = await asegurarPreview()
    const abierto = await abrirEdge(buscarEdge(), perfil)
    edge = abierto.edge
    urlNavegador = abierto.urlNavegador
    cdp = conectarCdp(abierto.urlPagina)
    await cdp.abierto

    const errores = []
    cdp.escuchar('Runtime.exceptionThrown', (p) =>
      errores.push(p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? 'excepción'),
    )
    await cdp.enviar('Page.enable')
    await cdp.enviar('Runtime.enable')
    await cdp.enviar('Emulation.setDeviceMetricsOverride', {
      width: ANCHO,
      height: ALTO,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await cdp.enviar('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: 'dark' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    })
    await cdp.enviar('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const preparacion = ${JSON.stringify(PREPARACION)};
        const slug = (location.pathname.match(/\\/demos\\/([^/]+)\\//) || [])[1];
        const claves = preparacion[slug];
        if (!claves) return;
        try {
          for (const [clave, valor] of Object.entries(claves)) {
            if (localStorage.getItem(clave) === null) localStorage.setItem(clave, valor);
          }
        } catch {}
      })();`,
    })

    for (const slug of slugs) {
      const url = new URL(rutaDemo(slug, opciones), BASE).href
      console.log(`\n▸ ${slug}: ${url}`)
      errores.length = 0
      const espera = await cargar(cdp, url)

      // El clip se mide desde el inicio del documento: si se bajó la página, se suma lo desplazado.
      let desplazamientoY = 0
      if (ENCUADRE[slug]) {
        const { result } = await cdp.enviar('Runtime.evaluate', {
          expression: `(() => { ${ENCUADRE[slug]}; return Math.round(window.scrollY); })()`,
          returnByValue: true,
        })
        desplazamientoY = Number(result.value) || 0
        console.log(`  encuadre: desplazado ${desplazamientoY} px`)
      }

      const extension = opciones.formato
      const grande = await capturar(cdp, extension, 1, desplazamientoY)
      const reducida = await capturar(cdp, extension, ANCHO_REDUCIDO / ANCHO, desplazamientoY)
      const archivoGrande = join(opciones.salida, `${slug}.${extension}`)
      const archivoReducido = join(opciones.salida, `${slug}-${ANCHO_REDUCIDO}.${extension}`)
      writeFileSync(archivoGrande, grande)
      writeFileSync(archivoReducido, reducida)

      console.log(`  espera: ${espera}`)
      console.log(`  ${relative(RAIZ, archivoGrande)}  ${ANCHO}×${ALTO}  ${(grande.length / 1024).toFixed(1)} KB`)
      console.log(
        `  ${relative(RAIZ, archivoReducido)}  ${ANCHO_REDUCIDO}×${(ALTO * ANCHO_REDUCIDO) / ANCHO}  ${(reducida.length / 1024).toFixed(1)} KB`,
      )
      if (errores.length > 0) console.warn(`  ! Errores en la página: ${errores.join(' | ')}`)
      // La siguiente demo arranca con el tiempo virtual detenido de nuevo.
      await cdp.enviar('Emulation.setVirtualTimePolicy', { policy: 'pause' }).catch(() => {})
    }

    console.log('\n✓ Capturas listas. Recuerda apuntar src/data/proyectos.ts a los archivos nuevos.')
  } finally {
    cdp?.cerrar()
    await cerrarEdge(urlNavegador)
    terminar(edge)
    terminar(preview)
    await esperar(300)
    rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}

principal().catch((error) => fallar(error instanceof Error ? error.message : String(error)))
