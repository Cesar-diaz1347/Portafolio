/**
 * Copia texto al portapapeles. Usa la API moderna si está disponible (requiere
 * contexto seguro) y, si falla, recurre a seleccionar un textarea temporal.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  if (window.isSecureContext && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      // Permiso denegado o API no disponible: se intenta el método alternativo.
    }
  }
  return copiarConSeleccion(texto)
}

function copiarConSeleccion(texto: string): boolean {
  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'

  // select() se lleva el foco; al terminar se devuelve a donde estaba.
  const activo = document.activeElement
  document.body.append(area)
  area.select()

  let copiado = false
  try {
    copiado = document.execCommand('copy')
  } catch {
    copiado = false
  }

  area.remove()
  if (activo instanceof HTMLElement) activo.focus()
  return copiado
}
