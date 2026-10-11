import { Chips } from '../../components/Chips/Chips'
import { EncabezadoSeccion } from '../../components/EncabezadoSeccion/EncabezadoSeccion'
import { GRUPOS_HABILIDADES } from '../../data/habilidades'
import { PERFIL } from '../../data/perfil'
import { cx } from '../../lib/cx'
import seccion from '../seccion.module.css'
import styles from './Resumen.module.css'

export function Resumen() {
  return (
    <section id="resumen" className={seccion.seccion} aria-labelledby="titulo-resumen">
      <div className="contenedor">
        <EncabezadoSeccion id="titulo-resumen" rotulo="01 · Resumen" titulo="Resumen profesional" />

        <div className={styles.resumen}>
          {PERFIL.resumen.map((parrafo) => (
            <p key={parrafo}>{parrafo}</p>
          ))}
        </div>

        <h3 className={cx(seccion.subtitulo, styles.subtitulo)}>Competencias técnicas</h3>
        <ul className={styles.grupos}>
          {GRUPOS_HABILIDADES.map((grupo) => (
            <li key={grupo.id} className={styles.grupo}>
              <h4 className={styles.tituloGrupo}>{grupo.titulo}</h4>
              <Chips items={grupo.items} etiqueta={grupo.titulo} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
