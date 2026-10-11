import { describe, expect, it } from 'vitest'

import { DATASET_FICTICIOS, PARAMETROS_ORIGINALES } from './dataset'
import { SCRIPT_DATOS, SCRIPT_LOGICA } from './scripts'

/** Las tuplas del INSERT INTO dbo.<tabla> … VALUES (…), (…); de CrearFicticios.sql. */
function valoresDelInsert(tabla: string): string[][] {
  const insert = new RegExp(`INSERT INTO dbo\\.${tabla}[\\s\\S]*?VALUES([\\s\\S]*?);`).exec(SCRIPT_DATOS)
  if (!insert) throw new Error(`No se encontró el INSERT de ${tabla}.`)
  return [...insert[1].matchAll(/\(([^()]*)\)/g)].map((tupla) => tupla[1].split(',').map((valor) => valor.trim()))
}

/** Un literal BIGINT del script tal como lo guarda SQL Server (sin ceros a la izquierda). */
const bigint = (literal: string) => BigInt(literal).toString()
/** '20260513' (DATETIME) → '2026-05-13'. */
const fecha = (literal: string) => literal.replace(/^'(\d{4})(\d{2})(\d{2})'$/, '$1-$2-$3')

describe('DATASET_FICTICIOS', () => {
  it('Datamart coincide con el INSERT del script', () => {
    const esperado = valoresDelInsert('Datamart').map(([id, yy, mm, indicador, monto, productoId, usuario]) => ({
      id: bigint(id),
      yy: Number(yy),
      mm: Number(mm),
      indicador: bigint(indicador),
      monto,
      productoId: Number(productoId),
      usuario: Number(usuario),
    }))
    expect(DATASET_FICTICIOS.datamart).toEqual(esperado)
  })

  it('RegistrosValidos coincide con el INSERT, con los ids canónicos', () => {
    const esperado = valoresDelInsert('RegistrosValidos').map(
      ([id, yy, mm, indiceId, usuarioId, sucursalId, grupoId, indicador, productoId, dataMartId, fapertura]) => ({
        id: bigint(id),
        yy: Number(yy),
        mm: Number(mm),
        indiceId: Number(indiceId),
        usuarioId: Number(usuarioId),
        sucursalId: Number(sucursalId),
        grupoId: Number(grupoId),
        indicador: bigint(indicador),
        productoId: Number(productoId),
        dataMartId: bigint(dataMartId),
        fapertura: fecha(fapertura),
      }),
    )
    expect(DATASET_FICTICIOS.registrosValidos).toEqual(esperado)
    expect(DATASET_FICTICIOS.registrosValidos.map((fila) => fila.indicador)).toContain('126367597') // 0126367597
  })

  it('PuntosAsignar e Indices coinciden con sus INSERT', () => {
    const rangos = valoresDelInsert('PuntosAsignar').map(([id, limiteInf, limiteSup, puntos, factor, puntajeMax, indiceId]) => ({
      id: Number(id),
      limiteInf,
      limiteSup,
      puntos,
      factor,
      puntajeMax,
      indiceId: Number(indiceId),
    }))
    expect(DATASET_FICTICIOS.puntosAsignar).toEqual(rangos)

    const indices = valoresDelInsert('Indices').map(([indiceId, puntajeMax]) => ({ indiceId: Number(indiceId), puntajeMax }))
    expect(DATASET_FICTICIOS.indices).toEqual(indices)
  })
})

describe('PARAMETROS_ORIGINALES', () => {
  it('son los valores de los DECLARE del script', () => {
    const declarado = (variable: string) => {
      const coincidencia = new RegExp(`@${variable}\\s+(?:INT|BIT)\\s*=\\s*(\\d+)`).exec(SCRIPT_LOGICA)
      if (!coincidencia) throw new Error(`No se encontró @${variable}.`)
      return Number(coincidencia[1])
    }
    expect(PARAMETROS_ORIGINALES).toEqual({
      yy: declarado('YY'),
      mm: declarado('MM'),
      indiceId: declarado('INDICEID'),
      usuarioId: declarado('USUARIOID'),
      aplicarBorrado: declarado('AplicarBorrado') === 1,
    })
  })
})
