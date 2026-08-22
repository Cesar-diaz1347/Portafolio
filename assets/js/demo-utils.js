/* demo-utils.js — utilidades compartidas por las demos (namespace CD). */
window.CD = (function () {
  "use strict";

  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(txt) {
    return String(txt).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function money(n) {
    return "Q " + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function num(n) {
    return Number(n || 0).toLocaleString("es-GT");
  }

  function hora(d) {
    var f = d || new Date();
    return [f.getHours(), f.getMinutes(), f.getSeconds()]
      .map(function (v) { return String(v).padStart(2, "0"); })
      .join(":");
  }

  function fecha(d) {
    var f = d ? new Date(d) : new Date();
    return f.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
  }

  /* -------- persistencia por demo (localStorage, tolerante a fallos) ------- */
  function store(clave, porDefecto) {
    var k = "cd-demo-" + clave;
    return {
      leer: function () {
        try {
          var raw = localStorage.getItem(k);
          return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(porDefecto));
        } catch (e) { return JSON.parse(JSON.stringify(porDefecto)); }
      },
      guardar: function (valor) {
        try { localStorage.setItem(k, JSON.stringify(valor)); } catch (e) { /* sin espacio */ }
        return valor;
      },
      limpiar: function () {
        try { localStorage.removeItem(k); } catch (e) { /* noop */ }
      }
    };
  }

  /* --------------------------------- toast -------------------------------- */
  var tId;
  function toast(msg) {
    var el = q("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(tId);
    tId = setTimeout(function () { el.classList.remove("visible"); }, 2600);
  }

  /* -------------------------------- consola ------------------------------- */
  function log(sel, msg, tipo) {
    var c = typeof sel === "string" ? q(sel) : sel;
    if (!c) return;
    var linea = document.createElement("div");
    linea.innerHTML = '<span class="hora">' + hora() + '</span><span class="' + (tipo || "info") + '">' + esc(msg) + "</span>";
    c.appendChild(linea);
    c.scrollTop = c.scrollHeight;
  }

  /* --------------------------- aleatorios con semilla ---------------------- */
  function rngConSemilla(semilla) {
    var s = semilla >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function id(prefijo) {
    return prefijo + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  /* ------------------------------ descarga CSV ---------------------------- */
  function csv(nombre, filas) {
    var texto = filas.map(function (f) {
      return f.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";");
    }).join("\r\n");
    var url = URL.createObjectURL(new Blob(["\ufeff" + texto], { type: "text/csv;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  return { q: q, qa: qa, esc: esc, money: money, num: num, hora: hora, fecha: fecha, store: store, toast: toast, log: log, rngConSemilla: rngConSemilla, id: id, csv: csv };
})();
