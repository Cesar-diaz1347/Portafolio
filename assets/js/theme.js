/* theme.js — toggle claro/oscuro compartido por el portafolio y las demos.
   El tema se aplica antes del primer paint con el script inline del <head>;
   este archivo solo se encarga del botón y de mantener sincronizadas
   las pestañas abiertas (evento "storage"). */
(function () {
  "use strict";

  var CLAVE = "cd-tema";

  function actual() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function aplicar(tema) {
    document.documentElement.setAttribute("data-theme", tema);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", tema === "light" ? "#f4f7fb" : "#0b1220");
    document.querySelectorAll("[data-tema-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(tema === "light"));
      btn.setAttribute("aria-label", tema === "light" ? "Activar modo oscuro" : "Activar modo claro");
      btn.title = tema === "light" ? "Modo oscuro" : "Modo claro";
    });
  }

  function alternar() {
    var nuevo = actual() === "light" ? "dark" : "light";
    try { localStorage.setItem(CLAVE, nuevo); } catch (e) { /* modo privado */ }
    aplicar(nuevo);
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-tema-toggle]");
    if (btn) alternar();
  });

  // Si el usuario cambia el tema en otra pestaña (p. ej. una demo), se refleja aquí.
  window.addEventListener("storage", function (ev) {
    if (ev.key === CLAVE && ev.newValue) aplicar(ev.newValue);
  });

  aplicar(actual());
})();
