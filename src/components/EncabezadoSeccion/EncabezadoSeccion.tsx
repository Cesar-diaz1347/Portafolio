import type { ReactNode } from 'react'

import styles from './EncabezadoSeccion.module.css'

export interface EncabezadoSeccionProps {
  /** id del h2, para el aria-labelledby de la sección. */
  id: string
  /** Rótulo corto, igual al de la navegación: «01 · Resumen». */
  rotulo: string
  titulo: string
  children?: ReactNode
}

export function EncabezadoSeccion({ id, rotulo, titulo, children }: EncabezadoSeccionProps) {
  return (
    <header className={styles.encabezado}>
      <p className={styles.rotulo} aria-hidden="true">
        {rotulo}
      </p>
      <h2 id={id} className={styles.titulo}>
        {titulo}
      </h2>
      {children !== undefined && <div className={styles.entrada}>{children}</div>}
    </header>
  )
}
