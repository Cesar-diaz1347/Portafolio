import { EncabezadoSeccion } from '../../components/EncabezadoSeccion/EncabezadoSeccion'
import { CARRERA, CERTIFICACIONES } from '../../data/educacion'
import { PUESTOS } from '../../data/experiencia'
import { cx } from '../../lib/cx'
import { aDateTime, formatearMesAnio } from '../../lib/fechas'
import { MES_ACTUAL } from '../../lib/hoy'
import seccion from '../seccion.module.css'
import { ItemPuesto } from './ItemPuesto'
import styles from './Trayectoria.module.css'

export function Trayectoria() {
  // Conteos y duraciones salen de los datos; el puesto actual se mide hasta el mes en curso.
  const empresas = new Set(PUESTOS.map((puesto) => puesto.empresa)).size
  const desde = Math.min(...PUESTOS.map((puesto) => puesto.inicio.anio))

  return (
    <section
      id="trayectoria"
      className={cx(seccion.seccion, seccion.banda)}
      aria-labelledby="titulo-trayectoria"
    >
      <div className="contenedor">
        <EncabezadoSeccion id="titulo-trayectoria" rotulo="02 · Trayectoria" titulo="Experiencia y formación">
          <p>
            {PUESTOS.length} puestos en {empresas} empresas desde {desde}, más {CERTIFICACIONES.length}{' '}
            certificaciones en datos y nube.
          </p>
        </EncabezadoSeccion>

        <div className={styles.columnas}>
          <div>
            <h3 className={seccion.subtitulo}>Experiencia profesional</h3>
            <ol className={styles.lineaTiempo}>
              {PUESTOS.map((puesto) => (
                <ItemPuesto key={puesto.id} puesto={puesto} hoy={MES_ACTUAL} />
              ))}
            </ol>
          </div>

          <div className={styles.formacion}>
            <h3 className={seccion.subtitulo}>Educación</h3>
            <p className={styles.carrera}>{CARRERA}</p>

            <h3 className={cx(seccion.subtitulo, styles.subtituloCertificaciones)}>
              Certificaciones <span className={styles.conteo}>({CERTIFICACIONES.length})</span>
            </h3>
            <ul className={styles.certificaciones}>
              {CERTIFICACIONES.map((certificacion) => (
                <li key={certificacion.nombre} className={styles.certificacion}>
                  <span className={styles.nombreCertificacion}>{certificacion.nombre}</span>
                  <span className={styles.metaCertificacion}>
                    {certificacion.emisor} ·{' '}
                    <time dateTime={aDateTime(certificacion.fecha)}>{formatearMesAnio(certificacion.fecha)}</time>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
