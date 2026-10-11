import { useCallback, useSyncExternalStore } from 'react'

/** Suscripción a una media query que se actualiza si cambia (rotar, preferencias del sistema). */
export function useMediaQuery(consulta: string): boolean {
  const suscribir = useCallback(
    (alCambiar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', alCambiar)
      return () => lista.removeEventListener('change', alCambiar)
    },
    [consulta],
  )
  const leer = useCallback(() => window.matchMedia(consulta).matches, [consulta])
  return useSyncExternalStore(suscribir, leer, () => false)
}

export function usePrefiereMenosMovimiento(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
