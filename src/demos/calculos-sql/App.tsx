import styles from './App.module.css'
import { Cabecera } from './components/Cabecera'
import { Controles } from './components/Controles'
import { ExplicacionPaso } from './components/ExplicacionPaso'
import { Resultados } from './components/Resultados'
import { Stepper } from './components/Stepper'
import { TablaCandidatos } from './components/TablaCandidatos'
import { TablaFiltrado } from './components/TablaFiltrado'
import { TablaVariables } from './components/TablaVariables'
import { VisorSql } from './components/VisorSql'
import { BLOQUES_SQL, ESCENARIOS, type BloqueSql, type PasoTraza } from './engine'
import { useSimulacion } from './hooks/useSimulacion'

/** Paso (desde 0) en el que el script ejecuta un bloque por primera vez, o null si no llega a él. */
function primerPasoDe(traza: readonly PasoTraza[], bloque: BloqueSql): number | null {
  const indice = traza.findIndex((paso) => paso.bloque === bloque)
  return indice === -1 ? null : indice
}

/** Simulador paso a paso de LogicaConteoYValor_Ficticios.sql. */
function App() {
  const simulacion = useSimulacion()
  const { traza, pasoActual, totalPasos, resultado, escenario } = simulacion
  const paso = traza[pasoActual]
  const previas = pasoActual > 0 ? (traza[pasoActual - 1]?.variables ?? null) : null

  const creacionCandidatos = primerPasoDe(traza, 'candidatos')
  const creacionFiltrado = primerPasoDe(traza, 'tablaFiltrado')
  // Antes de crear #candidatos lo que importa son las variables; después, las tablas, y las variables van debajo.
  const variablesPrimero = creacionCandidatos === null || pasoActual < creacionCandidatos

  const variables = paso ? <TablaVariables paso={paso} previas={previas} /> : null

  return (
    <div className={styles.pagina}>
      <a className={styles.saltar} href="#contenido">
        Saltar al contenido
      </a>

      <div className={styles.contenedor}>
        <Cabecera />

        <main id="contenido" className={styles.principal}>
          <Controles
            escenarios={ESCENARIOS}
            escenario={escenario}
            formulario={simulacion.formulario}
            errores={simulacion.errores}
            editado={simulacion.editado}
            onEscenario={simulacion.seleccionarEscenario}
            onCambioCampo={simulacion.cambiarCampo}
            onSalirCampo={simulacion.normalizarCampo}
            onModo={simulacion.cambiarModo}
            onRestablecer={simulacion.restablecer}
          />

          <section className={styles.simulador} aria-labelledby="titulo-simulador">
            <h2 id="titulo-simulador" className={styles.tituloSeccion}>
              Recorre el script
            </h2>

            <Stepper actual={pasoActual} total={totalPasos} titulo={paso?.titulo ?? ''} onIr={simulacion.irAPaso} />

            <div className={styles.rejilla}>
              <div className={styles.paso}>
                <ExplicacionPaso
                  paso={paso}
                  actual={pasoActual}
                  total={totalPasos}
                  lineas={paso ? BLOQUES_SQL[paso.bloque] : null}
                />
              </div>

              <div className={styles.codigo}>
                <VisorSql bloque={paso?.bloque ?? null} />
              </div>

              {paso && (
                <div className={styles.datos}>
                  {variablesPrimero && variables}
                  <TablaCandidatos
                    candidatos={paso.candidatos}
                    resaltada={paso.resaltado.candidato}
                    existe={creacionCandidatos !== null && pasoActual >= creacionCandidatos}
                    pasoDeCreacion={creacionCandidatos === null ? null : creacionCandidatos + 1}
                  />
                  <TablaFiltrado
                    filas={paso.filtrado}
                    resaltada={paso.resaltado.filtrado}
                    existe={creacionFiltrado !== null && pasoActual >= creacionFiltrado}
                    pasoDeCreacion={creacionFiltrado === null ? null : creacionFiltrado + 1}
                  />
                  {!variablesPrimero && variables}
                </div>
              )}
            </div>
          </section>

          <Resultados resultado={resultado} />
        </main>
      </div>
    </div>
  )
}

export default App
