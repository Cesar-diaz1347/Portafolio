import { describe, expect, it } from 'vitest'

import { ESCENARIOS, ejecutarConteoYValor, type Escenario, type IdEscenario } from '../engine'
import {
  construirEntrada,
  describirCampo,
  erroresPorCampo,
  estaEditado,
  formularioInicial,
  rutaIndice,
  rutaMonto,
  rutaParametro,
  rutaRango,
  type Formulario,
} from './formulario'

function escenario(id: IdEscenario): Escenario {
  const encontrado = ESCENARIOS.find((candidato) => candidato.id === id)
  if (!encontrado) throw new Error(`Falta el escenario ${id}`)
  return encontrado
}

function editar(base: Formulario, cambios: Record<string, string>): Formulario {
  return { ...base, campos: { ...base.campos, ...cambios } }
}

describe('formulario inicial', () => {
  it('reproduce el escenario: construir sin editar devuelve los mismos datos y parámetros', () => {
    for (const { id } of ESCENARIOS) {
      const base = escenario(id)
      const entrada = construirEntrada(base, formularioInicial(base))
      expect(entrada.errores).toEqual([])
      expect(entrada.dataset).toEqual(base.dataset)
      expect(entrada.parametros).toEqual(base.parametros)
    }
  })

  it('un escenario con borrado arranca en modo DELETE', () => {
    expect(formularioInicial(escenario('original-con-borrado')).aplicarBorrado).toBe(true)
    expect(formularioInicial(escenario('original')).aplicarBorrado).toBe(false)
  })

  it('detecta cuándo hay cambios', () => {
    const base = formularioInicial(escenario('original'))
    expect(estaEditado(base, base)).toBe(false)
    expect(estaEditado(editar(base, { [rutaMonto(0)]: '1' }), base)).toBe(true)
    expect(estaEditado({ ...base, aplicarBorrado: true }, base)).toBe(true)
  })
})

describe('construirEntrada: lectura flexible', () => {
  const original = escenario('original')

  it('«11,637.25» y «11637.25» llegan al motor como el mismo número', () => {
    const conComa = construirEntrada(original, editar(formularioInicial(original), { [rutaMonto(0)]: '11,637.25' }))
    const sinComa = construirEntrada(original, editar(formularioInicial(original), { [rutaMonto(0)]: '11637.25' }))
    expect(conComa.errores).toEqual([])
    expect(conComa.dataset.datamart[0]?.monto).toBe('11637.25')
    expect(conComa.dataset).toEqual(sinComa.dataset)
    expect(ejecutarConteoYValor(conComa.dataset, conComa.parametros)).toEqual(
      ejecutarConteoYValor(original.dataset, original.parametros),
    )
  })

  it('un texto que no es número deja el valor original y anota el error en su campo', () => {
    const entrada = construirEntrada(original, editar(formularioInicial(original), { [rutaMonto(1)]: 'abc' }))
    expect(entrada.dataset.datamart[1]?.monto).toBe(original.dataset.datamart[1]?.monto)
    expect(entrada.errores).toHaveLength(1)
    expect(entrada.errores[0]?.campo).toBe('datamart[1].monto')
    expect(entrada.errores[0]?.mensaje).toContain('abc')
  })

  it('los parámetros aceptan separadores de miles y marcan lo ilegible', () => {
    const base = formularioInicial(original)
    const bueno = construirEntrada(original, editar(base, { [rutaParametro('usuarioId')]: '91,720' }))
    expect(bueno.parametros.usuarioId).toBe(91720)
    const malo = construirEntrada(original, editar(base, { [rutaParametro('mm')]: '7.5' }))
    expect(malo.errores.map((error) => error.campo)).toEqual(['parametros.mm'])
    expect(malo.parametros.mm).toBe(7)
  })

  it('no modifica los datos del escenario', () => {
    const copia = structuredClone(original.dataset)
    construirEntrada(original, editar(formularioInicial(original), { [rutaMonto(0)]: '1', [rutaIndice(0)]: '3' }))
    expect(original.dataset).toEqual(copia)
  })
})

describe('con el motor', () => {
  const original = escenario('original')

  it('editar un monto recalcula: con 250 en la cuenta mayor ya no es la semilla', () => {
    const entrada = construirEntrada(original, editar(formularioInicial(original), { [rutaMonto(0)]: '250' }))
    const resultado = ejecutarConteoYValor(entrada.dataset, entrada.parametros)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.seleccion[0]?.indicador).toBe('2016185272')
  })

  it('editar los puntos de la escala recalcula: 9 puntos en el rango de arriba llenan el tope solos', () => {
    const entrada = construirEntrada(original, editar(formularioInicial(original), { [rutaRango(2, 'puntos')]: '9' }))
    const resultado = ejecutarConteoYValor(entrada.dataset, entrada.parametros)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.resumen.cumplimiento).toBe(1)
      expect(resultado.resumen.nota).toBe('8.00')
    }
  })

  it('el motor marca con la ruta del campo lo que no cabe en la columna', () => {
    const entrada = construirEntrada(original, editar(formularioInicial(original), { [rutaMonto(0)]: '1.23456' }))
    expect(entrada.errores).toEqual([])
    const resultado = ejecutarConteoYValor(entrada.dataset, entrada.parametros)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok && resultado.tipo === 'ENTRADA_INVALIDA') {
      expect(resultado.errores.map((error) => error.campo)).toContain('datamart[0].monto')
    }
  })
})

describe('mensajes por campo', () => {
  it('agrupa por ruta y une los mensajes repetidos', () => {
    expect(
      erroresPorCampo([
        { campo: 'a', mensaje: 'uno.' },
        { campo: 'b', mensaje: 'dos.' },
        { campo: 'a', mensaje: 'tres.' },
      ]),
    ).toEqual({ a: 'uno. tres.', b: 'dos.' })
  })

  it.each([
    ['datamart[2].monto', 'Datamart, fila 3, Monto'],
    ['puntosAsignar[0].limiteInf', 'PuntosAsignar, fila 1, LimiteInf'],
    ['indices[0].puntajeMax', 'Indices, fila 1, PuntajeMax'],
    ['registrosValidos[4]', 'RegistrosValidos, fila 5'],
    ['parametros.mm', '@MM'],
    ['parametros.usuarioId', '@USUARIOID'],
    ['puntosAsignar', 'PuntosAsignar'],
  ])('describe %j como %j', (ruta, esperado) => {
    expect(describirCampo(ruta)).toBe(esperado)
  })
})
