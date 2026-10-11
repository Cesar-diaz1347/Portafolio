import retrato from '../../../assets/perfil.jpg'
import styles from '../Tarjetas.module.css'

export function TarjetaFoto() {
  return (
    <img
      className={styles.imagenFoto}
      src={retrato}
      alt="Retrato de César Alejandro Díaz Cano: sonríe a la cámara, con lentes de montura metálica y camisa azul oscuro, sobre fondo negro."
      width={432}
      height={432}
      decoding="async"
      fetchPriority="high"
    />
  )
}
