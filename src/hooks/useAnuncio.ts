import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Mensaje para una región `aria-live`. Vacía el texto y lo vuelve a escribir un
 * instante después para que el lector de pantalla lo repita aunque sea igual al anterior.
 */
export function useAnuncio(retrasoMs = 60) {
  const [mensaje, setMensaje] = useState('')
  const temporizador = useRef<number | undefined>(undefined)

  const anunciar = useCallback(
    (texto: string) => {
      window.clearTimeout(temporizador.current)
      setMensaje('')
      temporizador.current = window.setTimeout(() => setMensaje(texto), retrasoMs)
    },
    [retrasoMs],
  )

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  return { mensaje, anunciar }
}
