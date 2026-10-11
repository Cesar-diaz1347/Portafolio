import { useTema } from '../../hooks/useTema'
import { Icono } from '../Icono/Icono'
import styles from './InterruptorTema.module.css'

/**
 * La etiqueta es fija («Tema claro») y el estado lo comunica aria-pressed, como en
 * Portafolio1.2: cambiar ambos hacía que el lector anunciara estados contradictorios.
 */
export function InterruptorTema() {
  const { tema, alternar } = useTema()
  return (
    <button
      type="button"
      className={styles.interruptor}
      aria-pressed={tema === 'light'}
      onClick={alternar}
      title="Tema claro"
    >
      <Icono nombre={tema === 'light' ? 'luna' : 'sol'} />
      <span className="solo-lectores">Tema claro</span>
    </button>
  )
}
