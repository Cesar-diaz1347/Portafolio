/** Secciones con ancla, en el orden de la página y de la navegación. */
export const SECCIONES = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'trayectoria', texto: 'Trayectoria' },
  { id: 'proyectos', texto: 'Proyectos' },
  { id: 'contacto', texto: 'Contacto' },
] as const

export type IdSeccion = (typeof SECCIONES)[number]['id']

/** Referencia estable para useSeccionActiva. */
export const IDS_SECCIONES: readonly IdSeccion[] = SECCIONES.map((seccion) => seccion.id)

/** La portada es el destino de la marca y de «Volver arriba». */
export const ID_INICIO = 'inicio'
