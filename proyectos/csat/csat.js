/* csat.js — Demo: calificación de servicio al cliente (CSAT + NPS).
   Captura la encuesta, consolida en vivo y dibuja las gráficas en SVG. */
(function () {
  "use strict";

  var q = CD.q, qa = CD.qa;

  var AGENTES = ["Ana Morales", "Luis Batres", "Karla Estrada", "Diego Pérez", "Sofía Ruano", "Mario Castillo"];
  var CANALES = ["Agencia", "Call center", "Banca en línea", "WhatsApp"];
  var CARITAS = [
    { valor: 1, emoji: "😠", texto: "Muy malo" },
    { valor: 2, emoji: "🙁", texto: "Malo" },
    { valor: 3, emoji: "😐", texto: "Regular" },
    { valor: 4, emoji: "🙂", texto: "Bueno" },
    { valor: 5, emoji: "😄", texto: "Excelente" }
  ];
  var COMENTARIOS = [
    "La atención fue rápida y clara.", "Tuve que esperar demasiado en fila.",
    "Me resolvieron el problema al primer intento.", "El agente no supo responder mi consulta.",
    "Excelente trato, muy amable.", "La app se cerró a mitad del trámite.",
    "Todo perfecto, gracias.", "Me transfirieron tres veces."
  ];

  var almacen = CD.store("csat", { respuestas: [] });
  var estado = almacen.leer();
  var calificacion = 5;

  function guardar() { almacen.guardar(estado); }

  /* --------------------------- cálculo de indicadores --------------------- */
  function filtradas() {
    var canal = q("#filtro-canal").value;
    return canal ? estado.respuestas.filter(function (r) { return r.canal === canal; }) : estado.respuestas;
  }

  function csat(lista) {
    if (!lista.length) return 0;
    var buenos = lista.filter(function (r) { return r.calificacion >= 4; }).length;
    return Math.round((buenos / lista.length) * 100);
  }

  function nps(lista) {
    if (!lista.length) return 0;
    var prom = lista.filter(function (r) { return r.nps >= 9; }).length;
    var det = lista.filter(function (r) { return r.nps <= 6; }).length;
    return Math.round(((prom - det) / lista.length) * 100);
  }

  function promedio(lista) {
    if (!lista.length) return 0;
    return lista.reduce(function (a, r) { return a + r.calificacion; }, 0) / lista.length;
  }

  /* -------------------------------- gráficas ------------------------------ */
  function pintarGrafica(lista) {
    var conteos = CARITAS.map(function (c) {
      return lista.filter(function (r) { return r.calificacion === c.valor; }).length;
    });
    var max = Math.max.apply(null, conteos.concat([1]));
    var alto = 120, base = 132, anchoBarra = 38, sep = 62;

    var svg = CARITAS.map(function (c, i) {
      var x = 22 + i * sep;
      var h = Math.round((conteos[i] / max) * alto);
      return '<rect class="barra-fill" x="' + x + '" y="' + (base - h) + '" width="' + anchoBarra +
          '" height="' + h + '" rx="5" opacity="' + (0.45 + 0.11 * i).toFixed(2) + '"></rect>' +
        '<text x="' + (x + anchoBarra / 2) + '" y="' + (base - h - 6) + '" text-anchor="middle">' + conteos[i] + "</text>" +
        '<text x="' + (x + anchoBarra / 2) + '" y="' + (base + 16) + '" text-anchor="middle" font-size="14">' + c.emoji + "</text>" +
        '<text x="' + (x + anchoBarra / 2) + '" y="' + (base + 30) + '" text-anchor="middle">' + c.valor + "</text>";
    }).join("");

    q("#grafica").innerHTML = '<line class="eje" x1="14" y1="' + base + '" x2="306" y2="' + base + '"></line>' + svg;
  }

  function pintarNps(lista) {
    var total = lista.length || 1;
    var grupos = [
      { nombre: "Detractores", n: lista.filter(function (r) { return r.nps <= 6; }).length, color: "var(--err)" },
      { nombre: "Pasivos", n: lista.filter(function (r) { return r.nps === 7 || r.nps === 8; }).length, color: "var(--warn)" },
      { nombre: "Promotores", n: lista.filter(function (r) { return r.nps >= 9; }).length, color: "var(--ok)" }
    ];
    var x = 10, ancho = 300, y = 12, alto = 26, out = "";
    grupos.forEach(function (g) {
      var w = (g.n / total) * ancho;
      if (w > 0) out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + alto + '" fill="' + g.color + '" opacity="0.85"></rect>';
      x += w;
    });
    out += grupos.map(function (g, i) {
      var cx = 14 + i * 104;
      return '<rect x="' + cx + '" y="' + (y + alto + 12) + '" width="9" height="9" rx="2" fill="' + g.color + '"></rect>' +
        '<text x="' + (cx + 14) + '" y="' + (y + alto + 20) + '">' + g.nombre + " (" + g.n + ")</text>";
    }).join("");
    q("#grafica-nps").innerHTML = out;
  }

  /* --------------------------------- render ------------------------------- */
  function pintarEscala() {
    q("#escala").innerHTML = CARITAS.map(function (c) {
      return '<button class="filtro" type="button" data-cal="' + c.valor + '" aria-pressed="' +
        (c.valor === calificacion) + '" title="' + c.texto + '">' + c.emoji + " " + c.valor + "</button>";
    }).join("");
  }

  function pintarAgentes(lista) {
    var filas = AGENTES.map(function (a) {
      var suyas = lista.filter(function (r) { return r.agente === a; });
      return { agente: a, n: suyas.length, prom: promedio(suyas), csat: csat(suyas), nps: nps(suyas) };
    }).sort(function (x, y) { return y.csat - x.csat || y.n - x.n; });

    q("#tabla-agentes").innerHTML = filas.map(function (f) {
      var clase = f.n === 0 ? "estado--neutro" : (f.csat >= 80 ? "estado--ok" : (f.csat >= 60 ? "estado--warn" : "estado--err"));
      return "<tr><td>" + CD.esc(f.agente) + "</td>" +
        '<td class="num">' + f.n + "</td>" +
        '<td class="num">' + (f.n ? f.prom.toFixed(1) : "—") + "</td>" +
        '<td class="num"><span class="estado ' + clase + '">' + (f.n ? f.csat + "%" : "sin datos") + "</span></td>" +
        '<td class="num">' + (f.n ? f.nps : "—") + "</td></tr>";
    }).join("");
  }

  function pintarComentarios(lista) {
    var con = lista.filter(function (r) { return r.comentario; }).slice(0, 8);
    q("#comentarios").innerHTML = con.map(function (r) {
      var c = CARITAS[r.calificacion - 1];
      return "<li><span aria-hidden='true' style='font-size:1.3rem'>" + c.emoji + "</span>" +
        '<span class="crece"><b>' + CD.esc(r.comentario) + "</b>" +
        "<small>" + CD.esc(r.agente) + " · " + CD.esc(r.canal) + " · NPS " + r.nps + "</small></span></li>";
    }).join("");
    q("#comentarios-vacio").hidden = con.length > 0;
    q("#conteo-comentarios").textContent = con.length;
  }

  function pintar() {
    var lista = filtradas();
    q("#kpi-respuestas").textContent = lista.length;
    q("#kpi-csat").textContent = csat(lista) + "%";
    q("#kpi-nps").textContent = nps(lista);
    q("#kpi-promedio").textContent = promedio(lista).toFixed(1);
    pintarGrafica(lista);
    pintarNps(lista);
    pintarAgentes(lista);
    pintarComentarios(lista);
  }

  /* -------------------------------- acciones ------------------------------ */
  function registrar(datos) {
    estado.respuestas.unshift(datos || {
      id: CD.id("ENC"),
      fecha: new Date().toISOString(),
      canal: q("#canal").value,
      agente: q("#agente").value,
      calificacion: calificacion,
      nps: Number(q("#nps").value),
      comentario: q("#comentario").value.trim()
    });
    guardar();
    pintar();
    if (!datos) {
      q("#comentario").value = "";
      CD.toast("Respuesta registrada. Indicadores actualizados.");
    }
  }

  function simular() {
    for (var i = 0; i < 25; i++) {
      var cal = [5, 5, 4, 4, 4, 3, 5, 2, 5, 1][Math.floor(Math.random() * 10)];
      var base = cal >= 4 ? 7 : 3;
      registrar({
        id: CD.id("ENC"),
        fecha: new Date(Date.now() - Math.floor(Math.random() * 6) * 86400000).toISOString(),
        canal: CANALES[Math.floor(Math.random() * CANALES.length)],
        agente: AGENTES[Math.floor(Math.random() * AGENTES.length)],
        calificacion: cal,
        nps: Math.min(10, base + Math.floor(Math.random() * 4)),
        comentario: Math.random() < 0.45 ? COMENTARIOS[Math.floor(Math.random() * COMENTARIOS.length)] : ""
      });
    }
    CD.toast("25 respuestas simuladas y consolidadas.");
  }

  /* ---------------------------------- init -------------------------------- */
  q("#agente").innerHTML = AGENTES.map(function (a) { return "<option>" + a + "</option>"; }).join("");
  pintarEscala();

  q("#escala").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-cal]");
    if (!b) return;
    calificacion = Number(b.dataset.cal);
    qa("[data-cal]").forEach(function (x) { x.setAttribute("aria-pressed", String(Number(x.dataset.cal) === calificacion)); });
  });
  q("#nps").addEventListener("input", function () { q("#nps-valor").textContent = q("#nps").value; });
  q("#registrar").addEventListener("click", function () { registrar(); });
  q("#simular").addEventListener("click", simular);
  q("#filtro-canal").addEventListener("change", pintar);
  q("#reiniciar").addEventListener("click", function () {
    estado = { respuestas: [] };
    guardar();
    pintar();
    CD.toast("Encuestas reiniciadas.");
  });

  pintar();
})();
