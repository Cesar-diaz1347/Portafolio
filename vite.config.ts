// Directiva pedida por la especificación para tipar el bloque `test` en defineConfig de Vite.
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference types="vitest/config" />
import { statSync } from 'node:fs'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

import demosConfig from './demos.config.json' with { type: 'json' }

/** Una demo del portafolio tal como se declara en demos.config.json. */
type Demo =
  | { slug: string; tipo: 'app'; dir: string }
  | { slug: string; tipo: 'entrada'; html: string }

const SLUG_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ENTRADA_PRINCIPAL = 'index'

function esDemo(valor: unknown): valor is Demo {
  if (typeof valor !== 'object' || valor === null) return false
  if (!('slug' in valor) || typeof valor.slug !== 'string' || !SLUG_KEBAB.test(valor.slug)) {
    return false
  }
  if (!('tipo' in valor)) return false
  if (valor.tipo === 'app') return 'dir' in valor && typeof valor.dir === 'string'
  // Una entrada vive siempre en demos/<slug>/index.html, así el enlace
  // ./demos/<slug>/index.html del portafolio es válido para cualquier demo.
  if (valor.tipo === 'entrada') {
    return 'html' in valor && valor.html === `demos/${valor.slug}/index.html`
  }
  return false
}

function esListaDeDemos(valor: unknown): valor is Demo[] {
  return Array.isArray(valor) && valor.every(esDemo)
}

/**
 * Páginas HTML del build: el portafolio más cada demo de tipo "entrada".
 * Las demos de tipo "app" no son entradas: build-demos las compila aparte
 * y copia su dist a public/demos/<slug>/.
 * Rutas relativas a la raíz y sin globs (Vite no los admite en `input`).
 */
function entradasHtml(config: unknown): Record<string, string> {
  if (!esListaDeDemos(config)) {
    throw new Error(
      'demos.config.json no es válido: cada demo necesita un slug en kebab-case y ' +
        'tipo "app" (con dir) o "entrada" (con html = "demos/<slug>/index.html").',
    )
  }

  const entradas: Record<string, string> = { [ENTRADA_PRINCIPAL]: 'index.html' }
  const slugsVistos = new Set<string>([ENTRADA_PRINCIPAL])

  for (const demo of config) {
    if (slugsVistos.has(demo.slug)) {
      throw new Error(`demos.config.json: el slug "${demo.slug}" está repetido o reservado.`)
    }
    slugsVistos.add(demo.slug)
    if (demo.tipo === 'entrada') entradas[demo.slug] = demo.html
  }

  return entradas
}

/** Tamaño en KB (redondeado) de un archivo del proyecto, para mostrarlo junto a su descarga. */
function tamanoKb(rutaRelativa: string): number {
  const bytes = statSync(new URL(rutaRelativa, import.meta.url)).size
  return Math.max(1, Math.round(bytes / 1024))
}

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: el sitio funciona bajo cualquier repo o subruta de GitHub Pages.
  base: './',
  plugins: [react()],
  // `input` de nivel superior (Vite >= 8.2; build.rollupOptions es un alias obsoleto).
  // Al ser explícito, el escáner de dependencias solo rastrea estas páginas
  // y no el HTML de demos-src/ ni de public/demos/.
  input: entradasHtml(demosConfig),
  define: {
    // Si se reemplaza un CV, el tamaño mostrado se actualiza solo en el siguiente build.
    __CV_KB__: JSON.stringify({
      es: tamanoKb('./public/cv/CV_Cesar_Diaz.pdf'),
      en: tamanoKb('./public/cv/CV_Cesar_Diaz_EN.pdf'),
    }),
  },
  server: {
    watch: {
      // Las copias se compilan aparte con `npm run build:demos`.
      // public/demos sí se vigila, para recargar al regenerar las demos.
      ignored: ['**/demos-src/**'],
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'demos-src/**', 'public/demos/**'],
    environment: 'node',
  },
})
