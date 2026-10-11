import { ESCALA_MONTO, ESCALA_PUNTOS, aEscala, formatearDecimal } from './decimal'
import type { Advertencia, Exclusion, MotivoExclusion, ParametrosConteo } from './tipos'
import type { DatamartInterno, EntradaInterna, RangoInterno, RegistroInterno } from './validacion'

/** Una fila de #candidatos (RegistrosValidos × Datamart × PuntosAsignar). */
export interface CandidatoInterno {
  clave: string
  registroId: bigint
  puntosAsignarId: number
  /** d.Indicador: el del Datamart. */
  indicador: bigint
  dataMartId: bigint
  usuarioId: number
  indiceId: number
  yy: number
  mm: number
  /** Escala 4. */
  monto: bigint
  /** Escala 2. */
  puntos: bigint
}

export interface Combinacion {
  candidatos: CandidatoInterno[]
  exclusiones: Exclusion[]
  advertencias: Advertencia[]
}

/**
 * El SELECT … INTO #candidatos del script (líneas 47–66):
 * RegistrosValidos r JOIN Datamart d ON r.DataMartId = d.Id
 *                    JOIN PuntosAsignar pa ON r.IndiceId = pa.IndiceId AND d.Monto BETWEEN pa.LimiteInf AND pa.LimiteSup
 * WHERE r.yy = @YY AND r.mm = @MM AND r.IndiceId = @INDICEID AND r.UsuarioId = @USUARIOID.
 * Un registro que cae en dos rangos genera dos filas, igual que el JOIN.
 */
export function combinarCuentas(entrada: EntradaInterna): Combinacion {
  const { parametros } = entrada
  const datamartPorId = new Map(entrada.datamart.map((fila) => [fila.id, fila]))
  const candidatos: CandidatoInterno[] = []
  const exclusiones: Exclusion[] = []
  const advertencias: Advertencia[] = []

  for (const registro of entrada.registros) {
    const filtro = motivoDeFiltro(registro, parametros)
    if (filtro) {
      exclusiones.push(exclusion(registro, filtro.motivo, filtro.detalle))
      continue
    }

    const datamart = datamartPorId.get(registro.dataMartId)
    if (!datamart) {
      exclusiones.push(exclusion(registro, 'SIN_DATAMART', `No hay fila en Datamart con Id ${registro.dataMartId}.`))
      continue
    }

    const rangosDelIndice = entrada.rangos.filter((rango) => rango.indiceId === registro.indiceId)
    const rangos = rangosDelIndice.filter((rango) => contiene(rango, datamart.monto))
    if (rangos.length === 0) {
      exclusiones.push(
        exclusion(
          registro,
          'SIN_RANGO',
          `Monto ${monto(datamart.monto)}: ningún rango del índice ${registro.indiceId} lo contiene.`,
        ),
      )
      const hueco = advertenciaDeHueco(rangosDelIndice, datamart)
      if (hueco) advertencias.push({ ...hueco, registroId: String(registro.id) })
      continue
    }

    if (registro.indicador !== datamart.indicador) {
      advertencias.push({
        codigo: 'INDICADOR_DIFERENTE',
        mensaje:
          `RegistrosValidos ${registro.id} trae el Indicador ${registro.indicador}, pero el Datamart ${datamart.id} ` +
          `dice ${datamart.indicador}: #candidatos y #filtrado usan el del Datamart.`,
        registroId: String(registro.id),
        dataMartId: String(datamart.id),
      })
    }
    if (rangos.length > 1) advertencias.push(advertenciaDeTraslape(registro, datamart, rangos))

    for (const rango of rangos) {
      candidatos.push({
        clave: `${registro.id}:${rango.id}`,
        registroId: registro.id,
        puntosAsignarId: rango.id,
        indicador: datamart.indicador,
        dataMartId: datamart.id,
        usuarioId: registro.usuarioId,
        indiceId: registro.indiceId,
        yy: registro.yy,
        mm: registro.mm,
        monto: datamart.monto,
        puntos: rango.puntos,
      })
      if (rango.puntos <= 0n) {
        advertencias.push({
          codigo: 'PUNTOS_NO_POSITIVOS',
          mensaje:
            `El rango ${rango.id} da ${puntos(rango.puntos)} puntos al DataMart ${datamart.id}: un aporte así no acerca ` +
            'el acumulado al tope, y el bucle sigue hasta agotar los candidatos.',
          registroId: String(registro.id),
          dataMartId: String(datamart.id),
          puntosAsignarIds: [rango.id],
        })
      }
    }
  }

  return { candidatos, exclusiones, advertencias }
}

/** El primer filtro del WHERE que no cumple el registro, en el orden del script. */
function motivoDeFiltro(
  registro: RegistroInterno,
  parametros: ParametrosConteo,
): { motivo: MotivoExclusion; detalle: string } | null {
  if (registro.yy !== parametros.yy || registro.mm !== parametros.mm) {
    return {
      motivo: 'OTRO_PERIODO',
      detalle: `Es del periodo ${periodo(registro.yy, registro.mm)}; se pide ${periodo(parametros.yy, parametros.mm)}.`,
    }
  }
  if (registro.indiceId !== parametros.indiceId) {
    return { motivo: 'OTRO_INDICE', detalle: `Es del índice ${registro.indiceId}; se pide el ${parametros.indiceId}.` }
  }
  if (registro.usuarioId !== parametros.usuarioId) {
    return { motivo: 'OTRO_USUARIO', detalle: `Es del usuario ${registro.usuarioId}; se pide el ${parametros.usuarioId}.` }
  }
  return null
}

/** BETWEEN inclusivo; los límites (escala 2) se llevan a la escala 4 de Monto para comparar exacto. */
function contiene(rango: RangoInterno, montoE4: bigint): boolean {
  return (
    aEscala(rango.limiteInf, ESCALA_PUNTOS, ESCALA_MONTO) <= montoE4 &&
    montoE4 <= aEscala(rango.limiteSup, ESCALA_PUNTOS, ESCALA_MONTO)
  )
}

/** Si el monto quedó fuera porque cae entre dos rangos (y no por debajo o por encima de toda la escala). */
function advertenciaDeHueco(rangos: RangoInterno[], datamart: DatamartInterno): Advertencia | null {
  const montoE4 = datamart.monto
  const anteriores = rangos.filter((rango) => aEscala(rango.limiteSup, ESCALA_PUNTOS, ESCALA_MONTO) < montoE4)
  const siguientes = rangos.filter((rango) => aEscala(rango.limiteInf, ESCALA_PUNTOS, ESCALA_MONTO) > montoE4)
  if (anteriores.length === 0 || siguientes.length === 0) return null

  const anterior = anteriores.reduce((a, b) => (b.limiteSup > a.limiteSup ? b : a))
  const siguiente = siguientes.reduce((a, b) => (b.limiteInf < a.limiteInf ? b : a))
  const porDecimales = siguiente.limiteInf - anterior.limiteSup === 1n
  return {
    codigo: 'HUECO_ENTRE_RANGOS',
    mensaje:
      `El Monto ${monto(montoE4)} (DataMart ${datamart.id}) cae en un hueco de la escala: entre ` +
      `${puntos(anterior.limiteSup)} (rango ${anterior.id}) y ${puntos(siguiente.limiteInf)} (rango ${siguiente.id}). ` +
      'BETWEEN incluye los extremos, pero ningún rango lo contiene' +
      (porDecimales ? ': Monto tiene 4 decimales y los límites solo 2.' : '.'),
    dataMartId: String(datamart.id),
    puntosAsignarIds: [anterior.id, siguiente.id],
  }
}

function advertenciaDeTraslape(registro: RegistroInterno, datamart: DatamartInterno, rangos: RangoInterno[]): Advertencia {
  const descripcion = rangos.map((rango) => `${rango.id} (${puntos(rango.limiteInf)}–${puntos(rango.limiteSup)} → ${puntos(rango.puntos)})`)
  const menorId = Math.min(...rangos.map((rango) => rango.id))
  return {
    codigo: 'RANGOS_TRASLAPADOS',
    mensaje:
      `El Monto ${monto(datamart.monto)} (DataMart ${datamart.id}) cae en ${rangos.length} rangos: ${descripcion.join(', ')}. ` +
      'El JOIN genera una fila por rango. SQL Server no garantiza qué fila toma un TOP 1 con empate ni el ' +
      `INSERT … SELECT TOP 1 sin ORDER BY; por decisión de la demo se usa la de menor PuntosAsignar.Id (${menorId}).`,
    registroId: String(registro.id),
    dataMartId: String(datamart.id),
    puntosAsignarIds: rangos.map((rango) => rango.id),
  }
}

function exclusion(registro: RegistroInterno, motivo: MotivoExclusion, detalle: string): Exclusion {
  return { registroId: String(registro.id), dataMartId: String(registro.dataMartId), motivo, detalle }
}

function periodo(yy: number, mm: number): string {
  return `${yy}-${String(mm).padStart(2, '0')}`
}

function monto(unidades: bigint): string {
  return formatearDecimal(unidades, ESCALA_MONTO)
}

function puntos(unidades: bigint): string {
  return formatearDecimal(unidades, ESCALA_PUNTOS)
}
