/* acordeon.js — portada.
   El acordeón funciona sin JavaScript: cada franja es un enlace y en escritorio
   se expande con :hover / :focus-visible desde CSS. Este archivo solo añade lo
   que el CSS no puede resolver:
     1. En pantallas táctiles (o angostas) no existe el hover, así que el primer
        toque abre la franja y el segundo —o el botón «Abrir»— navega.
     2. Mantiene sincronizado el contador de proyectos con la fuente de datos.
     3. Pone el año en el pie. */
(function () {
  "use strict";

  var acordeon = document.getElementById("acordeon");

  /* --------------------- modo apilado: abrir con un toque ---------------- */
  /* Mismo umbral que la media query de acordeon.css. */
  var horizontal = window.matchMedia("(hover: hover) and (min-width: 861px)");

  function cerrarTodas(excepto) {
    if (!acordeon) return;
    acordeon.querySelectorAll(".franja.abierta").forEach(function (f) {
      if (f !== excepto) f.classList.remove("abierta");
    });
  }

  if (acordeon) {
    acordeon.addEventListener("click", function (ev) {
      if (horizontal.matches) return;                 // escritorio: el enlace navega

      var franja = ev.target.closest(".franja");
      if (!franja) return;

      // Ya está abierta, o se pulsó el botón de abrir: se deja navegar.
      if (franja.classList.contains("abierta") || ev.target.closest(".franja__cta")) return;

      ev.preventDefault();
      cerrarTodas(franja);
      franja.classList.add("abierta");
    });

    // Al pasar de apilado a horizontal (girar el teléfono, redimensionar) se
    // limpia el estado manual para que mande otra vez el hover.
    var alCambiarModo = function () { if (horizontal.matches) cerrarTodas(); };
    if (horizontal.addEventListener) horizontal.addEventListener("change", alCambiarModo);
    else if (horizontal.addListener) horizontal.addListener(alCambiarModo);
  }

  /* ------------------------------- métricas ------------------------------ */
  /* Se lee de PROYECTOS para que el número no se desincronice al añadir uno. */
  function metricaProyectos() {
    var el = document.querySelector("[data-metrica-proyectos]");
    var n = (window.PROYECTOS || []).length;
    if (el && n) el.textContent = n;
  }

  /* Los proyectos de la vista previa también salen de los datos reales. */
  function muestraProyectos() {
    var cont = document.querySelector("[data-muestra-proyectos]");
    if (!cont || !window.PROYECTOS) return;
    cont.innerHTML = window.PROYECTOS.slice(0, 3)
      .map(function (p) {
        return '<span class="muestra__fila"><b>' + p.icono + " " + p.titulo +
               "</b><span>" + (p.tipo === "demo" ? "demo" : "caso") + "</span></span>";
      })
      .join("");
  }

  function anio() {
    var el = document.getElementById("anio");
    if (el) el.textContent = new Date().getFullYear();
  }

  metricaProyectos();
  muestraProyectos();
  anio();
})();
