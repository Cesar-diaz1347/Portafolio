import { describe, expect, it } from 'vitest'

import { aEscala, cabeEnDecimal18, formatearDecimal, leerDecimal } from './decimal'

function leer(texto: string, escala: number): bigint {
  const lectura = leerDecimal(texto, escala)
  if (!lectura.ok) throw new Error(lectura.mensaje)
  return lectura.unidades
}

describe('decimales de punto fijo', () => {
  it('leen y se escriben con la escala de SQL Server', () => {
    expect(leer('11637.25', 4)).toBe(116_372_500n)
    expect(formatearDecimal(116_372_500n, 4)).toBe('11637.2500')
    expect(formatearDecimal(-300n, 2)).toBe('-3.00')
    expect(formatearDecimal(5n, 2)).toBe('0.05')
    expect(formatearDecimal(0n, 4)).toBe('0.0000')
    expect(leer('-0.5', 2)).toBe(-50n)
  })

  it('guardan exacto 999999999999999.99, que en un number se convierte en 1e15', () => {
    expect(Number('999999999999999.99')).toBe(1e15)
    expect(formatearDecimal(leer('999999999999999.99', 2), 2)).toBe('999999999999999.99')
  })

  it('comparan Monto (escala 4) con límites (escala 2) sin perder decimales', () => {
    const montoEnHueco = leer('499.9950', 4)
    expect(montoEnHueco > aEscala(leer('499.99', 2), 2, 4)).toBe(true)
    expect(montoEnHueco < aEscala(leer('500.00', 2), 2, 4)).toBe(true)
  })

  it('rechazan lo que no cabe en DECIMAL(18,s), con un mensaje claro', () => {
    expect(leerDecimal('1,5', 2)).toMatchObject({ ok: false, mensaje: expect.stringContaining('punto decimal') })
    expect(leerDecimal('1.005', 2)).toMatchObject({ ok: false, mensaje: expect.stringContaining('2 decimales') })
    expect(leerDecimal('99999999999999999', 2)).toMatchObject({ ok: false, mensaje: expect.stringContaining('16 dígitos') })
    expect(leerDecimal('9999999999999999.99', 2).ok).toBe(true)
    expect(leerDecimal(5, 2).ok).toBe(false)
    expect(cabeEnDecimal18(10n ** 18n - 1n)).toBe(true)
    expect(cabeEnDecimal18(-(10n ** 18n))).toBe(false)
  })
})
