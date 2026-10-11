/**
 * DECIMAL de SQL Server como bigint de punto fijo: el valor es `unidades / 10^escala`.
 * Monto usa escala 4 (DECIMAL(18,4)); límites, puntos, tope y aportes, escala 2 (DECIMAL(18,2)).
 * Con bigint no hay redondeos: 999999999999999.99 no cabe exacto en un number de JS.
 */

export const ESCALA_MONTO = 4
export const ESCALA_PUNTOS = 2

/** DECIMAL(18, s) admite como máximo 18 dígitos en total. */
const LIMITE_DECIMAL_18 = 10n ** 18n

const PATRON_DECIMAL = /^([+-]?)(\d+)(?:\.(\d+))?$/

export type LecturaDecimal = { ok: true; unidades: bigint } | { ok: false; mensaje: string }

/** Lee un DECIMAL(18, escala) escrito con punto decimal y sin separadores de miles. */
export function leerDecimal(valor: unknown, escala: number): LecturaDecimal {
  if (typeof valor !== 'string') return { ok: false, mensaje: 'debe ser un número decimal escrito como texto.' }
  const coincidencia = PATRON_DECIMAL.exec(valor.trim())
  if (!coincidencia) {
    return { ok: false, mensaje: `"${valor}" no es un número válido (usa punto decimal y sin separadores de miles).` }
  }
  const [, signo, enteros, decimales = ''] = coincidencia
  if (decimales.length > escala) {
    return { ok: false, mensaje: `admite como máximo ${escala} decimales (DECIMAL(18,${escala})).` }
  }
  const unidadesAbsolutas = BigInt(enteros + decimales.padEnd(escala, '0'))
  if (unidadesAbsolutas >= LIMITE_DECIMAL_18) {
    return { ok: false, mensaje: `no cabe en DECIMAL(18,${escala}): admite hasta ${18 - escala} dígitos enteros.` }
  }
  return { ok: true, unidades: signo === '-' ? -unidadesAbsolutas : unidadesAbsolutas }
}

/** Texto con la escala de SQL Server: 116372500n con escala 4 → "11637.2500". */
export function formatearDecimal(unidades: bigint, escala: number): string {
  const negativo = unidades < 0n
  const digitos = (negativo ? -unidades : unidades).toString().padStart(escala + 1, '0')
  const enteros = digitos.slice(0, digitos.length - escala)
  const decimales = digitos.slice(digitos.length - escala)
  return `${negativo ? '-' : ''}${enteros}.${decimales}`
}

/** Sube a una escala mayor sin perder exactitud (p. ej. un límite de escala 2 a la escala 4 de Monto). */
export function aEscala(unidades: bigint, escalaActual: number, escalaNueva: number): bigint {
  return unidades * 10n ** BigInt(escalaNueva - escalaActual)
}

/** true si el valor cabe en un DECIMAL(18, s) de su misma escala. */
export function cabeEnDecimal18(unidades: bigint): boolean {
  return unidades < LIMITE_DECIMAL_18 && unidades > -LIMITE_DECIMAL_18
}
