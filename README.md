# Portafolio de César Díaz

Sitio de una sola página de **César Alejandro Díaz Cano**, desarrollador Full Stack y especialista ETL / SQL Server, con demos en vivo de cuatro proyectos. Cada demo corre completa en el navegador, sin servidor, y avisa de dónde salen sus datos.

- **Portada reordenable** con [Swapy](https://swapy.tahazsh.com/): el visitante arrastra las tarjetas desde su asa (⠿) o usa «Reordenar», y el orden se guarda en su navegador.
- **Secciones:** Resumen, Trayectoria, Proyectos y Contacto (WhatsApp, correo, GitHub, LinkedIn y CV en español e inglés).
- **Tema** oscuro por defecto y claro, responsive desde 320 px, usable con teclado y lector de pantalla.

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

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en <http://localhost:5173/> |
| `npm run build` | Revisa tipos (`tsc -b`) y genera `dist/` |
| `npm run build:demos` | Compila cada app de `demos-src/` y copia su `dist` a `public/demos/<slug>/`. Opciones: `--solo <slug>`, `--sin-instalar` (no corre `npm ci` si la demo ya tiene `node_modules`) y `--con-tests` (corre `npm test` de la demo antes del build) |
| `npm run build:all` | `build:demos` y luego `build`: el sitio completo |
| `npm run preview` | Sirve `dist/` en <http://localhost:4173/> |
| `npm test` | Pruebas con Vitest |
| `npm run lint` | Oxlint |
| `npm run verify:dist` | Comprueba `dist/`: que estén todas las páginas, que los enlaces relativos resuelvan y que existan los CV y el favicon. Opción: `--dist <ruta>` para revisar otra carpeta |
| `npm run capturas` | Regenera las portadas de los proyectos (`src/assets/proyectos/<slug>.webp`, 1280×800, y `<slug>-800.webp`) con Edge headless (requiere `build:all`). Opciones: `--solo=<slug>`, `--escenario=<id>` y `--paso=<n>` (demo SQL), `--salida=<carpeta>` y `--formato=png` (por defecto, webp) |

> **Antes de `dev` o `preview`, corre `npm run build:demos` (o `build:all`) al menos una vez.** Sin `public/demos/`, los enlaces «Ver demo en vivo» de Reservas, Pokédex y Control de cuentas no encuentran su página. La demo SQL no lo necesita, porque forma parte del build.

Las opciones se pasan después de `--`: `npm run build:demos -- --solo reservas --sin-instalar`.

Primera vez:

```sh
npm ci
npm run build:all
npm run preview
```

## Cómo funcionan las demos

- **Fuente única.** `demos.config.json` lista las demos. Las de tipo `app` son copias completas en `demos-src/<slug>/`; la de tipo `entrada` (`calculos-sql`) es una página más del build de Vite (`demos/calculos-sql/index.html` + `src/demos/calculos-sql/`).
- **Copias, no los originales.** Cada app se copió a `demos-src/` con los cambios mínimos para funcionar como demo. `demos-src/ORIGEN.md` registra la procedencia (ruta o repositorio y SHA), lo que se excluyó y cada cambio. Los proyectos originales no se modifican.
- **Datos simulados en el navegador.** Donde la app real usa un backend, la copia trae una capa demo que replica su API con latencia y datos de ejemplo:
  - **Control de cuentas:** `src/api/demo/` reemplaza a axios y replica la API .NET (saldos, estados y fecha estimada de liquidación).
  - **Reservas:** `src/services/` simula la API de reservas, con el plazo de gestión del jueves a las 5:00 p.m.
  - **Pokédex:** usa la PokeAPI real (datos en vivo).
  - **Cálculos SQL:** replica en TypeScript la lógica del script T-SQL y la recorre paso a paso. Cada escenario y paso tiene su enlace: `demos/calculos-sql/index.html?escenario=original&paso=15` (el paso cuenta desde 1).
- **Rutas relativas.** Todo usa `base: './'`, así que el sitio funciona en cualquier repositorio o subruta de GitHub Pages. Los enlaces apuntan a `./demos/<slug>/index.html`.
- **`localStorage` con prefijo propio,** porque todo `cesar-diaz1347.github.io` comparte origen: `cd-tema` (también en la demo SQL), `cd-portada-orden.v1`, `controlPagos.demo.v1`, `controlPagos.colorScheme`, `reservas.demo.v2` y `reservas.modoOscuro`. Pokédex conserva su clave original (`pokedex-theme`). «Reiniciar demo» borra solo la clave de datos de su demo.
- **Paridad con el backend real.** Los cálculos de Control de cuentas se comprueban contra el C# original: `tools/paridad-deudas/` es la consola .NET que regenera `paridad.fixture.ts` (ver su README; hace falta el SDK de .NET 10).

## Actualizar el contenido

Todo el texto sale de `src/data/`, en TypeScript tipado: si falta un campo, el build falla.

| Archivo | Contenido |
|---|---|
| `perfil.ts` | Nombre, título, resumen, años de experiencia, sectores y ubicación |
| `experiencia.ts` | Puestos: cargo, empresa, fechas y logros (la duración se calcula) |
| `educacion.ts` | Carrera y certificaciones |
| `habilidades.ts` | Grupos de competencias y stack de la portada |
| `contacto.ts` | Correo, WhatsApp (número y mensaje), redes y CV |
| `proyectos.ts` | Tarjetas de proyectos: textos, stack, etiqueta de datos, repositorio y portada |
| `portada.ts`, `navegacion.ts` | Tarjetas de la portada y enlaces del menú |

- **CV:** reemplaza `public/cv/CV_Cesar_Diaz.pdf` y `public/cv/CV_Cesar_Diaz_EN.pdf` conservando los nombres. El tamaño que se muestra se recalcula en cada build.
- **Foto:** `src/assets/perfil.jpg`, cuadrada.
- **Portadas de proyectos:** corre `npm run build:all` y luego `npm run capturas`. Los archivos se llaman igual que antes, así que `src/data/proyectos.ts` no cambia; si una portada cambia mucho, ajusta su texto alternativo en ese archivo. Para la demo SQL, `--escenario=<id>` y `--paso=<n>` eligen qué se captura (por defecto, el paso 15 del escenario original).
- **Una demo nueva:** añádela a `demos.config.json` y a `src/data/proyectos.ts`; una prueba comprueba que ambas listas coincidan.

Tras cualquier cambio: `npm test`, `npm run lint` y `npm run build:all`.

## Accesibilidad

- La portada se puede reordenar sin arrastrar: con «Reordenar» («Mover antes / Mover después») o con las flechas sobre el asa. Cada cambio se anuncia en una región `aria-live`.
- El sitio respeta `prefers-reduced-motion`: sin animaciones, y Swapy sin animar.
- Todos los objetivos táctiles miden al menos 44×44 px, el foco es visible y la página incluye un enlace «Saltar al contenido».

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` instala dependencias, revisa (lint y pruebas), compila las demos con sus pruebas, construye el sitio, verifica `dist/` y lo publica.

Checklist de publicación:

- [ ] Elegir el repositorio destino: reemplazar el contenido de `Portafolio` o crear un repositorio nuevo.
- [ ] Hacer push de **todo el proyecto con git** (ver «Primer push» abajo). No lo subas con «Add files via upload» de la web de GitHub: solo lleva los archivos sueltos de la raíz y deja fuera `src/`, `public/`, `demos-src/`, `scripts/` y `.github/`, así que GitHub publica el `index.html` de código fuente y la página sale en blanco.
- [ ] En el repositorio, ir a **Settings → Pages → Build and deployment → Source** y elegir **GitHub Actions**.
- [x] Con la URL definitiva, `index.html` ya lleva `og:image` y `og:url` absolutas, `<link rel="canonical">` y `url` e `image` en el JSON-LD `Person`. Hoy apuntan a `https://cesar-diaz1347.github.io/Portafolio/`; si cambias de repositorio o de dominio, actualízalas (la foto de la vista previa es `public/perfil-og.jpg`).
- [ ] Verificar el primer deploy (en la pestaña **Actions**, el primero tarda unos 8 a 12 minutos):
  - el job termina en verde y el sitio abre en la URL;
  - las cuatro demos cargan desde «Ver demo en vivo»;
  - los dos CV se descargan;
  - la vista previa al compartir el enlace muestra la foto.

### Primer push

Desde la carpeta del proyecto, sobre un repositorio de GitHub que ya existe (tomará su historial y encima añadirá un commit con el proyecto nuevo, sin `--force`):

```sh
git init -b main
git remote add origin https://github.com/Cesar-diaz1347/Portafolio.git
git fetch origin
git reset origin/main   # toma el historial de GitHub sin tocar tus archivos
git add -A              # añade lo nuevo y borra lo que ya no está (el portafolio anterior)
git status              # revisa: sin node_modules, dist ni public/demos
git commit -m "Portafolio 2.1: React + TypeScript + Vite, portada con Swapy y 4 demos"
git push -u origin main
```

- **`src/demos/calculos-sql/sql/.gitattributes`:** guarda los scripts `.sql` sin convertir sus saltos de línea (son LF). Una prueba compara su SHA-256 con el de los originales; sin ese archivo, Git en Windows (`core.autocrlf=true`) los pasaría a CRLF al clonar y la prueba fallaría en esa copia.
- **Si el push dice «refusing to allow … without `workflow` scope»:** el token no tiene permiso para crear workflows. Inicia sesión por el navegador (Git Credential Manager) o crea un token con el permiso `workflow`.
- **Si el workflow falla:** abre el paso en rojo en la pestaña Actions y mira las últimas líneas del log.

## Licencias

- **Código:** GPL-3.0 (ver [`LICENSE`](LICENSE)), porque el sitio incluye Swapy, que se distribuye bajo GPL-3.0.
- **Contenido:** los textos, la fotografía y los CV pertenecen a César Alejandro Díaz Cano, con todos los derechos reservados. No están cubiertos por la licencia del código.
- **Créditos:** [Swapy](https://swapy.tahazsh.com/), de Taha Shashtari (GPL-3.0). Los logos de WhatsApp, Gmail, GitHub y LinkedIn son marcas de sus dueños y se usan solo para identificar cada canal de contacto.
- **Pokémon:** Pokémon y sus nombres son marcas de Nintendo / Game Freak. La demo Pokédex es un proyecto educativo sin fines comerciales que usa la PokeAPI.
