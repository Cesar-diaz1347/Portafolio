import { describe, expect, it } from 'vitest'

import { construirBusqueda, leerEnlace } from './enlaceProfundo'

const IDS = ['original', 'sin-tope']

describe('leerEnlace', () => {
  it('lee el escenario y el paso', () => {
    expect(leerEnlace('?escenario=sin-tope&paso=4', IDS)).toEqual({ escenario: 'sin-tope', paso: 4 })
  })

  it('ignora lo que falta o no es válido', () => {
    expect(leerEnlace('', IDS)).toEqual({ escenario: null, paso: null })
    expect(leerEnlace('?escenario=inventado&paso=0', IDS)).toEqual({ escenario: null, paso: null })
    expect(leerEnlace('?escenario=original&paso=-3', IDS)).toEqual({ escenario: 'original', paso: null })
    expect(leerEnlace('?paso=2.5', IDS).paso).toBeNull()
    expect(leerEnlace('?paso=abc', IDS).paso).toBeNull()
    expect(leerEnlace('?paso=9999999', IDS).paso).toBeNull()
  })
})

describe('construirBusqueda', () => {
  it('escribe escenario y paso', () => {
    expect(construirBusqueda('', 'original', 1)).toBe('?escenario=original&paso=1')
  })

  it('reemplaza los valores anteriores y conserva otros parámetros', () => {
    expect(construirBusqueda('?x=1&escenario=sin-tope&paso=9', 'original', 5)).toBe('?x=1&escenario=original&paso=5')
  })

  it('lo que escribe, lo puede leer', () => {
    expect(leerEnlace(construirBusqueda('', 'sin-tope', 3), IDS)).toEqual({ escenario: 'sin-tope', paso: 3 })
  })
})
