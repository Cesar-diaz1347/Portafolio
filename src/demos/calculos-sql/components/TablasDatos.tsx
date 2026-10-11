import type { DatasetFicticios } from '../engine'
import { describirCampo, rutaIndice, rutaMonto, rutaRango, type Formulario } from '../lib/formulario'
import base from './base.module.css'
import { CampoNumerico } from './CampoNumerico'
import styles from './Controles.module.css'

interface TablasDatosProps {
  dataset: DatasetFicticios
  formulario: Formulario
  errores: Readonly<Record<string, string>>
  onCambioCampo: (ruta: string, texto: string) => void
  onSalirCampo: (ruta: string) => void
}

/** Las cuatro tablas de la base Ficticios; las columnas que el script usa como números se editan. */
export function TablasDatos({ dataset, formulario, errores, onCambioCampo, onSalirCampo }: TablasDatosProps) {
  const campo = (ruta: string) => (
    <CampoNumerico
      ruta={ruta}
      valor={formulario.campos[ruta] ?? ''}
      modo="decimal"
      nombreAccesible={describirCampo(ruta)}
      error={errores[ruta]}
      onCambio={onCambioCampo}
      onSalir={onSalirCampo}
    />
  )

  return (
    <div className={styles.tablasDatos}>
      <section aria-labelledby="datos-datamart">
        <h3 id="datos-datamart" className={styles.tituloTabla}>
          dbo.Datamart
        </h3>
        <div className={base.scroll} role="region" aria-labelledby="datos-datamart" tabIndex={0}>
          <table className={base.tabla}>
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Indicador</th>
                <th scope="col">Monto (editable)</th>
                <th scope="col">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {dataset.datamart.map((fila, i) => (
                <tr key={fila.id}>
                  <td className={base.mono}>{fila.id}</td>
                  <td className={base.mono}>{fila.indicador}</td>
                  <td>{campo(rutaMonto(i))}</td>
                  <td>{fila.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="datos-puntos">
        <h3 id="datos-puntos" className={styles.tituloTabla}>
          dbo.PuntosAsignar
        </h3>
        <div className={base.scroll} role="region" aria-labelledby="datos-puntos" tabIndex={0}>
          <table className={base.tabla}>
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">IndiceId</th>
                <th scope="col">LimiteInf (editable)</th>
                <th scope="col">LimiteSup (editable)</th>
                <th scope="col">Puntos (editable)</th>
              </tr>
            </thead>
            <tbody>
              {dataset.puntosAsignar.map((fila, i) => (
                <tr key={fila.id}>
                  <td className={base.mono}>{fila.id}</td>
                  <td>{fila.indiceId}</td>
                  <td>{campo(rutaRango(i, 'limiteInf'))}</td>
                  <td>{campo(rutaRango(i, 'limiteSup'))}</td>
                  <td>{campo(rutaRango(i, 'puntos'))}</td>
                </tr>
              ))}
              {dataset.puntosAsignar.length === 0 && (
                <tr>
                  <td colSpan={5} className={base.nulo}>
                    Sin filas: el script abortará en la segunda guarda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="datos-indices">
        <h3 id="datos-indices" className={styles.tituloTabla}>
          dbo.Indices
        </h3>
        <div className={base.scroll} role="region" aria-labelledby="datos-indices" tabIndex={0}>
          <table className={base.tabla}>
            <thead>
              <tr>
                <th scope="col">IndiceId</th>
                <th scope="col">PuntajeMax (editable)</th>
              </tr>
            </thead>
            <tbody>
              {dataset.indices.map((fila, i) => (
                <tr key={fila.indiceId}>
                  <td>{fila.indiceId}</td>
                  <td>{campo(rutaIndice(i))}</td>
                </tr>
              ))}
              {dataset.indices.length === 0 && (
                <tr>
                  <td colSpan={2} className={base.nulo}>
                    Sin filas: el script abortará en la primera guarda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="datos-registros">
        <h3 id="datos-registros" className={styles.tituloTabla}>
          dbo.RegistrosValidos <span className={styles.soloLectura}>(solo lectura)</span>
        </h3>
        <div className={base.scroll} role="region" aria-labelledby="datos-registros" tabIndex={0}>
          <table className={base.tabla}>
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">IndiceId</th>
                <th scope="col">UsuarioId</th>
                <th scope="col">YY</th>
                <th scope="col">MM</th>
                <th scope="col">Indicador</th>
                <th scope="col">DataMartId</th>
              </tr>
            </thead>
            <tbody>
              {dataset.registrosValidos.map((fila) => (
                <tr key={fila.id}>
                  <td className={base.mono}>{fila.id}</td>
                  <td>{fila.indiceId}</td>
                  <td>{fila.usuarioId}</td>
                  <td>{fila.yy}</td>
                  <td>{fila.mm}</td>
                  <td className={base.mono}>{fila.indicador}</td>
                  <td className={base.mono}>{fila.dataMartId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
