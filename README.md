# Portafolio · César Alejandro Díaz Cano

Portafolio web personal construido con **HTML, CSS y JavaScript puro** (sin frameworks, sin build,
sin dependencias externas), listo para publicarse en **GitHub Pages**.

🔗 Una vez publicado: `https://cesar-diaz1347.github.io/portafolio/`

## Qué incluye

- **Segmento 1 · Sobre mí** — perfil profesional, métricas, línea de tiempo de experiencia
  (Banco Internacional, Grupo Unicomer, Colgate-Palmolive, Autopan, Itics), competencias técnicas
  agrupadas en las cuatro áreas del CV y credenciales con su entidad emisora.
- **Segmento 2 · Proyectos** — 13 proyectos filtrables por empresa. Seis de ellos abren en una
  **pestaña nueva** una demo interactiva; el resto se detalla en una ficha de caso de estudio.
- **Modo claro / oscuro** con botón en la barra superior. La preferencia se guarda en `localStorage`
  y se hereda en las demos (incluso al abrirlas en otra pestaña).
- **Contacto directo**: Gmail (ventana de redacción con el correo prellenado), WhatsApp
  (`wa.me`, mensaje inicial incluido) y GitHub.

## Demos interactivas

| Demo | Proyecto | Qué se puede probar |
|---|---|---|
| `proyectos/cafeteria/` | Cafetería institucional — Banco Internacional | Reservar almuerzo por sucursal, fecha y menú, cobro electrónico con validación de saldo, descuento por planilla, despacho del proveedor y conciliación de RRHH |
| `proyectos/embozado/` | Embozado de tarjetas — Banco Internacional | Validación Luhn y de BIN, rechazo con motivo, generación de lote y exportación para la embozadora |
| `proyectos/sorteos/` | Sorteos diarios — Banco Internacional | Sorteo ponderado por boletas con semilla auditable y verificación del acta |
| `proyectos/csat/` | Calificación de servicio — Banco Internacional | Encuesta CSAT/NPS, indicadores en vivo y desempeño por agente y canal |
| `proyectos/etl-ssis/` | Pipeline ETL SSIS + SSRS | Ejecución por etapas, filas rechazadas, reintentos ante caída de la API y reporte del datamart |
| `proyectos/inventarios/` | Traslados inter-sucursales — Grupo Unicomer | Validación de existencias, mercadería en tránsito, recepción/devolución y kardex |

Todas usan **datos ficticios**; lo que se reproduce es la lógica de negocio.

## Estructura

```
.
├── index.html                 # Portafolio (segmentos 1 y 2)
├── assets/
│   ├── css/  base.css · styles.css · demo.css
│   ├── js/   theme.js · proyectos.js · main.js · demo-utils.js
│   └── img/  perfil.jpg · favicon.svg
└── proyectos/<slug>/index.html + <slug>.js     # una demo por carpeta
```

Para agregar un proyecto basta con añadir un objeto a `assets/js/proyectos.js`: el grid, los filtros
y la ficha se generan solos.

## Ver en local

Basta con abrir `index.html` en el navegador. Para que las rutas se comporten igual que en GitHub Pages,
conviene servirlo por HTTP:

```bash
npx serve .
```

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "Portafolio inicial"
git branch -M main
git remote add origin https://github.com/Cesar-diaz1347/portafolio.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
En un par de minutos el sitio queda publicado. El archivo `.nojekyll` evita que Pages procese el sitio
con Jekyll.

## Contacto

- ✉️ cesar.diaz1347@gmail.com
- 📱 +502 4290-9263
- 💻 [github.com/Cesar-diaz1347](https://github.com/Cesar-diaz1347)
