export type NombreIcono =
  | 'sol'
  | 'luna'
  | 'menu'
  | 'cerrar'
  | 'descargar'
  | 'correo'
  | 'copiar'
  | 'check'
  | 'flecha-derecha'
  | 'arriba'
  | 'abajo'
  | 'ubicacion'
  | 'remoto'
  | 'idioma'
  | 'info'
  | 'github'
  | 'reordenar'
  | 'restablecer'
  | 'flecha-izquierda'
  | 'saltar-final'
  | 'advertencia'

interface DefinicionIcono {
  d: string
  viewBox?: string
}

/** Trazos de 24×24 (los de Portafolio1.2 donde existían); GitHub usa su marca en 16×16. */
const ICONOS: Record<NombreIcono, DefinicionIcono> = {
  sol: {
    d: 'M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-13.5a1 1 0 0 1 1 1V6a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1V21a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1zM21 11a1 1 0 1 1 0 2h-1.5a1 1 0 1 1 0-2H21zM6 12a1 1 0 0 1-1 1H3.5a1 1 0 1 1 0-2H5a1 1 0 0 1 1 1zm12.36-6.36a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 1 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0zM8.11 15.89a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 0 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0zm10.25 2.47a1 1 0 0 1-1.41 0l-1.06-1.06a1 1 0 0 1 1.41-1.41l1.06 1.06a1 1 0 0 1 0 1.41zM8.11 8.11a1 1 0 0 1-1.41 0L5.64 7.05A1 1 0 0 1 7.05 5.64L8.11 6.7a1 1 0 0 1 0 1.41z',
  },
  luna: { d: 'M21.64 13a9 9 0 1 1-10.63-10.6 1 1 0 0 1 1.1 1.4 7 7 0 0 0 8.13 8.13 1 1 0 0 1 1.4 1.07z' },
  menu: { d: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z' },
  cerrar: {
    d: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z',
  },
  descargar: {
    d: 'M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3 1.4 1.42L12 16.41l-4.7-4.7 1.4-1.42 2.3 2.3V4a1 1 0 0 1 1-1zM5 18h14v2H5v-2z',
  },
  correo: {
    d: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-8 5-8-5V6l8 5 8-5v2.24z',
  },
  copiar: {
    d: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z',
  },
  check: { d: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
  'flecha-derecha': { d: 'M12.3 4.3 10.9 5.7l5.3 5.3H4v2h12.2l-5.3 5.3 1.4 1.4L20 12z' },
  arriba: { d: 'M12 4 5 11l1.41 1.41L11 7.83V20h2V7.83l4.59 4.58L19 11z' },
  abajo: { d: 'm12 20 7-7-1.41-1.41L13 16.17V4h-2v12.17l-4.59-4.58L5 13z' },
  ubicacion: {
    d: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
  },
  remoto: {
    d: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V5zm2 0v8h12V5H6zM1 17h22v1a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-1z',
  },
  idioma: {
    d: 'M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v11h6v1.9L12.4 16H20V5H4zm3 3h10v2H7V8zm0 4h7v2H7v-2z',
  },
  info: {
    d: 'M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  },
  github: {
    viewBox: '0 0 16 16',
    d: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z',
  },
  reordenar: { d: 'M7 4 3 8h3v8h2V8h3L7 4zm10 16 4-4h-3V8h-2v8h-3l4 4z' },
  restablecer: {
    d: 'M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
  },
  'flecha-izquierda': { d: 'm11.7 4.3 1.4 1.4L7.8 11H20v2H7.8l5.3 5.3-1.4 1.4L4 12z' },
  'saltar-final': { d: 'M6 6l8.5 6L6 18V6zm10 0h2v12h-2V6z' },
  advertencia: { d: 'M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z' },
}

export interface IconoProps {
  nombre: NombreIcono
  className?: string
}

/** Icono decorativo: el nombre accesible lo da siempre el texto del control. */
export function Icono({ nombre, className }: IconoProps) {
  const { d, viewBox = '0 0 24 24' } = ICONOS[nombre]
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
