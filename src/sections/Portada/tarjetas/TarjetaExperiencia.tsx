import { PERFIL } from '../../../data/perfil'
import { cx } from '../../../lib/cx'
import styles from '../Tarjetas.module.css'

export function TarjetaExperiencia() {
  return (
    <>
      <p className={cx(styles.rotulo, styles.conAsa)}>Experiencia</p>
      <p className={styles.cifra}>
        <span className={styles.numero}>{PERFIL.aniosExperiencia}</span>{' '}
        <span className={styles.unidad}>años</span>
      </p>
      <ul className={styles.sectores} aria-label="Sectores">
        {PERFIL.sectores.map((sector, indice) => (
          <li key={sector}>
            {sector}
            {/* El separador va al final: si la línea se parte, el punto queda arriba. */}
            {indice < PERFIL.sectores.length - 1 && (
              <span className={styles.separador} aria-hidden="true">
                ·
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
