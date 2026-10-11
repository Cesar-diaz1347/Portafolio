import { Icono } from '../../components/Icono/Icono'
import { cx } from '../../lib/cx'
import type { Direccion } from '../../lib/ordenPortada'
import boton from '../../styles/boton.module.css'
import styles from './Tarjetas.module.css'

export interface ControlesReordenarProps {
  nombre: string
  posicion: number
  total: number
  onMover: (direccion: Direccion) => void
}

/**
 * Alternativa al arrastre. En los extremos los botones quedan con aria-disabled (no
 * disabled) para que el foco no se pierda; al pulsarlos se explica por qué no se mueve.
 */
export function ControlesReordenar({ nombre, posicion, total, onMover }: ControlesReordenarProps) {
  return (
    <div className={styles.controles}>
      <p className={styles.posicion}>
        Posición {posicion} de {total}
      </p>
      <div className={styles.botonesMover}>
        <button
          type="button"
          className={cx(boton.boton, boton.compacto)}
          data-control="antes"
          aria-disabled={posicion <= 1 || undefined}
          onClick={() => onMover('antes')}
        >
          <Icono nombre="arriba" />
          Mover antes<span className="solo-lectores">: «{nombre}»</span>
        </button>
        <button
          type="button"
          className={cx(boton.boton, boton.compacto)}
          data-control="despues"
          aria-disabled={posicion >= total || undefined}
          onClick={() => onMover('despues')}
        >
          <Icono nombre="abajo" />
          Mover después<span className="solo-lectores">: «{nombre}»</span>
        </button>
      </div>
    </div>
  )
}
