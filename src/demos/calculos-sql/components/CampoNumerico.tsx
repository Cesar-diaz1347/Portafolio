import { useId } from 'react'
import type { ChangeEvent } from 'react'

import { cx } from '../../../lib/cx'
import styles from './Controles.module.css'

export interface CampoNumericoProps {
  /** Ruta del campo (la misma que usa el motor en sus errores). */
  ruta: string
  valor: string
  modo: 'entero' | 'decimal'
  /** Etiqueta visible; sin ella, el campo se nombra solo con `nombreAccesible` (dentro de una tabla). */
  etiqueta?: string
  nombreAccesible?: string
  error?: string
  ayuda?: string
  onCambio: (ruta: string, texto: string) => void
  onSalir: (ruta: string) => void
  className?: string
}

/**
 * Campo de texto para un número, con lectura flexible (ver entradaFlexible.ts). El error va
 * pegado al campo (Ley de Proximidad) y enlazado con aria-describedby.
 */
export function CampoNumerico({
  ruta,
  valor,
  modo,
  etiqueta,
  nombreAccesible,
  error,
  ayuda,
  onCambio,
  onSalir,
  className,
}: CampoNumericoProps) {
  const id = useId()
  const idMensaje = `${id}-mensaje`
  const alCambiar = (evento: ChangeEvent<HTMLInputElement>) => onCambio(ruta, evento.target.value)

  return (
    <div className={cx(styles.campo, className)}>
      {etiqueta && (
        <label className={styles.etiqueta} htmlFor={id}>
          {etiqueta}
        </label>
      )}
      <input
        id={id}
        className={styles.entrada}
        type="text"
        inputMode={modo === 'entero' ? 'numeric' : 'decimal'}
        autoComplete="off"
        spellCheck={false}
        value={valor}
        aria-label={etiqueta ? undefined : nombreAccesible}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? idMensaje : undefined}
        onChange={alCambiar}
        onBlur={() => onSalir(ruta)}
      />
      {(error || ayuda) && (
        <p id={idMensaje} className={cx(styles.mensaje, error && styles.error)}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  )
}
