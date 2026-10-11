/**
 * Contratos públicos del motor que replica LogicaConteoYValor_Ficticios.sql.
 *
 * Convenciones:
 * - Los DECIMAL viajan como texto con su escala de SQL Server: Monto con 4 decimales
 *   ("11637.2500"); límites, puntos, tope y aportes con 2 ("8.00"). Por dentro se calculan con
 *   bigint de punto fijo, porque valores como 999999999999999.99 no caben exactos en un number.
 * - Los BIGINT (ids e indicadores) viajan como texto decimal canónico, sin ceros a la izquierda
 *   ("0126367597" → "126367597"), y se comparan como BigInt.
 * - Los INT son number enteros de 32 bits.
 */

/** DECIMAL como texto, p. ej. "11637.2500" o "8.00". */
export type DecimalTexto = string

/** BIGINT como texto decimal canónico, p. ej. "6744301200". */
export type BigIntTexto = string

// --- Entrada: las cuatro tablas de la base Ficticios ------------------------------------------

export interface FilaDatamart {
  readonly id: BigIntTexto
  readonly yy: number
  readonly mm: number
  readonly indicador: BigIntTexto
  /** DECIMAL(18,4). */
  readonly monto: DecimalTexto
  readonly productoId: number
  readonly usuario: number
}

export interface FilaRegistroValido {
  readonly id: BigIntTexto
  readonly yy: number
  readonly mm: number
  readonly indiceId: number
  readonly usuarioId: number
  readonly sucursalId: number | null
  readonly grupoId: number | null
  /** Ojo: el script no usa este Indicador sino el del Datamart (ver advertencia INDICADOR_DIFERENTE). */
  readonly indicador: BigIntTexto
  readonly productoId: number
  readonly dataMartId: BigIntTexto
  /** DATETIME como `yyyy-MM-dd`; el script no la usa. */
  readonly fapertura: string | null
}

export interface FilaPuntosAsignar {
  readonly id: number
  /** DECIMAL(18,2); el rango es inclusivo en ambos extremos (BETWEEN). */
  readonly limiteInf: DecimalTexto
  readonly limiteSup: DecimalTexto
  readonly puntos: DecimalTexto
  readonly factor: DecimalTexto
  /** El script no usa esta columna: el tope sale de dbo.Indices. */
  readonly puntajeMax: DecimalTexto
  readonly indiceId: number
}

export interface FilaIndice {
  readonly indiceId: number
  /** DECIMAL(18,2): el tope de puntos del índice. */
  readonly puntajeMax: DecimalTexto
}

export interface DatasetFicticios {
  readonly datamart: readonly FilaDatamart[]
  readonly registrosValidos: readonly FilaRegistroValido[]
  readonly puntosAsignar: readonly FilaPuntosAsignar[]
  readonly indices: readonly FilaIndice[]
}

/** Las variables DECLARE del script que se pueden editar. */
export interface ParametrosConteo {
  readonly yy: number
  readonly mm: number
  readonly indiceId: number
  readonly usuarioId: number
  /** @AplicarBorrado: false = vista previa del paso 2, true = ejecuta el DELETE. */
  readonly aplicarBorrado: boolean
}

// --- Bloques del script ---------------------------------------------------------------------------

/**
 * Bloques de LogicaConteoYValor_Ficticios.sql. `bucle` es el contenedor del WHILE (89–129); los
 * pasos dentro de él usan sus sub-bloques, y la evaluación de la condición usa `condicionBucle`.
 */
export type BloqueSql =
  | 'preparacion'
  | 'parametros'
  | 'tope'
  | 'guardaTope'
  | 'guardaEscala'
  | 'candidatos'
  | 'tablaFiltrado'
  | 'semilla'
  | 'bucle'
  | 'condicionBucle'
  | 'contador'
  | 'aporte'
  | 'insercion'
  | 'acumular'
  | 'reinicioSeleccion'
  | 'relleno'
  | 'agregados'
  | 'detalle'
  | 'resumen'
  | 'encabezadoPaso2'
  | 'previsualizacion'
  | 'borrado'

/** Líneas del script, empezando en 1 y con ambos extremos incluidos. */
export interface RangoLineas {
  readonly desde: number
  readonly hasta: number
}

// --- Traza paso a paso ----------------------------------------------------------------------------

/** Valor de cada variable del script después del paso (null = NULL en T-SQL). */
export interface VariablesScript {
  yy: number
  mm: number
  indiceId: number
  usuarioId: number
  aplicarBorrado: boolean
  puntajeMax: DecimalTexto | null
  cumplimiento: number | null
  nota: DecimalTexto | null
  acumulado: DecimalTexto
  faltante: DecimalTexto | null
  orden: number
  selDm: BigIntTexto | null
  selPuntos: DecimalTexto | null
  selAporte: DecimalTexto | null
}

/** Una fila de #candidatos: un registro válido cruzado con su Datamart y con un rango de la escala. */
export interface CandidatoTraza {
  /** Única por fila: `<Id de RegistrosValidos>:<Id de PuntosAsignar>`. */
  clave: string
  registroId: BigIntTexto
  puntosAsignarId: number
  /** El Indicador del Datamart (d.Indicador), que es el que guarda #candidatos. */
  indicador: BigIntTexto
  dataMartId: BigIntTexto
  usuarioId: number
  indiceId: number
  yy: number
  mm: number
  monto: DecimalTexto
  puntos: DecimalTexto
  /** Posición (desde 1) en el ORDER BY de la semilla o del relleno; null en los demás pasos. */
  ranking: number | null
  /** Solo en el relleno: Puntos >= @faltante. */
  cubreFaltante: boolean | null
}

/** Una fila de #filtrado: la combinación elegida, con el aporte real al tope. */
export interface FilaFiltrado {
  orden: number
  indicador: BigIntTexto
  dataMartId: BigIntTexto
  usuarioId: number
  indiceId: number
  yy: number
  mm: number
  monto: DecimalTexto
  puntos: DecimalTexto
  aporte: DecimalTexto
}

/** Lo que el paso toca, para resaltarlo en la UI. */
export interface Resaltado {
  /** Clave de la fila de #candidatos que el paso elige o inserta. */
  candidato: string | null
  /** `orden` de la fila de #filtrado que el paso inserta. */
  filtrado: number | null
}

/** Foto completa del estado después de ejecutar un bloque. */
export interface PasoTraza {
  /** Posición del paso, desde 0. */
  indice: number
  bloque: BloqueSql
  titulo: string
  explicacion: string
  /** null solo en `preparacion`, antes de los DECLARE. */
  variables: VariablesScript | null
  candidatos: CandidatoTraza[]
  filtrado: FilaFiltrado[]
  resaltado: Resaltado
}

// --- Resultado ------------------------------------------------------------------------------------

/** El SELECT de resumen del script. */
export interface Resumen {
  tope: DecimalTexto
  cumplimiento: number
  nota: DecimalTexto
  puntosBrutos: DecimalTexto
}

export interface FilaDepuracion {
  id: BigIntTexto
  yy: number
  mm: number
  indiceId: number
  usuarioId: number
  indicador: BigIntTexto
  dataMartId: BigIntTexto
}

/** Paso 2 del script. */
export interface Depuracion {
  modo: 'preview' | 'delete'
  /** Filas que se borrarían (preview) o que se borraron (delete), por Indicador de RegistrosValidos. */
  filas: FilaDepuracion[]
  /** @@ROWCOUNT del DELETE; null en la vista previa. */
  filasBorradas: number | null
}

export type MotivoExclusion = 'OTRO_PERIODO' | 'OTRO_INDICE' | 'OTRO_USUARIO' | 'SIN_DATAMART' | 'SIN_RANGO'

/** Registro de RegistrosValidos que no entra en #candidatos, con el primer motivo según el script. */
export interface Exclusion {
  registroId: BigIntTexto
  dataMartId: BigIntTexto
  motivo: MotivoExclusion
  detalle: string
}

export type CodigoAdvertencia =
  | 'INDICADOR_DIFERENTE'
  | 'HUECO_ENTRE_RANGOS'
  | 'RANGOS_TRASLAPADOS'
  | 'BORRA_TODO'
  | 'PUNTOS_NO_POSITIVOS'

export interface Advertencia {
  codigo: CodigoAdvertencia
  mensaje: string
  registroId?: BigIntTexto
  dataMartId?: BigIntTexto
  puntosAsignarIds?: number[]
}

export interface ResultadoOk {
  ok: true
  traza: PasoTraza[]
  /** #filtrado al final: la combinación elegida, en orden. */
  seleccion: FilaFiltrado[]
  resumen: Resumen
  depuracion: Depuracion
  exclusiones: Exclusion[]
  advertencias: Advertencia[]
}

/** El script abortó en una guarda (RAISERROR + RETURN). */
export interface ResultadoGuarda {
  ok: false
  tipo: 'GUARDA'
  bloque: 'guardaTope' | 'guardaEscala'
  /** Texto exacto del RAISERROR, con %d ya sustituido. */
  mensaje: string
  traza: PasoTraza[]
}

export interface ErrorEntrada {
  /** Ruta del dato, p. ej. `datamart[2].monto` o `parametros.mm`. */
  campo: string
  mensaje: string
}

/** Los datos no caben en los tipos de las tablas (o la cuenta desbordaría un DECIMAL(18,2)). */
export interface ResultadoEntradaInvalida {
  ok: false
  tipo: 'ENTRADA_INVALIDA'
  errores: ErrorEntrada[]
}

export type ResultadoConteo = ResultadoOk | ResultadoGuarda | ResultadoEntradaInvalida

// --- Escenarios -----------------------------------------------------------------------------------

export type IdEscenario =
  | 'original'
  | 'tope-alto'
  | 'monto-en-hueco'
  | 'rangos-traslapados'
  | 'sin-tope'
  | 'sin-escala'
  | 'sin-candidatos'
  | 'original-con-borrado'

export interface Escenario {
  /** En kebab-case, para el enlace profundo `?escenario=`. */
  id: IdEscenario
  titulo: string
  descripcion: string
  dataset: DatasetFicticios
  parametros: ParametrosConteo
}
