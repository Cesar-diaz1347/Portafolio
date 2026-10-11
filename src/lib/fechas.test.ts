import { describe, expect, it } from 'vitest'

import {
  aDateTime,
  formatearDuracion,
  formatearMesAnio,
  mesAnioDeFecha,
  mesesInclusivos,
} from './fechas'

describe('mesesInclusivos', () => {
  it('cuenta ambos extremos, como en el CV', () => {
    expect(mesesInclusivos({ anio: 2022, mes: 1 }, { anio: 2022, mes: 6 })).toBe(6)
    expect(mesesInclusivos({ anio: 2020, mes: 11 }, { anio: 2021, mes: 10 })).toBe(12)
    expect(mesesInclusivos({ anio: 2018, mes: 1 }, { anio: 2020, mes: 4 })).toBe(28)
    expect(mesesInclusivos({ anio: 2016, mes: 2 }, { anio: 2019, mes: 12 })).toBe(47)
  })

  it('un mismo mes cuenta como 1 y un fin anterior al inicio como 0', () => {
    expect(mesesInclusivos({ anio: 2024, mes: 9 }, { anio: 2024, mes: 9 })).toBe(1)
    expect(mesesInclusivos({ anio: 2024, mes: 9 }, { anio: 2024, mes: 8 })).toBe(0)
  })

  it('rechaza meses fuera de rango', () => {
    expect(() => mesesInclusivos({ anio: 2024, mes: 0 }, { anio: 2024, mes: 5 })).toThrow(RangeError)
    expect(() => mesesInclusivos({ anio: 2024, mes: 1 }, { anio: 2024, mes: 13 })).toThrow(RangeError)
  })
})

describe('formatearDuracion', () => {
  it('usa singular y plural en español', () => {
    expect(formatearDuracion(1)).toBe('1 mes')
    expect(formatearDuracion(6)).toBe('6 meses')
    expect(formatearDuracion(12)).toBe('1 año')
    expect(formatearDuracion(13)).toBe('1 año 1 mes')
    expect(formatearDuracion(28)).toBe('2 años 4 meses')
    expect(formatearDuracion(47)).toBe('3 años 11 meses')
  })

  it('describe una duración vacía', () => {
    expect(formatearDuracion(0)).toBe('Menos de 1 mes')
  })
})

describe('formato de meses', () => {
  it('abrevia como el CV', () => {
    expect(formatearMesAnio({ anio: 2022, mes: 7 })).toBe('Jul 2022')
    expect(formatearMesAnio({ anio: 2022, mes: 1 })).toBe('Ene 2022')
    expect(formatearMesAnio({ anio: 2019, mes: 12 })).toBe('Dic 2019')
  })

  it('genera el valor de dateTime con dos dígitos', () => {
    expect(aDateTime({ anio: 2024, mes: 9 })).toBe('2024-09')
    expect(aDateTime({ anio: 2024, mes: 11 })).toBe('2024-11')
  })

  it('convierte una fecha local a mes y año', () => {
    expect(mesAnioDeFecha(new Date(2026, 9, 4))).toEqual({ anio: 2026, mes: 10 })
  })
})
