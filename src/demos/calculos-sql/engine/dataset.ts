import type { DatasetFicticios, ParametrosConteo } from './tipos'

/**
 * Los datos de CrearFicticios.sql. Los BIGINT van sin ceros a la izquierda: en el script,
 * 0126367597 y 0026367297 son literales numéricos que SQL Server guarda como 126367597 y
 * 26367297. Una prueba compara esto con los INSERT del script.
 */
export const DATASET_FICTICIOS: DatasetFicticios = congelar({
  datamart: [
    { id: '973123360', yy: 2026, mm: 7, indicador: '6744301200', monto: '11637.2500', productoId: 532, usuario: 91720 },
    { id: '973123363', yy: 2026, mm: 7, indicador: '2016185272', monto: '11222.2133', productoId: 532, usuario: 91720 },
    { id: '973123736', yy: 2026, mm: 7, indicador: '8026367297', monto: '500.0267', productoId: 532, usuario: 91720 },
  ],
  registrosValidos: [
    registro('17588594646', 634, 17, '2996185272', '973123363', '2026-05-13'),
    registro('17588594647', 634, 17, '6743501200', '973123360', '2026-05-27'),
    registro('17588594648', 634, 14, '26367297', '973123736', '2026-05-29'),
    registro('17588453840', 1455, 17, '2016185472', '973123363', '2026-05-13'),
    registro('17588453845', 1455, 17, '9864301200', '973123360', '2026-05-27'),
    registro('17588594645', 1455, 14, '126367597', '973123736', '2026-05-29'),
  ],
  puntosAsignar: [
    { id: 6202, limiteInf: '300.00', limiteSup: '499.99', puntos: '2.00', factor: '0.00', puntajeMax: '0.00', indiceId: 1455 },
    { id: 6203, limiteInf: '500.00', limiteSup: '999.99', puntos: '4.00', factor: '0.00', puntajeMax: '0.00', indiceId: 1455 },
    {
      id: 6204,
      limiteInf: '1000.00',
      limiteSup: '999999999999999.99',
      puntos: '5.00',
      factor: '0.00',
      puntajeMax: '0.00',
      indiceId: 1455,
    },
  ],
  indices: [{ indiceId: 1455, puntajeMax: '8.00' }],
})

/** Los valores de los DECLARE del script. */
export const PARAMETROS_ORIGINALES: ParametrosConteo = Object.freeze({
  yy: 2026,
  mm: 7,
  indiceId: 1455,
  usuarioId: 91720,
  aplicarBorrado: false,
})

/** Las 6 filas comparten periodo, usuario, grupo y producto; cambian el índice, la sucursal y el cruce. */
function registro(id: string, indiceId: number, sucursalId: number, indicador: string, dataMartId: string, fapertura: string) {
  return { id, yy: 2026, mm: 7, indiceId, usuarioId: 91720, sucursalId, grupoId: 0, indicador, productoId: 532, dataMartId, fapertura }
}

/** Congela en profundidad: los escenarios derivan de aquí y nadie debe mutarlos por accidente. */
export function congelar<T>(valor: T): T {
  if (typeof valor === 'object' && valor !== null) {
    for (const propiedad of Object.values(valor)) congelar(propiedad)
    Object.freeze(valor)
  }
  return valor
}
