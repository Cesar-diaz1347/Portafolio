import { DemoApiError } from '../api/demo/errores'

/**
 * Errores por campo de un 400 de la API (ProblemDetails.errors), listos para `form.setErrors`.
 * Las claves ya vienen en camelCase, igual que los campos de los formularios.
 */
export function erroresDeCampo(error: unknown): Record<string, string> | null {
  if (!(error instanceof DemoApiError) || !error.problem.errors) return null
  const entradas = Object.entries(error.problem.errors).filter(([, mensajes]) => mensajes.length > 0)
  if (entradas.length === 0) return null
  return Object.fromEntries(entradas.map(([campo, mensajes]) => [campo, mensajes.join(' ')]))
}

/**
 * Política de reintentos de React Query: un 400 o un 404 no cambian al reintentar, así que el
 * error se muestra de inmediato; un 503 se reintenta una vez; lo demás, hasta 3 veces (por defecto).
 */
export function debeReintentar(intentosFallidos: number, error: unknown): boolean {
  if (error instanceof DemoApiError) {
    if (error.status === 400 || error.status === 404) return false
    if (error.status === 503) return intentosFallidos < 1
  }
  return intentosFallidos < 3
}

export function esNoEncontrado(error: unknown): boolean {
  return error instanceof DemoApiError && error.status === 404
}
