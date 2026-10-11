import { DATASET_FICTICIOS, PARAMETROS_ORIGINALES, congelar } from './dataset'
import type { DatasetFicticios, Escenario, FilaDatamart } from './tipos'

const MONTO_EN_HUECO = '499.9950'
const DATAMART_DEL_HUECO = '973123736'

/** Escenarios del selector de la demo. Todos parten de los datos del script. */
export const ESCENARIOS: readonly Escenario[] = congelar([
  {
    id: 'original',
    titulo: 'Original',
    descripcion: 'Los datos y parámetros del script, tal cual: tope 8.00 para el índice 1455.',
    dataset: DATASET_FICTICIOS,
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'tope-alto',
    titulo: 'Tope alto',
    descripcion: 'El tope sube a 20.00: ninguna cuenta lo cubre sola y entran las tres.',
    dataset: { ...DATASET_FICTICIOS, indices: [{ indiceId: 1455, puntajeMax: '20.00' }] },
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'monto-en-hueco',
    titulo: 'Monto en un hueco',
    descripcion:
      'Un Monto de 499.9950 queda entre los rangos 300.00–499.99 y 500.00–999.99: Monto tiene 4 decimales y los límites 2, así que ningún rango lo cubre.',
    dataset: conMontoDatamart(DATASET_FICTICIOS, DATAMART_DEL_HUECO, MONTO_EN_HUECO),
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'rangos-traslapados',
    titulo: 'Rangos traslapados',
    descripcion:
      'Se agrega el rango 400.00–600.00 → 3.00 puntos, que se traslapa con 500.00–999.99. SQL Server no garantiza qué fila elige; la demo usa la de menor PuntosAsignar.Id.',
    dataset: {
      ...DATASET_FICTICIOS,
      puntosAsignar: [
        ...DATASET_FICTICIOS.puntosAsignar,
        { id: 6205, limiteInf: '400.00', limiteSup: '600.00', puntos: '3.00', factor: '0.00', puntajeMax: '0.00', indiceId: 1455 },
      ],
    },
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'sin-tope',
    titulo: 'Sin tope',
    descripcion: 'dbo.Indices no tiene el índice 1455: la primera guarda aborta con RAISERROR.',
    dataset: { ...DATASET_FICTICIOS, indices: [] },
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'sin-escala',
    titulo: 'Sin escala',
    descripcion: 'dbo.PuntosAsignar no tiene rangos para el índice 1455: la segunda guarda aborta.',
    dataset: { ...DATASET_FICTICIOS, puntosAsignar: [] },
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'sin-candidatos',
    titulo: 'Sin candidatos',
    descripcion: 'Los tres montos quedan por debajo de la escala: no hay combinación y el paso 2 borraría todas las filas.',
    dataset: {
      ...DATASET_FICTICIOS,
      datamart: DATASET_FICTICIOS.datamart.map((fila, i) => ({ ...fila, monto: ['250.0000', '120.5000', '80.0000'][i] })),
    },
    parametros: PARAMETROS_ORIGINALES,
  },
  {
    id: 'original-con-borrado',
    titulo: 'Original con borrado',
    descripcion: 'Los datos originales con @AplicarBorrado = 1: el paso 2 ejecuta el DELETE.',
    dataset: DATASET_FICTICIOS,
    parametros: { ...PARAMETROS_ORIGINALES, aplicarBorrado: true },
  },
] satisfies Escenario[])

function conMontoDatamart(dataset: DatasetFicticios, id: string, monto: string): DatasetFicticios {
  const datamart: FilaDatamart[] = dataset.datamart.map((fila) => (fila.id === id ? { ...fila, monto } : fila))
  return { ...dataset, datamart }
}
