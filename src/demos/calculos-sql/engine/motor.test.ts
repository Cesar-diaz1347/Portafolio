import { describe, expect, it } from 'vitest'

import { BLOQUES_SQL, DATASET_FICTICIOS, ESCENARIOS, PARAMETROS_ORIGINALES, ejecutarConteoYValor } from './index'
import type { BloqueSql, DatasetFicticios, IdEscenario, PasoTraza, ResultadoConteo, ResultadoOk } from './index'

function ejecutarEscenario(id: IdEscenario): ResultadoConteo {
  const escenario = ESCENARIOS.find((candidato) => candidato.id === id)
  if (!escenario) throw new Error(`No existe el escenario ${id}.`)
  return ejecutarConteoYValor(escenario.dataset, escenario.parametros)
}

function exitoso(resultado: ResultadoConteo): ResultadoOk {
  if (!resultado.ok) throw new Error(`Se esperaba ok y llegó ${JSON.stringify(resultado)}`)
  return resultado
}

/** [Indicador, Monto, Puntos, aporte] de cada fila de #filtrado. */
function seleccion(resultado: ResultadoOk): string[][] {
  return resultado.seleccion.map((fila) => [fila.indicador, fila.monto, fila.puntos, fila.aporte])
}

function codigos(resultado: ResultadoOk): string[] {
  return resultado.advertencias.map((advertencia) => advertencia.codigo)
}

function pasos(resultado: { traza: PasoTraza[] }, bloque: BloqueSql): PasoTraza[] {
  return resultado.traza.filter((paso) => paso.bloque === bloque)
}

const VUELTA: BloqueSql[] = ['condicionBucle', 'contador', 'aporte', 'insercion', 'acumular', 'reinicioSeleccion', 'relleno']
const INICIO: BloqueSql[] = ['preparacion', 'parametros', 'tope', 'guardaTope', 'guardaEscala', 'candidatos', 'tablaFiltrado', 'semilla']
const FINAL: BloqueSql[] = ['condicionBucle', 'agregados', 'detalle', 'resumen', 'encabezadoPaso2']

describe('escenario original', () => {
  const resultado = exitoso(ejecutarEscenario('original'))

  it('elige 6744301200 (5.00 → 5.00) y luego 8026367297 (4.00 → 3.00)', () => {
    expect(seleccion(resultado)).toEqual([
      ['6744301200', '11637.2500', '5.00', '5.00'],
      ['8026367297', '500.0267', '4.00', '3.00'],
    ])
  })

  it('resume Tope 8.00 · Cumplimiento 2 · Nota 8.00 · PuntosBrutos 9.00', () => {
    expect(resultado.resumen).toEqual({ tope: '8.00', cumplimiento: 2, nota: '8.00', puntosBrutos: '9.00' })
  })

  it('la vista previa borraría solo el Id 17588453840', () => {
    expect(resultado.depuracion.modo).toBe('preview')
    expect(resultado.depuracion.filasBorradas).toBeNull()
    expect(resultado.depuracion.filas.map((fila) => fila.id)).toEqual(['17588453840'])
  })

  it('deja fuera las 3 filas del índice 634 y avisa los 3 indicadores distintos del Datamart', () => {
    expect(resultado.exclusiones.map((exclusion) => [exclusion.registroId, exclusion.motivo])).toEqual([
      ['17588594646', 'OTRO_INDICE'],
      ['17588594647', 'OTRO_INDICE'],
      ['17588594648', 'OTRO_INDICE'],
    ])
    expect(codigos(resultado)).toEqual(['INDICADOR_DIFERENTE', 'INDICADOR_DIFERENTE', 'INDICADOR_DIFERENTE'])
  })

  it('la traza recorre los bloques del script en orden, con dos vueltas', () => {
    expect(resultado.traza.map((paso) => paso.bloque)).toEqual([...INICIO, ...VUELTA, ...VUELTA, ...FINAL, 'previsualizacion'])
    resultado.traza.forEach((paso, i) => {
      expect(paso.indice).toBe(i)
      expect(BLOQUES_SQL[paso.bloque]).toBeDefined()
      expect(paso.titulo.length).toBeGreaterThan(0)
      expect(paso.explicacion.length).toBeGreaterThan(0)
    })
    expect(resultado.traza[0].variables).toBeNull()
    expect(resultado.traza.slice(1).every((paso) => paso.variables !== null)).toBe(true)
  })

  it('la semilla ordena por Monto DESC y el relleno elige la cuenta que cubre el faltante con menos puntos', () => {
    const [semilla] = pasos(resultado, 'semilla')
    expect(ranking(semilla)).toEqual({ '6744301200': 1, '2016185272': 2, '8026367297': 3 })
    expect(semilla.variables).toMatchObject({ selDm: '973123360', selPuntos: '5.00' })

    const [relleno] = pasos(resultado, 'relleno')
    expect(relleno.variables).toMatchObject({ faltante: '3.00', selDm: '973123736', selPuntos: '4.00' })
    expect(ranking(relleno)).toEqual({ '8026367297': 1, '2016185272': 2 })
    expect(relleno.candidatos.every((candidato) => candidato.cubreFaltante === true)).toBe(true)
    expect(relleno.resaltado.candidato).toBe('17588594645:6203')
  })

  it('el aporte se topa: 5.00 + 4.00 > 8.00, así que solo aporta 3.00', () => {
    const [, segundoAporte] = pasos(resultado, 'aporte')
    expect(segundoAporte.variables).toMatchObject({ acumulado: '5.00', selPuntos: '4.00', selAporte: '3.00', orden: 2 })
    expect(segundoAporte.explicacion).toContain('8.00 − 5.00 = 3.00')
  })

  it('al final las variables quedan como en SQL Server', () => {
    expect(resultado.traza.at(-1)?.variables).toEqual({
      ...PARAMETROS_ORIGINALES,
      puntajeMax: '8.00',
      cumplimiento: 2,
      nota: '8.00',
      acumulado: '8.00',
      faltante: '3.00', // la segunda vuelta no entra al IF del relleno: @faltante conserva su valor
      orden: 2,
      selDm: null,
      selPuntos: '4.00', // un SELECT sin filas no asigna: queda el último valor
      selAporte: '3.00',
    })
  })
})

describe('otros escenarios', () => {
  it('tope-alto: entran las tres cuentas, 3 / 14.00 / 14.00, y la vista previa queda vacía', () => {
    const resultado = exitoso(ejecutarEscenario('tope-alto'))
    expect(seleccion(resultado)).toEqual([
      ['6744301200', '11637.2500', '5.00', '5.00'],
      ['2016185272', '11222.2133', '5.00', '5.00'],
      ['8026367297', '500.0267', '4.00', '4.00'],
    ])
    expect(resultado.resumen).toEqual({ tope: '20.00', cumplimiento: 3, nota: '14.00', puntosBrutos: '14.00' })
    expect(resultado.depuracion.filas).toEqual([])
    // Ninguna cubre 15.00 de faltante: el relleno toma la de más puntos.
    expect(pasos(resultado, 'relleno')[0].candidatos.every((candidato) => candidato.cubreFaltante === false)).toBe(true)
  })

  it('monto-en-hueco: 499.9950 queda sin rango; entran 973123360 (5) y 973123363 (aporte 3) y se borraría 17588594645', () => {
    const resultado = exitoso(ejecutarEscenario('monto-en-hueco'))
    expect(resultado.seleccion.map((fila) => [fila.dataMartId, fila.puntos, fila.aporte])).toEqual([
      ['973123360', '5.00', '5.00'],
      ['973123363', '5.00', '3.00'],
    ])
    expect(resultado.resumen).toEqual({ tope: '8.00', cumplimiento: 2, nota: '8.00', puntosBrutos: '10.00' })
    expect(resultado.exclusiones).toContainEqual(
      expect.objectContaining({ registroId: '17588594645', dataMartId: '973123736', motivo: 'SIN_RANGO' }),
    )
    const hueco = resultado.advertencias.find((advertencia) => advertencia.codigo === 'HUECO_ENTRE_RANGOS')
    expect(hueco).toMatchObject({ dataMartId: '973123736', puntosAsignarIds: [6202, 6203] })
    expect(hueco?.mensaje).toContain('4 decimales')
    expect(resultado.depuracion.filas.map((fila) => fila.id)).toEqual(['17588594645'])
  })

  it('rangos-traslapados: aplica la regla del menor PuntosAsignar.Id donde SQL Server no decide', () => {
    const resultado = exitoso(ejecutarEscenario('rangos-traslapados'))
    // El relleno elige la fila de 3.00 (rango 6205) por su ORDER BY; el INSERT … TOP 1 sin ORDER BY
    // toma la de menor Id (6203, 4.00). El aporte usa @selPuntos = 3.00.
    expect(seleccion(resultado)).toEqual([
      ['6744301200', '11637.2500', '5.00', '5.00'],
      ['8026367297', '500.0267', '4.00', '3.00'],
    ])
    expect(resultado.resumen).toEqual({ tope: '8.00', cumplimiento: 2, nota: '8.00', puntosBrutos: '9.00' })
    expect(pasos(resultado, 'relleno')[0].resaltado.candidato).toBe('17588594645:6205')
    expect(pasos(resultado, 'insercion')[1].resaltado.candidato).toBe('17588594645:6203')
    expect(pasos(resultado, 'insercion')[1].explicacion).toContain('menor PuntosAsignar.Id')

    const traslape = resultado.advertencias.find((advertencia) => advertencia.codigo === 'RANGOS_TRASLAPADOS')
    expect(traslape).toMatchObject({ registroId: '17588594645', puntosAsignarIds: [6203, 6205] })
    expect(traslape?.mensaje).toContain('menor PuntosAsignar.Id (6203)')
    expect(resultado.depuracion.filas.map((fila) => fila.id)).toEqual(['17588453840'])
  })

  it('sin-tope: aborta con el texto exacto del primer RAISERROR', () => {
    const resultado = ejecutarEscenario('sin-tope')
    expect(resultado).toMatchObject({
      ok: false,
      tipo: 'GUARDA',
      bloque: 'guardaTope',
      mensaje: 'Abortado: el indice 1455 no tiene PuntajeMax en dbo.Indices.',
    })
    if (resultado.ok || resultado.tipo !== 'GUARDA') throw new Error('tipo inesperado')
    expect(resultado.traza.map((paso) => paso.bloque)).toEqual(['preparacion', 'parametros', 'tope', 'guardaTope'])
    expect(resultado.traza.at(-1)?.variables?.puntajeMax).toBeNull()
  })

  it('sin-escala: aborta con el texto exacto del segundo RAISERROR', () => {
    const resultado = ejecutarEscenario('sin-escala')
    expect(resultado).toMatchObject({
      ok: false,
      tipo: 'GUARDA',
      bloque: 'guardaEscala',
      mensaje: 'Abortado: el indice 1455 no tiene escala en dbo.PuntosAsignar.',
    })
    if (resultado.ok || resultado.tipo !== 'GUARDA') throw new Error('tipo inesperado')
    expect(resultado.traza.map((paso) => paso.bloque)).toEqual(INICIO.slice(0, 5))
  })

  it('sin-candidatos: 0 / 0.00 / 0.00 y el paso 2 borraría todo, con BORRA_TODO', () => {
    const resultado = exitoso(ejecutarEscenario('sin-candidatos'))
    expect(resultado.seleccion).toEqual([])
    expect(resultado.resumen).toEqual({ tope: '8.00', cumplimiento: 0, nota: '0.00', puntosBrutos: '0.00' })
    expect(resultado.depuracion.filas.map((fila) => fila.id)).toEqual(['17588594645', '17588453840', '17588453845'])
    expect(codigos(resultado)).toEqual(['BORRA_TODO'])
    expect(resultado.exclusiones.filter((exclusion) => exclusion.motivo === 'SIN_RANGO')).toHaveLength(3)
    expect(resultado.traza.map((paso) => paso.bloque)).toEqual([...INICIO, ...FINAL, 'previsualizacion'])
  })

  it('original con @AplicarBorrado = 1: ejecuta el DELETE con filasBorradas 1', () => {
    const resultado = exitoso(ejecutarEscenario('original-con-borrado'))
    expect(resultado.depuracion).toMatchObject({ modo: 'delete', filasBorradas: 1 })
    expect(resultado.depuracion.filas.map((fila) => fila.id)).toEqual(['17588453840'])
    expect(resultado.traza.at(-1)?.bloque).toBe('borrado')
    expect(pasos(resultado, 'previsualizacion')).toEqual([])
  })

  it('cada escenario tiene un id único en kebab-case', () => {
    const ids = ESCENARIOS.map((escenario) => escenario.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true)
  })
})

describe('fidelidad al script', () => {
  it('compara Indicador como BigInt: 900 va antes que 1000 con el mismo Monto', () => {
    const dataset: DatasetFicticios = {
      ...DATASET_FICTICIOS,
      datamart: DATASET_FICTICIOS.datamart.map((fila, i) => ({ ...fila, monto: '600.0000', indicador: ['1000', '900', '5000'][i] })),
    }
    const resultado = exitoso(ejecutarConteoYValor(dataset, PARAMETROS_ORIGINALES))
    expect(resultado.seleccion[0].indicador).toBe('900')
  })

  it('BETWEEN es inclusivo en los dos extremos', () => {
    const dataset: DatasetFicticios = {
      ...DATASET_FICTICIOS,
      datamart: DATASET_FICTICIOS.datamart.map((fila, i) => ({ ...fila, monto: ['300.0000', '499.9900', '1000.0000'][i] })),
    }
    const resultado = exitoso(ejecutarConteoYValor(dataset, PARAMETROS_ORIGINALES))
    expect(resultado.exclusiones.filter((exclusion) => exclusion.motivo === 'SIN_RANGO')).toEqual([])
    expect(pasos(resultado, 'candidatos')[0].candidatos.map((candidato) => candidato.puntos).sort()).toEqual(['2.00', '2.00', '5.00'])
  })

  it('avisa los puntos no positivos y el bucle termina igual aunque esa cuenta no acerque al tope', () => {
    const dataset: DatasetFicticios = {
      ...DATASET_FICTICIOS,
      indices: [{ indiceId: 1455, puntajeMax: '20.00' }],
      puntosAsignar: DATASET_FICTICIOS.puntosAsignar.map((rango) => (rango.id === 6203 ? { ...rango, puntos: '0.00' } : rango)),
    }
    const resultado = exitoso(ejecutarConteoYValor(dataset, PARAMETROS_ORIGINALES))
    expect(codigos(resultado)).toContain('PUNTOS_NO_POSITIVOS')
    expect(seleccion(resultado).map(([indicador, , , aporte]) => [indicador, aporte])).toEqual([
      ['6744301200', '5.00'],
      ['2016185272', '5.00'],
      ['8026367297', '0.00'],
    ])
    expect(resultado.resumen).toEqual({ tope: '20.00', cumplimiento: 3, nota: '10.00', puntosBrutos: '10.00' })
  })

  it('no modifica los datos recibidos y es determinista', () => {
    const copia = structuredClone(DATASET_FICTICIOS)
    const primera = ejecutarConteoYValor(copia, PARAMETROS_ORIGINALES)
    expect(copia).toEqual(DATASET_FICTICIOS)
    expect(ejecutarConteoYValor(copia, PARAMETROS_ORIGINALES)).toEqual(primera)
  })
})

describe('entrada inválida', () => {
  it('marca cada dato que no cabe en su tipo, con su ruta', () => {
    const dataset: DatasetFicticios = {
      ...DATASET_FICTICIOS,
      datamart: [{ ...DATASET_FICTICIOS.datamart[0], monto: '1,5' }, ...DATASET_FICTICIOS.datamart.slice(1)],
      puntosAsignar: [{ ...DATASET_FICTICIOS.puntosAsignar[0], puntos: '2.005' }, ...DATASET_FICTICIOS.puntosAsignar.slice(1)],
    }
    const resultado = ejecutarConteoYValor(dataset, { ...PARAMETROS_ORIGINALES, mm: 7.5 })
    expect(resultado).toMatchObject({ ok: false, tipo: 'ENTRADA_INVALIDA' })
    if (resultado.ok || resultado.tipo !== 'ENTRADA_INVALIDA') throw new Error('tipo inesperado')
    expect(resultado.errores.map((error) => error.campo)).toEqual(['parametros.mm', 'datamart[0].monto', 'puntosAsignar[0].puntos'])
  })

  it('rechaza claves primarias repetidas', () => {
    const dataset: DatasetFicticios = {
      ...DATASET_FICTICIOS,
      datamart: [...DATASET_FICTICIOS.datamart, DATASET_FICTICIOS.datamart[0]],
    }
    const resultado = ejecutarConteoYValor(dataset, PARAMETROS_ORIGINALES)
    expect(resultado).toMatchObject({ ok: false, tipo: 'ENTRADA_INVALIDA', errores: [{ campo: 'datamart[3].id' }] })
  })

  it('un desbordamiento de DECIMAL(18,2) sale como entrada inválida (error 8115 en SQL Server)', () => {
    const dataset: DatasetFicticios = {
      ...DATASET_FICTICIOS,
      indices: [{ indiceId: 1455, puntajeMax: '9999999999999999.99' }],
      puntosAsignar: DATASET_FICTICIOS.puntosAsignar.map((rango) => ({ ...rango, puntos: '-9999999999999999.99' })),
    }
    const resultado = ejecutarConteoYValor(dataset, PARAMETROS_ORIGINALES)
    expect(resultado).toMatchObject({ ok: false, tipo: 'ENTRADA_INVALIDA' })
    if (resultado.ok || resultado.tipo !== 'ENTRADA_INVALIDA') throw new Error('tipo inesperado')
    expect(resultado.errores[0].mensaje).toContain('8115')
  })
})

function ranking(paso: PasoTraza): Record<string, number> {
  return Object.fromEntries(
    paso.candidatos
      .filter((candidato) => candidato.ranking !== null)
      .map((candidato) => [candidato.indicador, candidato.ranking ?? 0]),
  )
}
