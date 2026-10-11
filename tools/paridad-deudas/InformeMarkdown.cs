using ControlPagos.Api.Dtos;

namespace ParidadDeudas;

/// <summary>Escribe paridad-informe.md con los datos reales de la ejecución.</summary>
internal static class InformeMarkdown
{
    public static string Generar(
        IReadOnlyList<ResultadoCaso> casos, IReadOnlyList<ResultadoCaso> sondas,
        Procedencia procedencia, IReadOnlyList<string> problemas)
    {
        List<string> md = [];
        SeccionEntorno(md, procedencia);
        SeccionCasos(md, casos);
        SeccionCaso100Entre3(md, casos);
        SeccionDivergencia(md, casos);
        SeccionPorcentaje(md, casos);
        SeccionExcepciones(md, sondas);
        SeccionInvariantes(md, problemas);
        SeccionRegenerar(md);
        return string.Join('\n', md) + "\n";
    }

    /// <summary>La sospecha original, tal cual: Math.Ceiling(200 / (100/3m)). Con parámetros para que no se pliegue al compilar.</summary>
    public static decimal CeilingConLiterales(decimal remanente, decimal pagado, int meses) =>
        Math.Ceiling(remanente / (pagado / meses));

    private static void SeccionEntorno(List<string> md, Procedencia procedencia) => md.AddRange(
    [
        "# Informe de paridad: DeudaCalculoService (C#) frente al cálculo exacto",
        "",
        "Generado por la consola `ParidadDeudas`. Enlaza sin cambios los `.cs` originales y llama a",
        "`DeudaCalculoService` igual que `DeudasController`: montos `decimal` con escala 2, como los lee EF",
        "de `decimal(18,2)`, y `saldoRemanente = inicial − pagado`, como la columna calculada.",
        "",
        "| Dato | Valor |",
        "|---|---|",
        $"| SDK de compilación | {procedencia.Sdk} |",
        $"| Runtime de ejecución | {procedencia.Runtime} |",
        $"| Semilla del lote aleatorio | {procedencia.Semilla} |",
        .. procedencia.Fuentes.Select(f => $"| `{f.RutaRelativa}` | SHA-256 `{f.Sha256}` |"),
    ]);

    private static void SeccionCasos(List<string> md, IReadOnlyList<ResultadoCaso> casos)
    {
        var fijos = casos.Where(c => c.Entrada.Origen == Origen.Fijo).ToList();
        var aleatorios = casos.Where(c => c.Entrada.Origen == Origen.Aleatorio).ToList();
        var fechas = aleatorios.SelectMany(c => FechasDeEntrada(c.Entrada)).ToList();
        var iniciales = aleatorios.Select(c => c.Entrada.SaldoInicialCent).Order().ToList();
        var escenarios = aleatorios
            .GroupBy(c => c.Entrada.Nota ?? "general")
            .OrderByDescending(g => g.Count())
            .Select(g => $"{g.Key} {g.Count()}");

        string Fila(string concepto, Func<ResultadoCaso, bool> filtro) =>
            $"| {concepto} | {fijos.Count(filtro)} | {aleatorios.Count(filtro)} | {casos.Count(filtro)} |";

        md.AddRange(
        [
            "",
            "## Casos",
            "",
            "| Concepto | Fijos | Aleatorios | Total |",
            "|---|---:|---:|---:|",
            Fila("**Casos en el fixture**", _ => true),
            .. Enum.GetValues<EstadoDeuda>().Select(e => Fila($"estado `{SerializacionApi.Texto(e)}`", c => c.Estado == e)),
            Fila("con `fechaFinProyectada`", c => c.FechaFinProyectada is not null),
            Fila("con `fechaFinProyectada` null", c => c.FechaFinProyectada is null),
            Fila("porcentaje en una mitad exacta (x.x5)", c => c.Entrada.PorcentajeEnMitadExacta),
            Fila("cociente exacto entero (remanente·meses múltiplo de pagado)", c => c.CocienteExactoEntero),
            Fila("clase de divergencia (`fechaFinProyectadaExacta`)", c => c.DivergeProyeccion),
            "",
            $"Lote aleatorio: fechas de entrada de {Calendario.Iso(fechas.Min())} a {Calendario.Iso(fechas.Max())}; "
                + $"saldo inicial de Q{Dinero.Texto(iniciales[0])} a Q{Dinero.Texto(iniciales[^1])} "
                + $"(mediana Q{Dinero.Texto(iniciales[iniciales.Count / 2])}).",
            $"Escenarios del lote: {string.Join(" · ", escenarios)}.",
            "",
            "Bordes de `CalcularEstado` que alcanza el lote aleatorio (deudas con remanente > 0 que llegan a esa rama):",
            "",
            "| Borde | Casos |",
            "|---|---:|",
            .. BordesDeEstado.Select(b => $"| {b.Descripcion} | {aleatorios.Count(c => b.Cumple(c.Entrada))} |"),
        ]);
    }

    // Réplica de las ramas de CalcularEstado solo para medir cobertura; el estado del fixture sale del C# real.
    private static readonly (string Descripcion, Func<EntradaCaso, bool> Cumple)[] BordesDeEstado =
    [
        ("inicio futuro a 7 u 8 días (Proximo / Lejana)", e => Pendiente(e) && DiasDesdeHoy(e, e.FechaInicio) is 7 or 8),
        ("hoy = próximo pago o el día siguiente (vence)", e => Iniciada(e) && DiasDesdeHoy(e, ProximoPago(e)) is 0 or -1),
        ("hoy = fecha fin o el día siguiente (vence)", e => Iniciada(e) && DiasDesdeHoy(e, e.FechaFinPropuesta) is 0 or -1),
        ("al día con margen mínimo de 7 u 8 días (Proximo / AlDia)", e => Iniciada(e) && MargenMinimo(e) is 7 or 8),
        ("próximo pago con el día recortado por AddMonths (fin de mes)", e => Iniciada(e) && ProximoPago(e).Day != BaseProximoPago(e).Day),
    ];

    private static bool Pendiente(EntradaCaso e) => e.SaldoRemanenteCent > 0;

    private static bool Iniciada(EntradaCaso e) => Pendiente(e) && e.FechaInicio <= e.Hoy;

    private static DateOnly BaseProximoPago(EntradaCaso e) => e.UltimoPago ?? e.FechaInicio;

    private static DateOnly ProximoPago(EntradaCaso e) => BaseProximoPago(e).AddMonths(1);

    private static int DiasDesdeHoy(EntradaCaso e, DateOnly fecha) => fecha.DayNumber - e.Hoy.DayNumber;

    private static int? MargenMinimo(EntradaCaso e)
    {
        var diasFin = DiasDesdeHoy(e, e.FechaFinPropuesta);
        var diasPago = DiasDesdeHoy(e, ProximoPago(e));
        return diasFin >= 0 && diasPago >= 0 ? Math.Min(diasFin, diasPago) : null;
    }

    private static void SeccionCaso100Entre3(List<string> md, IReadOnlyList<ResultadoCaso> casos)
    {
        var caso = casos.Single(c => c.Entrada.Nota == CasosFijos.NotaCaso100Entre3);
        var e = caso.Entrada;
        var (ritmo, cociente) = DiagnosticoDecimal.Divisiones(e);
        var veredicto = caso.DivergeProyeccion
            ? $"**Veredicto: CONFIRMADO.** El C# real proyecta {caso.MesesRestantesCs} meses "
              + $"({Calendario.Iso(caso.FechaFinProyectada)}) donde la matemática exacta da {caso.Exacta.MesesRestantes} "
              + $"({Calendario.Iso(caso.Exacta.Fecha)}): un mes de más."
            : "**Veredicto: DESCARTADO.** El C# real coincide con la matemática exacta.";

        md.AddRange(
        [
            "",
            "## Caso 100/3",
            "",
            $"Entradas (`{e.Id}`): saldo inicial {Dinero.Texto(e.SaldoInicialCent)} · pagado {Dinero.Texto(e.SaldoPagadoCent)} · "
                + $"remanente {Dinero.Texto(e.SaldoRemanenteCent)} · inicio {Calendario.Iso(e.FechaInicio)} · "
                + $"hoy {Calendario.Iso(e.Hoy)} → {caso.Exacta.MesesTranscurridos} meses transcurridos.",
            "",
            "| Cálculo | Meses restantes | `fechaFinProyectada` |",
            "|---|---:|---|",
            $"| C# real: `DeudaCalculoService.CalcularFechaFinProyectada` | {caso.MesesRestantesCs} | {Calendario.Iso(caso.FechaFinProyectada)} |",
            $"| Exacto: `ceil(remanente·meses / pagado)` | {caso.Exacta.MesesRestantes} | {Calendario.Iso(caso.Exacta.Fecha)} |",
            "",
            "Divisiones decimales internas del C# (réplica para diagnóstico):",
            "",
            $"- `ritmoMensual = {Dinero.DeCentavos(e.SaldoPagadoCent)} / {caso.Exacta.MesesTranscurridos} = {ritmo}`",
            $"- `saldoRemanente / ritmoMensual = {Dinero.DeCentavos(e.SaldoRemanenteCent)} / {ritmo} = {cociente}`",
            $"- `Math.Ceiling(…) = {Math.Ceiling(cociente)}`",
            $"- Con literales, como en la sospecha original: `Math.Ceiling(200m / (100m / 3m)) = {CeilingConLiterales(200m, 100m, 3)}`",
            "",
            veredicto,
        ]);
    }

    private static void SeccionDivergencia(List<string> md, IReadOnlyList<ResultadoCaso> casos)
    {
        var divergentes = casos.Where(c => c.DivergeProyeccion).ToList();
        var fueraDeClase = divergentes.Count(c => !Invariantes.EsDivergenciaDocumentada(c));
        var conCocienteEntero = casos.Where(c => c.CocienteExactoEntero).ToList();
        var noEnteros = casos.Where(c => c.Exacta.MesesRestantes is not null && !c.CocienteExactoEntero).ToList();

        md.AddRange(
        [
            "",
            "## Clase de divergencia: el C# suma un mes",
            "",
            "Casos en que `CalcularFechaFinProyectada` difiere de `hoy + ceil(remanente·meses / pagado)` exacto: "
                + $"**{divergentes.Count}** ({divergentes.Count(c => c.Entrada.Origen == Origen.Fijo)} fijos y "
                + $"{divergentes.Count(c => c.Entrada.Origen == Origen.Aleatorio)} aleatorios).",
            "",
            fueraDeClase == 0
                ? "Todos son de la misma clase: remanente·meses es múltiplo exacto de pagado y el C# da exactamente un mes más. "
                  + "En el fixture llevan `fechaFinProyectadaExacta`, que es lo que debe devolver el port TS."
                : $"**{fueraDeClase} divergencias NO encajan en la clase documentada** (ver Invariantes).",
            "",
            "Por qué ocurre: casos con proyección, agrupados según si el cociente exacto es entero y cómo redondea el C# `pagado / meses`.",
            "",
            "| Cociente exacto | Ritmo `pagado / meses` en decimal | Casos | Divergen |",
            "|---|---|---:|---:|",
            .. Enum.GetValues<RedondeoRitmo>().Select(redondeo =>
            {
                var grupo = conCocienteEntero.Where(c => DiagnosticoDecimal.ClasificarRitmo(c.Entrada) == redondeo).ToList();
                return $"| entero | {Describir(redondeo)} | {grupo.Count} | {grupo.Count(c => c.DivergeProyeccion)} |";
            }),
            $"| no entero | cualquiera | {noEnteros.Count} | {noEnteros.Count(c => c.DivergeProyeccion)} |",
            "",
            "| Id | Inicial | Pagado | Remanente | Meses | Hoy | C# (meses) | Exacto (meses) | Ritmo decimal | Remanente / ritmo |",
            "|---|---:|---:|---:|---:|---|---|---|---|---|",
            .. divergentes.Select(FilaDivergencia),
        ]);
    }

    private static string FilaDivergencia(ResultadoCaso caso)
    {
        var e = caso.Entrada;
        var (ritmo, cociente) = DiagnosticoDecimal.Divisiones(e);
        return $"| {e.Id} | {Dinero.Texto(e.SaldoInicialCent)} | {Dinero.Texto(e.SaldoPagadoCent)} | "
            + $"{Dinero.Texto(e.SaldoRemanenteCent)} | {caso.Exacta.MesesTranscurridos} | {Calendario.Iso(e.Hoy)} | "
            + $"{Calendario.Iso(caso.FechaFinProyectada)} ({caso.MesesRestantesCs}) | "
            + $"{Calendario.Iso(caso.Exacta.Fecha)} ({caso.Exacta.MesesRestantes}) | {ritmo} | {cociente} |";
    }

    private static void SeccionPorcentaje(List<string> md, IReadOnlyList<ResultadoCaso> casos)
    {
        var diferencias = casos.Where(c => c.DivergePorcentaje).ToList();
        md.AddRange(
        [
            "",
            "## Porcentaje de avance",
            "",
            "`CalcularPorcentajeAvance` frente al redondeo bancario exacto con enteros "
                + "(`round_half_even(pagado·1000 / inicial) / 10`, acotado a [0, 100]; 0 si inicial ≤ 0): "
                + $"**{diferencias.Count}** diferencias en {casos.Count} casos "
                + $"({casos.Count(c => c.Entrada.PorcentajeEnMitadExacta)} caen en una mitad exacta).",
            .. diferencias.Select(c => $"- {c.Entrada.Id}: C# {c.PorcentajeAvance}, exacto {c.PorcentajeExactoDecimas / 10m}"),
        ]);
    }

    private static void SeccionExcepciones(List<string> md, IReadOnlyList<ResultadoCaso> sondas)
    {
        var hoy = sondas[0].Entrada.Hoy;
        md.AddRange(
        [
            "",
            "## Excepciones del C# (fuera del fixture)",
            "",
            "Con un ritmo mensual diminuto frente al remanente, `CalcularFechaFinProyectada` lanza en lugar de devolver "
                + "una fecha. Estos casos no van al fixture porque no hay salida que comparar.",
            "",
            "| Id | Caso | Inicial | Pagado | Meses | Meses exactos | Excepción del C# real |",
            "|---|---|---:|---:|---:|---:|---|",
            .. sondas.Select(s => $"| {s.Entrada.Id} | {s.Entrada.Nota} | {Dinero.Texto(s.Entrada.SaldoInicialCent)} | "
                + $"{Dinero.Texto(s.Entrada.SaldoPagadoCent)} | {s.Exacta.MesesTranscurridos} | {s.Exacta.MesesRestantes:N0} | "
                + $"{s.ExcepcionProyeccion ?? "(no lanzó)"} |"),
            "",
            $"Desde hoy = {Calendario.Iso(hoy)}, cualquier proyección de más de {Calendario.MesesEntre(hoy, DateOnly.MaxValue):N0} "
                + "meses sale del rango de `DateOnly` (9999-12-31); por encima de `int.MaxValue` meses el cast desborda antes.",
            "En la API, `MapToDetailDto` llama a `CalcularFechaFinProyectada`: `GET /api/deudas/{id}` y las respuestas de "
                + "crear, editar y borrar pagos responderían 500, con el pago ya guardado. El listado y el dashboard no "
                + "proyectan y no se ven afectados. Qué devuelve el port TS en ese caso queda como decisión del paso 2.",
        ]);
    }

    private static void SeccionInvariantes(List<string> md, IReadOnlyList<string> problemas)
    {
        md.AddRange(["", "## Invariantes", ""]);
        if (problemas.Count == 0)
            md.Add("Todas se cumplen: ninguna salida del fixture viene de una excepción; el porcentaje tiene a lo sumo "
                + "1 decimal y coincide con el redondeo bancario exacto; toda divergencia de la proyección es de la clase "
                + "documentada; las sondas lanzan; y los 5 estados aparecen tanto en los casos fijos como en el lote aleatorio.");
        else
            md.AddRange(problemas.Select(p => $"- {p}"));
    }

    private static void SeccionRegenerar(List<string> md) => md.AddRange(
    [
        "",
        "## Cómo regenerar",
        "",
        "Desde la carpeta del proyecto `ParidadDeudas`:",
        "",
        "```powershell",
        "dotnet run -c Release -- \"<directorio de salida>\"",
        "```",
        "",
        "Código de salida: 0 = archivos generados e invariantes OK · 2 = archivos generados con invariantes incumplidas · 1 = error.",
    ]);

    private static string Describir(RedondeoRitmo redondeo) => redondeo switch
    {
        RedondeoRitmo.Exacto => "exacto",
        RedondeoRitmo.HaciaAbajo => "redondeado hacia abajo",
        _ => "redondeado hacia arriba",
    };

    private static IEnumerable<DateOnly> FechasDeEntrada(EntradaCaso caso)
    {
        yield return caso.FechaInicio;
        yield return caso.FechaFinPropuesta;
        yield return caso.Hoy;
        if (caso.UltimoPago is { } ultimoPago) yield return ultimoPago;
    }
}
