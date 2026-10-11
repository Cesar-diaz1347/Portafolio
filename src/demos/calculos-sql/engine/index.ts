/**
 * Motor de la demo «Cálculos SQL»: replica LogicaConteoYValor_Ficticios.sql en el navegador y
 * devuelve una traza paso a paso para el simulador.
 *
 * Uso típico en la UI:
 *   const escenario = ESCENARIOS.find((e) => e.id === 'original')
 *   const resultado = ejecutarConteoYValor(escenario.dataset, escenario.parametros)
 *   if (resultado.ok) … resultado.traza[i] … BLOQUES_SQL[resultado.traza[i].bloque]
 *   else if (resultado.tipo === 'GUARDA') … resultado.mensaje (texto del RAISERROR)
 *   else … resultado.errores (campo + mensaje, para marcar los inputs)
 *
 * Los datos de entrada son inmutables: para editarlos, crea copias (spread) y vuelve a ejecutar.
 */
export { ejecutarConteoYValor } from './motor'
export { BLOQUES_SQL } from './bloques'
export { DATASET_FICTICIOS, PARAMETROS_ORIGINALES } from './dataset'
export { ESCENARIOS } from './escenarios'
export { SCRIPT_DATOS, SCRIPT_LOGICA } from './scripts'
export type {
  Advertencia,
  BigIntTexto,
  BloqueSql,
  CandidatoTraza,
  CodigoAdvertencia,
  DatasetFicticios,
  DecimalTexto,
  Depuracion,
  ErrorEntrada,
  Escenario,
  Exclusion,
  FilaDatamart,
  FilaDepuracion,
  FilaFiltrado,
  FilaIndice,
  FilaPuntosAsignar,
  FilaRegistroValido,
  IdEscenario,
  MotivoExclusion,
  ParametrosConteo,
  PasoTraza,
  RangoLineas,
  Resaltado,
  ResultadoConteo,
  ResultadoEntradaInvalida,
  ResultadoGuarda,
  ResultadoOk,
  Resumen,
  VariablesScript,
} from './tipos'
