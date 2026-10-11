/**
 * Enlaces profundos del simulador: `?escenario=<id>&paso=<n>` (paso desde 1, como se lee en
 * pantalla: «Paso 4 de 28»). Lo usan también las capturas de portada.
 */

export interface EnlaceSimulador {
  /** Un id de escenario conocido, o null si falta o no existe. */
  escenario: string | null
  /** Paso desde 1, o null si falta o no es un entero positivo. */
  paso: number | null
}

export function leerEnlace(busqueda: string, idsValidos: readonly string[]): EnlaceSimulador {
  const parametros = new URLSearchParams(busqueda)
  const escenario = parametros.get('escenario')
  const paso = parametros.get('paso')
  return {
    escenario: escenario !== null && idsValidos.includes(escenario) ? escenario : null,
    paso: paso !== null && /^\d{1,6}$/.test(paso) && Number(paso) >= 1 ? Number(paso) : null,
  }
}

/** Cadena de consulta con el estado actual; conserva cualquier otro parámetro de la URL. */
export function construirBusqueda(busquedaActual: string, escenario: string, paso: number): string {
  const parametros = new URLSearchParams(busquedaActual)
  parametros.set('escenario', escenario)
  parametros.set('paso', String(paso))
  return `?${parametros.toString()}`
}
