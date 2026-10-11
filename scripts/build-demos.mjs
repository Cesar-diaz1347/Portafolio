// Construye las demos de tipo "app" de demos.config.json y copia su dist a public/demos/<slug>/.
//
// Uso: node scripts/build-demos.mjs [--solo <slug>] [--sin-instalar] [--con-tests]
//   --solo <slug>   procesa solo esa demo
//   --sin-instalar  no corre `npm ci` si la demo ya tiene node_modules (más rápido en local)
//   --con-tests     corre `npm test` en las demos que tienen ese script, antes del build
//
// Por cada demo: revisa los bindings de Linux x64 del lockfile (error en CI, aviso en local),
// npm ci, npm test (opcional), npm run build, revisa que dist/index.html no tenga URLs absolutas
// de raíz y copia dist a public/demos/<slug>.
//
// Códigos de salida: 0 = todas las demos listas · 1 = alguna demo falló · 2 = uso o configuración inválidos.

import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CARPETA_FUENTES = path.join(RAIZ, 'demos-src')
const CARPETA_PUBLICA = path.join(RAIZ, 'public', 'demos')
const SLUG_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const URL_ABSOLUTA_DE_RAIZ = /(?:src|href)="\/[^/][^"]*"/

/** Error de uso o de configuración: termina con código 2 y sin stack. */
class ErrorDeUso extends Error {}

try {
  const opciones = leerOpciones(process.argv.slice(2))
  const apps = leerApps(opciones.solo)
  const npm = localizarNpm()
  const resultados = apps.map((app) => construir(app, opciones, npm))
  imprimirResumen(resultados)
  process.exitCode = resultados.every((resultado) => resultado.ok) ? 0 : 1
} catch (error) {
  if (!(error instanceof ErrorDeUso)) throw error
  console.error(`✖ ${error.message}`)
  process.exitCode = 2
}

// --- Opciones y configuración ------------------------------------------------------------------

/** @param {string[]} argumentos */
function leerOpciones(argumentos) {
  const opciones = { solo: /** @type {string | null} */ (null), sinInstalar: false, conTests: false }
  for (let i = 0; i < argumentos.length; i += 1) {
    const argumento = argumentos[i]
    if (argumento === '--sin-instalar') opciones.sinInstalar = true
    else if (argumento === '--con-tests') opciones.conTests = true
    else if (argumento === '--solo') {
      const slug = argumentos[i + 1]
      if (!slug || slug.startsWith('--')) throw new ErrorDeUso('--solo necesita el slug de una demo, p. ej. --solo reservas.')
      opciones.solo = slug
      i += 1
    } else {
      throw new ErrorDeUso(`Opción desconocida: ${argumento}. Usa --solo <slug>, --sin-instalar o --con-tests.`)
    }
  }
  return opciones
}

/**
 * Las demos "app" de demos.config.json, validadas. Una entrada y una app no pueden compartir
 * slug: las dos se publicarían en demos/<slug>/.
 * @param {string | null} solo
 */
function leerApps(solo) {
  const rutaConfig = path.join(RAIZ, 'demos.config.json')
  let config
  try {
    config = JSON.parse(readFileSync(rutaConfig, 'utf8'))
  } catch (error) {
    throw new ErrorDeUso(`No se pudo leer demos.config.json: ${error instanceof Error ? error.message : error}`)
  }
  if (!Array.isArray(config)) throw new ErrorDeUso('demos.config.json debe ser una lista de demos.')

  const tipoPorSlug = new Map()
  const apps = []
  for (const demo of config) {
    const slug = demo?.slug
    if (typeof slug !== 'string' || !SLUG_KEBAB.test(slug)) {
      throw new ErrorDeUso(`demos.config.json: slug inválido ${JSON.stringify(slug)} (usa kebab-case).`)
    }
    if (tipoPorSlug.has(slug)) {
      const otro = tipoPorSlug.get(slug)
      throw new ErrorDeUso(
        otro !== demo.tipo
          ? `demos.config.json: el slug "${slug}" lo usan una app y una entrada; las dos se publicarían en demos/${slug}/.`
          : `demos.config.json: el slug "${slug}" está repetido.`,
      )
    }
    tipoPorSlug.set(slug, demo.tipo)

    if (demo.tipo === 'entrada') continue
    if (demo.tipo !== 'app' || typeof demo.dir !== 'string') {
      throw new ErrorDeUso(`demos.config.json: "${slug}" necesita tipo "app" con dir, o tipo "entrada" con html.`)
    }
    const ruta = path.resolve(RAIZ, demo.dir)
    if (!estaDentro(CARPETA_FUENTES, ruta)) {
      throw new ErrorDeUso(`demos.config.json: el dir de "${slug}" (${demo.dir}) debe estar dentro de demos-src/.`)
    }
    apps.push({ slug, dir: demo.dir, ruta })
  }

  if (solo === null) return apps
  const elegida = apps.find((app) => app.slug === solo)
  if (!elegida) {
    throw new ErrorDeUso(`No hay una demo de tipo app con slug "${solo}". Disponibles: ${apps.map((app) => app.slug).join(', ')}.`)
  }
  return [elegida]
}

/**
 * npm-cli.js para lanzar npm con el mismo Node y sin shell (la ruta del proyecto tiene espacios).
 * Con `npm run`, npm deja su ruta en npm_execpath; con `node` directo se busca junto al Node instalado.
 */
function localizarNpm() {
  const desdeNpmRun = process.env.npm_execpath
  if (desdeNpmRun && /npm-cli\.[cm]?js$/.test(desdeNpmRun) && existsSync(desdeNpmRun)) return desdeNpmRun

  const carpetaNode = path.dirname(process.execPath)
  const candidatos = [
    path.join(carpetaNode, 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Windows
    path.join(carpetaNode, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Linux y macOS
  ]
  const encontrado = candidatos.find((candidato) => existsSync(candidato))
  if (!encontrado) {
    throw new ErrorDeUso(`No se encontró npm-cli.js junto a ${process.execPath}. Ejecuta el script con "npm run build:demos".`)
  }
  return encontrado
}

// --- Construcción de una demo ----------------------------------------------------------------

/**
 * @param {{ slug: string, dir: string, ruta: string }} app
 * @param {{ sinInstalar: boolean, conTests: boolean }} opciones
 * @param {string} npm
 */
function construir(app, opciones, npm) {
  const inicio = Date.now()
  /** @type {string[]} */
  const hechos = []
  /** @type {string[]} */
  const avisos = []
  const terminar = (/** @type {string | null} */ error) => ({
    slug: app.slug,
    ok: error === null,
    error,
    hechos,
    avisos,
    segundos: (Date.now() - inicio) / 1000,
  })

  console.log(`\n▶ ${app.slug} (${app.dir})`)
  if (!existsSync(path.join(app.ruta, 'package.json'))) return terminar(`no existe ${app.dir}/package.json`)

  const faltantes = bindingsLinuxFaltantes(app.ruta)
  if (faltantes === null) {
    avisos.push('no se pudieron revisar los bindings (falta package-lock.json v2+)')
  } else if (faltantes.length > 0) {
    const mensaje = `al lockfile le faltan bindings de Linux x64: ${faltantes.join(', ')}`
    if (process.env.CI) return terminar(`${mensaje}. Regenera el lockfile de ${app.dir}.`)
    avisos.push(`${mensaje} (en CI esto falla)`)
  }

  if (opciones.sinInstalar && existsSync(path.join(app.ruta, 'node_modules'))) {
    hechos.push('instalación omitida')
  } else {
    if (!npmEn(app, npm, ['ci'])) return terminar('npm ci falló')
    hechos.push('npm ci')
  }

  if (opciones.conTests) {
    if (tieneScript(app, 'test')) {
      if (!npmEn(app, npm, ['test'])) return terminar('npm test falló')
      hechos.push('npm test')
    } else {
      hechos.push('sin script test')
    }
  }

  if (!npmEn(app, npm, ['run', 'build'])) return terminar('npm run build falló')
  hechos.push('build')

  const problemaIndex = revisarIndex(app)
  if (problemaIndex) return terminar(problemaIndex)

  const destino = copiarDist(app)
  hechos.push(`copia → ${path.relative(RAIZ, destino).replaceAll('\\', '/')}`)
  return terminar(null)
}

/**
 * @param {{ ruta: string }} app
 * @param {string} npm
 * @param {string[]} argumentos
 */
function npmEn(app, npm, argumentos) {
  console.log(`  $ npm ${argumentos.join(' ')}`)
  const proceso = spawnSync(process.execPath, [npm, ...argumentos], { cwd: app.ruta, stdio: 'inherit', env: process.env })
  if (proceso.error) console.error(`  ✖ no se pudo lanzar npm: ${proceso.error.message}`)
  return proceso.status === 0
}

/**
 * @param {{ ruta: string }} app
 * @param {string} script
 */
function tieneScript(app, script) {
  const paquete = JSON.parse(readFileSync(path.join(app.ruta, 'package.json'), 'utf8'))
  return typeof paquete.scripts?.[script] === 'string'
}

/**
 * Dependencias opcionales de Linux x64 (glibc, la del CI) que algún paquete declara y que no están
 * en el lockfile. Pasa cuando `npm install` en Windows poda las de otras plataformas.
 * Devuelve null si no hay un lockfile v2 o posterior que revisar.
 * @param {string} rutaApp
 * @returns {string[] | null}
 */
function bindingsLinuxFaltantes(rutaApp) {
  const rutaLock = path.join(rutaApp, 'package-lock.json')
  if (!existsSync(rutaLock)) return null
  const paquetes = JSON.parse(readFileSync(rutaLock, 'utf8')).packages
  if (!paquetes || typeof paquetes !== 'object') return null

  const faltantes = new Set()
  for (const [ubicacion, paquete] of Object.entries(paquetes)) {
    for (const nombre of Object.keys(paquete.optionalDependencies ?? {})) {
      const esLinuxGlibc = nombre.includes('linux-x64') && !nombre.includes('musl')
      if (esLinuxGlibc && !estaEnLockfile(paquetes, ubicacion, nombre)) faltantes.add(nombre)
    }
  }
  return [...faltantes]
}

/**
 * Resolución de Node dentro del lockfile: node_modules del propio paquete y luego de cada carpeta superior.
 * @param {Record<string, unknown>} paquetes
 * @param {string} ubicacion
 * @param {string} nombre
 */
function estaEnLockfile(paquetes, ubicacion, nombre) {
  let base = ubicacion
  for (;;) {
    if (paquetes[`${base ? `${base}/` : ''}node_modules/${nombre}`]) return true
    if (!base) return false
    const corte = base.lastIndexOf('/node_modules/')
    base = corte === -1 ? '' : base.slice(0, corte)
  }
}

/**
 * Con base './' en vite.config, el index usa rutas relativas; una ruta "/…" se rompería bajo
 * la subruta de GitHub Pages.
 * @param {{ ruta: string, dir: string }} app
 * @returns {string | null} el problema encontrado, o null
 */
function revisarIndex(app) {
  const index = path.join(app.ruta, 'dist', 'index.html')
  if (!existsSync(index)) return `el build no generó ${app.dir}/dist/index.html`
  const absoluta = URL_ABSOLUTA_DE_RAIZ.exec(readFileSync(index, 'utf8'))
  return absoluta ? `dist/index.html tiene una URL absoluta de raíz: ${absoluta[0]} (usa base: './' en vite.config)` : null
}

/** @param {{ ruta: string, slug: string }} app */
function copiarDist(app) {
  const destino = path.resolve(CARPETA_PUBLICA, app.slug)
  // Guarda: nunca borrar ni escribir fuera de public/demos/<slug>.
  if (path.dirname(destino) !== CARPETA_PUBLICA) throw new Error(`Destino fuera de public/demos: ${destino}`)
  rmSync(destino, { recursive: true, force: true })
  cpSync(path.join(app.ruta, 'dist'), destino, { recursive: true })
  return destino
}

/**
 * @param {string} carpeta
 * @param {string} ruta
 */
function estaDentro(carpeta, ruta) {
  const relativa = path.relative(carpeta, ruta)
  return relativa !== '' && !relativa.startsWith('..') && !path.isAbsolute(relativa)
}

// --- Resumen ---------------------------------------------------------------------------------

/** @param {{ slug: string, ok: boolean, error: string | null, hechos: string[], avisos: string[], segundos: number }[]} resultados */
function imprimirResumen(resultados) {
  console.log('\nResumen de build-demos')
  for (const resultado of resultados) {
    const tiempo = `${resultado.segundos.toFixed(1)} s`.padStart(8)
    const detalle = resultado.ok ? resultado.hechos.join(' · ') : resultado.error
    console.log(`  ${resultado.ok ? '✔' : '✖'} ${resultado.slug.padEnd(18)}${tiempo}  ${detalle}`)
    for (const aviso of resultado.avisos) console.log(`      ⚠ ${aviso}`)
  }
  const fallidas = resultados.filter((resultado) => !resultado.ok).length
  console.log(fallidas === 0 ? `\n${resultados.length} demo(s) listas.` : `\n${fallidas} de ${resultados.length} demo(s) fallaron.`)
}
