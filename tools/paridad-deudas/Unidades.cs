using System.Globalization;

namespace ParidadDeudas;

internal static class Dinero
{
    // EF lee decimal(18,2) con escala 2 (12.00, no 12); multiplicar por 0.01m conserva esa escala.
    public static decimal DeCentavos(long centavos) => centavos * 0.01m;

    public static long ACentavos(decimal monto)
    {
        var centavos = monto * 100;
        if (centavos != decimal.Truncate(centavos))
            throw new ArgumentException($"{monto} tiene más de 2 decimales.", nameof(monto));
        return (long)centavos;
    }

    public static string Texto(long centavos) =>
        DeCentavos(centavos).ToString("#,0.00", CultureInfo.InvariantCulture);
}

internal static class Calendario
{
    public static DateOnly Fecha(string iso) => DateOnly.ParseExact(iso, "yyyy-MM-dd", CultureInfo.InvariantCulture);

    public static string Iso(DateOnly? fecha) =>
        fecha?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "null";

    public static int MesesEntre(DateOnly desde, DateOnly hasta) =>
        (hasta.Year - desde.Year) * 12 + hasta.Month - desde.Month;

    // Misma fórmula que DeudaCalculoService: cuenta cambios de mes calendario, con mínimo 1.
    public static int MesesTranscurridos(DateOnly inicio, DateOnly hoy) => Math.Max(1, MesesEntre(inicio, hoy));

    // DateOnly.AddMonths (recorta al fin de mes), pero devuelve null fuera del rango de DateOnly en vez de lanzar.
    public static DateOnly? SumarMeses(DateOnly fecha, long meses)
    {
        var mesDestino = fecha.Year * 12L + fecha.Month - 1 + meses;
        return mesDestino is >= 12 and <= 9999L * 12 + 11 ? fecha.AddMonths((int)meses) : null;
    }

    public static DateOnly UltimoDiaDelMes(DateOnly fecha) =>
        new(fecha.Year, fecha.Month, DateTime.DaysInMonth(fecha.Year, fecha.Month));
}
