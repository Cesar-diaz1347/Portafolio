import { utils } from 'swapy'
import { describe, expect, it } from 'vitest'

import {
  esOrdenPorDefecto,
  leerOrdenGuardado,
  moverTarjeta,
  ordenPorDefecto,
  posicionDe,
  validarOrden,
} from './ordenPortada'

const IDS = ['intro', 'foto', 'experiencia', 'stack', 'contacto', 'ubicacion'] as const

const PERMUTADO = [
  { slot: 'intro', item: 'foto' },
  { slot: 'foto', item: 'intro' },
  { slot: 'experiencia', item: 'experiencia' },
  { slot: 'stack', item: 'ubicacion' },
  { slot: 'contacto', item: 'contacto' },
  { slot: 'ubicacion', item: 'stack' },
]

describe('ordenPorDefecto', () => {
  it('sigue la misma convención que utils.initSlotItemMap de Swapy', () => {
    const tarjetas = IDS.map((id) => ({ id }))
    expect(ordenPorDefecto(IDS)).toEqual(utils.initSlotItemMap(tarjetas, 'id'))
  })

  it('es el orden por defecto y cada tarjeta ocupa su posición', () => {
    const orden = ordenPorDefecto(IDS)
    expect(esOrdenPorDefecto(orden)).toBe(true)
    expect(posicionDe(orden, 'intro')).toBe(1)
    expect(posicionDe(orden, 'ubicacion')).toBe(6)
    expect(posicionDe(orden, 'no-existe')).toBe(0)
  })
})

describe('validarOrden', () => {
  it('acepta una permutación válida', () => {
    expect(validarOrden(PERMUTADO, IDS)).toEqual(PERMUTADO)
    expect(esOrdenPorDefecto(PERMUTADO)).toBe(false)
  })

  it('normaliza los slots a su orden canónico', () => {
    const desordenado = [...PERMUTADO].reverse()
    expect(validarOrden(desordenado, IDS)).toEqual(PERMUTADO)
  })

  it('ignora propiedades extra', () => {
    const conExtras = PERMUTADO.map((entrada) => ({ ...entrada, otra: 1 }))
    expect(validarOrden(conExtras, IDS)).toEqual(PERMUTADO)
  })

  it('rechaza valores que no son una lista', () => {
    expect(validarOrden(null, IDS)).toBeNull()
    expect(validarOrden('intro', IDS)).toBeNull()
    expect(validarOrden({ intro: 'intro' }, IDS)).toBeNull()
  })

  it('rechaza una cantidad distinta de slots', () => {
    expect(validarOrden(PERMUTADO.slice(0, 5), IDS)).toBeNull()
    expect(validarOrden([...PERMUTADO, { slot: 'extra', item: 'extra' }], IDS)).toBeNull()
  })

  it('rechaza tarjetas o slots repetidos', () => {
    const tarjetaRepetida = PERMUTADO.map((entrada, i) => (i === 1 ? { ...entrada, item: 'foto' } : entrada))
    const slotRepetido = PERMUTADO.map((entrada, i) => (i === 1 ? { ...entrada, slot: 'intro' } : entrada))
    expect(validarOrden(tarjetaRepetida, IDS)).toBeNull()
    expect(validarOrden(slotRepetido, IDS)).toBeNull()
  })

  it('rechaza ids desconocidos y entradas mal formadas', () => {
    const desconocido = PERMUTADO.map((entrada, i) => (i === 0 ? { slot: 'intro', item: 'video' } : entrada))
    const malFormado = PERMUTADO.map((entrada, i) => (i === 0 ? { slot: 'intro', item: 3 } : entrada))
    expect(validarOrden(desconocido, IDS)).toBeNull()
    expect(validarOrden(malFormado, IDS)).toBeNull()
    expect(validarOrden([null, ...PERMUTADO.slice(1)], IDS)).toBeNull()
  })
})

describe('leerOrdenGuardado', () => {
  it('devuelve null sin datos o con JSON roto', () => {
    expect(leerOrdenGuardado(null, IDS)).toBeNull()
    expect(leerOrdenGuardado('{roto', IDS)).toBeNull()
    expect(leerOrdenGuardado('[]', IDS)).toBeNull()
  })

  it('lee un orden guardado válido', () => {
    expect(leerOrdenGuardado(JSON.stringify(PERMUTADO), IDS)).toEqual(PERMUTADO)
  })
})

describe('moverTarjeta', () => {
  it('intercambia con la tarjeta anterior o la siguiente', () => {
    const inicial = ordenPorDefecto(IDS)
    const despues = moverTarjeta(inicial, 'foto', 'despues')
    expect(despues).not.toBeNull()
    expect(posicionDe(despues ?? [], 'foto')).toBe(3)
    expect(posicionDe(despues ?? [], 'experiencia')).toBe(2)

    const antes = moverTarjeta(inicial, 'foto', 'antes')
    expect(posicionDe(antes ?? [], 'foto')).toBe(1)
    expect(posicionDe(antes ?? [], 'intro')).toBe(2)
  })

  it('no muta el orden original', () => {
    const inicial = ordenPorDefecto(IDS)
    const copia = structuredClone(inicial)
    moverTarjeta(inicial, 'stack', 'antes')
    expect(inicial).toEqual(copia)
  })

  it('devuelve null en los extremos o si la tarjeta no existe', () => {
    const inicial = ordenPorDefecto(IDS)
    expect(moverTarjeta(inicial, 'intro', 'antes')).toBeNull()
    expect(moverTarjeta(inicial, 'ubicacion', 'despues')).toBeNull()
    expect(moverTarjeta(inicial, 'video', 'antes')).toBeNull()
  })

  it('el resultado sigue siendo un orden válido y coincide con toSlottedItems', () => {
    const movido = moverTarjeta(ordenPorDefecto(IDS), 'contacto', 'antes') ?? []
    expect(validarOrden(movido, IDS)).toEqual(movido)
    const tarjetas = IDS.map((id) => ({ id }))
    const colocadas = utils.toSlottedItems(tarjetas, 'id', movido)
    expect(colocadas.map((c) => c.itemId)).toEqual([
      'intro',
      'foto',
      'experiencia',
      'contacto',
      'stack',
      'ubicacion',
    ])
  })
})
