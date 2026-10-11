import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { cx } from '../../../lib/cx'
import { BLOQUES_SQL, SCRIPT_DATOS, SCRIPT_LOGICA, type BloqueSql, type RangoLineas } from '../engine'
import { resaltarSql, type Token } from '../lib/resaltadoSql'
import styles from './VisorSql.module.css'

type IdPestana = 'logica' | 'datos'

interface Pestana {
  id: IdPestana
  texto: string
  archivo: string
  descripcion: string
  lineas: Token[][]
}

/** Resalta el script y quita la línea vacía que deja el salto de línea final del archivo. */
function resaltarScript(script: string): Token[][] {
  const lineas = resaltarSql(script)
  if (lineas.at(-1)?.length === 0) lineas.pop()
  return lineas
}

// Se resaltan una sola vez, al cargar la página.
const PESTANAS: readonly Pestana[] = [
  {
    id: 'logica',
    texto: 'Lógica',
    archivo: 'LogicaConteoYValor_Ficticios.sql',
    descripcion: 'El cálculo. El bloque que ejecuta el paso actual aparece marcado.',
    lineas: resaltarScript(SCRIPT_LOGICA),
  },
  {
    id: 'datos',
    texto: 'Datos',
    archivo: 'CrearFicticios.sql',
    descripcion: 'Crea las tablas y carga los datos ficticios con los que arranca la demo.',
    lineas: resaltarScript(SCRIPT_DATOS),
  },
]

function describirRango(rango: RangoLineas): string {
  return rango.desde === rango.hasta ? `línea ${rango.desde}` : `líneas ${rango.desde}–${rango.hasta}`
}

interface VisorSqlProps {
  /** Bloque que ejecuta el paso actual, o null si no hay recorrido. */
  bloque: BloqueSql | null
}

/** Los dos scripts T-SQL con números de línea; en la pestaña de lógica se marca el bloque activo. */
export function VisorSql({ bloque }: VisorSqlProps) {
  const [activa, setActiva] = useState<IdPestana>('logica')
  const contenedorLogica = useRef<HTMLDivElement>(null)
  const rango = bloque === null ? null : BLOQUES_SQL[bloque]
  const desde = rango?.desde ?? null
  const hasta = rango?.hasta ?? null

  // Lleva el bloque activo a la vista dentro del visor (sin mover la página).
  useEffect(() => {
    const contenedor = contenedorLogica.current
    if (!contenedor || desde === null || hasta === null || activa !== 'logica') return
    const primera = contenedor.querySelector<HTMLElement>(`[data-linea="${desde}"]`)
    const ultima = contenedor.querySelector<HTMLElement>(`[data-linea="${hasta}"]`)
    if (!primera || !ultima) return
    const alto = ultima.offsetTop + ultima.offsetHeight - primera.offsetTop
    const holgura = (contenedor.clientHeight - alto) / 2
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    contenedor.scrollTo({
      top: Math.max(0, primera.offsetTop - Math.max(holgura, 8)),
      behavior: reducir ? 'auto' : 'smooth',
    })
  }, [desde, hasta, activa])

  // Pestañas con flechas, Inicio y Fin (patrón ARIA de pestañas).
  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>) => {
    const actual = PESTANAS.findIndex((pestana) => pestana.id === activa)
    const destinos: Record<string, number> = {
      ArrowRight: (actual + 1) % PESTANAS.length,
      ArrowLeft: (actual - 1 + PESTANAS.length) % PESTANAS.length,
      Home: 0,
      End: PESTANAS.length - 1,
    }
    const destino = PESTANAS[destinos[evento.key] ?? -1]
    if (!destino) return
    evento.preventDefault()
    setActiva(destino.id)
    document.getElementById(`pestana-${destino.id}`)?.focus()
  }

  const pestanaActiva = PESTANAS.find((pestana) => pestana.id === activa) ?? PESTANAS[0]

  return (
    <section className={styles.visor} aria-labelledby="titulo-visor">
      <div className={styles.cabecera}>
        <h3 id="titulo-visor" className={styles.titulo}>
          Script T-SQL
        </h3>
        <div role="tablist" aria-label="Scripts del proyecto" className={styles.pestanas}>
          {PESTANAS.map((pestana) => (
            <button
              key={pestana.id}
              type="button"
              role="tab"
              id={`pestana-${pestana.id}`}
              className={styles.pestana}
              aria-selected={activa === pestana.id}
              aria-controls={`panel-${pestana.id}`}
              tabIndex={activa === pestana.id ? 0 : -1}
              onClick={() => setActiva(pestana.id)}
              onKeyDown={alTeclear}
            >
              {pestana.texto}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.estado}>
        <span className={styles.archivo}>{pestanaActiva?.archivo}</span>
        {activa === 'logica' && rango !== null
          ? ` · bloque activo: ${describirRango(rango)}`
          : ` · ${pestanaActiva?.descripcion ?? ''}`}
      </p>

      {PESTANAS.map((pestana) => (
        <div
          key={pestana.id}
          role="tabpanel"
          id={`panel-${pestana.id}`}
          aria-labelledby={`pestana-${pestana.id}`}
          hidden={activa !== pestana.id}
        >
          <div
            ref={pestana.id === 'logica' ? contenedorLogica : undefined}
            className={styles.codigo}
            role="region"
            aria-label={`Código de ${pestana.archivo}`}
            tabIndex={0}
          >
            <pre className={styles.pre}>
              <code>
                {pestana.lineas.map((tokens, indice) => {
                  const numero = indice + 1
                  const marcada = pestana.id === 'logica' && desde !== null && hasta !== null && numero >= desde && numero <= hasta
                  return (
                    <span key={numero} data-linea={numero} className={cx(styles.linea, marcada && styles.activa)}>
                      {tokens.map((token, posicion) =>
                        token.tipo === 'texto' ? (
                          token.texto
                        ) : (
                          <span key={posicion} className={styles[token.tipo]}>
                            {token.texto}
                          </span>
                        ),
                      )}
                    </span>
                  )
                })}
              </code>
            </pre>
          </div>
        </div>
      ))}
    </section>
  )
}
