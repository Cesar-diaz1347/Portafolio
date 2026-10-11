/**
 * El formulario de la demo guarda lo que el visitante escribe (texto) por campo; de ahí se
 * construyen los datos para el motor. Cada campo se identifica con la misma ruta que usa el
 * motor en sus errores (`datamart[2].monto`), así un error cae junto al input correcto.
 */
import type { DatasetFicticios, ErrorEntrada, Escenario, ParametrosConteo } from '../engine'
import { analizarDecimal, analizarEntero } from './entradaFlexible'

export type ParametroEditable = 'yy' | 'mm' | 'indiceId' | 'usuarioId'
export type ColumnaRango = 'limiteInf' | 'limiteSup' | 'puntos'

export const PARAMETROS_EDITABLES: readonly ParametroEditable[] = ['yy', 'mm', 'indiceId', 'usuarioId']

export const rutaParametro = (nombre: ParametroEditable): string => `parametros.${nombre}`
export const rutaMonto = (fila: number): string => `datamart[${fila}].monto`
export const rutaRango = (fila: number, columna: ColumnaRango): string => `puntosAsignar[${fila}].${columna}`
export const rutaIndice = (fila: number): string => `indices[${fila}].puntajeMax`

export interface Formulario {
  /** Texto de cada campo editable, por ruta. */
  readonly campos: Readonly<Record<string, string>>
  /** @AplicarBorrado: false = vista previa, true = DELETE. */
  readonly aplicarBorrado: boolean
}

export function formularioInicial(escenario: Escenario): Formulario {
  const campos: Record<string, string> = {}
  for (const nombre of PARAMETROS_EDITABLES) campos[rutaParametro(nombre)] = String(escenario.parametros[nombre])
  escenario.dataset.datamart.forEach((fila, i) => {
    campos[rutaMonto(i)] = fila.monto
  })
  escenario.dataset.puntosAsignar.forEach((fila, i) => {
    campos[rutaRango(i, 'limiteInf')] = fila.limiteInf
    campos[rutaRango(i, 'limiteSup')] = fila.limiteSup
    campos[rutaRango(i, 'puntos')] = fila.puntos
  })
  escenario.dataset.indices.forEach((fila, i) => {
    campos[rutaIndice(i)] = fila.puntajeMax
  })
  return { campos, aplicarBorrado: escenario.parametros.aplicarBorrado }
}

/** true si algún campo (o el modo del paso 2) difiere del escenario tal como viene. */
export function estaEditado(actual: Formulario, inicial: Formulario): boolean {
  if (actual.aplicarBorrado !== inicial.aplicarBorrado) return true
  return Object.entries(inicial.campos).some(([ruta, texto]) => actual.campos[ruta] !== texto)
}

export interface EntradaConstruida {
  dataset: DatasetFicticios
  parametros: ParametrosConteo
  /** Campos cuyo texto no se pudo leer como número, antes de llegar al motor. */
  errores: ErrorEntrada[]
}

/**
 * Datos para el motor: copias del escenario con los textos ya leídos. Un campo ilegible conserva
 * su valor original y queda anotado en `errores`.
 */
export function construirEntrada(escenario: Escenario, formulario: Formulario): EntradaConstruida {
  const errores: ErrorEntrada[] = []
  const texto = (ruta: string, original: string): string => formulario.campos[ruta] ?? original

  const decimal = (ruta: string, original: string): string => {
    const lectura = analizarDecimal(texto(ruta, original))
    if (lectura.ok) return lectura.valor
    errores.push({ campo: ruta, mensaje: lectura.mensaje })
    return original
  }

  const entero = (nombre: ParametroEditable): number => {
    const original = escenario.parametros[nombre]
    const ruta = rutaParametro(nombre)
    const lectura = analizarEntero(texto(ruta, String(original)))
    if (lectura.ok) return Number(lectura.valor)
    errores.push({ campo: ruta, mensaje: lectura.mensaje })
    return original
  }

  const base = escenario.dataset
  return {
    dataset: {
      ...base,
      datamart: base.datamart.map((fila, i) => ({ ...fila, monto: decimal(rutaMonto(i), fila.monto) })),
      puntosAsignar: base.puntosAsignar.map((fila, i) => ({
        ...fila,
        limiteInf: decimal(rutaRango(i, 'limiteInf'), fila.limiteInf),
        limiteSup: decimal(rutaRango(i, 'limiteSup'), fila.limiteSup),
        puntos: decimal(rutaRango(i, 'puntos'), fila.puntos),
      })),
      indices: base.indices.map((fila, i) => ({ ...fila, puntajeMax: decimal(rutaIndice(i), fila.puntajeMax) })),
    },
    parametros: {
      yy: entero('yy'),
      mm: entero('mm'),
      indiceId: entero('indiceId'),
      usuarioId: entero('usuarioId'),
      aplicarBorrado: formulario.aplicarBorrado,
    },
    errores,
  }
}

/** Agrupa los errores por ruta (si un campo tiene varios, los une) para marcarlos junto a su input. */
export function erroresPorCampo(errores: readonly ErrorEntrada[]): Record<string, string> {
  const porCampo: Record<string, string> = {}
  for (const { campo, mensaje } of errores) {
    porCampo[campo] = porCampo[campo] === undefined ? mensaje : `${porCampo[campo]} ${mensaje}`
  }
  return porCampo
}

const TABLAS: Readonly<Record<string, string>> = {
  datamart: 'Datamart',
  registrosValidos: 'RegistrosValidos',
  puntosAsignar: 'PuntosAsignar',
  indices: 'Indices',
}

const PARAMETROS: Readonly<Record<string, string>> = {
  yy: '@YY',
  mm: '@MM',
  indiceId: '@INDICEID',
  usuarioId: '@USUARIOID',
  aplicarBorrado: '@AplicarBorrado',
}

const mayuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1)

/** Nombre legible de un campo: «datamart[2].monto» → «Datamart, fila 3, Monto». */
export function describirCampo(ruta: string): string {
  const parametro = /^parametros\.(\w+)$/.exec(ruta)
  if (parametro) return PARAMETROS[parametro[1] ?? ''] ?? (parametro[1] ?? ruta)

  const celda = /^(\w+)\[(\d+)\](?:\.(\w+))?$/.exec(ruta)
  if (celda) {
    const [, tabla = '', fila = '0', columna] = celda
    const nombreTabla = TABLAS[tabla] ?? mayuscula(tabla)
    const nombreFila = `fila ${Number(fila) + 1}`
    return columna === undefined ? `${nombreTabla}, ${nombreFila}` : `${nombreTabla}, ${nombreFila}, ${mayuscula(columna)}`
  }
  return TABLAS[ruta] ?? mayuscula(ruta)
}
