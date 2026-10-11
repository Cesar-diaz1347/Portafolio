/**
 * Lectura flexible de números escritos a mano (ley de Postel: flexible al recibir, estricto al
 * producir). Acepta separadores de miles (coma, punto, espacio o guion bajo), coma o punto
 * decimal, signo y moneda (Q, $, €, GTQ, USD), y devuelve el texto canónico que entiende el
 * motor: sin miles y con punto decimal. «11,637.25», «11637.25» y «Q 11 637,25» dan lo mismo.
 */

export type LecturaNumero = { ok: true; valor: string } | { ok: false; mensaje: string }

const EJEMPLO_DECIMAL = 'Escribe un número, por ejemplo 11,637.25.'
const EJEMPLO_ENTERO = 'Escribe un número entero, sin decimales, por ejemplo 91720.'
const MENSAJE_MILES = 'Los separadores de miles van cada 3 dígitos (por ejemplo 1,234,567).'

interface TextoPreparado {
  negativo: boolean
  /** Solo dígitos, comas y puntos. */
  cuerpo: string
}

function fallo(mensaje: string): LecturaNumero {
  return { ok: false, mensaje }
}

/** Quita espacios, moneda y signo. Devuelve null si no queda nada que leer. */
function preparar(texto: string): TextoPreparado | null {
  let resto = texto.replace(/[\u00a0\u202f\u2009]/g, ' ').trim()
  let negativo = false
  const signo = /^[+\-\u2212]/.exec(resto)
  if (signo) {
    negativo = signo[0] !== '+'
    resto = resto.slice(1).trim()
  }
  resto = resto.replace(/^(?:gtq|usd|q|\$|€)\s*/i, '')
  const cuerpo = resto.replace(/[ _]/g, '')
  return cuerpo === '' ? null : { negativo, cuerpo }
}

function contar(texto: string, caracter: string): number {
  return texto.split(caracter).length - 1
}

/** «1,234,567» con separador «,» → «1234567»; null si los grupos no son de 3 dígitos. */
function quitarMiles(parte: string, separador: string): string | null {
  const grupos = parte.split(separador)
  const [primero, ...resto] = grupos
  if (!/^[1-9]\d{0,2}$/.test(primero ?? '')) return null
  if (!resto.every((grupo) => /^\d{3}$/.test(grupo))) return null
  return grupos.join('')
}

function ensamblar(negativo: boolean, enteros: string, decimales: string): string {
  const parteEntera = enteros.replace(/^0+(?=\d)/, '') || '0'
  const esCero = /^0*$/.test(parteEntera + decimales)
  return `${negativo && !esCero ? '-' : ''}${parteEntera}${decimales === '' ? '' : `.${decimales}`}`
}

/**
 * Número decimal. Con un solo separador, el punto es decimal («1.234» = 1.234) y la coma es de
 * miles solo si deja grupos de 3 dígitos («11,637» = 11637); si no, es coma decimal («1,5»).
 * Con los dos, el último es el decimal. Devuelve p. ej. «11637.25».
 */
export function analizarDecimal(texto: string): LecturaNumero {
  const preparado = preparar(texto)
  if (!preparado) return fallo(EJEMPLO_DECIMAL)
  const { negativo, cuerpo } = preparado
  if (!/^[\d.,]+$/.test(cuerpo)) {
    return fallo(`«${texto.trim()}» no es un número. ${EJEMPLO_DECIMAL}`)
  }

  const puntos = contar(cuerpo, '.')
  const comas = contar(cuerpo, ',')
  let enteros: string | null
  let decimales = ''

  if (puntos > 0 && comas > 0) {
    const posicion = Math.max(cuerpo.lastIndexOf('.'), cuerpo.lastIndexOf(','))
    const decimal = cuerpo.charAt(posicion)
    const miles = decimal === '.' ? ',' : '.'
    decimales = cuerpo.slice(posicion + 1)
    if (decimales.includes(miles) || decimales.includes(decimal)) return fallo(MENSAJE_MILES)
    enteros = quitarMiles(cuerpo.slice(0, posicion), miles)
  } else if (puntos > 1 || comas > 1) {
    enteros = quitarMiles(cuerpo, puntos > 1 ? '.' : ',')
  } else if (puntos === 1 || comas === 1) {
    const separador = puntos === 1 ? '.' : ','
    const [izquierda = '', derecha = ''] = cuerpo.split(separador)
    if (separador === ',' && /^[1-9]\d{0,2}$/.test(izquierda) && /^\d{3}$/.test(derecha)) {
      enteros = izquierda + derecha
    } else {
      enteros = izquierda
      decimales = derecha
    }
  } else {
    enteros = cuerpo
  }

  if (enteros === null) return fallo(MENSAJE_MILES)
  if (enteros === '' && decimales === '') return fallo(EJEMPLO_DECIMAL)
  return { ok: true, valor: ensamblar(negativo, enteros, decimales) }
}

/** Número entero (INT o BIGINT) con separadores de miles opcionales: «91,720» → «91720». */
export function analizarEntero(texto: string): LecturaNumero {
  const preparado = preparar(texto)
  if (!preparado) return fallo(EJEMPLO_ENTERO)
  const { negativo, cuerpo } = preparado
  if (!/^[\d.,]+$/.test(cuerpo)) return fallo(`«${texto.trim()}» no es un número. ${EJEMPLO_ENTERO}`)

  let digitos: string | null
  if (/^\d+$/.test(cuerpo)) {
    digitos = cuerpo
  } else if (cuerpo.includes('.') && cuerpo.includes(',')) {
    digitos = null
  } else {
    digitos = quitarMiles(cuerpo, cuerpo.includes('.') ? '.' : ',')
  }
  if (digitos === null) return fallo(EJEMPLO_ENTERO)
  return { ok: true, valor: ensamblar(negativo, digitos, '') }
}
