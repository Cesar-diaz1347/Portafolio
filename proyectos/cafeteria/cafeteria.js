/* cafeteria.js — Demo: automatización de la cafetería institucional.
   Réplica del portal de reservas (Inicio · Mis reservas · Reservar almuerzo)
   más los dos módulos operativos: app del proveedor y panel de RRHH. */
(function () {
  "use strict";

  var q = CD.q, qa = CD.qa;

  var COLABORADORES = [
    { id: "COL-1001", nombre: "María García", ini: "MG", depto: "Operaciones", saldoInicial: 260 },
    { id: "COL-1042", nombre: "Ana Morales", ini: "AM", depto: "Operaciones", saldoInicial: 250 },
    { id: "COL-1187", nombre: "Luis Batres", ini: "LB", depto: "Tecnología", saldoInicial: 180 },
    { id: "COL-1230", nombre: "Karla Estrada", ini: "KE", depto: "Riesgos", saldoInicial: 90 },
    { id: "COL-1355", nombre: "Diego Pérez", ini: "DP", depto: "Tesorería", saldoInicial: 40 },
    { id: "COL-1401", nombre: "Sofía Ruano", ini: "SR", depto: "RRHH", saldoInicial: 300 }
  ];

  /* Los cuatro menús del día son los mismos para toda la sucursal: cambia el
     plato fuerte, los acompañamientos son fijos. */
  var GUARNICION = "Crema de pollo, arroz verde, papas al cilantro, guicoyitos en finas hierbas a la plancha, " +
    "ensalada de lechuga y zanahoria o ensalada griega, refresco de sandía y papaya o refresco de naranja, " +
    "postre: pastel de chocolate, melón o piña.";

  var MENUS = [
    { id: 1, nombre: "Menú 1", plato: "Tacos rellenos de carne de res", precio: 38 },
    { id: 2, nombre: "Menú 2", plato: "Filete de pescado empanizado", precio: 45 },
    { id: 3, nombre: "Menú 3", plato: "Burrito de pollo con salsa de aguacate", precio: 35 },
    { id: 4, nombre: "Menú 4", plato: "Fajitas de res con vegetales chinos (Dieta)", precio: 42 }
  ];

  var SUCURSALES = ["Torre Internacional", "Torre Norte", "Campus Sur"];
  var HORARIO = "12:00 p.m. a 2:30 p.m.";
  var FLUJO = ["Recibida", "En preparación", "Lista", "Entregada"];
  var DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  var PASOS = [
    ["Sucursal", "Lugar de entrega"],
    ["Fecha", "Día de tu almuerzo"],
    ["Menú", "Tu menú favorito"],
    ["Confirmar", "Revisa y confirma"]
  ];

  /* ------------------------------- fechas -------------------------------- */
  var HOY = new Date();
  HOY.setHours(0, 0, 0, 0);

  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  /* new Date("2026-08-24") se interpreta como UTC y se corre un día en
     Guatemala; se arma la fecha en horario local a partir de sus partes. */
  function desdeIso(s) {
    var p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function fmt(s) { return CD.fecha(desdeIso(s)); }

  /* Lunes de la semana en curso; en fin de semana salta a la siguiente. */
  function lunes() {
    var d = new Date(HOY), dow = d.getDay();
    d.setDate(d.getDate() + (dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow));
    return d;
  }

  function semanaLaboral() {
    var l = lunes();
    return DIAS.map(function (nombre, i) {
      var d = new Date(l);
      d.setDate(l.getDate() + i);
      return { dia: nombre, fecha: iso(d) };
    });
  }

  function celdasMes(anio, mes) {
    var inicio = new Date(anio, mes, 1).getDay();
    inicio = inicio === 0 ? 6 : inicio - 1;
    var total = new Date(anio, mes + 1, 0).getDate(), celdas = [], i;
    for (i = 0; i < inicio; i++) celdas.push(null);
    for (i = 1; i <= total; i++) celdas.push(i);
    return celdas;
  }

  /* ------------------------------- estado -------------------------------- */
  var almacen = CD.store("cafeteria-v2", { reservas: null });
  var estado = almacen.leer();
  var usuario = COLABORADORES[0];
  var seleccion = null;
  var seleccionado = iso(HOY);
  var cal = { anio: HOY.getFullYear(), mes: HOY.getMonth() };
  var ultimoFoco = null;

  function guardar() { almacen.guardar(estado); }

  function colaborador(id) { return COLABORADORES.filter(function (c) { return c.id === id; })[0]; }
  function menu(id) { return MENUS.filter(function (m) { return m.id === id; })[0]; }
  function reserva(id) { return estado.reservas.filter(function (r) { return r.id === id; })[0]; }

  function reservaDe(colId, fecha) {
    return estado.reservas.filter(function (r) {
      return r.colaboradorId === colId && r.fecha === fecha;
    })[0];
  }

  function etiquetaPago(p) { return p === "electronico" ? "Cobro electrónico" : "Descuento por planilla"; }

  /* Saldo disponible = saldo inicial menos lo cobrado electrónicamente. */
  function saldo(id) {
    var gastado = estado.reservas.reduce(function (acc, r) {
      return acc + (r.colaboradorId === id && r.pago === "electronico" ? menu(r.menuId).precio : 0);
    }, 0);
    return colaborador(id).saldoInicial - gastado;
  }

  /* Precarga de la primera visita: sin ella el portal se ve vacío al entrar. */
  function sembrar() {
    var semana = semanaLaboral();
    return [
      [0, 0, 2, "electronico", 3], [0, 1, 1, "planilla", 2], [0, 3, 4, "electronico", 0],
      [1, 0, 3, "planilla", 3], [2, 1, 1, "electronico", 1], [4, 2, 4, "planilla", 0]
    ].map(function (s) {
      return {
        id: CD.id("RES"),
        colaboradorId: COLABORADORES[s[0]].id,
        fecha: semana[s[1]].fecha,
        menuId: s[2],
        sucursal: SUCURSALES[0],
        pago: s[3],
        estado: FLUJO[s[4]],
        creada: new Date().toISOString()
      };
    });
  }

  if (!estado || !estado.reservas) {
    estado = { reservas: sembrar() };
    guardar();
  }

  /* ------------------------------ encabezado ------------------------------ */
  function pintarUsuario() {
    q("#usuario-iniciales").textContent = usuario.ini;
    q("#usuario-nombre").textContent = usuario.nombre;
    q("#saludo").textContent = "¡Hola, " + usuario.nombre.split(" ")[0] + "!";
    q("#usuario-menu").innerHTML = COLABORADORES.map(function (c) {
      return '<button type="button" role="menuitem" data-colaborador="' + c.id +
        '" aria-current="' + (c.id === usuario.id) + '">' + CD.esc(c.nombre) +
        "<small>" + c.depto + " · saldo " + CD.money(saldo(c.id)) + "</small></button>";
    }).join("");
  }

  function menuUsuario(abrir) {
    q("#usuario-menu").hidden = !abrir;
    q("#usuario-btn").setAttribute("aria-expanded", String(abrir));
  }

  /* -------------------------------- inicio -------------------------------- */
  function pintarSemana() {
    var semana = semanaLaboral();
    q("#semana-rango").textContent = fmt(semana[0].fecha) + " – " + fmt(semana[4].fecha);
    q("#semana").innerHTML = semana.map(function (d) {
      var r = reservaDe(usuario.id, d.fecha);
      var dia = desdeIso(d.fecha);
      return '<div class="dia-card' + (r ? " dia-card--ok" : "") + '">' +
        '<div class="dia-card__top">' +
          "<b>" + d.dia + "<small>" + dia.getDate() + " de " + MESES[dia.getMonth()] + "</small></b>" +
          '<span class="estado ' + (r ? "estado--ok" : "estado--neutro") + '">' +
            (r ? "✓ Reservado" : "Sin reserva") + "</span>" +
        "</div><p>" + (r ? CD.esc(menu(r.menuId).plato) : "") + "</p></div>";
    }).join("");
  }

  /* ------------------------------- reservar ------------------------------- */
  function pintarPasos(activo) {
    q("#pasos").innerHTML = PASOS.map(function (p, i) {
      return '<div class="paso-item" data-on="' + (i + 1 <= activo ? 1 : 0) + '">' +
        '<span class="paso-n">' + (i + 1) + "</span>" +
        "<div><b>" + p[0] + "</b><small>" + p[1] + "</small></div></div>" +
        (i < PASOS.length - 1 ? '<span class="paso-linea"></span>' : "");
    }).join("");
  }

  function pintarMenus() {
    q("#menus-sub").textContent = "Entrega en " + q("#sucursal").value;
    q("#menus").innerHTML = MENUS.map(function (m) {
      var sel = seleccion === m.id;
      return '<div class="menu-card" data-sel="' + (sel ? 1 : 0) + '">' +
        '<div class="menu-card__top">' +
          "<div><small>" + m.nombre + "</small><b>" + CD.esc(m.plato) + "</b></div>" +
          '<span class="menu-card__radio"></span>' +
        "</div><p>" + GUARNICION + "</p>" +
        '<span class="precio">' + CD.money(m.precio) + "</span>" +
        '<button class="btn btn--sm' + (sel ? "" : " btn--primario") + '" type="button" data-menu="' + m.id +
        '" style="justify-content:center">' + (sel ? "Menú seleccionado" : "Seleccionar menú") + "</button></div>";
    }).join("");

    var m = seleccion ? menu(seleccion) : null;
    q("#resumen").innerHTML = m
      ? '<div class="resumen-ok"><div><b>✓ Menú seleccionado</b><small>' +
        m.nombre + ": " + CD.esc(m.plato) + " · " + CD.money(m.precio) + "</small></div>" +
        '<button class="btn btn--sm" type="button" data-menu="0">Cambiar menú</button></div>'
      : "";
    q("#reservar").disabled = !m;
    pintarPasos(m ? 3 : 2);
  }

  /* Primer día laboral de la semana que el colaborador aún no tiene reservado. */
  function fechaSugerida() {
    var semana = semanaLaboral();
    var libre = semana.filter(function (d) { return !reservaDe(usuario.id, d.fecha); })[0];
    return (libre || semana[0]).fecha;
  }

  function pedirConfirmacion() {
    var fecha = q("#fecha").value;
    var m = menu(seleccion);

    if (!fecha) { CD.toast("Elige la fecha del almuerzo."); return; }
    if (reservaDe(usuario.id, fecha)) {
      CD.toast(usuario.nombre.split(" ")[0] + " ya tiene una reserva para el " + fmt(fecha) + ".");
      return;
    }

    pintarPasos(4);
    abrirModal("Confirma tu reserva",
      '<div class="modal__datos">' +
        "<div><b>Colaborador:</b> <span>" + CD.esc(usuario.nombre) + "</span></div>" +
        "<div><b>Sucursal:</b> <span>" + q("#sucursal").value + "</span></div>" +
        "<div><b>Fecha:</b> <span>" + fmt(fecha) + "</span></div>" +
        "<div><b>Menú:</b> <span>" + m.nombre + " · " + CD.esc(m.plato) + "</span></div>" +
        "<div><b>Horario:</b> <span>" + HORARIO + "</span></div>" +
        "<div><b>Precio:</b> <span>" + CD.money(m.precio) + "</span></div>" +
      "</div>" +
      '<label class="campo"><span>Forma de cobro</span><select id="pago">' +
        '<option value="electronico">Cobro electrónico · saldo ' + CD.money(saldo(usuario.id)) + "</option>" +
        '<option value="planilla">Descuento por planilla</option>' +
      "</select></label>" +
      '<div class="modal__botones">' +
        '<button class="btn" type="button" data-cerrar="1">Volver</button>' +
        '<button class="btn btn--primario" type="button" id="confirmar">Confirmar reserva</button>' +
      "</div>");
  }

  function confirmar() {
    var fecha = q("#fecha").value;
    var pago = q("#pago").value;
    var m = menu(seleccion);

    if (pago === "electronico" && m.precio > saldo(usuario.id)) {
      CD.toast("Saldo insuficiente (" + CD.money(saldo(usuario.id)) + "). Usa descuento por planilla.");
      return;
    }

    estado.reservas.push({
      id: CD.id("RES"),
      colaboradorId: usuario.id,
      fecha: fecha,
      menuId: m.id,
      sucursal: q("#sucursal").value,
      pago: pago,
      estado: FLUJO[0],
      creada: new Date().toISOString()
    });
    guardar();

    seleccion = null;
    cerrarModal();
    seleccionado = fecha;
    cal.anio = desdeIso(fecha).getFullYear();
    cal.mes = desdeIso(fecha).getMonth();
    q("#fecha").value = fechaSugerida();
    pintarTodo();
    vista("inicio");
    CD.toast("Reserva confirmada para el " + fmt(fecha) + " · " + m.nombre + ".");
  }

  /* ----------------------------- mis reservas ----------------------------- */
  function pintarCalendario() {
    var hoy = iso(HOY);
    q("#cal-titulo").textContent = MESES[cal.mes] + " " + cal.anio;
    q("#cal-celdas").innerHTML = celdasMes(cal.anio, cal.mes).map(function (d) {
      if (!d) return "<span></span>";
      var f = cal.anio + "-" + String(cal.mes + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var sel = f === seleccionado;
      return "<span><button class=\"cal__dia\" type=\"button\" data-dia=\"" + f +
        "\" data-sel=\"" + (sel ? 1 : 0) + "\" data-hoy=\"" + (f === hoy ? 1 : 0) +
        "\" aria-label=\"" + fmt(f) + "\">" + d +
        (reservaDe(usuario.id, f) && !sel ? '<span class="cal__punto"></span>' : "") +
        "</button></span>";
    }).join("");
    pintarDetalle();
  }

  function pintarDetalle() {
    var r = reservaDe(usuario.id, seleccionado);
    var cabecera = '<h2 class="panel__titulo">Tu reserva del día <span class="contador">' +
      '<span class="estado ' + (r ? "estado--ok" : "estado--neutro") + '">' +
      (r ? "✓ Reservado" : "Sin reserva") + "</span></span></h2>";

    if (!r) {
      q("#detalle-dia").innerHTML = cabecera +
        '<p class="vacio">No hay una reserva registrada para el ' + fmt(seleccionado) + ".</p>";
      return;
    }

    var m = menu(r.menuId);
    q("#detalle-dia").innerHTML = cabecera +
      '<div class="detalle-fila"><span aria-hidden="true">📅</span><div><small>Fecha</small><b>' + fmt(r.fecha) + "</b></div></div>" +
      '<div class="detalle-fila"><span aria-hidden="true">🍽️</span><div><small>' + m.nombre + "</small><b>" + CD.esc(m.plato) + "</b></div></div>" +
      '<div class="sep"></div>' +
      '<div class="detalle-fila"><span aria-hidden="true">📍</span><div><small>Lugar de entrega</small><b>' + r.sucursal + "</b></div></div>" +
      '<div class="detalle-fila"><span aria-hidden="true">🕐</span><div><small>Horario de almuerzo</small><b>' + HORARIO + "</b></div></div>" +
      '<div class="detalle-fila"><span aria-hidden="true">💳</span><div><small>Forma de cobro</small><b>' +
        etiquetaPago(r.pago) + " · " + CD.money(m.precio) + "</b></div></div>" +
      '<div class="detalle-fila"><span aria-hidden="true">📦</span><div><small>Estado en cocina</small>' +
        '<span class="estado ' + claseEstado(r.estado) + '">' + r.estado + "</span></div></div>" +
      '<div class="modal__botones" style="margin-top:1rem">' +
        '<button class="btn btn--sm" type="button" data-detalle="' + r.id + '">👁 Ver detalle</button>' +
        '<button class="btn btn--sm" type="button" data-cancelar="' + r.id + '">🗑 Cancelar reserva</button>' +
      "</div>";
  }

  function verDetalle(id) {
    var r = reserva(id), m = menu(r.menuId);
    abrirModal("Detalle de la reserva",
      '<div class="modal__datos">' +
        "<div><b>Código:</b> <span class=\"mono\">" + r.id + "</span></div>" +
        "<div><b>Colaborador:</b> <span>" + CD.esc(colaborador(r.colaboradorId).nombre) + "</span></div>" +
        "<div><b>Fecha:</b> <span>" + fmt(r.fecha) + "</span></div>" +
        "<div><b>Menú:</b> <span>" + m.nombre + " · " + CD.esc(m.plato) + "</span></div>" +
        "<div><b>Lugar:</b> <span>" + r.sucursal + "</span></div>" +
        "<div><b>Horario:</b> <span>" + HORARIO + "</span></div>" +
        "<div><b>Cobro:</b> <span>" + etiquetaPago(r.pago) + " · " + CD.money(m.precio) + "</span></div>" +
        "<div><b>Estado:</b> <span>" + r.estado + "</span></div>" +
      "</div>" +
      '<button class="btn" type="button" data-cerrar="1" style="width:100%; justify-content:center">Cerrar</button>');
  }

  /* Solo se cancela mientras la cafetería no haya empezado a prepararla. */
  function cancelar(id) {
    var r = reserva(id);
    if (r.estado !== FLUJO[0]) {
      CD.toast("La cafetería ya la tomó (" + r.estado + "). Ya no se puede cancelar.");
      return;
    }
    estado.reservas = estado.reservas.filter(function (x) { return x.id !== id; });
    guardar();
    pintarTodo();
    CD.toast("Reserva del " + fmt(r.fecha) + " cancelada.");
  }

  /* ------------------------------- proveedor ------------------------------ */
  function claseEstado(e) {
    if (e === "Entregada") return "estado--ok";
    if (e === "Lista") return "estado--info";
    if (e === "En preparación") return "estado--warn";
    return "estado--neutro";
  }

  function pintarReservas() {
    var orden = estado.reservas.slice().sort(function (a, b) {
      return a.fecha === b.fecha ? (a.id < b.id ? -1 : 1) : (a.fecha < b.fecha ? -1 : 1);
    });
    q("#reservas").innerHTML = orden.map(function (r) {
      var c = colaborador(r.colaboradorId), m = menu(r.menuId);
      return "<li>" +
        '<span class="crece"><b>' + r.id + " · " + CD.esc(c.nombre) + "</b>" +
          "<small>" + m.nombre + ": " + CD.esc(m.plato) + "</small>" +
          "<small>" + fmt(r.fecha) + " · " + r.sucursal + " · " + etiquetaPago(r.pago) +
          " · " + CD.money(m.precio) + "</small></span>" +
        '<span class="estado ' + claseEstado(r.estado) + '">' + r.estado + "</span>" +
        (r.estado === FLUJO[FLUJO.length - 1] ? "" :
          '<button class="btn btn--sm" type="button" data-avanzar="' + r.id + '">Avanzar →</button>') +
        "</li>";
    }).join("");
    q("#reservas-vacio").hidden = estado.reservas.length > 0;
    q("#conteo-reservas").textContent = estado.reservas.length + " en el periodo";
  }

  function avanzar(id) {
    var r = reserva(id), i = FLUJO.indexOf(r.estado);
    if (i < FLUJO.length - 1) r.estado = FLUJO[i + 1];
    guardar();
    pintarReservas();
    pintarDetalle();
    CD.toast(r.id + " → " + r.estado);
  }

  /* --------------------------------- RRHH --------------------------------- */
  function resumen() {
    return COLABORADORES.map(function (c) {
      var suyas = estado.reservas.filter(function (r) { return r.colaboradorId === c.id; });
      var elec = suyas.reduce(function (a, r) { return a + (r.pago === "electronico" ? menu(r.menuId).precio : 0); }, 0);
      var plan = suyas.reduce(function (a, r) { return a + (r.pago === "planilla" ? menu(r.menuId).precio : 0); }, 0);
      return { col: c, reservas: suyas.length, elec: elec, plan: plan, total: elec + plan };
    });
  }

  function pintarRRHH() {
    var filas = resumen();
    var totalGeneral = filas.reduce(function (a, f) { return a + f.total; }, 0);
    var totalPlanilla = filas.reduce(function (a, f) { return a + f.plan; }, 0);
    var n = estado.reservas.length;

    q("#kpi-reservas").textContent = n;
    q("#kpi-total").textContent = CD.money(totalGeneral);
    q("#kpi-ticket").textContent = CD.money(n ? totalGeneral / n : 0);
    q("#kpi-planilla").textContent = CD.money(totalPlanilla);

    q("#tabla-rrhh").innerHTML = filas.map(function (f) {
      return "<tr><td><b>" + CD.esc(f.col.nombre) + "</b><br><small class='muted mono'>" + f.col.id + "</small></td>" +
        "<td>" + f.col.depto + "</td>" +
        '<td class="num">' + f.reservas + "</td>" +
        '<td class="num">' + CD.money(f.elec) + "</td>" +
        '<td class="num">' + CD.money(f.plan) + "</td>" +
        '<td class="num"><b>' + CD.money(f.total) + "</b></td></tr>";
    }).join("");
  }

  function exportar() {
    var filas = [["Codigo", "Colaborador", "Departamento", "Reservas", "Cobro electronico", "Descuento planilla", "Total"]];
    resumen().forEach(function (f) {
      filas.push([f.col.id, f.col.nombre, f.col.depto, f.reservas, f.elec.toFixed(2), f.plan.toFixed(2), f.total.toFixed(2)]);
    });
    CD.csv("planilla-cafeteria.csv", filas);
    CD.toast("Archivo de planilla generado.");
  }

  function cerrarPeriodo() {
    if (!estado.reservas.length) { CD.toast("No hay reservas en el periodo."); return; }
    var pendientes = estado.reservas.filter(function (r) { return r.estado !== FLUJO[FLUJO.length - 1]; }).length;
    if (pendientes) { CD.toast("Hay " + pendientes + " reserva(s) sin entregar. Ciérralas primero."); return; }
    estado = { reservas: [] };
    guardar();
    pintarTodo();
    CD.toast("Periodo cerrado: consumos enviados a planilla y saldos liberados.");
  }

  /* -------------------------------- modales ------------------------------- */
  function abrirModal(titulo, cuerpo) {
    ultimoFoco = document.activeElement;
    q("#modal-caja").innerHTML = '<h3 id="modal-titulo">' + titulo +
      '<button class="btn btn--sm" type="button" data-cerrar="1" aria-label="Cerrar">✕</button></h3>' + cuerpo;
    q("#modal").hidden = false;
    var primero = q("#modal-caja select") || q("#modal-caja .btn--primario") || q("#modal-caja [data-cerrar]");
    if (primero) primero.focus();
  }

  function cerrarModal() {
    if (q("#modal").hidden) return;
    q("#modal").hidden = true;
    q("#modal-caja").innerHTML = "";
    if (seleccion) pintarPasos(3);
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }

  /* -------------------------------- vistas -------------------------------- */
  function vista(nombre) {
    qa(".app__nav button").forEach(function (b) {
      b.setAttribute("aria-current", String(b.dataset.vista === nombre));
    });
    qa("[data-panel]").forEach(function (p) { p.hidden = p.dataset.panel !== nombre; });
  }

  function pintarTodo() {
    pintarUsuario();
    pintarSemana();
    pintarMenus();
    pintarCalendario();
    pintarReservas();
    pintarRRHH();
  }

  /* --------------------------------- init --------------------------------- */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest(
      "[data-vista],[data-menu],[data-dia],[data-mes],[data-avanzar],[data-detalle]," +
      "[data-cancelar],[data-colaborador],[data-cerrar],#usuario-btn,#reservar,#confirmar,#exportar,#cerrar-periodo"
    );

    if (!t || !t.closest(".app__usuario")) menuUsuario(false);
    if (!t) return;

    if (t.id === "usuario-btn") { menuUsuario(q("#usuario-menu").hidden); return; }
    if (t.dataset.colaborador) {
      usuario = colaborador(t.dataset.colaborador);
      seleccion = null;
      q("#fecha").value = fechaSugerida();
      menuUsuario(false);
      pintarTodo();
      CD.toast("Sesión de " + usuario.nombre + " · saldo " + CD.money(saldo(usuario.id)));
      return;
    }
    if (t.dataset.vista) { vista(t.dataset.vista); return; }
    if (t.dataset.menu !== undefined) { seleccion = Number(t.dataset.menu) || null; pintarMenus(); return; }
    if (t.dataset.dia) { seleccionado = t.dataset.dia; pintarCalendario(); return; }
    if (t.dataset.mes) {
      cal.mes += Number(t.dataset.mes);
      if (cal.mes < 0) { cal.mes = 11; cal.anio -= 1; }
      if (cal.mes > 11) { cal.mes = 0; cal.anio += 1; }
      pintarCalendario();
      return;
    }
    if (t.dataset.avanzar) { avanzar(t.dataset.avanzar); return; }
    if (t.dataset.detalle) { verDetalle(t.dataset.detalle); return; }
    if (t.dataset.cancelar) { cancelar(t.dataset.cancelar); return; }
    if (t.dataset.cerrar) { cerrarModal(); return; }
    if (t.id === "reservar") { pedirConfirmacion(); return; }
    if (t.id === "confirmar") { confirmar(); return; }
    if (t.id === "exportar") { exportar(); return; }
    if (t.id === "cerrar-periodo") { cerrarPeriodo(); return; }
  });

  q("#modal").addEventListener("click", function (ev) {
    if (ev.target.id === "modal") cerrarModal();
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    cerrarModal();
    menuUsuario(false);
  });

  q("#sucursal").innerHTML = SUCURSALES.map(function (s) { return "<option>" + s + "</option>"; }).join("");
  q("#sucursal").addEventListener("change", pintarMenus);

  q("#fecha").min = iso(HOY);
  q("#fecha").value = fechaSugerida();

  pintarTodo();
})();
