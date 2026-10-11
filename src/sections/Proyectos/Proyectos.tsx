import { EncabezadoSeccion } from '../../components/EncabezadoSeccion/EncabezadoSeccion'
import { PROYECTOS } from '../../data/proyectos'
import seccion from '../seccion.module.css'
import styles from './Proyectos.module.css'
import { TarjetaProyecto } from './TarjetaProyecto'

export function Proyectos() {
  return (
    <section id="proyectos" className={seccion.seccion} aria-labelledby="titulo-proyectos">
      <div className="contenedor">
        <EncabezadoSeccion id="titulo-proyectos" rotulo="03 · Proyectos" titulo="Proyectos con demo en vivo">
          <p>
            {PROYECTOS.length} proyectos que puedes probar aquí mismo. Las demos corren en tu navegador, sin
            servidor, y la etiqueta de cada tarjeta indica de dónde salen sus datos.
          </p>
        </EncabezadoSeccion>

        <ul className={styles.lista}>
          {PROYECTOS.map((proyecto) => (
            <li key={proyecto.slug} className={styles.elemento}>
              <TarjetaProyecto proyecto={proyecto} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
