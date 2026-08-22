/* cafeteria.js — Demo: automatización de la cafetería institucional.
   Portal del colaborador · App del proveedor · Panel de RRHH. */
(function () {
  "use strict";

  var q = CD.q, qa = CD.qa;

  var COLABORADORES = [
    { id: "COL-1042", nombre: "Ana Morales", depto: "Operaciones", saldoInicial: 250 },
    { id: "COL-1187", nombre: "Luis Batres", depto: "Tecnología", saldoInicial: 180 },
    { id: "COL-1230", nombre: "Karla Estrada", depto: "Riesgos", saldoInicial: 90 },
    { id: "COL-1355", nombre: "Diego Pérez", depto: "Tesorería", saldoInicial: 40 },
    { id: "COL-1401", nombre: "Sofía Ruano", depto: "RRHH", saldoInicial: 300 }
  ];

  var MENU = [
    { id: "P01", nombre: "Desayuno chapín", emoji: "🍳", precio: 32, cat: "Desayuno" },
    { id: "P02", nombre: "Panqueques", emoji: "🥞", precio: 28, cat: "Desayuno" },
    { id: "P03", nombre: "Almuerzo del día", emoji: "🍛", precio: 45, cat: "Almuerzo" },
    { id: "P04", nombre: "Pollo a la plancha", emoji: "🍗", precio: 52, cat: "Almuerzo" },
    { id: "P05", nombre: "Ensalada César", emoji: "🥗", precio: 38, cat: "Almuerzo" },
    { id: "P06", nombre: "Sándwich de pavo", emoji: "🥪", precio: 30, cat: "Snack" },
    { id: "P07", nombre: "Café americano", emoji: "☕", precio: 12, cat: "Bebida" },
    { id: "P08", nombre: "Jugo natural", emoji: "🧃", precio: 15, cat: "Bebida" },
    { id: "P09", nombre: "Fruta picada", emoji: "🍉", precio: 18, cat: "Snack" },
    { id: "P10", nombre: "Postre del día", emoji: "🍰", precio: 22, cat: "Snack" }
  ];

  var FLUJO = ["Recibida", "En preparación", "Lista", "Entregada"];

  var almacen = CD.store("cafeteria", { ordenes: [] });
  var estado = almacen.leer();
  var carrito = [];

  function guardar() { almacen.guardar(estado); }

  function colaborador(id) {
    return COLABORADORES.filter(function (c) { return c.id === id; })[0];
  }

  /* Saldo disponible = saldo inicial menos lo cobrado electrónicamente. */
  function saldo(id) {
    var gastado = estado.ordenes.reduce(function (acc, o) {
      return acc + (o.colaboradorId === id && o.pago === "electronico" ? o.total : 0);
    }, 0);
    return colaborador(id).saldoInicial - gastado;
  }

  function totalCarrito() {
    return carrito.reduce(function (a, i) { return a + i.precio * i.cant; }, 0);
  }

  /* ------------------------------- portal -------------------------------- */
  function pintarMenu() {
    q("#menu").innerHTML = MENU.map(function (p) {
      return '<button class="producto" type="button" data-add="' + p.id + '">' +
        '<span class="emoji" aria-hidden="true">' + p.emoji + "</span>" +
        "<b>" + CD.esc(p.nombre) + "</b><small>" + p.cat + "</small>" +
        '<span class="precio">' + CD.money(p.precio) + "</span></button>";
    }).join("");
  }

  function pintarColaboradores() {
    q("#colaborador").innerHTML = COLABORADORES.map(function (c) {
      return '<option value="' + c.id + '">' + CD.esc(c.nombre) + " · " + c.depto + "</option>";
    }).join("");
  }

  function pintarSaldo() {
    var id = q("#colaborador").value;
    q("#saldo-info").textContent = "Saldo disponible para cobro electrónico: " + CD.money(saldo(id));
  }

  function pintarCarrito() {
    var lista = q("#carrito");
    lista.innerHTML = carrito.map(function (i) {
      return "<li>" +
        '<span class="crece"><b>' + CD.esc(i.nombre) + "</b><small>" + CD.money(i.precio) + " c/u</small></span>" +
        '<button class="btn btn--sm" type="button" data-menos="' + i.id + '" aria-label="Quitar uno">−</button>' +
        '<span class="mono">' + i.cant + "</span>" +
        '<button class="btn btn--sm" type="button" data-mas="' + i.id + '" aria-label="Agregar uno">+</button>' +
        '<b class="mono">' + CD.money(i.precio * i.cant) + "</b></li>";
    }).join("");
    q("#carrito-vacio").hidden = carrito.length > 0;
    q("#conteo-carrito").textContent = carrito.reduce(function (a, i) { return a + i.cant; }, 0) + " ítems";
    q("#total").textContent = CD.money(totalCarrito());
  }

  function agregar(id, delta) {
    var prod = MENU.filter(function (p) { return p.id === id; })[0];
    var linea = carrito.filter(function (i) { return i.id === id; })[0];
    if (!linea) {
      if (delta < 0) return;
      carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cant: 1 });
    } else {
      linea.cant += delta;
      if (linea.cant <= 0) carrito = carrito.filter(function (i) { return i.id !== id; });
    }
    pintarCarrito();
  }

  function confirmar() {
    var idCol = q("#colaborador").value;
    var pago = q("#pago").value;
    var total = totalCarrito();

    if (!carrito.length) { CD.toast("Agrega al menos un producto al carrito."); return; }
    if (pago === "electronico" && total > saldo(idCol)) {
      CD.toast("Saldo insuficiente (" + CD.money(saldo(idCol)) + "). Usa descuento por planilla.");
      return;
    }

    estado.ordenes.unshift({
      id: CD.id("ORD"),
      colaboradorId: idCol,
      items: carrito.slice(),
      total: total,
      pago: pago,
      estado: FLUJO[0],
      fecha: new Date().toISOString()
    });
    guardar();
    carrito = [];
    pintarCarrito();
    pintarSaldo();
    pintarOrdenes();
    pintarRRHH();
    CD.toast("Orden enviada a la cafetería por " + CD.money(total) + ".");
  }

  /* ------------------------------ proveedor ------------------------------ */
  function claseEstado(e) {
    if (e === "Entregada") return "estado--ok";
    if (e === "Lista") return "estado--info";
    if (e === "En preparación") return "estado--warn";
    return "estado--neutro";
  }

  function pintarOrdenes() {
    var lista = q("#ordenes");
    lista.innerHTML = estado.ordenes.map(function (o) {
      var c = colaborador(o.colaboradorId);
      var detalle = o.items.map(function (i) { return i.cant + "× " + i.nombre; }).join(", ");
      var final = o.estado === "Entregada";
      return "<li>" +
        '<span class="crece"><b>' + o.id + " · " + CD.esc(c.nombre) + "</b>" +
          "<small>" + CD.esc(detalle) + "</small>" +
          "<small>" + (o.pago === "electronico" ? "Cobro electrónico" : "Descuento por planilla") +
          " · " + CD.money(o.total) + "</small></span>" +
        '<span class="estado ' + claseEstado(o.estado) + '">' + o.estado + "</span>" +
        (final ? "" : '<button class="btn btn--sm" type="button" data-avanzar="' + o.id + '">Avanzar →</button>') +
        "</li>";
    }).join("");
    q("#ordenes-vacio").hidden = estado.ordenes.length > 0;
    q("#conteo-ordenes").textContent = estado.ordenes.length + " en el periodo";
  }

  function avanzar(id) {
    var o = estado.ordenes.filter(function (x) { return x.id === id; })[0];
    var i = FLUJO.indexOf(o.estado);
    if (i < FLUJO.length - 1) o.estado = FLUJO[i + 1];
    guardar();
    pintarOrdenes();
    CD.toast(o.id + " → " + o.estado);
  }

  /* --------------------------------- RRHH -------------------------------- */
  function resumen() {
    return COLABORADORES.map(function (c) {
      var suyas = estado.ordenes.filter(function (o) { return o.colaboradorId === c.id; });
      var elec = suyas.reduce(function (a, o) { return a + (o.pago === "electronico" ? o.total : 0); }, 0);
      var plan = suyas.reduce(function (a, o) { return a + (o.pago === "planilla" ? o.total : 0); }, 0);
      return { col: c, ordenes: suyas.length, elec: elec, plan: plan, total: elec + plan };
    });
  }

  function pintarRRHH() {
    var filas = resumen();
    var totalGeneral = filas.reduce(function (a, f) { return a + f.total; }, 0);
    var totalPlanilla = filas.reduce(function (a, f) { return a + f.plan; }, 0);
    var nOrdenes = estado.ordenes.length;

    q("#kpi-ordenes").textContent = nOrdenes;
    q("#kpi-total").textContent = CD.money(totalGeneral);
    q("#kpi-ticket").textContent = CD.money(nOrdenes ? totalGeneral / nOrdenes : 0);
    q("#kpi-planilla").textContent = CD.money(totalPlanilla);

    q("#tabla-rrhh").innerHTML = filas.map(function (f) {
      return "<tr><td><b>" + CD.esc(f.col.nombre) + "</b><br><small class='muted mono'>" + f.col.id + "</small></td>" +
        "<td>" + f.col.depto + "</td>" +
        '<td class="num">' + f.ordenes + "</td>" +
        '<td class="num">' + CD.money(f.elec) + "</td>" +
        '<td class="num">' + CD.money(f.plan) + "</td>" +
        '<td class="num"><b>' + CD.money(f.total) + "</b></td></tr>";
    }).join("");
  }

  function exportar() {
    var filas = [["Codigo", "Colaborador", "Departamento", "Ordenes", "Cobro electronico", "Descuento planilla", "Total"]];
    resumen().forEach(function (f) {
      filas.push([f.col.id, f.col.nombre, f.col.depto, f.ordenes, f.elec.toFixed(2), f.plan.toFixed(2), f.total.toFixed(2)]);
    });
    CD.csv("planilla-cafeteria.csv", filas);
    CD.toast("Archivo de planilla generado.");
  }

  function cerrarPeriodo() {
    if (!estado.ordenes.length) { CD.toast("No hay órdenes en el periodo."); return; }
    var pendientes = estado.ordenes.filter(function (o) { return o.estado !== "Entregada"; }).length;
    if (pendientes) { CD.toast("Hay " + pendientes + " orden(es) sin entregar. Ciérralas primero."); return; }
    estado = { ordenes: [] };
    guardar();
    pintarOrdenes();
    pintarRRHH();
    pintarSaldo();
    CD.toast("Periodo cerrado: consumos enviados a planilla y saldos liberados.");
  }

  /* -------------------------------- vistas ------------------------------- */
  function vista(nombre) {
    qa("[data-vista]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.vista === nombre)); });
    qa("[data-panel]").forEach(function (p) { p.hidden = p.dataset.panel !== nombre; });
  }

  /* --------------------------------- init -------------------------------- */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-add],[data-mas],[data-menos],[data-avanzar],[data-vista]");
    if (!t) return;
    if (t.dataset.add) agregar(t.dataset.add, 1);
    else if (t.dataset.mas) agregar(t.dataset.mas, 1);
    else if (t.dataset.menos) agregar(t.dataset.menos, -1);
    else if (t.dataset.avanzar) avanzar(t.dataset.avanzar);
    else if (t.dataset.vista) vista(t.dataset.vista);
  });

  q("#confirmar").addEventListener("click", confirmar);
  q("#colaborador").addEventListener("change", pintarSaldo);
  q("#exportar").addEventListener("click", exportar);
  q("#cerrar-periodo").addEventListener("click", cerrarPeriodo);

  q("#fecha-hoy").textContent = CD.fecha();
  pintarMenu();
  pintarColaboradores();
  pintarSaldo();
  pintarCarrito();
  pintarOrdenes();
  pintarRRHH();
})();
