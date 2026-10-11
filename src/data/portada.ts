/**
 * Tarjetas de la portada, en su orden por defecto. Con `utils.initSlotItemMap` cada
 * slot toma el id de la tarjeta que contiene por defecto, y el tamaño de cada slot
 * se define en Portada.module.css según ese id.
 */
export const TARJETAS_PORTADA = [
  { id: 'intro', nombre: 'Presentación' },
  { id: 'foto', nombre: 'Foto' },
  { id: 'experiencia', nombre: 'Experiencia' },
  { id: 'stack', nombre: 'Stack' },
  { id: 'contacto', nombre: 'Contacto' },
  { id: 'ubicacion', nombre: 'Ubicación' },
] as const

export type TarjetaPortada = (typeof TARJETAS_PORTADA)[number]
export type IdTarjeta = TarjetaPortada['id']

export const IDS_TARJETAS: readonly IdTarjeta[] = TARJETAS_PORTADA.map((tarjeta) => tarjeta.id)
