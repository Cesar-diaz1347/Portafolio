import logoGmail from '../../assets/logos/gmail.svg'
import logoLinkedin from '../../assets/logos/linkedin.svg'
import logoWhatsapp from '../../assets/logos/whatsapp.svg'
import { BotonCopiar } from '../../components/BotonCopiar/BotonCopiar'
import { EncabezadoSeccion } from '../../components/EncabezadoSeccion/EncabezadoSeccion'
import { EnlaceExterno } from '../../components/EnlaceExterno/EnlaceExterno'
import { Icono } from '../../components/Icono/Icono'
import { CORREO, CVS, ENLACE_CORREO, ENLACE_WHATSAPP, REDES, WHATSAPP } from '../../data/contacto'
import { PERFIL } from '../../data/perfil'
import { cx } from '../../lib/cx'
import boton from '../../styles/boton.module.css'
import seccion from '../seccion.module.css'
import styles from './Contacto.module.css'

export function Contacto() {
  return (
    <section
      id="contacto"
      className={cx(seccion.seccion, seccion.banda)}
      aria-labelledby="titulo-contacto"
    >
      <div className="contenedor">
        <EncabezadoSeccion id="titulo-contacto" rotulo="04 · Contacto" titulo="¿Construimos algo juntos?">
          <p>
            Escríbeme por el canal que prefieras: respondo por WhatsApp y correo. Estoy disponible para nuevos
            proyectos, en remoto.
          </p>
        </EncabezadoSeccion>

        <div className={styles.canales}>
          <article className={styles.canal} aria-labelledby="canal-whatsapp">
            <div className={styles.cabeceraCanal}>
              <img className={styles.logo} src={logoWhatsapp} alt="" width={40} height={40} />
              <div>
                <h3 id="canal-whatsapp" className={styles.tituloCanal}>
                  WhatsApp
                </h3>
                <p className={styles.dato}>{WHATSAPP.visible}</p>
              </div>
            </div>
            <div className={styles.accionesCanal}>
              <EnlaceExterno className={cx(boton.boton, boton.secundario)} href={ENLACE_WHATSAPP}>
                Escribir por WhatsApp
              </EnlaceExterno>
            </div>
          </article>

          <article className={styles.canal} aria-labelledby="canal-correo">
            <div className={styles.cabeceraCanal}>
              <img className={styles.logo} src={logoGmail} alt="" width={40} height={32} />
              <div>
                <h3 id="canal-correo" className={styles.tituloCanal}>
                  Correo
                </h3>
                <p className={styles.dato}>{CORREO}</p>
              </div>
            </div>
            <div className={styles.accionesCanal}>
              <a className={cx(boton.boton, boton.secundario)} href={ENLACE_CORREO}>
                <Icono nombre="correo" />
                Enviar correo
              </a>
              <BotonCopiar
                className={boton.fantasma}
                texto={CORREO}
                etiqueta="Copiar correo"
                etiquetaCopiado="Correo copiado"
                descripcion="Correo"
              />
            </div>
          </article>
        </div>

        <div className={styles.extras}>
          <div className={styles.bloque}>
            <h3 className={seccion.subtitulo}>Perfiles</h3>
            <ul className={styles.perfiles}>
              <li>
                <EnlaceExterno className={styles.perfil} href={REDES.github.url} mostrarFlecha={false}>
                  <Icono nombre="github" className={styles.iconoPerfil} />
                  <span className={styles.textoPerfil}>
                    <span className={styles.nombrePerfil}>
                      GitHub{' '}
                      <span className={styles.flecha} aria-hidden="true">
                        ↗
                      </span>
                    </span>
                    <span className={styles.direccion}>{REDES.github.visible}</span>
                  </span>
                </EnlaceExterno>
              </li>
              <li>
                <EnlaceExterno className={styles.perfil} href={REDES.linkedin.url} mostrarFlecha={false}>
                  <img className={styles.iconoPerfil} src={logoLinkedin} alt="" width={28} height={28} />
                  <span className={styles.textoPerfil}>
                    <span className={styles.nombrePerfil}>
                      LinkedIn{' '}
                      <span className={styles.flecha} aria-hidden="true">
                        ↗
                      </span>
                    </span>
                    <span className={styles.direccion}>{REDES.linkedin.visible}</span>
                  </span>
                </EnlaceExterno>
              </li>
            </ul>
          </div>

          <div className={styles.bloque}>
            <h3 className={seccion.subtitulo}>Currículum</h3>
            <ul className={styles.descargas}>
              {CVS.map((cv) => (
                <li key={cv.idioma}>
                  <a
                    className={cx(boton.boton, boton.fantasma, styles.descarga)}
                    href={cv.href}
                    download
                    hrefLang={cv.idioma}
                    type="application/pdf"
                  >
                    <Icono nombre="descargar" />
                    <span>
                      Descargar {cv.etiqueta} <small className={styles.peso}>(PDF, {cv.kb} KB)</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.bloque}>
            <h3 className={seccion.subtitulo}>Datos</h3>
            <dl className={styles.datos}>
              <div>
                <dt>Ubicación</dt>
                <dd>
                  {PERFIL.ubicacion.pais} · {PERFIL.ubicacion.modalidad.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt>Idiomas</dt>
                <dd>{PERFIL.ubicacion.idiomas}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
