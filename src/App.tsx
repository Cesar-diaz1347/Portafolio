import styles from './App.module.css'
import { Footer } from './components/Footer/Footer'
import { Header } from './components/Header/Header'
import { Contacto } from './sections/Contacto/Contacto'
import { Portada } from './sections/Portada/Portada'
import { Proyectos } from './sections/Proyectos/Proyectos'
import { Resumen } from './sections/Resumen/Resumen'
import { Trayectoria } from './sections/Trayectoria/Trayectoria'

/** Una sola página con anclas: Header · Portada · Resumen · Trayectoria · Proyectos · Contacto · Footer. */
function App() {
  return (
    <>
      <a className={styles.saltar} href="#contenido">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" tabIndex={-1}>
        <Portada />
        <Resumen />
        <Trayectoria />
        <Proyectos />
        <Contacto />
      </main>
      <Footer />
    </>
  )
}

export default App
