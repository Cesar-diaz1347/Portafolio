import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { createSwapy, utils, type SlotItemMapArray, type Swapy } from 'swapy'

import { IDS_TARJETAS, TARJETAS_PORTADA, type IdTarjeta } from '../../data/portada'
import { useAnuncio } from '../../hooks/useAnuncio'
import { usePrefiereMenosMovimiento } from '../../hooks/useMediaQuery'
import { borrar, escribir, leer } from '../../lib/almacenamiento'
import {
  CLAVE_ORDEN_PORTADA,
  esOrdenPorDefecto,
  leerOrdenGuardado,
  moverTarjeta,
  type Direccion,
} from '../../lib/ordenPortada'

/** Control desde el que se movió una tarjeta; tras moverla, el foco vuelve a él. */
export type ControlMovimiento = Direccion | 'asa'

const MENSAJE_GUARDADO = 'Orden guardado en este navegador.'
// Mensajes breves: la región de estado reserva dos líneas (ver Portada.module.css).
const MENSAJE_SIN_GUARDAR = 'No se pudo guardar el orden en este navegador.'
/** La animación 'dynamic' de Swapy dura 300 ms: se espera a que termine. */
const ESPERA_TRAS_SOLTAR_MS = 350
/** Si el puntero se movió más que esto entre presionar y soltar el asa, fue un arrastre. */
const UMBRAL_ARRASTRE_PX = 6

function nombreDe(id: string): string {
  return TARJETAS_PORTADA.find((tarjeta) => tarjeta.id === id)?.nombre ?? id
}

function ordenInicial(): SlotItemMapArray {
  return (
    leerOrdenGuardado(leer(CLAVE_ORDEN_PORTADA), IDS_TARJETAS) ??
    utils.initSlotItemMap([...TARJETAS_PORTADA], 'id')
  )
}

function guardar(orden: SlotItemMapArray): boolean {
  return escribir(CLAVE_ORDEN_PORTADA, JSON.stringify(orden))
}

/**
 * Estado y comportamiento de la portada reordenable.
 *
 * Swapy trabaja en modo `manualSwap`: React renderiza cada tarjeta dentro del slot
 * que indica `orden` y Swapy solo anima. Al cambiar de slot, React vuelve a montar
 * la tarjeta y Swapy 1.0.5 conserva la referencia al asa anterior (`targetEl`), así
 * que tras cada reordenamiento se crea una instancia nueva (`generacion`). No se usa
 * `update()`: en 1.0.5 quita el listener de scroll de window y no lo vuelve a poner,
 * y el arrastre con autoscroll se descuadra.
 */
export function usePortadaReordenable() {
  const [orden, setOrden] = useState<SlotItemMapArray>(ordenInicial)
  const [generacion, setGeneracion] = useState(0)
  const [modoReordenar, setModoReordenar] = useState(false)
  const { mensaje, anunciar } = useAnuncio()
  const reducirMovimiento = usePrefiereMenosMovimiento()
  const grillaRef = useRef<HTMLUListElement>(null)
  const botonReordenarRef = useRef<HTMLButtonElement>(null)
  const inicioPuntero = useRef<{ x: number; y: number } | null>(null)

  const tarjetas = useMemo(() => utils.toSlottedItems([...TARJETAS_PORTADA], 'id', orden), [orden])
  const ordenCambiado = !esOrdenPorDefecto(orden)

  useEffect(() => {
    const grilla = grillaRef.current
    if (!grilla) return undefined

    let swapy: Swapy
    try {
      swapy = createSwapy(grilla, {
        manualSwap: true,
        animation: reducirMovimiento ? 'none' : 'dynamic',
        autoScrollOnDrag: true,
      })
    } catch {
      // Sin Swapy la portada sigue siendo reordenable con «Reordenar» y las flechas.
      return undefined
    }

    let hayQueRecrear = false
    let guardado = true
    let temporizador: number | undefined

    swapy.onSwapStart(() => window.clearTimeout(temporizador))
    swapy.onSwap(({ newSlotItemMap }) => {
      hayQueRecrear = true
      const nuevo = newSlotItemMap.asArray.map(({ slot, item }) => ({ slot, item }))
      // Swapy busca las tarjetas en el DOM en el siguiente frame: React ya debe haberlas movido.
      flushSync(() => setOrden(nuevo))
      guardado = guardar(nuevo)
    })
    swapy.onSwapEnd(({ hasChanged }) => {
      if (hasChanged) anunciar(guardado ? MENSAJE_GUARDADO : MENSAJE_SIN_GUARDAR)
      if (!hayQueRecrear) return
      temporizador = window.setTimeout(
        () => setGeneracion((valor) => valor + 1),
        reducirMovimiento ? 0 : ESPERA_TRAS_SOLTAR_MS,
      )
    })

    return () => {
      window.clearTimeout(temporizador)
      swapy.destroy()
    }
  }, [generacion, reducirMovimiento, anunciar])

  const mover = useCallback(
    (id: IdTarjeta, direccion: Direccion, control: ControlMovimiento) => {
      const nombre = nombreDe(id)
      const nuevo = moverTarjeta(orden, id, direccion)
      if (!nuevo) {
        anunciar(
          direccion === 'antes' ? `«${nombre}» ya es la primera tarjeta.` : `«${nombre}» ya es la última tarjeta.`,
        )
        return
      }

      flushSync(() => {
        setOrden(nuevo)
        setGeneracion((valor) => valor + 1)
      })
      const guardado = guardar(nuevo)
      const posicion = nuevo.findIndex((entrada) => entrada.item === id) + 1
      anunciar(
        `«${nombre}» pasó a la posición ${posicion} de ${nuevo.length}. ${guardado ? MENSAJE_GUARDADO : MENSAJE_SIN_GUARDAR}`,
      )
      // La tarjeta se volvió a montar en su nuevo slot: el foco vuelve al mismo control.
      grillaRef.current
        ?.querySelector<HTMLElement>(`[data-swapy-item="${id}"] [data-control="${control}"]`)
        ?.focus()
    },
    [orden, anunciar],
  )

  const restablecer = useCallback(() => {
    flushSync(() => {
      setOrden(utils.initSlotItemMap([...TARJETAS_PORTADA], 'id'))
      setGeneracion((valor) => valor + 1)
    })
    borrar(CLAVE_ORDEN_PORTADA)
    anunciar('Orden restablecido.')
    // «Restablecer orden» desaparece: el foco pasa a su vecino, «Reordenar».
    botonReordenarRef.current?.focus()
  }, [anunciar])

  const alternarModoReordenar = useCallback(() => {
    const activo = !modoReordenar
    setModoReordenar(activo)
    anunciar(
      activo
        ? 'Reordenar activado: cada tarjeta muestra «Mover antes» y «Mover después».'
        : 'Reordenar desactivado.',
    )
  }, [modoReordenar, anunciar])

  const alPresionarAsa = useCallback((evento: PointerEvent<HTMLButtonElement>) => {
    inicioPuntero.current = { x: evento.clientX, y: evento.clientY }
  }, [])

  // Un clic o Enter sobre el asa (sin arrastrar) explica cómo moverla.
  const alPulsarAsa = useCallback(
    (id: IdTarjeta, evento: MouseEvent<HTMLButtonElement>) => {
      const inicio = inicioPuntero.current
      inicioPuntero.current = null
      const fueArrastre =
        evento.detail > 0 &&
        inicio !== null &&
        Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > UMBRAL_ARRASTRE_PX
      if (fueArrastre) return
      anunciar(`Arrastra el asa o usa las flechas del teclado para mover «${nombreDe(id)}».`)
    },
    [anunciar],
  )

  const alTeclearAsa = useCallback(
    (id: IdTarjeta, evento: KeyboardEvent<HTMLButtonElement>) => {
      let direccion: Direccion | null = null
      if (evento.key === 'ArrowUp' || evento.key === 'ArrowLeft') direccion = 'antes'
      if (evento.key === 'ArrowDown' || evento.key === 'ArrowRight') direccion = 'despues'
      if (direccion === null) return
      evento.preventDefault()
      mover(id, direccion, 'asa')
    },
    [mover],
  )

  // Escape sale del modo «Reordenar» y devuelve el foco a su botón.
  const alTeclearGrilla = useCallback(
    (evento: KeyboardEvent<HTMLUListElement>) => {
      if (evento.key !== 'Escape' || !modoReordenar) return
      setModoReordenar(false)
      anunciar('Reordenar desactivado.')
      botonReordenarRef.current?.focus()
    },
    [modoReordenar, anunciar],
  )

  return {
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
  }
}
