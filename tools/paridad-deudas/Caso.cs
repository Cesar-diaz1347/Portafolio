using ControlPagos.Api.Dtos;

namespace ParidadDeudas;

internal enum Origen { Fijo, Aleatorio }

/// <summary>Entradas de un caso en las unidades del port TS: montos en centavos enteros.</summary>
internal sealed record EntradaCaso(
    string Id,
    Origen Origen,
    string? Nota,
    long SaldoInicialCent,
    long SaldoPagadoCent,
    DateOnly FechaInicio,
    DateOnly FechaFinPropuesta,
    DateOnly? UltimoPago,
    DateOnly Hoy)
{
    /// <summary>Igual que la columna calculada de la BD: [SaldoInicial] - [SaldoPagado].</summary>
    public long SaldoRemanenteCent => SaldoInicialCent - SaldoPagadoCent;

    /// <summary>pagado·1000/inicial termina en ,5 exacto: el porcentaje cae justo en una mitad.</summary>
    public bool PorcentajeEnMitadExacta =>
        SaldoInicialCent > 0 && 2 * (Math.Abs(SaldoPagadoCent) * 1000 % SaldoInicialCent) == SaldoInicialCent;
}

/// <summary>Proyección con la matemática exacta que implementará el port TS.</summary>
internal sealed record ProyeccionExacta(int MesesTranscurridos, long? MesesRestantes, DateOnly? Fecha);

/// <summary>Salidas del C# real junto al cálculo exacto del mismo caso.</summary>
internal sealed record ResultadoCaso(
    EntradaCaso Entrada,
    decimal PorcentajeAvance,
    EstadoDeuda Estado,
    DateOnly? FechaFinProyectada,
    string? ExcepcionProyeccion,
    ProyeccionExacta Exacta,
    int PorcentajeExactoDecimas)
{
    public bool DivergeProyeccion => ExcepcionProyeccion is null && FechaFinProyectada != Exacta.Fecha;

    public bool DivergePorcentaje => PorcentajeAvance * 10 != PorcentajeExactoDecimas;

    /// <summary>Meses que sumó el C#, deducidos de su fecha: AddMonths(k) siempre cae en el mes hoy + k.</summary>
    public int? MesesRestantesCs =>
        FechaFinProyectada is { } fecha ? Calendario.MesesEntre(Entrada.Hoy, fecha) : null;

    /// <summary>remanente·meses es múltiplo de pagado: el único caso en que la división decimal puede cruzar un entero.</summary>
    public bool CocienteExactoEntero =>
        Exacta.MesesRestantes is not null
        && Entrada.SaldoRemanenteCent * Exacta.MesesTranscurridos % Entrada.SaldoPagadoCent == 0;
}
