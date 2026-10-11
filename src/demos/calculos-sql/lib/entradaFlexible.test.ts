import { describe, expect, it } from 'vitest'

import { analizarDecimal, analizarEntero } from './entradaFlexible'

function valorDe(lectura: ReturnType<typeof analizarDecimal>): string {
  if (!lectura.ok) throw new Error(`Se esperaba un número, pero: ${lectura.mensaje}`)
  return lectura.valor
}

describe('analizarDecimal', () => {
  it.each([
    ['11637.25', '11637.25'],
    ['11,637.25', '11637.25'],
    ['  11,637.2500  ', '11637.2500'],
    ['11.637,25', '11637.25'],
    ['1,234,567.89', '1234567.89'],
    ['1.234.567,89', '1234567.89'],
    ['11 637.25', '11637.25'],
    ['11\u00a0637,25', '11637.25'],
    ['11_637.25', '11637.25'],
    ['Q 11,637.25', '11637.25'],
    ['q11637.25', '11637.25'],
    ['$1,500', '1500'],
    ['GTQ 2 500,5', '2500.5'],
  ])('lee %j como %j', (texto, esperado) => {
    expect(valorDe(analizarDecimal(texto))).toBe(esperado)
  })

  it('con un solo separador, el punto es decimal y la coma solo es de miles si deja grupos de 3', () => {
    expect(valorDe(analizarDecimal('1.234'))).toBe('1.234')
    expect(valorDe(analizarDecimal('1,234'))).toBe('1234')
    expect(valorDe(analizarDecimal('11,637'))).toBe('11637')
    expect(valorDe(analizarDecimal('1,5'))).toBe('1.5')
    expect(valorDe(analizarDecimal('500,0267'))).toBe('500.0267')
    expect(valorDe(analizarDecimal('0,500'))).toBe('0.500')
  })

  it('acepta signo, ceros a la izquierda y extremos sin dígitos', () => {
    expect(valorDe(analizarDecimal('+3.50'))).toBe('3.50')
    expect(valorDe(analizarDecimal('-3.50'))).toBe('-3.50')
    expect(valorDe(analizarDecimal('\u22123'))).toBe('-3')
    expect(valorDe(analizarDecimal('-0'))).toBe('0')
    expect(valorDe(analizarDecimal('007.5'))).toBe('7.5')
    expect(valorDe(analizarDecimal('.5'))).toBe('0.5')
    expect(valorDe(analizarDecimal('5.'))).toBe('5')
    expect(valorDe(analizarDecimal('0'))).toBe('0')
  })

  it('no recorta ni redondea los decimales: eso lo valida el motor según la columna', () => {
    expect(valorDe(analizarDecimal('499.9950'))).toBe('499.9950')
    expect(valorDe(analizarDecimal('1.123456'))).toBe('1.123456')
  })

  it.each(['', '   ', 'abc', '12abc', '1.2.3', '1,2,3', '12,34,567', '1,234.5,6', '1.234,5.6', '--3', '1e5', 'Q'])(
    'rechaza %j con un mensaje que dice cómo corregirlo',
    (texto) => {
      const lectura = analizarDecimal(texto)
      expect(lectura.ok).toBe(false)
      if (!lectura.ok) expect(lectura.mensaje).toMatch(/ejemplo|miles/)
    },
  )
})

describe('analizarEntero', () => {
  it.each([
    ['91720', '91720'],
    ['91,720', '91720'],
    ['91.720', '91720'],
    ['6 744 301 200', '6744301200'],
    ['  2026 ', '2026'],
    ['-5', '-5'],
    ['+7', '7'],
    ['007', '7'],
    ['2,026', '2026'],
  ])('lee %j como %j', (texto, esperado) => {
    expect(valorDe(analizarEntero(texto))).toBe(esperado)
  })

  it.each(['', '1.5', '1,5', '12,34', '1,234.5', 'abc', '3e2'])('rechaza %j: debe ser un entero', (texto) => {
    const lectura = analizarEntero(texto)
    expect(lectura.ok).toBe(false)
    if (!lectura.ok) expect(lectura.mensaje).toContain('91720')
  })
})
