import { describe, expect, it } from 'vitest'

import { SCRIPT_DATOS, SCRIPT_LOGICA } from '../engine'
import { resaltarSql, type Token } from './resaltadoSql'

/** «tipo:texto» por token, para leer las expectativas de un vistazo. */
function ver(linea: string): string[] {
  const [tokens = []] = resaltarSql(linea)
  return tokens.map((token) => `${token.tipo}:${token.texto}`)
}

describe('resaltarSql', () => {
  it('distingue palabras clave, @variables, números y comentarios', () => {
    expect(ver('SELECT @YY = 2026 -- año')).toEqual([
      'palabra:SELECT',
      'texto: ',
      'variable:@YY',
      'texto: = ',
      'numero:2026',
      'texto: ',
      'comentario:-- año',
    ])
  })

  it('no distingue mayúsculas de minúsculas en las palabras clave', () => {
    expect(ver('select top 1 from dbo.Datamart')).toEqual([
      'palabra:select',
      'texto: ',
      'palabra:top',
      'texto: ',
      'numero:1',
      'texto: ',
      'palabra:from',
      'texto: dbo.Datamart',
    ])
  })

  it('reconoce tipos de dato, funciones y números decimales', () => {
    expect(ver('DECIMAL(18,2) = ISNULL(SUM(x), 0.5)')).toEqual([
      'tipo:DECIMAL',
      'texto:(',
      'numero:18',
      'texto:,',
      'numero:2',
      'texto:) = ',
      'funcion:ISNULL',
      'texto:(',
      'funcion:SUM',
      'texto:(x), ',
      'numero:0.5',
      'texto:)',
    ])
  })

  it('una cadena con comillas duplicadas es un solo token y no colorea lo de adentro', () => {
    expect(ver("RAISERROR('it''s #tmp %d', 16, 1)")).toEqual([
      'funcion:RAISERROR',
      'texto:(',
      "cadena:'it''s #tmp %d'",
      'texto:, ',
      'numero:16',
      'texto:, ',
      'numero:1',
      'texto:)',
    ])
  })

  it('una cadena sin cerrar llega hasta el final de la línea', () => {
    expect(ver("PRINT 'sin cerrar -- no es comentario")).toEqual([
      'palabra:PRINT',
      'texto: ',
      "cadena:'sin cerrar -- no es comentario",
    ])
  })

  it('reconoce @@variables del sistema y tablas #temporales', () => {
    expect(ver('SELECT @@ROWCOUNT FROM #filtrado, ##global')).toEqual([
      'palabra:SELECT',
      'texto: ',
      'variable:@@ROWCOUNT',
      'texto: ',
      'palabra:FROM',
      'texto: ',
      'temporal:#filtrado',
      'texto:, ',
      'temporal:##global',
    ])
  })

  it('tras un punto, un nombre que coincide con una palabra clave sigue siendo un nombre', () => {
    expect(ver('r.Index, d.Table')).toEqual(['texto:r.Index, d.Table'])
  })

  it('los comentarios de bloque siguen en las líneas siguientes hasta cerrarse', () => {
    const lineas = resaltarSql('/* abre\nsigue SELECT\ncierra */ SELECT 1')
    const tipos = (indice: number): string[] => (lineas[indice] ?? []).map((token: Token) => token.tipo)
    expect(tipos(0)).toEqual(['comentario'])
    expect(tipos(1)).toEqual(['comentario'])
    expect(tipos(2)).toEqual(['comentario', 'texto', 'palabra', 'texto', 'numero'])
    expect(lineas[2]?.[0]?.texto).toBe('cierra */')
  })

  it('un comentario de bloque que abre y cierra en la misma línea no contagia a la siguiente', () => {
    const lineas = resaltarSql('SELECT /* x */ 1\nSELECT 2')
    expect(lineas[1]?.map((token) => token.tipo)).toEqual(['palabra', 'texto', 'numero'])
  })

  it('una línea vacía no tiene tokens y cada línea del texto se conserva', () => {
    expect(resaltarSql('a\n\nb\r\nc')).toHaveLength(4)
    expect(resaltarSql('a\n\nb')[1]).toEqual([])
  })
})

describe('resaltarSql sobre los scripts reales', () => {
  it.each([
    ['LogicaConteoYValor_Ficticios.sql', SCRIPT_LOGICA],
    ['CrearFicticios.sql', SCRIPT_DATOS],
  ])('%s: es sin pérdida, línea por línea', (_nombre, script) => {
    const originales = script.split(/\r?\n/)
    const resaltadas = resaltarSql(script)
    expect(resaltadas).toHaveLength(originales.length)
    resaltadas.forEach((tokens, i) => {
      expect(tokens.map((token) => token.texto).join('')).toBe(originales[i])
    })
  })

  it('colorea las líneas conocidas de la lógica', () => {
    const lineas = resaltarSql(SCRIPT_LOGICA)
    const tipos = (numero: number): string[] => (lineas[numero - 1] ?? []).map((token) => `${token.tipo}:${token.texto.trim()}`)

    // Línea 4: IF OBJECT_ID('tempdb..#candidatos') IS NOT NULL DROP TABLE #candidatos;
    expect(tipos(4)).toContain('funcion:OBJECT_ID')
    expect(tipos(4)).toContain("cadena:'tempdb..#candidatos'")
    expect(tipos(4)).toContain('temporal:#candidatos')
    // Línea 8: DECLARE @YY INT = 2026,
    expect(tipos(8)).toEqual(expect.arrayContaining(['palabra:DECLARE', 'variable:@YY', 'tipo:INT', 'numero:2026']))
    // Línea 24: comentario de línea completo.
    expect(lineas[23]?.map((token) => token.tipo)).toEqual(['comentario'])
    // Líneas 43–45: el comentario de bloque del encabezado.
    for (const numero of [43, 44, 45]) expect(lineas[numero - 1]?.every((token) => token.tipo === 'comentario')).toBe(true)
    // Línea 32: el texto del RAISERROR es una cadena.
    expect(tipos(32).some((token) => token.startsWith("cadena:'Abortado: el indice %d"))).toBe(true)
    // Línea 193: la variable del sistema.
    expect(tipos(193)).toContain('variable:@@ROWCOUNT')
  })
})
