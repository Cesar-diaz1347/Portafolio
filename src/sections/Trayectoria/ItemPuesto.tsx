import type { Puesto } from '../../data/experiencia'
import { aDateTime, formatearDuracion, formatearMesAnio, mesesInclusivos, type MesAnio } from '../../lib/fechas'
import styles from './Trayectoria.module.css'

export interface ItemPuestoProps {
  puesto: Puesto
  /** Mes actual, para medir el puesto vigente. */
  hoy: MesAnio
}

export function ItemPuesto({ puesto, hoy }: ItemPuestoProps) {
  const fin = puesto.fin === 'actual' ? hoy : puesto.fin
  const duracion = formatearDuracion(mesesInclusivos(puesto.inicio, fin))
  const idTitulo = `puesto-${puesto.id}`

  return (
    <li className={styles.item} data-actual={puesto.fin === 'actual' || undefined}>
      <article className={styles.puesto} aria-labelledby={idTitulo}>
        <h4 id={idTitulo} className={styles.cargo}>
          {puesto.cargo}
        </h4>
        <p className={styles.empresa}>
          {puesto.empresa}
          {puesto.modalidad && <span className={styles.modalidad}>{puesto.modalidad}</span>}
        </p>
        <p className={styles.fechas}>
          <time dateTime={aDateTime(puesto.inicio)}>{formatearMesAnio(puesto.inicio)}</time>
          {' – '}
          {puesto.fin === 'actual' ? (
            'Presente'
          ) : (
            <time dateTime={aDateTime(puesto.fin)}>{formatearMesAnio(puesto.fin)}</time>
          )}
          <span aria-hidden="true"> · </span>
          <span className={styles.duracion}>
            <span className="solo-lectores">, duración: </span>
            {duracion}
          </span>
        </p>
        <ul className={styles.logros}>
          {puesto.logros.map((logro) => (
            <li key={logro}>{logro}</li>
          ))}
        </ul>
      </article>
    </li>
  )
}
