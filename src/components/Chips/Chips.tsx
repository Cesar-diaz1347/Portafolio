import { cx } from '../../lib/cx'
import styles from './Chips.module.css'

export interface ChipsProps {
  items: readonly string[]
  /** Nombre accesible de la lista, p. ej. «Tecnologías de Control de cuentas». */
  etiqueta?: string
  acento?: boolean
  className?: string
}

/** Lista de etiquetas no interactivas: no parecen botones (Ley de la Semejanza). */
export function Chips({ items, etiqueta, acento = false, className }: ChipsProps) {
  return (
    <ul className={cx(styles.chips, className)} aria-label={etiqueta}>
      {items.map((item) => (
        <li key={item} className={cx(styles.chip, acento && styles.acento)}>
          {item}
        </li>
      ))}
    </ul>
  )
}
