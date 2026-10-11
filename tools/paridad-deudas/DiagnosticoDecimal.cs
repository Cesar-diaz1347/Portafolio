using System.Numerics;

namespace ParidadDeudas;

internal enum RedondeoRitmo { Exacto, HaciaAbajo, HaciaArriba }

/// <summary>
/// Réplica de las dos divisiones decimales internas de CalcularFechaFinProyectada. Solo explica
/// las divergencias en el informe; las salidas del fixture salen siempre del C# real.
/// Requiere pagado &gt; 0.
/// </summary>
internal static class DiagnosticoDecimal
{
    public static (decimal Ritmo, decimal Cociente) Divisiones(EntradaCaso caso)
    {
        var saldoPagado = Dinero.DeCentavos(caso.SaldoPagadoCent);
        var saldoRemanente = Dinero.DeCentavos(caso.SaldoInicialCent) - saldoPagado;
        var ritmo = saldoPagado / Calendario.MesesTranscurridos(caso.FechaInicio, caso.Hoy);
        return (ritmo, saldoRemanente / ritmo);
    }

    /// <summary>Compara ritmo·meses con pagado de forma exacta, porque el producto decimal también redondea.</summary>
    public static RedondeoRitmo ClasificarRitmo(EntradaCaso caso)
    {
        var (ritmo, _) = Divisiones(caso);
        var (mantisa, escala) = Descomponer(ritmo);
        var meses = Calendario.MesesTranscurridos(caso.FechaInicio, caso.Hoy);

        // ritmo = mantisa / 10^escala y pagado = centavos / 100.
        var ritmoPorMeses = mantisa * meses * 100;
        var pagado = caso.SaldoPagadoCent * BigInteger.Pow(10, escala);
        return ritmoPorMeses.CompareTo(pagado) switch
        {
            0 => RedondeoRitmo.Exacto,
            < 0 => RedondeoRitmo.HaciaAbajo,
            _ => RedondeoRitmo.HaciaArriba,
        };
    }

    private static (BigInteger Mantisa, int Escala) Descomponer(decimal valor)
    {
        Span<int> bits = stackalloc int[4];
        decimal.GetBits(valor, bits);
        var mantisa = ((BigInteger)(uint)bits[2] << 64) | ((BigInteger)(uint)bits[1] << 32) | (uint)bits[0];
        return (valor < 0 ? -mantisa : mantisa, valor.Scale);
    }
}
