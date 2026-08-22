/* embozado.js — Demo: sistema de embozado de tarjetas de crédito.
   Valida la solicitud, arma el lote para la embozadora y controla estados. */
(function () {
  "use strict";

  var q = CD.q;

  var PRODUCTOS = {
    "visa-clasica": { nombre: "Visa Clásica", bin: "4", franquicia: "VISA" },
    "visa-oro": { nombre: "Visa Oro", bin: "4", franquicia: "VISA" },
    "mc-platino": { nombre: "Mastercard Platino", bin: "5", franquicia: "MC" }
  };

  var NOMBRES = ["ANA MORALES", "LUIS BATRES", "KARLA ESTRADA", "DIEGO PEREZ", "SOFIA RUANO",
                 "MARIO CASTILLO", "LUCIA HERRERA", "JOSE ARRIAGA"];

  var FLUJO = ["En lote", "Embozada", "Entregada"];

  var almacen = CD.store("embozado", { solicitudes: [], lotes: [], correlativo: 1 });
  var estado = almacen.leer();

  function guardar() { almacen.guardar(estado); }

  /* ------------------------- validaciones del plástico -------------------- */
  function soloDigitos(txt) { return String(txt).replace(/[^0-9]/g, ""); }

  function luhn(numero) {
    var n = soloDigitos(numero);
    if (n.length !== 16) return false;
    var suma = 0;
    for (var i = 0; i < n.length; i++) {
      var d = Number(n[n.length - 1 - i]);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      suma += d;
    }
    return suma % 10 === 0;
  }

  function generarNumero(bin) {
    var base = bin;
    while (base.length < 15) base += Math.floor(Math.random() * 10);
    var suma = 0;
    for (var i = 0; i < base.length; i++) {
      var d = Number(base[base.length - 1 - i]);
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      suma += d;
    }
    return base + String((10 - (suma % 10)) % 10);
  }

  function vencimientoValido(txt) {
    var m = /^(\d{2})\/(\d{2})$/.exec(String(txt).trim());
    if (!m) return null;
    var mes = Number(m[1]), anio = 2000 + Number(m[2]);
    if (mes < 1 || mes > 12) return null;
    var fin = new Date(anio, mes, 0, 23, 59, 59);
    return fin > new Date() ? m[1] + "/" + m[2] : null;
  }

  function validar(sol) {
    var prod = PRODUCTOS[sol.producto];
    if (!sol.titular || sol.titular.trim().length < 5) return "Titular vacío o demasiado corto";
    if (sol.titular.length > 26) return "El titular excede los 26 caracteres de la embozadora";
    if (soloDigitos(sol.numero).length !== 16) return "El número debe tener 16 dígitos";
    if (soloDigitos(sol.numero)[0] !== prod.bin) return "El BIN no corresponde a " + prod.nombre;
    if (!luhn(sol.numero)) return "Dígito verificador inválido (Luhn)";
    if (!vencimientoValido(sol.vencimiento)) return "Vencimiento inválido o ya expirado";
    return null;
  }

  function enmascarar(numero) {
    var n = soloDigitos(numero);
    return n.slice(0, 4) + " •••• •••• " + n.slice(-4);
  }

  /* --------------------------------- render ------------------------------- */
  function claseEstado(e) {
    if (e === "Rechazada") return "estado--err";
    if (e === "Válida") return "estado--info";
    if (e === "Entregada") return "estado--ok";
    if (e === "Embozada") return "estado--ok";
    return "estado--warn";
  }

  function pintarSolicitudes() {
    var filas = estado.solicitudes.map(function (s) {
      return "<tr>" +
        '<td class="mono">' + s.id + "</td>" +
        "<td>" + CD.esc(s.titular) + "</td>" +
        "<td>" + PRODUCTOS[s.producto].nombre + "</td>" +
        '<td class="mono">' + enmascarar(s.numero) + "</td>" +
        '<td class="mono">' + CD.esc(s.vencimiento) + "</td>" +
        '<td><span class="estado ' + claseEstado(s.estado) + '">' + s.estado + "</span></td>" +
        '<td class="muted">' + CD.esc(s.motivo || (s.lote ? "Lote " + s.lote : "—")) + "</td></tr>";
    }).join("");
    q("#tabla-solicitudes").innerHTML = filas;
    q("#solicitudes-vacio").hidden = estado.solicitudes.length > 0;

    var cuenta = function (e) { return estado.solicitudes.filter(function (s) { return s.estado === e; }).length; };
    q("#kpi-pendientes").textContent = estado.solicitudes.length;
    q("#kpi-validas").textContent = cuenta("Válida");
    q("#kpi-rechazadas").textContent = cuenta("Rechazada");
    q("#kpi-lotes").textContent = estado.lotes.length;
  }

  function pintarLotes() {
    q("#lotes").innerHTML = estado.lotes.map(function (l) {
      var final = l.estado === "Entregada";
      return "<li>" +
        '<span class="crece"><b>' + l.id + "</b><small>" + l.tarjetas.length + " tarjetas · " +
          CD.fecha(l.fecha) + "</small></span>" +
        '<span class="estado ' + claseEstado(l.estado) + '">' + l.estado + "</span>" +
        '<button class="btn btn--sm" type="button" data-csv="' + l.id + '">⬇ CSV</button>' +
        (final ? "" : '<button class="btn btn--sm" type="button" data-lote="' + l.id + '">Avanzar →</button>') +
        "</li>";
    }).join("");
    q("#lotes-vacio").hidden = estado.lotes.length > 0;
    q("#conteo-lotes").textContent = estado.lotes.length;
  }

  function pintar() { pintarSolicitudes(); pintarLotes(); }

  /* --------------------------------- acciones ----------------------------- */
  function crear(datos) {
    var sol = {
      id: "SOL-" + String(estado.correlativo++).padStart(4, "0"),
      titular: datos.titular.toUpperCase(),
      producto: datos.producto,
      numero: soloDigitos(datos.numero),
      vencimiento: datos.vencimiento,
      estado: "Válida",
      motivo: "",
      lote: null
    };
    var error = validar(sol);
    if (error) {
      sol.estado = "Rechazada";
      sol.motivo = error;
      CD.log("#bitacora", sol.id + " rechazada: " + error, "err");
    } else {
      CD.log("#bitacora", sol.id + " validada (" + PRODUCTOS[sol.producto].franquicia + " " + enmascarar(sol.numero) + ")", "ok");
    }
    estado.solicitudes.unshift(sol);
    guardar();
    pintar();
    return sol;
  }

  function leerFormulario() {
    return {
      titular: q("#titular").value,
      producto: q("#producto").value,
      numero: q("#numero").value,
      vencimiento: q("#vencimiento").value
    };
  }

  function limpiarFormulario() {
    q("#titular").value = "";
    q("#numero").value = "";
    q("#vencimiento").value = "";
  }

  function generarLote() {
    var validas = estado.solicitudes.filter(function (s) { return s.estado === "Válida"; });
    if (!validas.length) {
      CD.toast("No hay solicitudes válidas en la cola.");
      CD.log("#bitacora", "Intento de generar lote sin solicitudes válidas", "warn");
      return;
    }
    var lote = {
      id: "LOTE-" + String(estado.lotes.length + 1).padStart(3, "0"),
      fecha: new Date().toISOString(),
      estado: FLUJO[0],
      tarjetas: validas.map(function (s) { return s.id; })
    };
    validas.forEach(function (s) { s.estado = "En lote"; s.lote = lote.id; });
    estado.lotes.unshift(lote);
    guardar();
    pintar();
    CD.log("#bitacora", lote.id + " generado con " + lote.tarjetas.length + " tarjetas", "info");
    CD.toast(lote.id + " enviado a la embozadora (" + lote.tarjetas.length + " tarjetas).");
  }

  function avanzarLote(id) {
    var lote = estado.lotes.filter(function (l) { return l.id === id; })[0];
    var i = FLUJO.indexOf(lote.estado);
    if (i < FLUJO.length - 1) lote.estado = FLUJO[i + 1];
    estado.solicitudes.forEach(function (s) { if (s.lote === lote.id) s.estado = lote.estado; });
    guardar();
    pintar();
    CD.log("#bitacora", lote.id + " → " + lote.estado, "ok");
  }

  function exportarLote(id) {
    var lote = estado.lotes.filter(function (l) { return l.id === id; })[0];
    var filas = [["Lote", "Solicitud", "Titular", "Producto", "Tarjeta (enmascarada)", "Vence", "Estado"]];
    lote.tarjetas.forEach(function (sid) {
      var s = estado.solicitudes.filter(function (x) { return x.id === sid; })[0];
      filas.push([lote.id, s.id, s.titular, PRODUCTOS[s.producto].nombre, enmascarar(s.numero), s.vencimiento, s.estado]);
    });
    CD.csv(lote.id + ".csv", filas);
    CD.log("#bitacora", "Archivo " + lote.id + ".csv exportado para el proveedor", "info");
  }

  function autogenerar(conError) {
    var claves = Object.keys(PRODUCTOS);
    var prodKey = claves[Math.floor(Math.random() * claves.length)];
    var prod = PRODUCTOS[prodKey];
    var nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
    var anio = new Date().getFullYear() + 3;
    var datos = {
      titular: nombre,
      producto: prodKey,
      numero: generarNumero(prod.bin),
      vencimiento: String(Math.floor(Math.random() * 12) + 1).padStart(2, "0") + "/" + String(anio).slice(2)
    };
    if (conError) {
      var fallas = [
        function () { datos.numero = datos.numero.slice(0, 15) + ((Number(datos.numero.slice(-1)) + 5) % 10); },
        function () { datos.numero = (prod.bin === "4" ? "5" : "4") + datos.numero.slice(1); },
        function () { datos.vencimiento = "03/22"; },
        function () { datos.titular = nombre + " DE LA CRUZ Y SANDOVAL MEJIA"; }
      ];
      fallas[Math.floor(Math.random() * fallas.length)]();
    }
    q("#titular").value = datos.titular;
    q("#producto").value = datos.producto;
    q("#numero").value = datos.numero.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    q("#vencimiento").value = datos.vencimiento;
    crear(datos);
    limpiarFormulario();
  }

  /* ---------------------------------- init -------------------------------- */
  q("#crear").addEventListener("click", function () { crear(leerFormulario()); limpiarFormulario(); });
  q("#autogenerar").addEventListener("click", function () { autogenerar(false); });
  q("#autogenerar-mala").addEventListener("click", function () { autogenerar(true); });
  q("#generar-lote").addEventListener("click", generarLote);
  q("#limpiar").addEventListener("click", function () {
    estado = { solicitudes: [], lotes: [], correlativo: 1 };
    guardar();
    pintar();
    q("#bitacora").innerHTML = "";
    CD.log("#bitacora", "Demo reiniciada", "warn");
  });

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-lote],[data-csv]");
    if (!t) return;
    if (t.dataset.lote) avanzarLote(t.dataset.lote);
    else exportarLote(t.dataset.csv);
  });

  CD.log("#bitacora", "Sistema de embozado listo. Esperando solicitudes.", "info");
  pintar();
})();
