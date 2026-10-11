import type { CandidatoTraza } from '../engine'
import { cx } from '../../../lib/cx'
import base from './base.module.css'

interface TablaCandidatosProps {
  candidatos: readonly CandidatoTraza[]
  /** Clave de la fila que este paso elige o inserta. */
  resaltada: string | null
  /** false mientras el script todavía no ejecuta el SELECT … INTO #candidatos. */
  existe: boolean
  /** Paso (desde 1) en que se crea la tabla, para explicar por qué aún no existe. */
  pasoDeCreacion: number | null
}

/** #candidatos: cada registro válido cruzado con su Datamart y con el rango de puntos que le toca. */
export function TablaCandidatos({ candidatos, resaltada, existe, pasoDeCreacion }: TablaCandidatosProps) {
  return (
    <section className={base.panel} aria-labelledby="titulo-candidatos">
      <h3 id="titulo-candidatos" className={cx(base.tituloPanel, base.mono)}>
        #candidatos
      </h3>
      <p className={base.subtitulo}>
        Cuentas que compiten por entrar, con su ranking en el último ORDER BY y si cubren (¿Cubre?) los puntos que faltan.
      </p>

      {!existe ? (
        <p className={base.vacio}>
          Todavía no existe{pasoDeCreacion !== null ? `: el script la crea en el paso ${pasoDeCreacion}` : ''}.
        </p>
      ) : candidatos.length === 0 ? (
        <p className={base.vacio}>Está vacía: ya no quedan cuentas candidatas.</p>
      ) : (
        <div className={base.scroll} role="region" aria-labelledby="titulo-candidatos" tabIndex={0}>
          <table className={base.tabla}>
            <caption className="solo-lectores">Filas de #candidatos después de este paso</caption>
            <thead>
              <tr>
                <th scope="col" className={base.num}>
                  Ranking
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
                <th scope="col">¿Cubre?</th>
                <th scope="col" className={base.ocultoMovil}>
                  Rango
                </th>
              </tr>
            </thead>
            <tbody>
              {candidatos.map((fila) => {
                const marcada = fila.clave === resaltada
                return (
                  <tr key={fila.clave} className={cx(marcada && base.marcada)} aria-current={marcada ? 'true' : undefined}>
                    <td className={base.num}>
                      {marcada && (
                        <>
                          <span className={base.marcador} aria-hidden="true">
                            ▶{' '}
                          </span>
                          <span className="solo-lectores">Fila de este paso: </span>
                        </>
                      )}
                      {fila.ranking ?? '—'}
                    </td>
                    <td className={base.mono}>{fila.indicador}</td>
                    <td className={cx(base.mono, base.ocultoMovil)}>{fila.dataMartId}</td>
                    <td className={cx(base.num, base.mono)}>{fila.monto}</td>
                    <td className={cx(base.num, base.mono)}>{fila.puntos}</td>
                    <td>{fila.cubreFaltante === null ? '—' : fila.cubreFaltante ? 'Sí' : 'No'}</td>
                    <td className={cx(base.mono, base.ocultoMovil)}>{fila.puntosAsignarId}</td>
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
