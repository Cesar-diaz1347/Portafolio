import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'

import styles from './Tarjetas.module.css'

export interface AsaArrastreProps {
  nombre: string
  /** id del texto que explica cómo usar el asa con teclado. */
  idAyuda: string
  onPointerDown: (evento: PointerEvent<HTMLButtonElement>) => void
  onClick: (evento: MouseEvent<HTMLButtonElement>) => void
  onKeyDown: (evento: KeyboardEvent<HTMLButtonElement>) => void
}

/**
 * Asa de arrastre de 44×44 px. Solo aquí se inicia el arrastre (data-swapy-handle) y
 * solo aquí `touch-action: none`: en móvil el resto de la tarjeta deja hacer scroll.
 */
export function AsaArrastre({ nombre, idAyuda, onPointerDown, onClick, onKeyDown }: AsaArrastreProps) {
  return (
    <button
      type="button"
      className={styles.asa}
      data-swapy-handle=""
      data-control="asa"
      aria-label={`Mover «${nombre}»`}
      aria-describedby={idAyuda}
      title="Arrastra para mover"
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <svg viewBox="0 0 10 16" aria-hidden="true">
        <circle cx="2.5" cy="2.5" r="1.6" />
        <circle cx="7.5" cy="2.5" r="1.6" />
        <circle cx="2.5" cy="8" r="1.6" />
        <circle cx="7.5" cy="8" r="1.6" />
        <circle cx="2.5" cy="13.5" r="1.6" />
        <circle cx="7.5" cy="13.5" r="1.6" />
      </svg>
    </button>
  )
}
