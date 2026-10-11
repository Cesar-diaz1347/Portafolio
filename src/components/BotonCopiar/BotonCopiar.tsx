import { useAnuncio } from '../../hooks/useAnuncio'
import { useCopiarAlPortapapeles } from '../../hooks/useCopiarAlPortapapeles'
import { cx } from '../../lib/cx'
import boton from '../../styles/boton.module.css'
import { Icono } from '../Icono/Icono'
import styles from './BotonCopiar.module.css'

export interface BotonCopiarProps {
  texto: string
  etiqueta: string
  /** Texto visible tras copiar, p. ej. «Correo copiado». */
  etiquetaCopiado: string
  /** Cómo se nombra lo copiado en el aviso: «Correo». */
  descripcion: string
  className?: string
}

/** Copia al portapapeles con confirmación visible y aviso aria-live. */
export function BotonCopiar({ texto, etiqueta, etiquetaCopiado, descripcion, className }: BotonCopiarProps) {
  const { estado, copiar } = useCopiarAlPortapapeles()
  const { mensaje, anunciar } = useAnuncio()

  const alPulsar = async () => {
    const copiado = await copiar(texto)
    anunciar(
      copiado
        ? `${descripcion} copiado al portapapeles: ${texto}`
        : `No se pudo copiar automáticamente. Es ${texto}.`,
    )
  }

  const textoVisible =
    estado === 'copiado' ? etiquetaCopiado : estado === 'error' ? 'No se pudo copiar' : etiqueta

  return (
    <>
      <button
        type="button"
        className={cx(boton.boton, estado === 'copiado' && styles.copiado, className)}
        onClick={() => {
          void alPulsar()
        }}
      >
        <Icono nombre={estado === 'copiado' ? 'check' : 'copiar'} />
        <span>{textoVisible}</span>
      </button>
      <span className="solo-lectores" role="status">
        {mensaje}
      </span>
    </>
  )
}
