/* main.js — render del grid de proyectos, filtros, modal de casos de estudio
   y pequeños detalles de la página (reveal, año del pie). */
(function () {
  "use strict";

  var grid = document.getElementById("grid-proyectos");
  var filtros = document.getElementById("filtros");
  var modal = document.getElementById("modal-proyecto");
  var proyectos = window.PROYECTOS || [];

  var ICONO_EXTERNO =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h5v2H7v10h10v-3h2v5H5V5z"/></svg>';

  function esc(txt) {
    return String(txt).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function chipsStack(stack) {
    return stack.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("");
  }

  /* ------------------------------ tarjetas ------------------------------- */
  function tarjeta(p) {
    var esDemo = p.tipo === "demo";
    var cuerpo =
      '<div class="proyecto__top">' +
        '<span class="proyecto__icono" aria-hidden="true">' + p.icono + "</span>" +
        '<span class="proyecto__badge ' + (esDemo ? "badge--demo" : "badge--caso") + '">' +
          (esDemo ? "Demo interactiva" : "Caso de estudio") +
        "</span>" +
      "</div>" +
      '<span class="proyecto__empresa">' + esc(p.empresa) + "</span>" +
      "<h3>" + esc(p.titulo) + "</h3>" +
      '<p class="proyecto__desc">' + esc(p.desc) + "</p>" +
      '<div class="proyecto__stack">' + chipsStack(p.stack) + "</div>" +
      '<span class="proyecto__cta">' +
        (esDemo ? "Abrir demo en pestaña nueva " + ICONO_EXTERNO : "Ver detalle del proyecto") +
      "</span>";

    var el;
    if (esDemo) {
      el = document.createElement("a");
      el.href = p.demo;
      el.target = "_blank";
      el.rel = "noopener";
      el.setAttribute("aria-label", "Abrir la demo de " + p.titulo + " en una pestaña nueva");
    } else {
      el = document.createElement("button");
      el.type = "button";
      el.addEventListener("click", function () { abrirModal(p); });
    }
    el.className = "proyecto";
    el.dataset.empresa = p.empresaId;
    el.dataset.tipo = p.tipo;
    el.innerHTML = cuerpo;
    return el;
  }

  function pintar() {
    var frag = document.createDocumentFragment();
    proyectos.forEach(function (p) { frag.appendChild(tarjeta(p)); });
    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  /* ------------------------------- filtros ------------------------------- */
  function construirFiltros() {
    var empresas = [];
    proyectos.forEach(function (p) {
      if (!empresas.some(function (e) { return e.id === p.empresaId; })) {
        empresas.push({ id: p.empresaId, nombre: p.empresa });
      }
    });

    var opciones = [{ id: "todos", nombre: "Todos" }, { id: "demo", nombre: "Con demo" }].concat(empresas);
    opciones.forEach(function (op, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "filtro";
      b.textContent = op.nombre;
      b.dataset.filtro = op.id;
      b.setAttribute("aria-pressed", String(i === 0));
      filtros.appendChild(b);
    });

    filtros.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".filtro");
      if (!btn) return;
      filtros.querySelectorAll(".filtro").forEach(function (f) {
        f.setAttribute("aria-pressed", String(f === btn));
      });
      aplicarFiltro(btn.dataset.filtro);
    });
  }

  function aplicarFiltro(id) {
    grid.querySelectorAll(".proyecto").forEach(function (card) {
      var visible =
        id === "todos" ||
        (id === "demo" && card.dataset.tipo === "demo") ||
        card.dataset.empresa === id;
      card.hidden = !visible;
    });
  }

  /* -------------------------------- modal -------------------------------- */
  function abrirModal(p) {
    modal.querySelector("[data-modal-empresa]").textContent = p.empresa;
    modal.querySelector("[data-modal-titulo]").textContent = p.titulo;
    modal.querySelector("[data-modal-reto]").textContent = p.detalle.reto;
    modal.querySelector("[data-modal-resultado]").textContent = p.detalle.resultado;
    modal.querySelector("[data-modal-lista]").innerHTML = p.detalle.hice
      .map(function (h) { return "<li>" + esc(h) + "</li>"; })
      .join("");
    modal.querySelector("[data-modal-stack]").innerHTML = chipsStack(p.stack);
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }

  if (modal) {
    modal.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-modal-cerrar]") || ev.target === modal) modal.close();
    });
  }

  /* ------------------------- detalles de la página ----------------------- */
  function reveal() {
    var elems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    function mostrarTodo() {
      elems.forEach(function (el) { el.classList.add("visible"); });
    }
    if (!("IntersectionObserver" in window)) { mostrarTodo(); return; }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
    elems.forEach(function (el) { obs.observe(el); });

    /* Red de seguridad: si el observador no reportó nada (pestaña en segundo
       plano, navegador sin composición, etc.) se muestra el contenido igual. */
    setTimeout(function () {
      if (!document.querySelector(".reveal.visible")) mostrarTodo();
    }, 1800);
  }

  function anio() {
    var el = document.getElementById("anio");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* --------------------------------- init -------------------------------- */
  if (grid) {
    pintar();
    construirFiltros();
  }
  reveal();
  anio();
})();
