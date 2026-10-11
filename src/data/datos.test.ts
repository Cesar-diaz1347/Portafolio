import { describe, expect, it } from 'vitest'

import demosConfig from '../../demos.config.json'
import { mesesInclusivos } from '../lib/fechas'
import { CERTIFICACIONES } from './educacion'
import { PUESTOS } from './experiencia'
import { GRUPOS_HABILIDADES } from './habilidades'
import { IDS_TARJETAS } from './portada'
import { enlaceDemo, PROYECTOS } from './proyectos'

describe('proyectos', () => {
  it('usa exactamente los slugs de demos.config.json', () => {
    const slugsConfig = demosConfig.map((demo) => demo.slug).sort()
    expect(PROYECTOS.map((proyecto) => proyecto.slug).sort()).toEqual(slugsConfig)
  })

  it('enlaza cada demo con una ruta relativa explícita a index.html', () => {
    for (const { slug } of PROYECTOS) {
      expect(enlaceDemo(slug)).toBe(`./demos/${slug}/index.html`)
    }
  })

  it('enlaza el código en GitHub de Cesar-diaz1347 y lleva etiqueta de datos', () => {
    for (const proyecto of PROYECTOS) {
      expect(proyecto.repo).toMatch(/^https:\/\/github\.com\/Cesar-diaz1347\/[\w-]+$/)
      expect(proyecto.etiquetaDatos.length).toBeGreaterThan(0)
      expect(proyecto.detalle.hice.length).toBeGreaterThan(0)
    }
  })

  it('las 4 portadas son capturas uniformes (webp de 1280×800) con texto alternativo', () => {
    for (const { portada } of PROYECTOS) {
      expect(portada.src).toMatch(/[.]webp$/)
      expect(portada.ancho / portada.alto).toBe(1.6)
      expect(portada.srcSet).toContain('800w')
      expect(portada.srcSet).toContain('1280w')
      expect(portada.alt.length).toBeGreaterThan(20)
    }
  })
})

describe('trayectoria', () => {
  it('tiene los 5 puestos del CV en 5 empresas', () => {
    expect(PUESTOS).toHaveLength(5)
    expect(new Set(PUESTOS.map((puesto) => puesto.empresa)).size).toBe(5)
    expect(new Set(PUESTOS.map((puesto) => puesto.id)).size).toBe(5)
  })

  it('cada puesto cerrado termina después de empezar', () => {
    for (const puesto of PUESTOS) {
      if (puesto.fin !== 'actual') {
        expect(mesesInclusivos(puesto.inicio, puesto.fin)).toBeGreaterThan(0)
      }
    }
  })

  it('tiene las 7 certificaciones del CV', () => {
    expect(CERTIFICACIONES).toHaveLength(7)
  })
})

describe('competencias y portada', () => {
  it('tiene los 4 grupos de competencias del CV', () => {
    expect(GRUPOS_HABILIDADES.map((grupo) => grupo.titulo)).toEqual([
      'Backend & Lenguajes',
      'Frontend & Web',
      'Datos & ETL',
      'Cloud & DevOps',
    ])
  })

  it('la portada tiene 6 tarjetas sin ids repetidos', () => {
    expect(IDS_TARJETAS).toHaveLength(6)
    expect(new Set(IDS_TARJETAS).size).toBe(6)
  })
})
