/* sorteos.js — Demo: motor de sorteos diarios con selección auditable.
   Semilla registrada + tómbola ponderada por boletas + historial verificable. */
(function () {
  "use strict";

  var q = CD.q;

  var NOMBRES = ["Ana Morales", "Luis Batres", "Karla Estrada", "Diego Pérez", "Sofía Ruano",
    "Mario Castillo", "Lucía Herrera", "José Arriaga", "Elena Girón", "Pablo Solís",
    "Marta Chávez", "Óscar Ramírez", "Ingrid López", "Rodrigo Paz", "Silvia Marroquín",
    "Héctor Aguilar", "Nancy Fuentes", "Julio Barrios", "Rosa Melgar", "Alan Cifuentes",
    "Brenda Osorio", "Kevin Tobar", "Andrea Sandoval", "Erick Monzón"];

  /* Los participantes son fijos para que la verificación con semilla sea posible. */
  var PARTICIPANTES = NOMBRES.map(function (n, i) {
    return {
      id: "PART-" + String(i + 1).padStart(3, "0"),
      nombre: n,
      cuenta: "•••• " + String(1000 + ((i * 137) % 8999)),
      boletas: 1 + ((i * 7) % 5)
    };
  });

  var almacen = CD.store("sorteos", { historial: [] });
  var estado = almacen.leer();
  var animando = false;

  function guardar() { almacen.guardar(estado); }

  function ganadoresPrevios() {
    return estado.historial.map(function (h) { return h.participanteId; });
  }

  function elegibles(regla) {
    var previos = ganadoresPrevios();
    return PARTICIPANTES.filter(function (p) {
      if (regla === "sin-ganadores") return previos.indexOf(p.id) === -1;
      if (regla === "min-boletas") return p.boletas >= 3;
      return true;
    });
  }

  /* Tómbola ponderada: cada boleta es una entrada distinta. */
  function sortear(lista, semilla) {
    var tombola = [];
    lista.forEach(function (p) {
      for (var i = 0; i < p.boletas; i++) tombola.push(p);
    });
    var rng = CD.rngConSemilla(semilla);
    rng(); rng(); /* descarta los dos primeros valores para dispersar semillas contiguas */
    var idx = Math.floor(rng() * tombola.length);
    return { ganador: tombola[idx], boletas: tombola.length, indice: idx };
  }

  /* --------------------------------- render ------------------------------- */
  function pintarParticipantes() {
    var regla = q("#regla").value;
    var aptos = elegibles(regla);
    var idsAptos = aptos.map(function (p) { return p.id; });
    var previos = ganadoresPrevios();

    q("#tabla-participantes").innerHTML = PARTICIPANTES.map(function (p) {
      var apto = idsAptos.indexOf(p.id) !== -1;
      var yaGano = previos.indexOf(p.id) !== -1;
      var etiqueta = yaGano ? "Ya ganó" : (apto ? "Elegible" : "Excluido");
      var clase = yaGano ? "estado--ok" : (apto ? "estado--info" : "estado--neutro");
      return "<tr><td>" + CD.esc(p.nombre) + "</td>" +
        '<td class="mono muted">' + p.cuenta + "</td>" +
        '<td class="num">' + p.boletas + "</td>" +
        '<td><span class="estado ' + clase + '">' + etiqueta + "</span></td></tr>";
    }).join("");

    var totalBoletas = aptos.reduce(function (a, p) { return a + p.boletas; }, 0);
    q("#kpi-participantes").textContent = aptos.length;
    q("#kpi-boletas").textContent = totalBoletas;
    q("#kpi-sorteos").textContent = estado.historial.length;
    q("#kpi-ganadores").textContent = previos.filter(function (v, i) { return previos.indexOf(v) === i; }).length;
    q("#conteo-tombola").textContent = aptos.length + " elegibles";
  }

  function pintarHistorial() {
    q("#tabla-historial").innerHTML = estado.historial.map(function (h) {
      return "<tr>" +
        '<td class="mono">' + h.acta + "</td>" +
        "<td>" + CD.fecha(h.fecha) + " " + h.hora + "</td>" +
        "<td>" + CD.esc(h.campana) + "</td>" +
        "<td>" + CD.esc(h.premio) + "</td>" +
        "<td><b>" + CD.esc(h.ganador) + "</b></td>" +
        '<td class="num">' + h.semilla + "</td>" +
        '<td><button class="btn btn--sm" type="button" data-verificar="' + h.acta + '">🔍 Verificar</button></td></tr>';
    }).join("");
    q("#historial-vacio").hidden = estado.historial.length > 0;
  }

  /* -------------------------------- acciones ------------------------------ */
  function ejecutar() {
    if (animando) return;
    var regla = q("#regla").value;
    var aptos = elegibles(regla);
    var semilla = Number(q("#semilla").value) || 1;

    if (aptos.length < 2) {
      CD.toast("No quedan suficientes participantes elegibles. Cambia la regla o reinicia la demo.");
      return;
    }

    var resultado = sortear(aptos, semilla);
    var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function anunciar() {
      animando = false;
      var acta = "ACTA-" + String(estado.historial.length + 1).padStart(3, "0");
      var ahora = new Date();
      estado.historial.unshift({
        acta: acta,
        fecha: ahora.toISOString(),
        hora: CD.hora(ahora),
        campana: q("#campana").value,
        premio: q("#premio").value,
        ganador: resultado.ganador.nombre,
        participanteId: resultado.ganador.id,
        semilla: semilla,
        regla: regla,
        boletas: resultado.boletas
      });
      guardar();
      q("#ruleta").textContent = resultado.ganador.nombre;
      q("#ganador-detalle").innerHTML = "Cuenta " + resultado.ganador.cuenta + " · " +
        resultado.ganador.boletas + " boletas · boleta ganadora " +
        (resultado.indice + 1) + " de " + resultado.boletas + " · semilla " + semilla;
      pintarParticipantes();
      pintarHistorial();
      CD.toast("Ganador registrado en " + acta + ".");
    }

    if (reducido) { anunciar(); return; }

    animando = true;
    q("#ganador-detalle").textContent = "Girando la tómbola…";
    var i = 0;
    var timer = setInterval(function () {
      q("#ruleta").textContent = aptos[i % aptos.length].nombre;
      i += 3;
    }, 70);
    setTimeout(function () { clearInterval(timer); anunciar(); }, 1500);
  }

  /* Repite el sorteo con la semilla y la regla registradas en el acta. */
  function verificar(acta) {
    var h = estado.historial.filter(function (x) { return x.acta === acta; })[0];
    var previos = estado.historial
      .slice(estado.historial.indexOf(h) + 1)
      .map(function (x) { return x.participanteId; });
    var lista = PARTICIPANTES.filter(function (p) {
      if (h.regla === "sin-ganadores") return previos.indexOf(p.id) === -1;
      if (h.regla === "min-boletas") return p.boletas >= 3;
      return true;
    });
    var r = sortear(lista, h.semilla);
    var coincide = r.ganador.id === h.participanteId;
    CD.toast(coincide
      ? acta + " verificada: la semilla " + h.semilla + " reproduce a " + h.ganador + "."
      : acta + ": el resultado no se pudo reproducir.");
  }

  function exportar() {
    var filas = [["Acta", "Fecha", "Hora", "Campana", "Premio", "Ganador", "Cuenta", "Semilla", "Regla", "Boletas"]];
    estado.historial.forEach(function (h) {
      var p = PARTICIPANTES.filter(function (x) { return x.id === h.participanteId; })[0];
      filas.push([h.acta, CD.fecha(h.fecha), h.hora, h.campana, h.premio, h.ganador, p.cuenta, h.semilla, h.regla, h.boletas]);
    });
    if (filas.length === 1) { CD.toast("No hay sorteos que exportar."); return; }
    CD.csv("actas-sorteos.csv", filas);
  }

  /* ---------------------------------- init -------------------------------- */
  q("#ejecutar").addEventListener("click", ejecutar);
  q("#regla").addEventListener("change", pintarParticipantes);
  q("#exportar").addEventListener("click", exportar);
  q("#semilla-hoy").addEventListener("click", function () {
    var h = new Date();
    q("#semilla").value = String(h.getFullYear()) + String(h.getMonth() + 1).padStart(2, "0") + String(h.getDate()).padStart(2, "0");
    CD.toast("Semilla del día aplicada.");
  });
  q("#reiniciar").addEventListener("click", function () {
    estado = { historial: [] };
    guardar();
    q("#ruleta").textContent = "— — —";
    q("#ganador-detalle").textContent = "Configura la campaña y ejecuta el sorteo.";
    pintarParticipantes();
    pintarHistorial();
    CD.toast("Historial de sorteos reiniciado.");
  });

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-verificar]");
    if (t) verificar(t.dataset.verificar);
  });

  pintarParticipantes();
  pintarHistorial();
})();
