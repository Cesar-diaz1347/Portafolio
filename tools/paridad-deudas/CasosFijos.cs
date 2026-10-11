namespace ParidadDeudas;

/// <summary>Casos elegidos a mano para los bordes de las tres reglas. Montos en quetzales.</summary>
internal static class CasosFijos
{
    public const string NotaCaso100Entre3 = "Caso 100/3: pagado 100 en 3 meses, remanente 200; exacto 6 meses";

    private sealed record Definicion(
        string Nota, decimal Inicial, decimal Pagado, string Inicio, string Fin, string? UltimoPago, string Hoy);

    public static IReadOnlyList<EntradaCaso> Crear() => Numerar("F", Definiciones);

    /// <summary>Casos en que el C# real lanza: van al informe, no al fixture, porque no hay salida que comparar.</summary>
    public static IReadOnlyList<EntradaCaso> SondasDeExcepcion() => Numerar("X", Sondas);

    private static List<EntradaCaso> Numerar(string prefijo, IEnumerable<Definicion> definiciones) =>
        definiciones
            .Select((d, i) => new EntradaCaso(
                $"{prefijo}{i + 1:D2}", Origen.Fijo, d.Nota,
                Dinero.ACentavos(d.Inicial), Dinero.ACentavos(d.Pagado),
                Calendario.Fecha(d.Inicio), Calendario.Fecha(d.Fin),
                d.UltimoPago is null ? null : Calendario.Fecha(d.UltimoPago),
                Calendario.Fecha(d.Hoy)))
            .ToList();

    private const string Hoy = "2026-10-04";

    // Fechas neutras para aislar el porcentaje: inicio en enero, fin lejano y próximo pago en 16 días.
    private const string InicioNeutro = "2026-01-15";
    private const string FinNeutro = "2027-12-15";
    private const string PagoNeutro = "2026-09-20";

    private static readonly Definicion[] Definiciones =
    [
        // Porcentaje de avance: Math.Round(decimal, 1) usa MidpointRounding.ToEven.
        new("12.25 → 12.2: redondeo bancario (MidpointRounding.ToEven)", 400m, 49m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("12.35 → 12.4: la mitad va al dígito par", 2000m, 247m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("0.25 → 0.2: AwayFromZero daría 0.3", 4000m, 10m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("0.05 → 0", 2000m, 1m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("99.85 → 99.8", 2000m, 1997m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("99.95 → 100 con Q1.00 pendiente: muestra 100 % sin estar Pagada", 2000m, 1999m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("2/3 → 66.7: sin mitad, redondeo normal", 300m, 200m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("Menos de 0.05 % con pagos → 0", 10_000m, 4.99m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("Clamp a 100: sobrepago (pagado > inicial) → Pagada", 1000m, 1250m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("Clamp a 0: pagado negativo; no alcanzable vía API (CK_Pago_Monto > 0)", 1000m, -50m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("Saldo inicial 0 sin pagos → 0 % y Pagada; no alcanzable vía API ([Range(0.01, …)])", 0m, 0m, InicioNeutro, FinNeutro, null, Hoy),
        new("Saldo inicial 0 con pagos → 0 % aunque esté sobrepagada", 0m, 100m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),
        new("Pagada exacta: remanente 0 → 100 % y sin proyección", 1500m, 1500m, InicioNeutro, FinNeutro, PagoNeutro, Hoy),

        // Estado: Pagada → inicio futuro → vencido → margen de 7 días.
        new("Pagada gana a fechas vencidas: el remanente se evalúa primero", 1000m, 1000m, "2025-01-10", "2025-12-10", "2025-06-10", Hoy),
        new("Inicio futuro a 7 días → Proximo (límite inclusivo)", 1000m, 0m, "2026-10-11", "2027-10-11", null, Hoy),
        new("Inicio futuro a 8 días → Lejana", 1000m, 0m, "2026-10-12", "2027-10-12", null, Hoy),
        new("Inicio futuro a 1 día → Proximo", 1000m, 0m, "2026-10-05", "2027-10-05", null, Hoy),
        new("Inicio hoy no es futuro: primer pago en 31 días → AlDia", 1000m, 0m, "2026-10-04", "2027-10-04", null, Hoy),
        new("Inicio futuro gana a un fin ya pasado (fechas invertidas) → Lejana", 1000m, 0m, "2026-10-14", "2026-10-01", null, Hoy),
        new("Prepago antes de un inicio futuro: manda el inicio → Proximo; meses = max(1, 0)", 1000m, 300m, "2026-10-08", "2027-10-08", "2026-10-01", Hoy),
        new("Vencido por fecha fin aunque haya un pago reciente", 1000m, 300m, "2026-01-03", "2026-10-03", "2026-09-28", Hoy),
        new("Fin hoy: aún no vence, 0 días → Proximo", 1000m, 300m, "2026-01-04", "2026-10-04", "2026-09-28", Hoy),
        new("Fin a 7 días → Proximo (límite exacto)", 1000m, 300m, "2026-01-11", "2026-10-11", "2026-09-28", Hoy),
        new("Fin a 8 días → AlDia", 1000m, 300m, "2026-01-12", "2026-10-12", "2026-09-28", Hoy),
        new("Vencido por falta de pago: el próximo pago era ayer", 1000m, 300m, "2026-01-15", "2027-12-31", "2026-09-03", Hoy),
        new("Próximo pago hoy: aún no vence, 0 días → Proximo", 1000m, 300m, "2026-01-15", "2027-12-31", "2026-09-04", Hoy),
        new("Próximo pago a 7 días → Proximo (límite exacto)", 1000m, 300m, "2026-01-15", "2027-12-31", "2026-09-11", Hoy),
        new("Próximo pago a 8 días → AlDia", 1000m, 300m, "2026-01-15", "2027-12-31", "2026-09-12", Hoy),
        new("Sin pagos: el primer pago vencía 1 mes después del inicio → Vencido", 1000m, 0m, "2026-08-01", "2027-08-01", null, Hoy),
        new("Sin pagos, primer pago en 16 días → AlDia", 1000m, 0m, "2026-09-20", "2027-09-20", null, Hoy),
        new("Último pago anterior al inicio: cuenta el pago, no el inicio → Vencido", 1000m, 300m, "2026-09-15", "2027-09-15", "2026-08-01", Hoy),
        new("Último pago con fecha futura: próximo pago en 47 días → AlDia", 1000m, 300m, "2026-01-15", "2027-12-31", "2026-10-20", Hoy),

        // Fin de mes y bisiesto: DateOnly.AddMonths recorta al último día del mes.
        new("31 ene + 1 mes = 28 feb (2027): vence hoy → Proximo", 1000m, 300m, "2026-12-31", "2027-12-31", "2027-01-31", "2027-02-28"),
        new("31 ene + 1 mes = 28 feb (2027): el 1 mar ya es Vencido (setMonth de JS daría 3 mar)", 1000m, 300m, "2026-12-31", "2027-12-31", "2027-01-31", "2027-03-01"),
        new("31 ene + 1 mes = 29 feb en bisiesto (2028) → Proximo", 1000m, 300m, "2027-12-31", "2028-12-31", "2028-01-31", "2028-02-29"),
        new("31 ene + 1 mes = 29 feb (2028): el 1 mar ya es Vencido", 1000m, 300m, "2027-12-31", "2028-12-31", "2028-01-31", "2028-03-01"),
        new("Pago el 29 feb (bisiesto) + 1 mes = 29 mar → Proximo", 1000m, 300m, "2027-12-31", "2028-12-31", "2028-02-29", "2028-03-29"),
        new("Pago el 29 feb + 1 mes = 29 mar: el 30 mar ya es Vencido", 1000m, 300m, "2027-12-31", "2028-12-31", "2028-02-29", "2028-03-30"),
        new("Inicio 31 ene sin pagos: primer pago el 28 feb, a 1 día → Proximo", 1000m, 0m, "2027-01-31", "2027-12-31", null, "2027-02-27"),
        new("Pago 31 mar + 1 mes = 30 abr: el 1 may ya es Vencido", 1000m, 300m, "2027-01-15", "2027-12-31", "2027-03-31", "2027-05-01"),

        // Fecha fin proyectada: hoy.AddMonths(ceil(remanente / (pagado / meses))).
        new(NotaCaso100Entre3, 300m, 100m, "2026-07-04", "2027-07-04", "2026-09-30", Hoy),
        new("Contraste 200/3: mismo cociente exacto 6, ritmo 66.66…7 redondeado hacia arriba", 600m, 200m, "2026-07-04", "2027-07-04", "2026-09-30", Hoy),
        new("Ritmo exacto 300/3 = 100: cociente 6 sin división inexacta", 900m, 300m, "2026-07-04", "2027-07-04", "2026-09-30", Hoy),
        new("Pagado 300 en 7 meses, remanente 600: ritmo 42.857… redondeado hacia abajo, pero el exceso no llega al cociente: 14, sin mes extra", 900m, 300m, "2026-03-04", "2027-03-04", "2026-09-30", Hoy),
        new("Los meses transcurridos cuentan cambios de mes: inicio 31 ene, hoy 1 feb → 1", 350m, 100m, "2027-01-31", "2027-12-31", "2027-01-31", "2027-02-01"),
        new("Inicio y hoy en el mismo mes → meses = max(1, 0) = 1", 1000m, 100m, "2026-10-01", "2027-10-01", "2026-10-02", Hoy),
        new("Inicio futuro con prepago → meses = max(1, −1) = 1 y Lejana", 500m, 50m, "2026-11-02", "2027-11-02", "2026-10-01", Hoy),
        new("Proyección desde el 31 ene + 1 mes = 28 feb", 900m, 500m, "2026-12-31", "2027-12-31", "2027-01-20", "2027-01-31"),
        new("Proyección desde el 29 feb (bisiesto) + 12 meses = 28 feb", 1500m, 300m, "2027-11-29", "2028-11-29", "2028-02-20", "2028-02-29"),
        new("Proyección muy lejana (año 9110) pero dentro del rango de DateOnly", 85_001m, 1m, "2026-10-01", "2027-10-01", "2026-10-02", Hoy),
        new("Sin pagos → sin proyección (ritmo 0)", 1000m, 0m, InicioNeutro, FinNeutro, null, Hoy),
    ];

    private static readonly Definicion[] Sondas =
    [
        new("Pago de prueba de Q1.00 en una deuda de Q100,000 el mismo mes: 99,999 meses, fuera de DateOnly",
            100_000m, 1m, "2026-10-01", "2027-10-01", "2026-10-02", Hoy),
        new("Q0.01 pagado de Q100,000,000 el mismo mes: 9,999,999,999 meses, desborda int",
            100_000_000m, 0.01m, "2026-10-01", "2027-10-01", "2026-10-02", Hoy),
    ];
}
