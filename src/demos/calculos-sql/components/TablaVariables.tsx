import type { PasoTraza, VariablesScript } from '../engine'
import { formatearVariable, VARIABLES } from '../lib/etiquetas'
import base from './base.module.css'
import { cx } from '../../../lib/cx'

interface TablaVariablesProps {
  paso: PasoTraza | undefined
  /** Variables del paso anterior, para marcar lo que cambió. */
  previas: VariablesScript | null
}

/** Valor de cada variable del script después del paso; lo que cambió se marca con texto. */
export function TablaVariables({ paso, previas }: TablaVariablesProps) {
  const variables = paso?.variables ?? null

  return (
    <section className={base.panel} aria-labelledby="titulo-variables">
      <h3 id="titulo-variables" className={base.tituloPanel}>
        Variables
      </h3>
      <p className={base.subtitulo}>Lo que valen los DECLARE y las variables de trabajo después de este paso.</p>

      {variables === null ? (
        <p className={base.vacio}>Todavía no hay variables: los DECLARE llegan en el paso 2.</p>
      ) : (
        <div className={base.scroll} role="region" aria-labelledby="titulo-variables" tabIndex={0}>
          <table className={base.tabla}>
            <caption className="solo-lectores">Variables del script después de este paso</caption>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col" className={base.ocultoMovil}>
                  Tipo
                </th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLES.map(({ clave, nombre, tipo }) => {
                const valor = variables[clave]
                const cambio = previas !== null && previas[clave] !== valor
                return (
                  <tr key={clave} className={cx(cambio && base.cambio)}>
                    <th scope="row" className={base.mono}>
                      {nombre}
                    </th>
                    <td className={cx(base.mono, base.ocultoMovil)}>{tipo}</td>
                    <td className={base.mono}>
                      {valor === null ? <span className={base.nulo}>NULL</span> : formatearVariable(valor)}
                      {cambio && (
                        <span className={base.insignia}>
                          cambió<span className="solo-lectores"> en este paso</span>
                        </span>
                      )}
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
