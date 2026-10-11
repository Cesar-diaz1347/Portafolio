// Revisa la carpeta dist antes de publicar en GitHub Pages.
//
// Uso: node scripts/verificar-dist.mjs [--dist <ruta>]   (por defecto, dist/ en la raíz del portafolio)
//
// Comprueba que:
//   - existan index.html y demos/<slug>/index.html de cada demo de demos.config.json (apps y entradas);
//   - todo src/href relativo de cada .html apunte a un archivo que existe dentro de dist
//     (se ignoran http:, https:, mailto:, tel:, data: y demás esquemas, //… y las anclas #…);
//   - ningún .html use URLs absolutas de raíz (src="/…", href="/…"), que se rompen bajo la subruta
//     de GitHub Pages;
//   - estén el CV en español e inglés y el favicon.
// Al final muestra el tamaño de cada demo.
//
// Códigos de salida: 0 = todo bien · 1 = alguna comprobación falló · 2 = uso o configuración inválidos.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARCHIVOS_OBLIGATORIOS = ['cv/CV_Cesar_Diaz.pdf', 'cv/CV_Cesar_Diaz_EN.pdf', 'favicon.svg']
const SLUG_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ATRIBUTO_URL = /\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi
/** Cualquier esquema (http:, https:, mailto:, tel:, data:…) o una URL relativa al protocolo (//cdn…). */
const URL_EXTERNA = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i
const ENTIDADES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>' }

/** Error de uso o de configuración: termina con código 2. */
class ErrorDeUso extends Error {}

try {
  const dist = leerOpciones(process.argv.slice(2))
  const demos = leerDemos()
  process.exitCode = verificar(dist, demos) ? 0 : 1
} catch (error) {
  if (!(error instanceof ErrorDeUso)) throw error
  console.error(`✖ ${error.message}`)
  process.exitCode = 2
}

/** @param {string[]} argumentos */
function leerOpciones(argumentos) {
  let dist = path.join(RAIZ, 'dist')
  for (let i = 0; i < argumentos.length; i += 1) {
    if (argumentos[i] !== '--dist') throw new ErrorDeUso(`Opción desconocida: ${argumentos[i]}. Uso: --dist <ruta>.`)
    const ruta = argumentos[i + 1]
    if (!ruta || ruta.startsWith('--')) throw new ErrorDeUso('--dist necesita una ruta.')
    dist = path.resolve(ruta)
    i += 1
  }
  return dist
}

/** Las demos de demos.config.json (apps y entradas): cada una se publica en demos/<slug>/. */
function leerDemos() {
  let config
  try {
    config = JSON.parse(readFileSync(path.join(RAIZ, 'demos.config.json'), 'utf8'))
  } catch (error) {
    throw new ErrorDeUso(`No se pudo leer demos.config.json: ${error instanceof Error ? error.message : error}`)
  }
  if (!Array.isArray(config)) throw new ErrorDeUso('demos.config.json debe ser una lista de demos.')
  return config.map((demo) => {
    if (typeof demo?.slug !== 'string' || !SLUG_KEBAB.test(demo.slug)) {
      throw new ErrorDeUso(`demos.config.json: slug inválido ${JSON.stringify(demo?.slug)}.`)
    }
    return { slug: demo.slug, tipo: String(demo.tipo) }
  })
}

/**
 * @param {string} dist
 * @param {{ slug: string, tipo: string }[]} demos
 * @returns {boolean} true si todo está bien
 */
function verificar(dist, demos) {
  console.log(`Revisando ${dist}`)
  if (!existsSync(dist) || !statSync(dist).isDirectory()) {
    console.error(`✖ No existe la carpeta ${dist}. Genera el sitio con "npm run build:all".`)
    return false
  }

  /** @type {string[]} */
  const fallos = []
  const exigir = (/** @type {string} */ relativa) => {
    const existe = existsSync(path.join(dist, relativa))
    console.log(`  ${existe ? '✔' : '✖'} ${relativa}`)
    if (!existe) fallos.push(`falta ${relativa}`)
  }

  exigir('index.html')
  for (const demo of demos) exigir(`demos/${demo.slug}/index.html`)
  for (const archivo of ARCHIVOS_OBLIGATORIOS) exigir(archivo)

  const paginas = listarArchivos(dist).filter((archivo) => archivo.toLowerCase().endsWith('.html'))
  let referencias = 0
  /** @type {string[]} */
  const problemasHtml = []
  for (const pagina of paginas) {
    const revision = revisarReferencias(dist, pagina)
    referencias += revision.revisadas
    problemasHtml.push(...revision.fallos)
  }
  console.log(
    `  ${problemasHtml.length === 0 ? '✔' : '✖'} ${paginas.length} página(s) HTML: ${referencias} referencia(s) ` +
      `relativa(s) revisada(s)${problemasHtml.length === 0 ? ', todas resuelven y sin URLs absolutas de raíz' : ''}`,
  )
  for (const problema of problemasHtml) console.log(`      ✖ ${problema}`)
  fallos.push(...problemasHtml)

  console.log('\nTamaño de las demos')
  for (const demo of demos) {
    const carpeta = path.join(dist, 'demos', demo.slug)
    const tamano = existsSync(carpeta) ? formatearTamano(tamanoDe(carpeta)) : '(no existe)'
    const nota = demo.tipo === 'entrada' ? '  (entrada: sus assets van en dist/assets, con el portafolio)' : ''
    console.log(`  ${demo.slug.padEnd(18)}${tamano.padStart(10)}${nota}`)
  }
  console.log(`  ${'dist completo'.padEnd(18)}${formatearTamano(tamanoDe(dist)).padStart(10)}`)

  if (fallos.length === 0) {
    console.log('\n✔ dist está lista para publicar.')
    return true
  }
  console.error(`\n✖ ${fallos.length} problema(s):`)
  for (const fallo of fallos) console.error(`  - ${fallo}`)
  return false
}

/**
 * Revisa los src/href de una página: las URLs absolutas de raíz fallan y las relativas deben
 * resolver a un archivo dentro de dist (una carpeta vale si tiene index.html).
 * @param {string} dist
 * @param {string} pagina
 */
function revisarReferencias(dist, pagina) {
  const html = readFileSync(pagina, 'utf8')
  const nombre = path.relative(dist, pagina).replaceAll('\\', '/')
  /** @type {string[]} */
  const fallos = []
  let revisadas = 0

  for (const [, atributo, comillasDobles, comillasSimples] of html.matchAll(ATRIBUTO_URL)) {
    const valor = decodificarEntidades(comillasDobles ?? comillasSimples ?? '').trim()
    if (valor === '' || valor.startsWith('#') || URL_EXTERNA.test(valor)) continue
    const original = `${atributo}="${valor}"`
    if (valor.startsWith('/')) {
      fallos.push(`${nombre}: ${original} es una URL absoluta de raíz (usa una ruta relativa)`)
      continue
    }

    revisadas += 1
    const sinConsulta = valor.split(/[?#]/)[0]
    if (sinConsulta === '') continue
    let rutaDecodificada
    try {
      rutaDecodificada = decodeURIComponent(sinConsulta)
    } catch {
      fallos.push(`${nombre}: ${original} tiene una codificación % inválida`)
      continue
    }

    const destino = path.resolve(path.dirname(pagina), rutaDecodificada)
    const relativaADist = path.relative(dist, destino)
    if (relativaADist.startsWith('..') || path.isAbsolute(relativaADist)) {
      fallos.push(`${nombre}: ${original} apunta fuera de dist`)
    } else if (!existeComoArchivo(destino)) {
      fallos.push(`${nombre}: ${original} no existe (${relativaADist.replaceAll('\\', '/') || '.'})`)
    }
  }
  return { fallos, revisadas }
}

/** Un archivo, o una carpeta con index.html (como la sirve GitHub Pages). @param {string} ruta */
function existeComoArchivo(ruta) {
  if (!existsSync(ruta)) return false
  return statSync(ruta).isDirectory() ? existsSync(path.join(ruta, 'index.html')) : true
}

/** @param {string} texto */
function decodificarEntidades(texto) {
  return texto.replace(/&(?:amp|quot|#39|apos|lt|gt);/g, (entidad) => ENTIDADES[/** @type {keyof typeof ENTIDADES} */ (entidad)])
}

/** @param {string} carpeta @returns {string[]} */
function listarArchivos(carpeta) {
  return readdirSync(carpeta, { recursive: true, withFileTypes: true })
    .filter((entrada) => entrada.isFile())
    .map((entrada) => path.join(entrada.parentPath, entrada.name))
}

/** @param {string} carpeta */
function tamanoDe(carpeta) {
  return listarArchivos(carpeta).reduce((total, archivo) => total + statSync(archivo).size, 0)
}

/** @param {number} bytes */
function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
