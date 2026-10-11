# Origen de las copias en `demos-src/`

Cada carpeta es una **copia** de una app real, adaptada para correr como demo dentro del portafolio.
Los proyectos originales no se modifican: solo se leen o se copian.

- **Fecha de copia:** 2026-10-04.
- **Comando de copia** (robocopy; los códigos de salida 0–7 indican éxito):

  ```text
  robocopy <origen> <destino> /E /XD node_modules dist .git .github .vite coverage /XF *.local *.tsbuildinfo vite.config.*.timestamp-*.mjs
  ```

- **Comprobación:** antes de cualquier cambio, `diff -r` entre cada origen y su copia no mostró diferencias (aparte de lo excluido).
- **Lockfiles:** se copian sin cambios y `npm ci` no los modifica. Los tres incluyen los bindings nativos de Linux x64 que necesita el CI.

---

## `reservas/`

| Dato | Valor |
|---|---|
| Origen | `C:\Users\Freelance\Proyectos\Reservas-Front-main`: descarga ZIP, sin `.git`, de <https://github.com/Cesar-diaz1347/Reservas-Front> |
| SHA | `1bb4b01ae8f324f2652676917c63c80149f4f670` (`main`, 2026-08-11 02:40 UTC, «Versión base de app para reservar productos o servicios») |
| Cómo se obtuvo el SHA | API pública de GitHub (`/repos/Cesar-diaz1347/Reservas-Front/commits/main`), confirmado con `git ls-remote` |
| Fidelidad | Los 23 archivos versionados en ese commit son idénticos byte a byte a los del ZIP, y el ZIP no tiene archivos extra (salvo `node_modules`) |
| Excluido | `node_modules/`, `.github/` (workflow de deploy del repo original) y 3 archivos `vite.config.js.timestamp-*.mjs` (temporales de Vite que quedaron versionados en el repo) |
| Stack | React 18 · Vite 5.4.21 · Tailwind 3 · JavaScript |

### Cambios para la demo

- [x] `vite.config.js`: `base: '/reserva-almuerzo-app/'` → `base: './'`.
- [x] **API simulada** (`src/services/`): `reglas.js` (calendario, plazo de gestión «jueves a las 5:00 p.m.» de la semana anterior y los 4 servicios médicos del día) y `reservasApi.js` (asíncrona, con latencia de 250 a 600 ms; datos en `localStorage`, clave `reservas.demo.v2`, sembrados en relación con hoy; errores `ApiError`). `package.json`: script `test` con `node --test` sobre `src/**/*.test.js` (35 pruebas: reglas, API simulada y calendario; sin dependencias nuevas).
- [x] **Pantallas conectadas a la API** (`Dashboard`, `Reservar`, `MisReservas`) con estados de carga, vacío, error con reintento y éxito (`src/hooks/useRecurso.js`). Confirmar una reserva refresca la semana, el calendario y la campana, y lleva a «Mis reservas» en esa fecha. Cancelar pide confirmación y, si el plazo venció, queda deshabilitado y explica el límite. Se quitan las fechas fijas de julio de 2026 y los comentarios `BACKEND:`.
- [x] **Accesibilidad e interfaz:** barra lateral que entra desde la izquierda por debajo de `md` (hamburguesa, Esc y manejo del foco); diálogos accesibles (`Dialogo.jsx`: `role="dialog"`, `aria-modal`, Esc, foco atrapado y devuelto al cerrar); `aria-label` en los botones de icono; opciones de menú como grupo de radios; enlace «Saltar al contenido»; contrastes AA, foco visible y `prefers-reduced-motion` (`src/index.css`).
- [x] **Banner de demo** (`DemoBanner.jsx`): «Demo · datos simulados en tu navegador», «Reiniciar demo» (borra solo `reservas.demo.v2`) y «← Volver al portafolio». «Cerrar sesión» muestra una pantalla de salida con «Volver a entrar» (`SesionCerrada.jsx`).
- [x] **Tema:** la clave `modoOscuro` pasa a `reservas.modoOscuro`, y `index.html` la aplica antes del primer pintado.
- [x] `index.html`: `lang="es"`, título «Reserva de citas médicas · Demo», descripción e icono.
- [x] **Textos provisionales del original sustituidos:** «Logo de marca» → «Citas médicas» e «Imagen promocional» → el encabezado «Reserva tu cita médica».
- [x] **Cambio de temática (almuerzos → citas médicas):** los menús pasan a ser 4 servicios fijos (dermatología, pediatría, medicina general y oftalmología), «Torre Internacional» se elimina de las sedes (quedan Torre Norte y Campus Sur), el horario pasa a 8:00 a.m. a 4:00 p.m., los textos de la interfaz hablan de citas y las opciones del desplegable de sede tienen fondo propio (en modo oscuro salían blancas). La clave de datos sube a `reservas.demo.v2`. Internamente se conservan los nombres `plato` y `menuId` del contrato original.
- [x] **Selector de fecha propio** (`src/components/SelectorFecha.jsx`): reemplaza al `<input type="date">`. El calendario nativo solo se abre desde su icono, a la derecha, y no admite cambiar su tamaño. El nuevo abre con un clic (o Enter, Espacio o ↓) en cualquier parte de la tarjeta y mide lo mismo que ella. Los días anteriores a la primera fecha reservable no se pueden elegir; los fines de semana siguen siendo elegibles y la pantalla los explica, como antes. Con teclado: flechas, Inicio, Fin, RePág / AvPág y Esc. La lógica de fechas está en `src/utils/calendar.js` (`diasVisiblesDelMes`, `sumarMeses`, `moverFecha`, `fechaNumerica`), con pruebas en `calendar.test.js`.
- [x] `src/data/mockData.js` eliminado (ya nada lo usa) y `README.md` de la copia reescrito para describir lo anterior.

---

## `pokedex/`

| Dato | Valor |
|---|---|
| Origen | <https://github.com/Cesar-diaz1347/Pokedex>, rama `main` |
| SHA | `3844be5551f3bd152fe74ab0c2332583dcde48a9` (2026-08-09 21:06 −06:00, «Update README.md») |
| Cómo se obtuvo | `git clone --depth 1 -c core.autocrlf=false` en un directorio temporal y robocopy a esta carpeta |
| Fidelidad | Con `core.autocrlf=false`, los archivos quedan en LF, byte a byte iguales a los del repo. Sin esa opción, el `core.autocrlf=true` del sistema los habría convertido a CRLF |
| Excluido | `.git/` |
| Stack | React 18 · Vite 5.4.21 · TypeScript 5 · datos en vivo de PokeAPI |

### Cambios para la demo

- [x] `vite.config.ts`: se añade `base: './'`.
- [x] **Banner de demo** (`src/components/DemoBanner.tsx`, estilos en `src/index.css`): «← Volver al portafolio», «Datos en vivo de PokeAPI» y el aviso de marca Nintendo / Game Freak. `App.tsx` lo monta encima de la app.
- [x] `index.html`: título «Pokédex · Demo» (el `lang="es"` ya estaba).
- [x] `src/index.css`: con `prefers-reduced-motion` se quitan las transiciones.
- No se tocó nada más: los controles del original (buscador, selector, paginación y tema) conservan sus tamaños, y algunos miden entre 33 y 40 px de alto.

### Notas

- El script `lint` (`eslint .`) no funciona: `eslint` no está en las dependencias. No se usa.
- `tsc -b` genera `tsconfig.*.tsbuildinfo` en la raíz de la copia; los ignora `.gitignore` (`*.tsbuildinfo`).

---

## `control-cuentas/`

| Dato | Valor |
|---|---|
| Origen | `C:\Users\Freelance\Proyectos\Control de pagos\frontend\control-pagos-web`, subcarpeta del repo <https://github.com/Cesar-diaz1347/Control-de-Pagos> |
| SHA del HEAD | `05ef0be60304ca2b35ca2645088aa0c952c63587` (2026-08-20 21:35 −06:00, «Permitir campos de monto vacios en formularios de pago y deuda») |
| Estado git | **Se copió el working tree, no el commit.** El repo tiene 4 archivos modificados sin commit; 3 están dentro de la carpeta copiada y entraron tal cual |
| Excluido | `node_modules/` |
| Stack | React 19 · Vite 8.2.1 · TypeScript 6.0.3 · Mantine 9 · TanStack Query 5 · React Router 7 |

Los 4 archivos modificados sin commit del repo son:

- `frontend/control-pagos-web/src/api/client.ts` (copiado)
- `frontend/control-pagos-web/src/pages/DashboardPage.tsx` (copiado)
- `frontend/control-pagos-web/src/pages/DeudasListPage.tsx` (copiado)
- `scripts/dev-start.ps1` (fuera de la carpeta copiada)

Por eso esta copia va por delante del repo publicado, que es el que enlaza «Ver código».

### Cambios para la demo

- [x] `vite.config.ts`: se añade `base: './'`. El proxy `/api` se conserva; solo aplica en `vite dev`.
- [x] `src/router.tsx`: `createBrowserRouter` → `createHashRouter`, con las mismas rutas.
- [x] `src/pages/DeudaFormPage.tsx`: corrección de tipos preexistente del original (TS2322); el repo publicado tiene el mismo error. El `mutationFn` pasa a ser `async` y devuelve `Promise<void>`; `onSuccess` no usaba el resultado, así que el comportamiento no cambia.
- [x] **Capa demo en lugar de axios** (`src/api/demo/`): port exacto de `DeudaCalculoService` con montos en centavos enteros (`calculo.ts`), fechas con la semántica de `DateOnly.AddMonths` (`fechas.ts`), almacén en `localStorage` con clave `controlPagos.demo.v1` (`almacen.ts`), semilla en relación con hoy con los 2 tipos y los 5 estados (`semilla.ts`), errores en español (`errores.ts`) y la API con latencia de 200 a 450 ms (`api.ts`). `src/api/deudas.ts` conserva sus 9 funciones y delega en esa API: las páginas y React Query no cambian.
- [x] **Pruebas:** Vitest 5 como devDependency y script `test`. `paridad.fixture.ts` trae 1551 casos calculados con el C# real, generados con `tools/paridad-deudas/`; en total son 1612 pruebas.
- [x] `src/main.tsx`: el `QueryClient` no reintenta los 400 y 404 (un 503 se reintenta una vez), y el color del tema se guarda con la clave `controlPagos.colorScheme`. `index.html` aplica esa clave antes del primer pintado, con `lang="es"` y el título «Control de cuentas · Demo».
- [x] `src/App.tsx`: menú hamburguesa en el `AppShell` (se cierra al navegar o con Esc) y `DemoBanner.tsx`: «Reiniciar demo» (pide confirmación, borra solo su clave, reinicia las consultas y vuelve al inicio) y «← Volver al portafolio».
- [x] **Formularios:** errores reales de la API, por campo cuando corresponde (`src/utils/errores.ts`); monto máximo de 999,999,999.99 y separador de miles (`utils/format.ts`); si la API rechaza un pago, lo escrito se conserva (`PagoForm.tsx`).
- [x] **Tablas:** `Table.ScrollContainer` en los listados y el nombre de la deuda como enlace accesible (`DeudasListPage.tsx`, `PagosHistorialTable.tsx`, `DeudaDetailPage.tsx`).
- [x] **Objetivos táctiles de 44 px:** `src/demo.css` sube a 44 px el alto mínimo de botones, iconos, enlaces del menú, filtros y campos (Mantine los trae de 28 a 36 px), y el enlace «Ver listado de deudas» del Dashboard gana alto.

### Problema heredado del original (corregido en la copia)

En el original, `npm run build` falla en `tsc -b` con TS2322 en `src/pages/DeudaFormPage.tsx:64`:

- **Causa:** el `mutationFn` devuelve `Promise<DeudaDetail> | Promise<void>`.
- **Origen:** el error ya está en el original. Es el mismo código, con las mismas versiones que su `node_modules`: TypeScript 6.0.3 y @tanstack/react-query 5.101.4.
- **Estado:** corregido en esta copia (ver «Cambios para la demo»). El repo publicado sigue con el error.

---

## Fuera de `demos-src/`: Cálculos SQL

La demo de Cálculos SQL no es una copia de una app: es una página más del build del portafolio (`demos/calculos-sql/index.html` y `src/demos/calculos-sql/`).

| Dato | Valor |
|---|---|
| Origen de los scripts | <https://github.com/Cesar-diaz1347/CalculoConteoValor>, commit `65cb895`: `LogicaConteoYValor_Ficticios.sql` y `CrearFicticios.sql` |
| Fidelidad | `src/demos/calculos-sql/sql/` tiene copias exactas, byte a byte; una prueba compara su SHA-256 (`engine/scripts.test.ts`) |
| Lo que se escribió | Un motor en TypeScript que replica el script (`engine/`, con decimales exactos en `bigint`) y la interfaz que lo recorre paso a paso (`components/`, `hooks/`, `lib/`) |
