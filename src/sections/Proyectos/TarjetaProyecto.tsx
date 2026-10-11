import { Chips } from '../../components/Chips/Chips'
import { EnlaceExterno } from '../../components/EnlaceExterno/EnlaceExterno'
import { Icono } from '../../components/Icono/Icono'
import { enlaceDemo, type Proyecto } from '../../data/proyectos'
import { cx } from '../../lib/cx'
import boton from '../../styles/boton.module.css'
import styles from './Proyectos.module.css'

export interface TarjetaProyectoProps {
  proyecto: Proyecto
}

/** Ancho real de la imagen según la grilla: 1 columna en móvil, 2 desde 48rem. */
const TAMANOS_IMAGEN = '(min-width: 72rem) 34rem, (min-width: 48rem) 46vw, 92vw'

export function TarjetaProyecto({ proyecto }: TarjetaProyectoProps) {
  const { slug, titulo, resumen, stack, etiquetaDatos, repo, detalle, aviso, portada } = proyecto
  const idTitulo = `proyecto-${slug}`

  return (
    <article className={styles.tarjeta} aria-labelledby={idTitulo}>
      <div className={styles.portada}>
        <img
          src={portada.src}
          srcSet={portada.srcSet}
          sizes={TAMANOS_IMAGEN}
          alt={portada.alt}
          width={portada.ancho}
          height={portada.alto}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className={styles.cuerpo}>
        <p className={styles.etiquetaDatos}>
          <Icono nombre="info" />
          <span>
            <span className="solo-lectores">Datos de la demo: </span>
            {etiquetaDatos}
          </span>
        </p>
        <h3 id={idTitulo} className={styles.titulo}>
          {titulo}
        </h3>
        <p className={styles.resumen}>{resumen}</p>
        <Chips items={stack} etiqueta={`Tecnologías de ${titulo}`} />

        <details className={styles.detalle}>
          <summary className={styles.resumenDetalle}>Reto, qué hice y resultado</summary>
          <div className={styles.contenidoDetalle}>
            <h4>Reto</h4>
            <p>{detalle.reto}</p>
            <h4>Qué hice</h4>
            <ul>
              {detalle.hice.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ul>
            <h4>Resultado</h4>
            <p>{detalle.resultado}</p>
          </div>
        </details>

        {aviso && <p className={styles.aviso}>{aviso}</p>}

        <div className={styles.acciones}>
          <EnlaceExterno className={cx(boton.boton, boton.secundario)} href={enlaceDemo(slug)}>
            Ver demo en vivo<span className="solo-lectores">: {titulo}</span>
          </EnlaceExterno>
          <EnlaceExterno className={cx(boton.boton, boton.fantasma)} href={repo}>
            <Icono nombre="github" />
            Ver código<span className="solo-lectores"> de {titulo} en GitHub</span>
          </EnlaceExterno>
        </div>
      </div>
    </article>
  )
}
