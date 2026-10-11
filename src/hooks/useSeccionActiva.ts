import { useEffect, useState } from 'react'

/**
 * Id de la sección que cruza una franja cerca del centro de la pantalla, para
 * marcar el enlace actual en la navegación. `ids` debe ser una referencia estable.
 */
export function useSeccionActiva(ids: readonly string[]): string | null {
  const [activa, setActiva] = useState<string | null>(null)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined
    const secciones = ids
      .map((id) => document.getElementById(id))
      .filter((seccion): seccion is HTMLElement => seccion !== null)
    if (secciones.length === 0) return undefined

    const visibles = new Map<string, boolean>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) visibles.set(entrada.target.id, entrada.isIntersecting)
        setActiva(ids.find((id) => visibles.get(id) === true) ?? null)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const seccion of secciones) observador.observe(seccion)
    return () => observador.disconnect()
  }, [ids])

  return activa
}
