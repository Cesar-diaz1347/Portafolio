import type { CodigoAdvertencia, MotivoExclusion, VariablesScript } from '../engine'

export interface DefinicionVariable {
  readonly clave: keyof VariablesScript
  /** Nombre en el script. */
  readonly nombre: string
  readonly tipo: string
}

/** Las variables del script, en el orden de sus DECLARE. */
export const VARIABLES: readonly DefinicionVariable[] = [
  { clave: 'yy', nombre: '@YY', tipo: 'INT' },
  { clave: 'mm', nombre: '@MM', tipo: 'INT' },
  { clave: 'indiceId', nombre: '@INDICEID', tipo: 'INT' },
  { clave: 'usuarioId', nombre: '@USUARIOID', tipo: 'INT' },
  { clave: 'puntajeMax', nombre: '@PUNTAJEMAX', tipo: 'DECIMAL(18,2)' },
  { clave: 'cumplimiento', nombre: '@Cumplimiento', tipo: 'INT' },
  { clave: 'nota', nombre: '@Nota', tipo: 'DECIMAL(18,2)' },
  { clave: 'aplicarBorrado', nombre: '@AplicarBorrado', tipo: 'BIT' },
  { clave: 'acumulado', nombre: '@acumulado', tipo: 'DECIMAL(18,2)' },
  { clave: 'faltante', nombre: '@faltante', tipo: 'DECIMAL(18,2)' },
  { clave: 'orden', nombre: '@orden', tipo: 'INT' },
  { clave: 'selDm', nombre: '@selDm', tipo: 'BIGINT' },
  { clave: 'selPuntos', nombre: '@selPuntos', tipo: 'DECIMAL(18,2)' },
  { clave: 'selAporte', nombre: '@selAporte', tipo: 'DECIMAL(18,2)' },
]

/** Como lo mostraría SSMS: NULL, y los BIT como 1 o 0. */
export function formatearVariable(valor: string | number | boolean | null): string {
  if (valor === null) return 'NULL'
  if (typeof valor === 'boolean') return valor ? '1' : '0'
  return String(valor)
}

export const ETIQUETA_MOTIVO: Readonly<Record<MotivoExclusion, string>> = {
  OTRO_PERIODO: 'Otro periodo',
  OTRO_INDICE: 'Otro índice',
  OTRO_USUARIO: 'Otro usuario',
  SIN_DATAMART: 'Sin Datamart',
  SIN_RANGO: 'Sin rango',
}

export const ETIQUETA_ADVERTENCIA: Readonly<Record<CodigoAdvertencia, string>> = {
  INDICADOR_DIFERENTE: 'Indicador distinto',
  HUECO_ENTRE_RANGOS: 'Hueco entre rangos',
  RANGOS_TRASLAPADOS: 'Rangos traslapados',
  BORRA_TODO: 'Se borraría todo',
  PUNTOS_NO_POSITIVOS: 'Puntos no positivos',
}
