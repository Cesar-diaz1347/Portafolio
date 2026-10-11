import { Icono } from '../../../components/Icono/Icono'
import { PERFIL } from '../../../data/perfil'
import { cx } from '../../../lib/cx'
import styles from '../Tarjetas.module.css'

export function TarjetaUbicacion() {
  const { pais, modalidad, ingles } = PERFIL.ubicacion
  return (
    <>
      <p className={cx(styles.rotulo, styles.conAsa)}>Ubicación</p>
      <ul className={styles.datos}>
        <li>
          <Icono nombre="ubicacion" />
          {pais}
        </li>
        <li>
          <Icono nombre="remoto" />
          {modalidad}
        </li>
        <li>
          <Icono nombre="idioma" />
          {ingles}
        </li>
      </ul>
    </>
  )
}
