import { describe, expect, it } from 'vitest'

import { BLOQUES_SQL } from './bloques'
import { SCRIPT_LOGICA } from './scripts'
import type { BloqueSql } from './tipos'

const LINEAS = SCRIPT_LOGICA.split(/\r?\n/)
const linea = (numero: number) => (LINEAS[numero - 1] ?? '').trim()

/** Primera y última línea de cada bloque, tal como están en el script. */
const ANCLAS: Record<BloqueSql, [RegExp, RegExp]> = {
  preparacion: [/^USE Ficticios;$/, /^GO$/],
  parametros: [/^DECLARE @YY\s+INT = 2026,$/, /^@selAporte\s+DECIMAL\(18,2\);$/],
  tope: [/^-- Tope dinamico por indice/, /^WHERE IndiceId = @INDICEID;$/],
  guardaTope: [/^IF @PUNTAJEMAX IS NULL$/, /^END$/],
  guardaEscala: [/^IF NOT EXISTS \(SELECT 1 FROM dbo\.PuntosAsignar WHERE IndiceId = @INDICEID\)$/, /^END$/],
  candidatos: [/^\/\* =+$/, /^AND r\.UsuarioId = @USUARIOID;$/],
  tablaFiltrado: [/^CREATE TABLE #filtrado$/, /^\);$/],
  semilla: [/^-- SEMILLA:/, /^ORDER BY Monto DESC, Indicador;$/],
  bucle: [/^WHILE @selDm IS NOT NULL$/, /^END$/],
  condicionBucle: [/^WHILE @selDm IS NOT NULL$/, /^WHILE @selDm IS NOT NULL$/],
  contador: [/^SET @orden \+= 1;$/, /^SET @orden \+= 1;$/],
  aporte: [/^-- Aporte real al tope/, /^END;$/],
  insercion: [/^INSERT INTO #filtrado$/, /^WHERE DataMartId = @selDm;$/],
  acumular: [/^SET @acumulado \+= @selAporte;$/, /^DELETE FROM #candidatos WHERE DataMartId = @selDm;$/],
  reinicioSeleccion: [/^SET @selDm = NULL;$/, /^SET @selDm = NULL;$/],
  relleno: [/^-- RELLENO:/, /^END$/],
  agregados: [/^SELECT @Cumplimiento = COUNT\(Indicador\),$/, /^FROM #filtrado;$/],
  detalle: [/^-- Detalle de la combinacion elegida/, /^ORDER BY orden;$/],
  resumen: [/^SELECT @PUNTAJEMAX\s+AS Tope,$/, /AS PuntosBrutos;$/],
  encabezadoPaso2: [/^\/\* =+$/, /^=+ \*\/$/],
  previsualizacion: [/^IF @AplicarBorrado = 0$/, /^END$/],
  borrado: [/^ELSE$/, /^END$/],
}

const SUB_BLOQUES_DEL_BUCLE: BloqueSql[] = [
  'condicionBucle',
  'contador',
  'aporte',
  'insercion',
  'acumular',
  'reinicioSeleccion',
  'relleno',
]

describe('BLOQUES_SQL', () => {
  it('el script es la copia de 195 líneas con finales LF', () => {
    expect(SCRIPT_LOGICA.includes('\r')).toBe(false)
    expect(SCRIPT_LOGICA.endsWith('GO\n')).toBe(true)
    expect(LINEAS).toHaveLength(196) // 195 líneas más el vacío tras el último salto
  })

  it.each(Object.entries(ANCLAS) as [BloqueSql, [RegExp, RegExp]][])('%s empieza y termina en sus líneas ancla', (bloque, [inicio, fin]) => {
    const { desde, hasta } = BLOQUES_SQL[bloque]
    expect(linea(desde)).toMatch(inicio)
    expect(linea(hasta)).toMatch(fin)
  })

  it('los bloques principales van en orden y no se traslapan; los del bucle quedan dentro de él', () => {
    const principales = (Object.keys(BLOQUES_SQL) as BloqueSql[]).filter((bloque) => !SUB_BLOQUES_DEL_BUCLE.includes(bloque))
    const rangos = principales.map((bloque) => BLOQUES_SQL[bloque])
    rangos.forEach((rango, i) => {
      expect(rango.desde).toBeLessThanOrEqual(rango.hasta)
      if (i > 0) expect(rango.desde).toBeGreaterThan(rangos[i - 1].hasta)
    })
    expect(rangos.at(-1)?.hasta).toBeLessThanOrEqual(195)

    for (const bloque of SUB_BLOQUES_DEL_BUCLE) {
      expect(BLOQUES_SQL[bloque].desde).toBeGreaterThanOrEqual(BLOQUES_SQL.bucle.desde)
      expect(BLOQUES_SQL[bloque].hasta).toBeLessThanOrEqual(BLOQUES_SQL.bucle.hasta)
    }
  })
})
