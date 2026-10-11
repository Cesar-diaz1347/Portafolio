import { useEffect, useRef, useState, type FocusEvent } from 'react'

import { ID_INICIO, IDS_SECCIONES, SECCIONES } from '../../data/navegacion'
import { PERFIL } from '../../data/perfil'
import { useSeccionActiva } from '../../hooks/useSeccionActiva'
import { cx } from '../../lib/cx'
import { Icono } from '../Icono/Icono'
import { InterruptorTema } from '../InterruptorTema/InterruptorTema'
import styles from './Header.module.css'

/** Mismo umbral que la media query de Header.module.css. */
const CONSULTA_ESCRITORIO = '(min-width: 48rem)'

/**
 * Cabecera fija con navegación por anclas (Ley de Jakob: marca a la izquierda que
 * lleva al inicio, enlaces y tema a la derecha). En móvil los enlaces se pliegan
 * tras «Menú»: Escape cierra y devuelve el foco, y también se cierra al elegir un
 * enlace, al pulsar fuera, al sacar el foco o al pasar a escritorio.
 */
export function Header() {
  const [abierto, setAbierto] = useState(false)
  const cabeceraRef = useRef<HTMLElement>(null)
  const botonMenuRef = useRef<HTMLButtonElement>(null)
  const activa = useSeccionActiva(IDS_SECCIONES)

  useEffect(() => {
    if (!abierto) return undefined

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      setAbierto(false)
      botonMenuRef.current?.focus()
    }
    const alPulsarFuera = (evento: PointerEvent) => {
      if (evento.target instanceof Node && !cabeceraRef.current?.contains(evento.target)) {
        setAbierto(false)
      }
    }

    document.addEventListener('keydown', alTeclear)
    document.addEventListener('pointerdown', alPulsarFuera)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('pointerdown', alPulsarFuera)
    }
  }, [abierto])

  useEffect(() => {
    const escritorio = window.matchMedia(CONSULTA_ESCRITORIO)
    const alCambiar = () => {
      if (escritorio.matches) setAbierto(false)
    }
    escritorio.addEventListener('change', alCambiar)
    return () => escritorio.removeEventListener('change', alCambiar)
  }, [])

  // Si el foco del teclado sale de la cabecera, el panel no tapa el contenido enfocado.
  const alPerderFoco = (evento: FocusEvent<HTMLElement>) => {
    const destino = evento.relatedTarget
    if (abierto && destino instanceof Node && !evento.currentTarget.contains(destino)) {
      setAbierto(false)
    }
  }

  return (
    <header ref={cabeceraRef} className={styles.cabecera} onBlur={alPerderFoco}>
      <div className={cx('contenedor', styles.interior)}>
        <a className={styles.marca} href={`#${ID_INICIO}`}>
          <span className={styles.monograma} aria-hidden="true">
            CD
          </span>
          <span className={styles.marcaTexto}>
            {PERFIL.nombreCorto}
            <small className={styles.lema}>{PERFIL.lema}</small>
          </span>
        </a>

        <nav className={styles.nav} aria-label="Principal">
          <button
            ref={botonMenuRef}
            type="button"
            className={styles.botonMenu}
            aria-expanded={abierto}
            aria-controls="menu-principal"
            onClick={() => setAbierto((valor) => !valor)}
          >
            <Icono nombre={abierto ? 'cerrar' : 'menu'} />
            <span className="solo-lectores">Menú</span>
          </button>
          <ul id="menu-principal" className={styles.lista} data-abierto={abierto}>
            {SECCIONES.map(({ id, texto }) => (
              <li key={id}>
                <a
                  className={styles.enlace}
                  href={`#${id}`}
                  aria-current={activa === id ? 'location' : undefined}
                  onClick={() => setAbierto(false)}
                >
                  {texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <InterruptorTema />
      </div>
    </header>
  )
}
