import { describe, expect, it } from 'vitest'

import { DemoApiError, errorNoEncontrado, errorServicioNoDisponible, errorValidacion } from '../api/demo/errores'
import { debeReintentar, erroresDeCampo, esNoEncontrado } from './errores'

describe('debeReintentar', () => {
  it('no reintenta 400 ni 404', () => {
    expect(debeReintentar(0, errorValidacion({ nombre: ['El nombre es obligatorio.'] }))).toBe(false)
    expect(debeReintentar(0, errorNoEncontrado('No se encontró la deuda 99.'))).toBe(false)
  })

  it('reintenta un 503 solo una vez', () => {
    expect(debeReintentar(0, errorServicioNoDisponible())).toBe(true)
    expect(debeReintentar(1, errorServicioNoDisponible())).toBe(false)
  })

  it('para otros errores conserva los 3 reintentos de React Query', () => {
    const otro = new Error('fallo de red')
    expect(debeReintentar(2, otro)).toBe(true)
    expect(debeReintentar(3, otro)).toBe(false)
  })
})

describe('erroresDeCampo', () => {
  it('une los mensajes de cada campo', () => {
    const error = errorValidacion({
      monto: ['El monto debe ser al menos 0.01.', 'Usa como máximo 2 decimales.'],
      nota: ['La nota admite hasta 500 caracteres.'],
    })
    expect(erroresDeCampo(error)).toEqual({
      monto: 'El monto debe ser al menos 0.01. Usa como máximo 2 decimales.',
      nota: 'La nota admite hasta 500 caracteres.',
    })
  })

  it('devuelve null si no hay errores por campo', () => {
    expect(erroresDeCampo(errorNoEncontrado('No está.'))).toBeNull()
    expect(erroresDeCampo(new DemoApiError({ status: 400, title: 'Mal', errors: {} }))).toBeNull()
    expect(erroresDeCampo(new Error('otro'))).toBeNull()
  })

  it('reconoce el 404', () => {
    expect(esNoEncontrado(errorNoEncontrado('x'))).toBe(true)
    expect(esNoEncontrado(errorServicioNoDisponible())).toBe(false)
  })
})
