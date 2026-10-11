import type { BloqueSql, RangoLineas } from './tipos'

/**
 * Líneas de cada bloque en LogicaConteoYValor_Ficticios.sql (195 líneas, LF). Una prueba revisa
 * las líneas ancla leyendo el script con `?raw`, así que si el script cambia, esto avisa.
 */
export const BLOQUES_SQL: Readonly<Record<BloqueSql, RangoLineas>> = Object.freeze({
  preparacion: { desde: 1, hasta: 6 },
  parametros: { desde: 8, hasta: 22 },
  tope: { desde: 24, hasta: 27 },
  guardaTope: { desde: 30, hasta: 34 },
  guardaEscala: { desde: 36, hasta: 40 },
  candidatos: { desde: 43, hasta: 66 },
  tablaFiltrado: { desde: 68, hasta: 80 },
  semilla: { desde: 82, hasta: 87 },
  bucle: { desde: 89, hasta: 129 },
  condicionBucle: { desde: 89, hasta: 89 },
  contador: { desde: 91, hasta: 91 },
  aporte: { desde: 93, hasta: 97 },
  insercion: { desde: 99, hasta: 104 },
  acumular: { desde: 106, hasta: 107 },
  reinicioSeleccion: { desde: 109, hasta: 109 },
  relleno: { desde: 111, hasta: 128 },
  agregados: { desde: 131, hasta: 133 },
  detalle: { desde: 135, hasta: 138 },
  resumen: { desde: 140, hasta: 143 },
  encabezadoPaso2: { desde: 146, hasta: 152 },
  previsualizacion: { desde: 154, hasta: 174 },
  borrado: { desde: 175, hasta: 194 },
})
