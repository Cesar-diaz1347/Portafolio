import type { FilaFiltrado } from '../engine'
import { cx } from '../../../lib/cx'
import base from './base.module.css'

/** Compara dos DECIMAL(18,2) escritos con 2 decimales sin pasar por number (que no los guarda exactos). */
function esMenor(a: string, b: string): boolean {
  return BigInt(a.replace('.', '')) < BigInt(b.replace('.', ''))
}

interface TablaFiltradoProps {
  filas: readonly FilaFiltrado[]
  /** `orden` de la fila que este paso inserta. */
  resaltada: number | null
  /** false mientras el script todavía no crea #filtrado. */
  existe: boolean
  pasoDeCreacion: number | null
}

/** #filtrado: la combinación que se va armando, con el aporte real de cada cuenta al tope. */
export function TablaFiltrado({ filas, resaltada, existe, pasoDeCreacion }: TablaFiltradoProps) {
  return (
    <section className={base.panel} aria-labelledby="titulo-filtrado">
      <h3 id="titulo-filtrado" className={cx(base.tituloPanel, base.mono)}>
        #filtrado
      </h3>
      <p className={base.subtitulo}>La combinación elegida hasta ahora. Cuando una cuenta se pasa del tope, solo aporta lo que faltaba.</p>

      {!existe ? (
        <p className={base.vacio}>
          Todavía no existe{pasoDeCreacion !== null ? `: el script la crea en el paso ${pasoDeCreacion}` : ''}.
        </p>
      ) : filas.length === 0 ? (
        <p className={base.vacio}>Está vacía: todavía no se eligió ninguna cuenta.</p>
      ) : (
        <div className={base.scroll} role="region" aria-labelledby="titulo-filtrado" tabIndex={0}>
          <table className={base.tabla}>
            <caption className="solo-lectores">Filas de #filtrado después de este paso</caption>
            <thead>
              <tr>
                <th scope="col" className={base.num}>
                  orden
                </th>
                <th scope="col">Indicador</th>
                <th scope="col" className={base.ocultoMovil}>
                  DataMartId
                </th>
                <th scope="col" className={base.num}>
                  Monto
                </th>
                <th scope="col" className={base.num}>
                  Puntos
                </th>
                <th scope="col" className={base.num}>
                  aporte
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const marcada = fila.orden === resaltada
                const topada = esMenor(fila.aporte, fila.puntos)
                return (
                  <tr key={fila.orden} className={cx(marcada && base.marcada)} aria-current={marcada ? 'true' : undefined}>
                    <td className={base.num}>
                      {marcada && (
                        <>
                          <span className={base.marcador} aria-hidden="true">
                            ▶{' '}
                          </span>
                          <span className="solo-lectores">Fila de este paso: </span>
                        </>
                      )}
                      {fila.orden}
                    </td>
                    <td className={base.mono}>{fila.indicador}</td>
                    <td className={cx(base.mono, base.ocultoMovil)}>{fila.dataMartId}</td>
                    <td className={cx(base.num, base.mono)}>{fila.monto}</td>
                    <td className={cx(base.num, base.mono)}>{fila.puntos}</td>
                    <td className={cx(base.num, base.mono)}>
                      {fila.aporte}
                      {topada && <span className={base.insignia}>topado</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
