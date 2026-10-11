import type { AnchorHTMLAttributes, ReactNode } from 'react'

import styles from './EnlaceExterno.module.css'

export interface EnlaceExternoProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel' | 'children'> {
  href: string
  children: ReactNode
  /** Flecha ↗ visible; el aviso para lectores de pantalla va siempre. */
  mostrarFlecha?: boolean
}

/** Enlace que se abre en una pestaña nueva y lo avisa a todos. */
export function EnlaceExterno({ children, mostrarFlecha = true, ...resto }: EnlaceExternoProps) {
  return (
    <a {...resto} target="_blank" rel="noopener noreferrer">
      {children}
      {mostrarFlecha && (
        <span className={styles.flecha} aria-hidden="true">
          ↗
        </span>
      )}
      <span className="solo-lectores"> (se abre en una pestaña nueva)</span>
    </a>
  )
}
