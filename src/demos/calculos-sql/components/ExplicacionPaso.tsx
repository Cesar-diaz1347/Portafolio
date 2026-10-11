import type { PasoTraza, RangoLineas } from '../engine'
import base from './base.module.css'
import styles from './Paso.module.css'

interface ExplicacionPasoProps {
  paso: PasoTraza | undefined
  /** Paso actual, desde 0. */
  actual: number
  total: number
  lineas: RangoLineas | null
}

/** Qué hace el paso actual, en lenguaje llano, y a qué líneas del script corresponde. */
export function ExplicacionPaso({ paso, actual, total, lineas }: ExplicacionPasoProps) {
  if (!paso) {
    return (
      <article className={base.panel} aria-labelledby="titulo-paso">
        <h3 id="titulo-paso" className={styles.titulo}>
          Todavía no hay recorrido
        </h3>
        <p className={styles.explicacion}>
          Los datos tienen errores y el script no puede ejecutarse. Corrige los campos marcados y el recorrido aparecerá
          aquí.
        </p>
      </article>
    )
  }

  const esFinal = actual === total - 1
  const rangoTexto =
    lineas === null ? null : lineas.desde === lineas.hasta ? `línea ${lineas.desde}` : `líneas ${lineas.desde}–${lineas.hasta}`

  return (
    <article className={base.panel} aria-labelledby="titulo-paso">
      <p className={styles.sobretitulo}>
        Paso {actual + 1} de {total}
        {rangoTexto && ` · ${rangoTexto} del script`}
      </p>
      <h3 id="titulo-paso" className={styles.titulo}>
        {paso.titulo}
      </h3>
      <p className={styles.explicacion}>{paso.explicacion}</p>
      {esFinal && (
        <p className={styles.cierre}>
          Fin del recorrido. <a href="#resultado">Ver el resultado completo</a>
        </p>
      )}
    </article>
  )
}
