import { ID_INICIO } from '../../data/navegacion'
import { PERFIL } from '../../data/perfil'
import { cx } from '../../lib/cx'
import { ANIO_ACTUAL } from '../../lib/hoy'
import { EnlaceExterno } from '../EnlaceExterno/EnlaceExterno'
import { Icono } from '../Icono/Icono'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.pie}>
      <div className={cx('contenedor', styles.interior)}>
        <div className={styles.textos}>
          <p className={styles.texto}>
            © {ANIO_ACTUAL} {PERFIL.nombre}
          </p>
          <p className={styles.texto}>
            Hecho con React, TypeScript y{' '}
            <EnlaceExterno href="https://swapy.tahazsh.com/">Swapy</EnlaceExterno> (GPL-3.0)
          </p>
        </div>
        <a className={styles.arriba} href={`#${ID_INICIO}`}>
          <Icono nombre="arriba" />
          Volver arriba
        </a>
      </div>
    </footer>
  )
}
