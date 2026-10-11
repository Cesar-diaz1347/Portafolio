/**
 * Acceso a localStorage que nunca lanza (modo privado, cuota llena o almacenamiento
 * deshabilitado). Si falla, el sitio sigue funcionando sin recordar preferencias.
 */
export function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave)
  } catch {
    return null
  }
}

export function escribir(clave: string, valor: string): boolean {
  try {
    window.localStorage.setItem(clave, valor)
    return true
  } catch {
    return false
  }
}

export function borrar(clave: string): void {
  try {
    window.localStorage.removeItem(clave)
  } catch {
    // Sin almacenamiento disponible: no hay nada que borrar.
  }
}
