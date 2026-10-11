import { Icono } from '../../components/Icono/Icono'
import { ID_INICIO } from '../../data/navegacion'
import { cx } from '../../lib/cx'
import { posicionDe } from '../../lib/ordenPortada'
import boton from '../../styles/boton.module.css'
import { AsaArrastre } from './AsaArrastre'
import { ContenidoTarjeta } from './ContenidoTarjeta'
import { ControlesReordenar } from './ControlesReordenar'
import styles from './Portada.module.css'
import tarjeta from './Tarjetas.module.css'
import { usePortadaReordenable } from './usePortadaReordenable'

const ID_AYUDA_ASA = 'portada-ayuda-asa'

/**
 * Portada en grilla bento: los tamaños viven en los slots y cada tarjeta ocupa el
 * 100 % de su slot y se adapta con container queries. El visitante la reordena
 * arrastrando desde el asa o, sin arrastrar, con «Reordenar» o las flechas.
 */
export function Portada() {
  const {
    tarjetas,
    orden,
    ordenCambiado,
    modoReordenar,
    mensaje,
    grillaRef,
    botonReordenarRef,
    mover,
    restablecer,
    alternarModoReordenar,
    alPresionarAsa,
    alPulsarAsa,
    alTeclearAsa,
    alTeclearGrilla,
  } = usePortadaReordenable()

  return (
    <section id={ID_INICIO} className={styles.portada} aria-labelledby="titulo-portada">
      <div className="contenedor">
        <div className={styles.barra}>
          <div className={styles.indicaciones}>
            <p className={styles.indicacion}>
              <span className={styles.simboloAsa} aria-hidden="true">
                ⠿
              </span>
              <span>
                Esta portada es tuya: arrastra las tarjetas desde <span aria-hidden="true">⠿</span>
                <span className="solo-lectores">su asa</span> o usa «Reordenar».
              </span>
            </p>
            <p className={styles.estado} role="status">
              {mensaje}
            </p>
          </div>
          <div className={styles.acciones}>
            {/* Siempre en el DOM: con el orden por defecto queda invisible (sin foco ni
                presencia para lectores de pantalla) pero conserva su sitio, así que
                aparecer no desplaza la grilla ni reacomoda la indicación. */}
            <button
              type="button"
              className={cx(boton.boton, boton.compacto, boton.fantasma, !ordenCambiado && styles.reservado)}
              onClick={restablecer}
            >
              <Icono nombre="restablecer" />
              Restablecer orden
            </button>
            <button
              ref={botonReordenarRef}
              type="button"
              className={cx(boton.boton, boton.compacto)}
              aria-pressed={modoReordenar}
              onClick={alternarModoReordenar}
            >
              <Icono nombre="reordenar" />
              Reordenar
            </button>
          </div>
        </div>

        <p id={ID_AYUDA_ASA} className="solo-lectores">
          Arrastra para mover la tarjeta, o usa las flechas del teclado para moverla antes o después.
        </p>

        <ul ref={grillaRef} className={styles.grilla} role="list" onKeyDown={alTeclearGrilla}>
          {tarjetas.map(({ slotId, itemId, item }) => (
            <li key={slotId} className={styles.slot} data-swapy-slot={slotId}>
              {item && (
                <div
                  key={itemId}
                  className={cx(tarjeta.tarjeta, tarjeta[item.id])}
                  data-swapy-item={itemId}
                  role="group"
                  aria-label={item.nombre}
                >
                  <AsaArrastre
                    nombre={item.nombre}
                    idAyuda={ID_AYUDA_ASA}
                    onPointerDown={alPresionarAsa}
                    onClick={(evento) => alPulsarAsa(item.id, evento)}
                    onKeyDown={(evento) => alTeclearAsa(item.id, evento)}
                  />
                  <ContenidoTarjeta id={item.id} />
                  {modoReordenar && (
                    <ControlesReordenar
                      nombre={item.nombre}
                      posicion={posicionDe(orden, item.id)}
                      total={tarjetas.length}
                      onMover={(direccion) => mover(item.id, direccion, direccion)}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
