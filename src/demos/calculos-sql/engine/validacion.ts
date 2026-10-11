import { ESCALA_MONTO, ESCALA_PUNTOS, leerDecimal } from './decimal'
import type { DatasetFicticios, ErrorEntrada, ParametrosConteo } from './tipos'

/** Las columnas que usa el script, ya convertidas: BIGINT y DECIMAL como bigint de punto fijo. */
export interface DatamartInterno {
  id: bigint
  indicador: bigint
  /** Escala 4. */
  monto: bigint
}

export interface RegistroInterno {
  id: bigint
  yy: number
  mm: number
  indiceId: number
  usuarioId: number
  indicador: bigint
  dataMartId: bigint
}

export interface RangoInterno {
  id: number
  /** Escala 2. */
  limiteInf: bigint
  limiteSup: bigint
  puntos: bigint
  indiceId: number
}

export interface IndiceInterno {
  indiceId: number
  /** Escala 2. */
  puntajeMax: bigint
}

export interface EntradaInterna {
  datamart: DatamartInterno[]
  registros: RegistroInterno[]
  rangos: RangoInterno[]
  indices: IndiceInterno[]
  parametros: ParametrosConteo
}

export type ResultadoValidacion = { ok: true; entrada: EntradaInterna } | { ok: false; errores: ErrorEntrada[] }

const INT_MINIMO = -2_147_483_648
const INT_MAXIMO = 2_147_483_647
const BIGINT_MINIMO = -(2n ** 63n)
const BIGINT_MAXIMO = 2n ** 63n - 1n

/**
 * Comprueba que los datos quepan en los tipos de las tablas y convierte las columnas que usa el
 * script. Junta todos los errores en vez de parar en el primero, para marcarlos todos en la UI.
 */
export function validarEntrada(dataset: DatasetFicticios, parametros: ParametrosConteo): ResultadoValidacion {
  const errores: ErrorEntrada[] = []
  const leer = crearLector(errores)

  const parametrosLeidos: ParametrosConteo = {
    yy: leer.int(parametros.yy, 'parametros.yy'),
    mm: leer.int(parametros.mm, 'parametros.mm'),
    indiceId: leer.int(parametros.indiceId, 'parametros.indiceId'),
    usuarioId: leer.int(parametros.usuarioId, 'parametros.usuarioId'),
    aplicarBorrado: leer.bit(parametros.aplicarBorrado, 'parametros.aplicarBorrado'),
  }

  const datamart = leer.tabla(dataset.datamart, 'datamart').map((fila, i) => {
    const campo = `datamart[${i}]`
    leer.int(fila.yy, `${campo}.yy`)
    leer.int(fila.mm, `${campo}.mm`)
    leer.int(fila.productoId, `${campo}.productoId`)
    leer.int(fila.usuario, `${campo}.usuario`)
    return {
      id: leer.bigint(fila.id, `${campo}.id`),
      indicador: leer.bigint(fila.indicador, `${campo}.indicador`),
      monto: leer.decimal(fila.monto, `${campo}.monto`, ESCALA_MONTO),
    }
  })

  const registros = leer.tabla(dataset.registrosValidos, 'registrosValidos').map((fila, i) => {
    const campo = `registrosValidos[${i}]`
    leer.intONulo(fila.sucursalId, `${campo}.sucursalId`)
    leer.intONulo(fila.grupoId, `${campo}.grupoId`)
    leer.int(fila.productoId, `${campo}.productoId`)
    leer.textoONulo(fila.fapertura, `${campo}.fapertura`)
    return {
      id: leer.bigint(fila.id, `${campo}.id`),
      yy: leer.int(fila.yy, `${campo}.yy`),
      mm: leer.int(fila.mm, `${campo}.mm`),
      indiceId: leer.int(fila.indiceId, `${campo}.indiceId`),
      usuarioId: leer.int(fila.usuarioId, `${campo}.usuarioId`),
      indicador: leer.bigint(fila.indicador, `${campo}.indicador`),
      dataMartId: leer.bigint(fila.dataMartId, `${campo}.dataMartId`),
    }
  })

  const rangos = leer.tabla(dataset.puntosAsignar, 'puntosAsignar').map((fila, i) => {
    const campo = `puntosAsignar[${i}]`
    leer.decimal(fila.factor, `${campo}.factor`, ESCALA_PUNTOS)
    leer.decimal(fila.puntajeMax, `${campo}.puntajeMax`, ESCALA_PUNTOS)
    return {
      id: leer.int(fila.id, `${campo}.id`),
      limiteInf: leer.decimal(fila.limiteInf, `${campo}.limiteInf`, ESCALA_PUNTOS),
      limiteSup: leer.decimal(fila.limiteSup, `${campo}.limiteSup`, ESCALA_PUNTOS),
      puntos: leer.decimal(fila.puntos, `${campo}.puntos`, ESCALA_PUNTOS),
      indiceId: leer.int(fila.indiceId, `${campo}.indiceId`),
    }
  })

  const indices = leer.tabla(dataset.indices, 'indices').map((fila, i) => ({
    indiceId: leer.int(fila.indiceId, `indices[${i}].indiceId`),
    puntajeMax: leer.decimal(fila.puntajeMax, `indices[${i}].puntajeMax`, ESCALA_PUNTOS),
  }))

  // Con algún valor ilegible, las claves llevan valores neutros: revisarlas solo daría ruido.
  if (errores.length === 0) {
    leer.clavesUnicas(datamart.map((fila) => fila.id), 'datamart', 'id')
    leer.clavesUnicas(registros.map((fila) => fila.id), 'registrosValidos', 'id')
    leer.clavesUnicas(rangos.map((fila) => fila.id), 'puntosAsignar', 'id')
    leer.clavesUnicas(indices.map((fila) => fila.indiceId), 'indices', 'indiceId')
  }

  if (errores.length > 0) return { ok: false, errores }
  return { ok: true, entrada: { datamart, registros, rangos, indices, parametros: parametrosLeidos } }
}

/** Lectores que anotan el error y devuelven un valor neutro para poder seguir revisando. */
function crearLector(errores: ErrorEntrada[]) {
  const error = (campo: string, mensaje: string) => {
    errores.push({ campo, mensaje })
  }

  function tabla<T>(filas: readonly T[] | undefined, campo: string): readonly T[] {
    if (!Array.isArray(filas)) {
      error(campo, 'debe ser una lista de filas.')
      return []
    }
    return filas.filter((fila, i) => {
      const esFila = typeof fila === 'object' && fila !== null
      if (!esFila) error(`${campo}[${i}]`, 'debe ser una fila con sus columnas.')
      return esFila
    })
  }

  function int(valor: unknown, campo: string): number {
    if (typeof valor === 'number' && Number.isInteger(valor) && valor >= INT_MINIMO && valor <= INT_MAXIMO) return valor
    error(campo, 'debe ser un entero INT (de −2,147,483,648 a 2,147,483,647).')
    return 0
  }

  function intONulo(valor: unknown, campo: string): void {
    if (valor !== null) int(valor, campo)
  }

  function bigint(valor: unknown, campo: string): bigint {
    const texto = typeof valor === 'number' && Number.isSafeInteger(valor) ? String(valor) : valor
    if (typeof texto === 'string' && /^[+-]?\d+$/.test(texto.trim())) {
      const numero = BigInt(texto.trim())
      if (numero >= BIGINT_MINIMO && numero <= BIGINT_MAXIMO) return numero
    }
    error(campo, 'debe ser un entero BIGINT, sin decimales.')
    return 0n
  }

  function decimal(valor: unknown, campo: string, escala: number): bigint {
    const lectura = leerDecimal(valor, escala)
    if (lectura.ok) return lectura.unidades
    error(campo, lectura.mensaje)
    return 0n
  }

  function bit(valor: unknown, campo: string): boolean {
    if (typeof valor === 'boolean') return valor
    error(campo, 'debe ser verdadero o falso (BIT).')
    return false
  }

  function textoONulo(valor: unknown, campo: string): void {
    if (valor !== null && typeof valor !== 'string') error(campo, 'debe ser texto o nulo.')
  }

  function clavesUnicas(claves: readonly (bigint | number)[], nombreTabla: string, columna: string): void {
    const vistas = new Set<bigint | number>()
    claves.forEach((clave, i) => {
      if (vistas.has(clave)) error(`${nombreTabla}[${i}].${columna}`, `repite la clave primaria ${clave}.`)
      vistas.add(clave)
    })
  }

  return { tabla, int, intONulo, bigint, decimal, bit, textoONulo, clavesUnicas }
}
