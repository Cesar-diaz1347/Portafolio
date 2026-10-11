import { Icono } from '../../../components/Icono/Icono'
import { cx } from '../../../lib/cx'
import type { ResultadoConteo, ResultadoOk } from '../engine'
import { ETIQUETA_ADVERTENCIA, ETIQUETA_MOTIVO } from '../lib/etiquetas'
import { describirCampo } from '../lib/formulario'
import base from './base.module.css'
import styles from './Resultados.module.css'

interface ResultadosProps {
  resultado: ResultadoConteo
}

/** El final del script: resumen, combinación elegida, depuración, advertencias y exclusiones. */
export function Resultados({ resultado }: ResultadosProps) {
  return (
    <section id="resultado" className={styles.resultados} aria-labelledby="titulo-resultado">
      <h2 id="titulo-resultado" className={styles.titulo}>
        Resultado del script
      </h2>

      {resultado.ok ? (
        <ResultadoCompleto resultado={resultado} />
      ) : resultado.tipo === 'GUARDA' ? (
        <div role="alert" className={styles.alerta}>
          <p className={styles.alertaTitulo}>
            <Icono nombre="advertencia" /> El script se detuvo con RAISERROR
          </p>
          <p className={styles.mensajeSql}>
            <code>{resultado.mensaje}</code>
          </p>
          <p className={styles.alertaAyuda}>
            Severidad 16, estado 1. Después del RAISERROR el script ejecuta RETURN: no se calcula nada más, tampoco el
            paso 2, y RegistrosValidos queda intacta.
          </p>
        </div>
      ) : (
        <div role="alert" className={styles.alerta}>
          <p className={styles.alertaTitulo}>
            <Icono nombre="advertencia" /> Con estos datos el script no puede ejecutarse
          </p>
          <ul className={styles.errores}>
            {resultado.errores.map((error) => (
              <li key={`${error.campo}-${error.mensaje}`}>
                <strong>{describirCampo(error.campo)}:</strong> {error.mensaje}
              </li>
            ))}
          </ul>
          <p className={styles.alertaAyuda}>Corrige los campos marcados en «Datos de entrada» y el resultado volverá a calcularse.</p>
        </div>
      )}
    </section>
  )
}

const TARJETAS = [
  { clave: 'tope', nombre: 'Tope', ayuda: '@PUNTAJEMAX del índice' },
  { clave: 'cumplimiento', nombre: 'Cumplimiento', ayuda: 'cuentas elegidas' },
  { clave: 'nota', nombre: 'Nota', ayuda: 'puntos que aportan, con tope' },
  { clave: 'puntosBrutos', nombre: 'PuntosBrutos', ayuda: 'puntos sin topar' },
] as const

function ResultadoCompleto({ resultado }: { resultado: ResultadoOk }) {
  const { resumen, seleccion, depuracion, advertencias, exclusiones } = resultado
  const borrando = depuracion.modo === 'delete'

  return (
    <div className={styles.cuerpo}>
      <dl className={styles.resumen}>
        {TARJETAS.map(({ clave, nombre, ayuda }) => (
          <div key={clave} className={styles.tarjeta}>
            <dt className={styles.nombre}>{nombre}</dt>
            <dd className={styles.valor}>{resumen[clave]}</dd>
            <dd className={styles.ayudaTarjeta}>{ayuda}</dd>
          </div>
        ))}
      </dl>

      <section className={base.panel} aria-labelledby="titulo-seleccion">
        <h3 id="titulo-seleccion" className={base.tituloPanel}>
          Combinación elegida
        </h3>
        <p className={base.subtitulo}>El contenido final de #filtrado, en el orden en que se armó.</p>
        {seleccion.length === 0 ? (
          <p className={base.vacio}>No se eligió ninguna cuenta: ninguna llegó a #candidatos.</p>
        ) : (
          <div className={base.scroll} role="region" aria-labelledby="titulo-seleccion" tabIndex={0}>
            <table className={cx(base.tabla, base.compacta)}>
              <thead>
                <tr>
                  <th scope="col" className={base.num}>orden</th>
                  <th scope="col">Indicador</th>
                  <th scope="col" className={base.num}>Monto</th>
                  <th scope="col" className={base.num}>Puntos</th>
                  <th scope="col" className={base.num}>aporte</th>
                </tr>
              </thead>
              <tbody>
                {seleccion.map((fila) => (
                  <tr key={fila.orden}>
                    <td className={base.num}>{fila.orden}</td>
                    <td className={base.mono}>{fila.indicador}</td>
                    <td className={cx(base.num, base.mono)}>{fila.monto}</td>
                    <td className={cx(base.num, base.mono)}>{fila.puntos}</td>
                    <td className={cx(base.num, base.mono)}>{fila.aporte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={base.panel} aria-labelledby="titulo-depuracion">
        <h3 id="titulo-depuracion" className={base.tituloPanel}>
          Paso 2: depuración de RegistrosValidos
        </h3>
        <p className={base.subtitulo}>
          {borrando
            ? `DELETE ejecutado: @@ROWCOUNT = ${depuracion.filasBorradas ?? 0}.`
            : `Vista previa: ${textoFilas(depuracion.filas.length, 'se borraría', 'se borrarían')}. Con @AplicarBorrado = 1 se ejecutaría el DELETE.`}
        </p>
        {depuracion.filas.length === 0 ? (
          <p className={base.vacio}>No se borra ninguna fila.</p>
        ) : (
          <div className={base.scroll} role="region" aria-labelledby="titulo-depuracion" tabIndex={0}>
            <table className={cx(base.tabla, base.compacta)}>
              <thead>
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">YY</th>
                  <th scope="col">MM</th>
                  <th scope="col">IndiceId</th>
                  <th scope="col">UsuarioId</th>
                  <th scope="col">Indicador</th>
                  <th scope="col">DataMartId</th>
                </tr>
              </thead>
              <tbody>
                {depuracion.filas.map((fila) => (
                  <tr key={fila.id}>
                    <td className={base.mono}>{fila.id}</td>
                    <td>{fila.yy}</td>
                    <td>{fila.mm}</td>
                    <td>{fila.indiceId}</td>
                    <td>{fila.usuarioId}</td>
                    <td className={base.mono}>{fila.indicador}</td>
                    <td className={base.mono}>{fila.dataMartId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {advertencias.length > 0 && (
        <section className={base.panel} aria-labelledby="titulo-advertencias">
          <h3 id="titulo-advertencias" className={base.tituloPanel}>
            Advertencias ({advertencias.length})
          </h3>
          <p className={base.subtitulo}>Detalles de los datos que conviene conocer: el script los resuelve a su manera.</p>
          <ul className={styles.lista}>
            {advertencias.map((advertencia, indice) => (
              <li key={`${advertencia.codigo}-${indice}`} className={styles.item}>
                <Icono nombre="advertencia" />
                <span>
                  <strong>{ETIQUETA_ADVERTENCIA[advertencia.codigo]}.</strong> {advertencia.mensaje}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {exclusiones.length > 0 && (
        <details className={cx(base.panel, styles.exclusiones)}>
          <summary className={styles.resumenExclusiones}>
            Registros que no entraron a #candidatos ({exclusiones.length})
          </summary>
          <ul className={styles.lista}>
            {exclusiones.map((exclusion) => (
              <li key={`${exclusion.registroId}-${exclusion.motivo}`} className={styles.item}>
                <span>
                  <strong>
                    RegistrosValidos <span className={base.mono}>{exclusion.registroId}</span> · {ETIQUETA_MOTIVO[exclusion.motivo]}.
                  </strong>{' '}
                  {exclusion.detalle}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function textoFilas(cantidad: number, singular: string, plural: string): string {
  return `${cantidad === 1 ? singular : plural} ${cantidad} fila${cantidad === 1 ? '' : 's'}`
}
