import { Chips } from '../../../components/Chips/Chips'
import { EnlaceExterno } from '../../../components/EnlaceExterno/EnlaceExterno'
import { InterruptorTema } from '../../../components/InterruptorTema/InterruptorTema'
import styles from './Cabecera.module.css'

const STACK = ['T-SQL', 'SQL Server', 'TypeScript', 'React', 'Vite'] as const
const REPOSITORIO = 'https://github.com/Cesar-diaz1347/CalculoConteoValor'

/** Presentación de la demo: qué problema resuelve el script y qué es (y qué no es) esta página. */
export function Cabecera() {
  return (
    <header className={styles.cabecera}>
      <div className={styles.barra}>
        <a className={styles.volver} href="../../index.html#proyectos">
          <span aria-hidden="true">←</span> Volver al portafolio
        </a>
        <InterruptorTema />
      </div>

      <p className={styles.etiqueta}>Lógica T-SQL replicada en el navegador</p>
      <h1 className={styles.titulo}>Cálculos SQL: el script, paso a paso</h1>
      <p className={styles.problema}>
        Un script T-SQL decide qué cuentas de un usuario cuentan para un índice con tope de puntos: toma la cuenta de
        mayor monto, rellena con las que mejor encajan en los puntos que faltan y marca el resto para depurarlas. Aquí
        corre completo en tu navegador: recórrelo paso a paso, mira cómo cambian las variables y las tablas temporales,
        y edita los datos para ver otro resultado.
      </p>
      <p className={styles.nota}>
        Los datos son ficticios y no hay ningún servidor SQL detrás: el mismo algoritmo está escrito en TypeScript y
        probado contra el script.
      </p>

      <div className={styles.pie}>
        <Chips items={STACK} etiqueta="Tecnologías de la demo" />
        <EnlaceExterno href={REPOSITORIO}>Ver los scripts en GitHub</EnlaceExterno>
      </div>
    </header>
  )
}
