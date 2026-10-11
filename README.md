# Portafolio de César Díaz

Sitio de una sola página de **César Alejandro Díaz Cano**, desarrollador Full Stack y especialista ETL / SQL Server, con demos en vivo de cuatro proyectos. Cada demo corre completa en el navegador, sin servidor, y avisa de dónde salen sus datos.

- **Portada reordenable** con [Swapy](https://swapy.tahazsh.com/): el visitante arrastra las tarjetas desde su asa (⠿) o usa «Reordenar», y el orden se guarda en su navegador.

## Stack

| Área | Herramientas |
|---|---|
| Sitio | Vite 8, React 19, TypeScript 6 (estricto), CSS Modules con tokens globales, fuentes del sistema |
| Portada | Swapy 1.0 (GPL-3.0) |
| Calidad | Vitest 5, Oxlint |
| Publicación | GitHub Pages con GitHub Actions |

Requisitos: Node 24 y npm 11, los mismos que usa el CI.

## Estructura

```text
├─ index.html                  Entrada 1: el portafolio (SEO, Open Graph, JSON-LD y tema sin parpadeo)
├─ demos/calculos-sql/         Entrada 2: la demo SQL, en el mismo build
├─ demos.config.json           Lista única de demos y sus slugs
├─ src/
│  ├─ data/                    Contenido tipado: perfil, experiencia, proyectos…
│  ├─ sections/                Portada, Resumen, Trayectoria, Proyectos y Contacto
│  ├─ components/ hooks/ lib/ styles/
│  ├─ assets/                  Foto, logos y portadas de los proyectos
│  └─ demos/calculos-sql/      UI y motor de la demo SQL
├─ demos-src/                  Copias de las apps reales (ver demos-src/ORIGEN.md)
├─ public/                     favicon, cv/ y demos/ (esta última la genera build:demos)
├─ scripts/                    build-demos, verificar-dist y capturar-portadas
├─ tools/paridad-deudas/       Consola C# que regenera el fixture de paridad de Control de cuentas
└─ .github/workflows/deploy.yml
```

## Licencias

- **Código:** GPL-3.0 (ver [`LICENSE`](LICENSE)), porque el sitio incluye Swapy, que se distribuye bajo GPL-3.0.
- **Contenido:** los textos, la fotografía y los CV pertenecen a César Alejandro Díaz Cano, con todos los derechos reservados. No están cubiertos por la licencia del código.
- **Créditos:** [Swapy](https://swapy.tahazsh.com/), de Taha Shashtari (GPL-3.0). Los logos de WhatsApp, Gmail, GitHub y LinkedIn son marcas de sus dueños y se usan solo para identificar cada canal de contacto.
- **Pokémon:** Pokémon y sus nombres son marcas de Nintendo / Game Freak. La demo Pokédex es un proyecto educativo sin fines comerciales que usa la PokeAPI.
