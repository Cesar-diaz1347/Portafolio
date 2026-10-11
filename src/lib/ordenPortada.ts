import type { SlotItemMapArray } from 'swapy'

/** Clave propia en localStorage: todo cesar-diaz1347.github.io comparte origen. */
export const CLAVE_ORDEN_PORTADA = 'cd-portada-orden.v1'

export type Direccion = 'antes' | 'despues'

type EntradaOrden = SlotItemMapArray[number]

/**
 * Orden por defecto: cada tarjeta en el slot que lleva su mismo id.
 * Es la misma convención de `utils.initSlotItemMap` de Swapy.
 */
export function ordenPorDefecto(ids: readonly string[]): SlotItemMapArray {
  return ids.map((id) => ({ slot: id, item: id }))
}

function esEntradaOrden(valor: unknown): valor is EntradaOrden {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'slot' in valor &&
    typeof valor.slot === 'string' &&
    'item' in valor &&
    typeof valor.item === 'string'
  )
}

/**
 * Valida un orden leído del almacenamiento: deben aparecer exactamente los mismos
 * slots y las mismas tarjetas, sin repetidos. Devuelve el orden con los slots en su
 * orden canónico (el del DOM), o `null` si no es válido.
 */
export function validarOrden(valor: unknown, ids: readonly string[]): SlotItemMapArray | null {
  if (!Array.isArray(valor)) return null
  const lista: readonly unknown[] = valor
  if (lista.length !== ids.length) return null

  const validos = new Set(ids)
  const tarjetaPorSlot = new Map<string, string>()
  const tarjetasVistas = new Set<string>()

  for (const entrada of lista) {
    if (!esEntradaOrden(entrada)) return null
    const { slot, item } = entrada
    if (!validos.has(slot) || !validos.has(item)) return null
    if (tarjetaPorSlot.has(slot) || tarjetasVistas.has(item)) return null
    tarjetaPorSlot.set(slot, item)
    tarjetasVistas.add(item)
  }

  const normalizado: SlotItemMapArray = []
  for (const slot of ids) {
    const item = tarjetaPorSlot.get(slot)
    if (item === undefined) return null
    normalizado.push({ slot, item })
  }
  return normalizado
}

/** Lee el JSON guardado; cualquier error (JSON roto, forma inválida) da `null`. */
export function leerOrdenGuardado(
  texto: string | null,
  ids: readonly string[],
): SlotItemMapArray | null {
  if (texto === null) return null
  try {
    const valor: unknown = JSON.parse(texto)
    return validarOrden(valor, ids)
  } catch {
    return null
  }
}

export function esOrdenPorDefecto(orden: SlotItemMapArray): boolean {
  return orden.every(({ slot, item }) => slot === item)
}

/** Posición de una tarjeta, empezando en 1 (0 si no está). */
export function posicionDe(orden: SlotItemMapArray, item: string): number {
  return orden.findIndex((entrada) => entrada.item === item) + 1
}

/**
 * Intercambia la tarjeta con la del slot anterior o siguiente.
 * Devuelve un orden nuevo, o `null` si ya está en el extremo o no existe.
 */
export function moverTarjeta(
  orden: SlotItemMapArray,
  item: string,
  direccion: Direccion,
): SlotItemMapArray | null {
  const origen = orden.findIndex((entrada) => entrada.item === item)
  if (origen === -1) return null
  const destino = direccion === 'antes' ? origen - 1 : origen + 1
  if (destino < 0 || destino >= orden.length) return null

  return orden.map((entrada, indice) => {
    if (indice === origen) return { slot: entrada.slot, item: orden[destino].item }
    if (indice === destino) return { slot: entrada.slot, item }
    return { slot: entrada.slot, item: entrada.item }
  })
}
