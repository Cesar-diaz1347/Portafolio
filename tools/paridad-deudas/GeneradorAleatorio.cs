namespace ParidadDeudas;

/// <summary>
/// Lote reproducible (semilla fija) con fechas entre 2025 y 2028 y montos realistas. Una parte
/// de los casos se sesga hacia los bordes de cada regla para que el lote sirva como prueba.
/// </summary>
internal sealed class GeneradorAleatorio(int semilla)
{
    public static readonly DateOnly FechaMinima = new(2025, 1, 1);
    public static readonly DateOnly FechaMaxima = new(2028, 12, 31);
    private const long SaldoInicialMaximoCent = 50_000_000; // Q500,000

    private readonly Random _random = new(semilla);

    public IReadOnlyList<EntradaCaso> Generar(int cantidad) =>
        Enumerable.Range(1, cantidad).Select(i => GenerarCaso($"A{i:D4}")).ToList();

    private EntradaCaso GenerarCaso(string id)
    {
        // Muestreo por rechazo: se descarta el intento si una fecha cae fuera de 2025–2028 o el saldo no es realista.
        while (true)
        {
            var hoy = FechaEntre(FechaMinima, FechaMaxima);
            var fechaInicio = ElegirFechaInicio(hoy);
            var fechaFin = ElegirFechaFin(hoy, fechaInicio);
            var (inicial, pagado, nota) = ElegirMontos(Calendario.MesesTranscurridos(fechaInicio, hoy));
            DateOnly? ultimoPago = pagado > 0 ? ElegirUltimoPago(hoy, fechaInicio) : null;

            var valido = inicial <= SaldoInicialMaximoCent
                && EnRango(fechaInicio) && EnRango(fechaFin) && (ultimoPago is not { } pago || EnRango(pago));
            if (valido)
                return new EntradaCaso(id, Origen.Aleatorio, nota, inicial, pagado, fechaInicio, fechaFin, ultimoPago, hoy);
        }
    }

    private DateOnly ElegirFechaInicio(DateOnly hoy) => _random.NextDouble() switch
    {
        < 0.15 => hoy.AddDays(_random.Next(1, 21)),                     // futuro: cruza el margen de 7 días
        < 0.30 => hoy.AddMonths(-1).AddDays(_random.Next(-10, 11)),     // sin pagos, el primer pago vence cerca de hoy
        _ => hoy.AddDays(-_random.Next(0, 1_096)),                      // hasta 3 años atrás
    };

    private DateOnly ElegirFechaFin(DateOnly hoy, DateOnly fechaInicio) => _random.NextDouble() switch
    {
        < 0.25 => hoy.AddDays(_random.Next(-10, 11)),                   // cruza el vencimiento y el margen de 7 días
        < 0.45 => fechaInicio.AddMonths(_random.Next(1, 37)),           // plazo de 1 a 36 meses desde el inicio
        _ => hoy.AddDays(_random.Next(11, 1_096)),                      // deuda en curso: termina en 11 días a 3 años
    };

    private DateOnly ElegirUltimoPago(DateOnly hoy, DateOnly fechaInicio) => _random.NextDouble() switch
    {
        < 0.35 => hoy.AddMonths(-1).AddDays(_random.Next(-10, 11)),     // el próximo pago cae cerca de hoy
        < 0.45 => Calendario.UltimoDiaDelMes(hoy.AddMonths(-_random.Next(1, 3))), // fin de mes: AddMonths recorta
        < 0.70 => hoy.AddDays(-_random.Next(0, 21)),                    // pago reciente
        < 0.95 => FechaEntre(fechaInicio < hoy ? fechaInicio : hoy, hoy),
        _ => hoy.AddDays(_random.Next(1, 31)),                          // fecha futura: la API no lo impide
    };

    private (long Inicial, long Pagado, string? Nota) ElegirMontos(int mesesTranscurridos)
    {
        var inicial = MontoRealista(300, 300_000);
        return _random.NextDouble() switch
        {
            < 0.15 => (inicial, 0, "sin pagos"),
            < 0.20 => (inicial, inicial, "pagada exacta"),
            < 0.25 => (inicial, inicial + Fraccion(inicial, 0.01, 0.10), "sobrepago"),
            < 0.50 => CocienteEntero(mesesTranscurridos),
            < 0.55 => MitadExacta(),
            _ => (inicial, Fraccion(inicial, 0.01, 0.99), null),
        };
    }

    // remanente·meses/pagado entero: la única situación en que el C# puede sumar un mes de más.
    private (long Inicial, long Pagado, string? Nota) CocienteEntero(int mesesTranscurridos)
    {
        var pagado = MontoRealista(100, 50_000);
        var paso = mesesTranscurridos / (int)Mcd(pagado, mesesTranscurridos);
        var mesesRestantes = paso * _random.Next(1, Math.Max(2, 120 / paso + 1));
        var remanente = mesesRestantes * pagado / mesesTranscurridos;
        return (pagado + remanente, pagado, "cociente entero");
    }

    // pagado·1000/inicial = n + 0.5 exacto: el porcentaje cae en una mitad y ejercita el redondeo bancario.
    private (long Inicial, long Pagado, string? Nota) MitadExacta()
    {
        var k = _random.Next(5, 5_001);      // inicial = Q20·k, de Q100 a Q100,000
        var n = _random.Next(0, 1_000);      // porcentaje = (n + 0.5) / 10
        return (2_000L * k, (2L * n + 1) * k, "mitad exacta");
    }

    // Log-uniforme: tantos montos de cientos como de cientos de miles.
    private long MontoRealista(double minimoQ, double maximoQ)
    {
        var exponente = Math.Log(minimoQ) + (Math.Log(maximoQ) - Math.Log(minimoQ)) * _random.NextDouble();
        return Redondear((long)Math.Round(Math.Exp(exponente) * 100));
    }

    private long Fraccion(long centavos, double minimo, double maximo) =>
        Redondear((long)Math.Round(centavos * (minimo + (maximo - minimo) * _random.NextDouble())));

    // Como se registran en la vida real: casi siempre cerrados a Q50 o a quetzales, a veces con centavos.
    private long Redondear(long centavos) => _random.NextDouble() switch
    {
        < 0.55 => Math.Max(5_000, centavos / 5_000 * 5_000),
        < 0.85 => Math.Max(100, centavos / 100 * 100),
        _ => Math.Max(1, centavos),
    };

    private DateOnly FechaEntre(DateOnly desde, DateOnly hasta) =>
        DateOnly.FromDayNumber(_random.Next(desde.DayNumber, hasta.DayNumber + 1));

    private static bool EnRango(DateOnly fecha) => fecha >= FechaMinima && fecha <= FechaMaxima;

    private static long Mcd(long a, long b) => b == 0 ? a : Mcd(b, a % b);
}
