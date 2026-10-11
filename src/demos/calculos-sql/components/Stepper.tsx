import { Icono } from '../../../components/Icono/Icono'
import { cx } from '../../../lib/cx'
import boton from '../../../styles/boton.module.css'
import styles from './Stepper.module.css'

interface StepperProps {
  /** Paso actual, desde 0. */
  actual: number
  total: number
  titulo: string
  onIr: (indice: number) => void
}

/**
 * Controles del recorrido: Reiniciar, Anterior, Siguiente y Final. El título del paso se anuncia
 * por aria-live. Los botones sin acción posible usan aria-disabled (no disabled), así el foco no
 * se pierde al llegar a un extremo.
 */
export function Stepper({ actual, total, titulo, onIr }: StepperProps) {
  const hayPasos = total > 0
  const alInicio = !hayPasos || actual <= 0
  const alFinal = !hayPasos || actual >= total - 1
  const porcentaje = hayPasos ? ((actual + 1) / total) * 100 : 0

  const ir = (indice: number, sinAccion: boolean) => () => {
    if (!sinAccion) onIr(indice)
  }

  return (
    <div className={styles.barra} role="group" aria-label="Control del recorrido">
      <p className={styles.estado} aria-live="polite" aria-atomic="true">
        {hayPasos ? (
          <>
            <strong>
              Paso {actual + 1} de {total}
            </strong>
            <span className={styles.titulo}> · {titulo}</span>
          </>
        ) : (
          'Sin recorrido: corrige los datos marcados.'
        )}
      </p>

      <div className={styles.progreso} aria-hidden="true">
        <span style={{ width: `${porcentaje}%` }} />
      </div>

      <div className={styles.botones}>
        <button
          type="button"
          className={cx(boton.boton, boton.fantasma, styles.boton)}
          aria-disabled={alInicio}
          onClick={ir(0, alInicio)}
        >
          <Icono nombre="restablecer" />
          <span className={styles.textoOpcional}>Reiniciar</span>
        </button>
        <button
          type="button"
          className={cx(boton.boton, boton.secundario, styles.boton)}
          aria-disabled={alInicio}
          onClick={ir(actual - 1, alInicio)}
        >
          <Icono nombre="flecha-izquierda" />
          Anterior
        </button>
        <button
          type="button"
          className={cx(boton.boton, boton.primario, styles.boton)}
          aria-disabled={alFinal}
          onClick={ir(actual + 1, alFinal)}
        >
          Siguiente
          <Icono nombre="flecha-derecha" />
        </button>
        <button
          type="button"
          className={cx(boton.boton, boton.fantasma, styles.boton)}
          aria-disabled={alFinal}
          onClick={ir(total - 1, alFinal)}
        >
          <span className={styles.textoOpcional}>Final</span>
          <Icono nombre="saltar-final" />
        </button>
      </div>
    </div>
  )
}
