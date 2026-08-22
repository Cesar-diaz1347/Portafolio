/* etl-ssis.js — Demo: ejecución de un paquete SSIS y publicación del reporte SSRS.
   Extracción asíncrona → staging → limpieza → dimensiones → DW → datamart. */
(function () {
  "use strict";

  var q = CD.q;

  var SUCURSALES = ["Zona 10", "Zona 1 Centro", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla"];

  var PASOS = [
    { id: 1, nombre: "Extract · GET /api/transacciones", detalle: "Origen REST asíncrono, paginado por lote" },
    { id: 2, nombre: "Landing · stg.Transacciones", detalle: "Aterrizaje del JSON crudo en staging" },
    { id: 3, nombre: "Data cleansing", detalle: "Tipos, nulos y montos fuera de rango → stg.Errores" },
    { id: 4, nombre: "Lookup de dimensiones", detalle: "Cliente, producto y sucursal a claves surrogate" },
    { id: 5, nombre: "Load · dw.FactTransacciones", detalle: "Inserción por lotes con transacción" },
    { id: 6, nombre: "Datamart + publicación SSRS", detalle: "Agregado por sucursal y periodo" }
  ];

  var almacen = CD.store("etl", { ultima: null });
  var estado = almacen.leer();
  var corriendo = false;

  /* --------------------------------- render ------------------------------- */
  function pintarPipeline(estados) {
    q("#pipeline").innerHTML = PASOS.map(function (p, i) {
      var e = (estados && estados[i]) || { estado: "", metrica: "" };
      return '<div class="paso" data-estado="' + e.estado + '">' +
        '<span class="idx">' + p.id + "</span>" +
        "<span><b>" + p.nombre + "</b><small>" + p.detalle + "</small></span>" +
        '<span class="metrica-paso">' + (e.metrica || "") + "</span></div>";
    }).join("");
  }

  function progreso(pct, texto) {
    q("#progreso").style.width = pct + "%";
    q("#progreso-texto").textContent = texto;
  }

  function esperar(ms) {
    var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return new Promise(function (r) { setTimeout(r, reducido ? 20 : ms); });
  }

  /* ------------------------------ generación ------------------------------ */
  function generarLote(n, ruido, inicio) {
    var filas = [];
    for (var i = 0; i < n; i++) {
      var malo = Math.random() * 100 < ruido;
      filas.push({
        id: inicio + i,
        sucursal: SUCURSALES[Math.floor(Math.random() * SUCURSALES.length)],
        monto: malo && Math.random() < 0.5 ? -1 : Math.round((80 + Math.random() * 1800) * 100) / 100,
        cliente: malo && Math.random() < 0.5 ? null : "CLI-" + (1000 + Math.floor(Math.random() * 9000)),
        fecha: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString()
      });
    }
    return filas;
  }

  function esValida(f) { return f.monto > 0 && f.cliente !== null; }

  /* ------------------------------- ejecución ------------------------------ */
  async function ejecutar() {
    if (corriendo) return;
    corriendo = true;
    q("#ejecutar").disabled = true;
    q("#reporte").hidden = true;
    q("#consola").innerHTML = "";

    var total = Number(q("#volumen").value);
    var ruido = Number(q("#ruido").value);
    var tamLote = Number(q("#lote").value);
    var maxReintentos = Number(q("#reintentos").value);
    var puedeFallar = q("#fallo").value === "si";

    var ejecucionId = CD.id("EXEC");
    q("#ejecucion-id").textContent = ejecucionId;

    var estados = PASOS.map(function () { return { estado: "", metrica: "" }; });
    pintarPipeline(estados);

    var t0 = performance.now();
    var leidas = 0, validas = [], rechazadas = 0;

    function marcar(i, est, metrica) {
      estados[i] = { estado: est, metrica: metrica || estados[i].metrica };
      pintarPipeline(estados);
    }

    CD.log("#consola", "Inicio del paquete CargaTransacciones.dtsx (" + ejecucionId + ")", "info");
    CD.log("#consola", "Parámetros: " + CD.num(total) + " filas · buffer " + CD.num(tamLote) + " · ruido " + ruido + "%", "info");

    /* 1 · Extract con reintentos */
    marcar(0, "corriendo");
    var lotes = Math.ceil(total / tamLote);
    var fallosSimulados = 0;
    for (var b = 0; b < lotes; b++) {
      var intento = 0;
      while (true) {
        await esperar(140);
        var cae = puedeFallar && Math.random() < 0.12;
        if (cae && intento < maxReintentos) {
          intento++;
          fallosSimulados++;
          CD.log("#consola", "Time-out del origen en el lote " + (b + 1) + ". Reintento " + intento + "/" + maxReintentos, "warn");
          continue;
        }
        if (cae && intento >= maxReintentos) {
          marcar(0, "err", "fallo tras " + intento + " reintentos");
          CD.log("#consola", "El origen no respondió y no quedan reintentos. Paquete abortado.", "err");
          progreso(100, "Ejecución fallida");
          q("#ejecutar").disabled = false;
          corriendo = false;
          CD.toast("Paquete abortado: la API no respondió.");
          return;
        }
        break;
      }
      var n = Math.min(tamLote, total - leidas);
      var filas = generarLote(n, ruido, leidas + 1);
      leidas += n;
      validas = validas.concat(filas);
      marcar(0, "corriendo", CD.num(leidas) + " / " + CD.num(total));
      progreso(Math.round((leidas / total) * 35), "Extrayendo del origen…");
    }
    marcar(0, "ok", CD.num(leidas) + " filas leídas");
    CD.log("#consola", "Extracción completa: " + CD.num(leidas) + " filas en " + lotes + " lotes" +
      (fallosSimulados ? " (" + fallosSimulados + " reintentos)" : ""), "ok");

    /* 2 · Landing */
    marcar(1, "corriendo");
    await esperar(420);
    marcar(1, "ok", CD.num(leidas) + " filas en stg");
    CD.log("#consola", "stg.Transacciones cargada con " + CD.num(leidas) + " filas crudas", "ok");
    progreso(48, "Aterrizando en staging…");

    /* 3 · Cleansing */
    marcar(2, "corriendo");
    await esperar(520);
    var limpias = validas.filter(esValida);
    rechazadas = validas.length - limpias.length;
    marcar(2, rechazadas > validas.length * 0.25 ? "err" : "ok",
      CD.num(limpias.length) + " ok / " + CD.num(rechazadas) + " rechazadas");
    CD.log("#consola", rechazadas + " filas enviadas a stg.Errores (monto <= 0 o cliente nulo)",
      rechazadas ? "warn" : "ok");
    progreso(62, "Validando calidad de datos…");

    /* 4 · Lookup de dimensiones */
    marcar(3, "corriendo");
    await esperar(430);
    marcar(3, "ok", SUCURSALES.length + " sucursales conformadas");
    CD.log("#consola", "Lookup resuelto contra dim.Cliente, dim.Producto y dim.Sucursal", "ok");
    progreso(76, "Conformando dimensiones…");

    /* 5 · Load al Data Warehouse */
    marcar(4, "corriendo");
    await esperar(560);
    marcar(4, "ok", CD.num(limpias.length) + " filas insertadas");
    CD.log("#consola", "dw.FactTransacciones: " + CD.num(limpias.length) + " filas insertadas en transacción", "ok");
    progreso(90, "Cargando el Data Warehouse…");

    /* 6 · Datamart + SSRS */
    marcar(5, "corriendo");
    await esperar(380);
    var resumen = SUCURSALES.map(function (s) {
      var suyas = limpias.filter(function (f) { return f.sucursal === s; });
      var monto = suyas.reduce(function (a, f) { return a + f.monto; }, 0);
      return { sucursal: s, n: suyas.length, monto: monto, ticket: suyas.length ? monto / suyas.length : 0 };
    }).sort(function (a, b) { return b.monto - a.monto; });

    marcar(5, "ok", "datamart publicado");
    var segundos = (performance.now() - t0) / 1000;
    CD.log("#consola", "Datamart dm.VentasSucursal actualizado y reporte SSRS publicado", "ok");
    CD.log("#consola", "Paquete finalizado en " + segundos.toFixed(1) + " s", "info");
    progreso(100, "Ejecución completada");
    q("#duracion").textContent = segundos.toFixed(1) + " s";

    q("#kpi-leidas").textContent = CD.num(leidas);
    q("#kpi-insertadas").textContent = CD.num(limpias.length);
    q("#kpi-rechazadas").textContent = CD.num(rechazadas);
    q("#kpi-throughput").textContent = CD.num(Math.round(leidas / Math.max(segundos, 0.1)));

    estado.ultima = { id: ejecucionId, fecha: new Date().toISOString(), resumen: resumen, leidas: leidas, rechazadas: rechazadas };
    almacen.guardar(estado);
    pintarReporte(resumen);

    q("#ejecutar").disabled = false;
    corriendo = false;
    CD.toast("Paquete ejecutado: " + CD.num(limpias.length) + " filas en el DW.");
  }

  /* -------------------------------- reporte ------------------------------- */
  function pintarReporte(resumen) {
    q("#reporte").hidden = false;
    q("#tabla-reporte").innerHTML = resumen.map(function (r) {
      return "<tr><td>" + r.sucursal + "</td>" +
        '<td class="num">' + CD.num(r.n) + "</td>" +
        '<td class="num">' + CD.money(r.monto) + "</td>" +
        '<td class="num">' + CD.money(r.ticket) + "</td></tr>";
    }).join("");

    var max = Math.max.apply(null, resumen.map(function (r) { return r.monto; }).concat([1]));
    var alto = 26, sep = 34, x0 = 108;
    q("#grafica-reporte").innerHTML = resumen.map(function (r, i) {
      var y = 12 + i * sep;
      var w = Math.round((r.monto / max) * 210);
      return '<text x="100" y="' + (y + 17) + '" text-anchor="end">' + r.sucursal + "</text>" +
        '<rect class="barra-fill" x="' + x0 + '" y="' + y + '" width="' + w + '" height="' + alto + '" rx="5" opacity="0.85"></rect>' +
        '<text x="' + (x0 + w + 6) + '" y="' + (y + 17) + '">' + CD.money(Math.round(r.monto)) + "</text>";
    }).join("");
  }

  function exportar() {
    if (!estado.ultima) { CD.toast("Ejecuta el paquete primero."); return; }
    var filas = [["Sucursal", "Transacciones", "Monto", "Ticket promedio"]];
    estado.ultima.resumen.forEach(function (r) {
      filas.push([r.sucursal, r.n, r.monto.toFixed(2), r.ticket.toFixed(2)]);
    });
    CD.csv("ventas-por-sucursal.csv", filas);
  }

  /* ---------------------------------- init -------------------------------- */
  q("#ejecutar").addEventListener("click", ejecutar);
  q("#exportar").addEventListener("click", exportar);
  q("#ruido").addEventListener("input", function () { q("#ruido-valor").textContent = q("#ruido").value + "%"; });
  q("#reiniciar").addEventListener("click", function () {
    q("#consola").innerHTML = "";
    q("#reporte").hidden = true;
    q("#ejecucion-id").textContent = "";
    q("#duracion").textContent = "";
    ["leidas", "insertadas", "rechazadas", "throughput"].forEach(function (k) { q("#kpi-" + k).textContent = "0"; });
    progreso(0, "Listo para ejecutar");
    pintarPipeline(null);
  });

  pintarPipeline(null);
  if (estado.ultima) {
    pintarReporte(estado.ultima.resumen);
    CD.log("#consola", "Última ejecución cargada: " + estado.ultima.id + " (" + CD.fecha(estado.ultima.fecha) + ")", "info");
  }
})();
