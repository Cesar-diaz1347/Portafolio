import { useCallback, useEffect, useRef, useState } from 'react'

import { copiarTexto } from '../lib/portapapeles'

export type EstadoCopia = 'inactivo' | 'copiado' | 'error'

/** Copia un texto y deja el estado visible unos segundos antes de volver a «inactivo». */
export function useCopiarAlPortapapeles(duracionMs = 2600) {
  const [estado, setEstado] = useState<EstadoCopia>('inactivo')
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  const copiar = useCallback(
    async (texto: string): Promise<boolean> => {
      const copiado = await copiarTexto(texto)
      setEstado(copiado ? 'copiado' : 'error')
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(() => setEstado('inactivo'), duracionMs)
      return copiado
    },
    [duracionMs],
  )

  return { estado, copiar }
}
