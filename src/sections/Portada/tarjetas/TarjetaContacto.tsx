import logoWhatsapp from '../../../assets/logos/whatsapp.svg'
import { EnlaceExterno } from '../../../components/EnlaceExterno/EnlaceExterno'
import { Icono } from '../../../components/Icono/Icono'
import { ENLACE_CORREO, ENLACE_WHATSAPP } from '../../../data/contacto'
import { cx } from '../../../lib/cx'
import boton from '../../../styles/boton.module.css'
import styles from '../Tarjetas.module.css'

export function TarjetaContacto() {
  return (
    <>
      <p className={cx(styles.rotulo, styles.conAsa)}>Contacto</p>
      <p className={styles.texto}>¿Hablamos? Respondo por WhatsApp y correo.</p>
      <div className={styles.accionesContacto}>
        <EnlaceExterno className={cx(boton.boton, boton.secundario)} href={ENLACE_WHATSAPP}>
          <img src={logoWhatsapp} alt="" width={20} height={20} />
          Escribir por WhatsApp
        </EnlaceExterno>
        <a className={cx(boton.boton, boton.secundario)} href={ENLACE_CORREO}>
          <Icono nombre="correo" />
          Enviar correo
        </a>
      </div>
    </>
  )
}
