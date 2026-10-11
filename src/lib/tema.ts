export type Tema = 'light' | 'dark'

/** Misma clave que Portafolio1.2, para conservar el tema que ya eligió el visitante. */
export const CLAVE_TEMA = 'cd-tema'

/** Color de la barra del navegador por tema (meta theme-color). */
const COLOR_BARRA: Record<Tema, string> = {
  dark: '#0b1220',
  light: '#f4f7fb',
}

export function esTema(valor: unknown): valor is Tema {
  return valor === 'light' || valor === 'dark'
}

/** Tema activo, tal como lo dejó el script anti-parpadeo de index.html. */
export function temaDelDocumento(): Tema {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function temaDelSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.theme = tema
  // Hay una meta por esquema preferido; con un tema elegido, ambas lo reflejan.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = COLOR_BARRA[tema]
  }
}
