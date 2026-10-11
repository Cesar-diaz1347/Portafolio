import type { CandidatoInterno } from './combinacion'

/**
 * Los ORDER BY del script, comparando Monto y Puntos como decimales exactos e Indicador como
 * BigInt. Donde SQL Server no define el orden (empate en todas las claves o un TOP 1 sin
 * ORDER BY), la demo desempata por menor PuntosAsignar.Id, luego por DataMartId y por último
 * por el Id de RegistrosValidos.
 */

export function compararBigInt(a: bigint, b: bigint): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

function desempateDeLaDemo(a: CandidatoInterno, b: CandidatoInterno): number {
  return (
    a.puntosAsignarId - b.puntosAsignarId ||
    compararBigInt(a.dataMartId, b.dataMartId) ||
    compararBigInt(a.registroId, b.registroId)
  )
}

/** Semilla (línea 87): ORDER BY Monto DESC, Indicador. */
export function ordenSemilla(a: CandidatoInterno, b: CandidatoInterno): number {
  return compararBigInt(b.monto, a.monto) || compararBigInt(a.indicador, b.indicador) || desempateDeLaDemo(a, b)
}

/** Puntos >= @faltante, como el primer CASE del relleno. */
export function cubreFaltante(candidato: CandidatoInterno, faltante: bigint): boolean {
  return candidato.puntos >= faltante
}

/**
 * Relleno (líneas 120–127): primero las cuentas que cubren el faltante, la de menos puntos;
 * si ninguna cubre, la de más puntos. Luego Monto DESC e Indicador.
 */
export function ordenRelleno(faltante: bigint): (a: CandidatoInterno, b: CandidatoInterno) => number {
  const grupo = (candidato: CandidatoInterno) => (cubreFaltante(candidato, faltante) ? 0 : 1)
  const puntosOrdenables = (candidato: CandidatoInterno) =>
    cubreFaltante(candidato, faltante) ? candidato.puntos : -candidato.puntos
  return (a, b) =>
    grupo(a) - grupo(b) ||
    compararBigInt(puntosOrdenables(a), puntosOrdenables(b)) ||
    compararBigInt(b.monto, a.monto) ||
    compararBigInt(a.indicador, b.indicador) ||
    desempateDeLaDemo(a, b)
}

/** INSERT … SELECT TOP 1 … WHERE DataMartId = @selDm (líneas 99–104), que no tiene ORDER BY. */
export function filaParaInsertar(candidatos: readonly CandidatoInterno[], dataMartId: bigint): CandidatoInterno | undefined {
  return candidatos.filter((candidato) => candidato.dataMartId === dataMartId).sort(desempateDeLaDemo)[0]
}
