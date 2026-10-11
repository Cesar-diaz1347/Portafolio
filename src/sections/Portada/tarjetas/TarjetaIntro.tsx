import { Icono } from '../../../components/Icono/Icono'
import { PERFIL } from '../../../data/perfil'
import { cx } from '../../../lib/cx'
import boton from '../../../styles/boton.module.css'
import styles from '../Tarjetas.module.css'

/** Presentación con el h1 de la página y el único CTA primario del sitio. */
export function TarjetaIntro() {
  return (
    <>
      <p className={cx(styles.rotulo, styles.conAsa)}>{PERFIL.disponibilidad}</p>
      <h1 id="titulo-portada" className={styles.nombre}>
        {PERFIL.nombre}
      </h1>
      <p className={styles.titulo}>{PERFIL.titulo}</p>
      <p className={styles.frase}>{PERFIL.fraseBreve}</p>
      <a className={cx(boton.boton, boton.primario, styles.cta)} href="#proyectos">
        Ver proyectos
        <Icono nombre="flecha-derecha" />
      </a>
    </>
  )
}
