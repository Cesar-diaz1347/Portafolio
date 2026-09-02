# Portafolio 1.2 · César Alejandro Díaz Cano

Portafolio web personal construido con **HTML, CSS y JavaScript puro**, sin frameworks ni build step.

## Estructura

```
index.html               Portada: presentación + acordeón de 5 secciones
secciones/               Una página por sección (destino de cada franja)
  experiencia.html       Los 5 puestos de la trayectoria
  proyectos.html         Los 13 proyectos, con filtros y detalle
  competencias.html      Las 4 áreas del stack; cada chip filtra los proyectos
  certificaciones.html   Educación y las 7 credenciales
  contacto.html          Gmail, WhatsApp, GitHub y datos de contacto
proyectos/               Las 6 demos interactivas (datos ficticios)
assets/css/              base.css (tema) · sitio.css (cascarón) · acordeon.css · seccion.css · demo.css
assets/js/               theme.js · proyectos.js (datos) · acordeon.js · seccion.js · demo-utils.js
```

Los proyectos son la única fuente de datos: `assets/js/proyectos.js`. De ahí salen el grid, los
filtros, el contador de la portada y el enlace de cada competencia hacia sus proyectos.

## Créditos

Los logos de Gmail, WhatsApp y GitHub provienen de [svgl.app](https://svgl.app) y son marcas de sus
respectivos propietarios; se usan únicamente para identificar los canales de contacto.

## Contacto

- ✉️ cesar.diaz1347@gmail.com
- 📱 +502 4290-9263
- 💻 [github.com/Cesar-diaz1347](https://github.com/Cesar-diaz1347)
