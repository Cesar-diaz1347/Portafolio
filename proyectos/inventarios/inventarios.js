/* inventarios.js — Demo: traslado de inventarios inter-sucursales.
   Valida existencias, mantiene la mercadería en tránsito y registra el kardex. */
(function () {
  "use strict";

  var q = CD.q;

  var SUCURSALES = ["Central", "Zona 4", "Mixco", "Quetzaltenango"];
  var PRODUCTOS = [
    { id: "SKU-100", nombre: "Refrigeradora 12 pies", minimo: 3 },
    { id: "SKU-210", nombre: "Televisor 55\"", minimo: 4 },
    { id: "SKU-315", nombre: "Lavadora 20 lb", minimo: 3 },
    { id: "SKU-420", nombre: "Estufa 4 hornillas", minimo: 5 },
    { id: "SKU-530", nombre: "Microondas 0.7", minimo: 6 }
  ];

  function inventarioInicial() {
    var stock = {};
    PRODUCTOS.forEach(function (p, i) {
      stock[p.id] = {};
      SUCURSALES.forEach(function (s, j) {
        stock[p.id][s] = 4 + ((i * 3 + j * 5) % 12);
      });
    });
    return stock;
  }

  var almacen = CD.store("inventarios", { stock: inventarioInicial(), traslados: [], kardex: [], correlativo: 1 });
  var estado = almacen.leer();

  function guardar() { almacen.guardar(estado); }

  function producto(id) { return PRODUCTOS.filter(function (p) { return p.id === id; })[0]; }

  function enTransito() {
    return estado.traslados
      .filter(function (t) { return t.estado === "En tránsito"; })
      .reduce(function (a, t) { return a + t.cantidad; }, 0);
  }

  function totalRed() {
    var suma = 0;
    PRODUCTOS.forEach(function (p) {
      SUCURSALES.forEach(function (s) { suma += estado.stock[p.id][s]; });
    });
    return suma + enTransito();
  }

  function movimiento(doc, prodId, sucursal, tipo, cantidad) {
    estado.kardex.unshift({
      doc: doc,
      fecha: new Date().toISOString(),
      producto: prodId,
      sucursal: sucursal,
      tipo: tipo,
      cantidad: cantidad,
      saldo: estado.stock[prodId][sucursal]
    });
  }

  /* --------------------------------- render ------------------------------- */
  function pintarSelects() {
    var ops = SUCURSALES.map(function (s) { return "<option>" + s + "</option>"; }).join("");
    q("#origen").innerHTML = ops;
    q("#destino").innerHTML = ops;
    q("#destino").selectedIndex = 1;
    q("#producto").innerHTML = PRODUCTOS.map(function (p) {
      return '<option value="' + p.id + '">' + CD.esc(p.nombre) + " · " + p.id + "</option>";
    }).join("");
  }

  function pintarDisponible() {
    var d = estado.stock[q("#producto").value][q("#origen").value];
    q("#disponible").value = d + " unidades";
  }

  function pintarExistencias() {
    q("#cabecera-existencias").innerHTML = "<th>Producto</th>" +
      SUCURSALES.map(function (s) { return '<th class="num">' + s + "</th>"; }).join("") +
      '<th class="num">En tránsito</th><th class="num">Total</th>';

    var alertas = 0;
    q("#tabla-existencias").innerHTML = PRODUCTOS.map(function (p) {
      var transito = estado.traslados
        .filter(function (t) { return t.estado === "En tránsito" && t.producto === p.id; })
        .reduce(function (a, t) { return a + t.cantidad; }, 0);
      var total = transito;
      var celdas = SUCURSALES.map(function (s) {
        var v = estado.stock[p.id][s];
        total += v;
        var bajo = v < p.minimo;
        if (bajo) alertas++;
        return '<td class="num">' + (bajo ? '<span class="estado estado--warn">' + v + "</span>" : v) + "</td>";
      }).join("");
      return "<tr><td><b>" + CD.esc(p.nombre) + '</b><br><small class="muted mono">' + p.id +
        " · mín " + p.minimo + "</small></td>" + celdas +
        '<td class="num">' + (transito || "—") + "</td>" +
        '<td class="num"><b>' + total + "</b></td></tr>";
    }).join("");

    q("#kpi-minimos").textContent = alertas;
    q("#kpi-total").textContent = CD.num(totalRed());
    q("#kpi-transito").textContent = CD.num(enTransito());
    q("#kpi-traslados").textContent = estado.traslados.filter(function (t) { return t.estado === "En tránsito"; }).length;
  }

  function pintarTraslados() {
    q("#traslados").innerHTML = estado.traslados.map(function (t) {
      var p = producto(t.producto);
      var clase = t.estado === "Recibido" ? "estado--ok" : (t.estado === "Devuelto" ? "estado--err" : "estado--warn");
      var acciones = t.estado === "En tránsito"
        ? '<button class="btn btn--sm" type="button" data-recibir="' + t.id + '">✔ Recibir</button>' +
          '<button class="btn btn--sm" type="button" data-devolver="' + t.id + '">↩ Devolver</button>'
        : "";
      return "<li>" +
        '<span class="crece"><b>' + t.id + " · " + CD.esc(p.nombre) + "</b>" +
        "<small>" + t.cantidad + " u · " + t.origen + " → " + t.destino + " · " + CD.fecha(t.fecha) + "</small></span>" +
        '<span class="estado ' + clase + '">' + t.estado + "</span>" + acciones + "</li>";
    }).join("");
    q("#traslados-vacio").hidden = estado.traslados.length > 0;
    q("#conteo-traslados").textContent = estado.traslados.length;
  }

  function pintarKardex() {
    q("#tabla-kardex").innerHTML = estado.kardex.slice(0, 40).map(function (m) {
      var clase = m.tipo === "Entrada" ? "estado--ok" : "estado--err";
      return '<tr><td class="mono">' + m.doc + "</td>" +
        "<td>" + CD.fecha(m.fecha) + " " + CD.hora(new Date(m.fecha)) + "</td>" +
        "<td>" + CD.esc(producto(m.producto).nombre) + "</td>" +
        "<td>" + m.sucursal + "</td>" +
        '<td><span class="estado ' + clase + '">' + m.tipo + "</span></td>" +
        '<td class="num">' + (m.tipo === "Entrada" ? "+" : "−") + m.cantidad + "</td>" +
        '<td class="num">' + m.saldo + "</td></tr>";
    }).join("");
    q("#kardex-vacio").hidden = estado.kardex.length > 0;
  }

  function pintar() { pintarExistencias(); pintarTraslados(); pintarKardex(); pintarDisponible(); }

  /* -------------------------------- acciones ------------------------------ */
  function enviar() {
    var origen = q("#origen").value;
    var destino = q("#destino").value;
    var prodId = q("#producto").value;
    var cantidad = Math.floor(Number(q("#cantidad").value));
    var disponible = estado.stock[prodId][origen];

    if (origen === destino) { CD.toast("El origen y el destino no pueden ser la misma sucursal."); return; }
    if (!cantidad || cantidad < 1) { CD.toast("Ingresa una cantidad mayor a cero."); return; }
    if (cantidad > disponible) {
      CD.toast("Existencias insuficientes en " + origen + ": solo hay " + disponible + " unidades.");
      return;
    }

    var t = {
      id: "TRA-" + String(estado.correlativo++).padStart(4, "0"),
      fecha: new Date().toISOString(),
      origen: origen,
      destino: destino,
      producto: prodId,
      cantidad: cantidad,
      estado: "En tránsito"
    };
    estado.stock[prodId][origen] -= cantidad;
    movimiento(t.id, prodId, origen, "Salida", cantidad);
    estado.traslados.unshift(t);
    guardar();
    pintar();
    CD.toast(t.id + ": " + cantidad + " u salieron de " + origen + " hacia " + destino + ".");
  }

  function recibir(id) {
    var t = estado.traslados.filter(function (x) { return x.id === id; })[0];
    estado.stock[t.producto][t.destino] += t.cantidad;
    t.estado = "Recibido";
    movimiento(t.id, t.producto, t.destino, "Entrada", t.cantidad);
    guardar();
    pintar();
    CD.toast(t.id + " recibido en " + t.destino + ".");
  }

  function devolver(id) {
    var t = estado.traslados.filter(function (x) { return x.id === id; })[0];
    estado.stock[t.producto][t.origen] += t.cantidad;
    t.estado = "Devuelto";
    movimiento(t.id, t.producto, t.origen, "Entrada", t.cantidad);
    guardar();
    pintar();
    CD.toast(t.id + " devuelto a " + t.origen + ".");
  }

  function exportar() {
    if (!estado.kardex.length) { CD.toast("El kardex está vacío."); return; }
    var filas = [["Documento", "Fecha", "Producto", "SKU", "Sucursal", "Movimiento", "Cantidad", "Saldo"]];
    estado.kardex.forEach(function (m) {
      filas.push([m.doc, CD.fecha(m.fecha) + " " + CD.hora(new Date(m.fecha)), producto(m.producto).nombre,
        m.producto, m.sucursal, m.tipo, m.cantidad, m.saldo]);
    });
    CD.csv("kardex-traslados.csv", filas);
  }

  /* ---------------------------------- init -------------------------------- */
  pintarSelects();
  q("#enviar").addEventListener("click", enviar);
  q("#exportar").addEventListener("click", exportar);
  q("#origen").addEventListener("change", pintarDisponible);
  q("#producto").addEventListener("change", pintarDisponible);
  q("#reiniciar").addEventListener("click", function () {
    estado = { stock: inventarioInicial(), traslados: [], kardex: [], correlativo: 1 };
    guardar();
    pintar();
    CD.toast("Inventario restablecido a los valores iniciales.");
  });

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-recibir],[data-devolver]");
    if (!t) return;
    if (t.dataset.recibir) recibir(t.dataset.recibir);
    else devolver(t.dataset.devolver);
  });

  pintar();
})();
