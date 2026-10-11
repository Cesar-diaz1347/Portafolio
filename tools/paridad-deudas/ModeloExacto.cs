namespace ParidadDeudas;

/// <summary>
/// Cálculo exacto con enteros, el mismo que implementará el port TS. Sirve para encontrar
/// dónde la aritmética decimal del C# se aparta de la matemática exacta.
/// </summary>
internal static class ModeloExacto
{
    public static ProyeccionExacta Proyeccion(EntradaCaso caso)
    {
        var mesesTranscurridos = Calendario.MesesTranscurridos(caso.FechaInicio, caso.Hoy);
        if (caso.SaldoRemanenteCent <= 0 || caso.SaldoPagadoCent <= 0)
            return new ProyeccionExacta(mesesTranscurridos, null, null);

        // ceil(remanente·meses / pagado) sin la división decimal intermedia (ritmo mensual) del C#.
        var mesesRestantes = DividirHaciaArriba(
            checked(caso.SaldoRemanenteCent * mesesTranscurridos), caso.SaldoPagadoCent);
        return new ProyeccionExacta(
            mesesTranscurridos, mesesRestantes, Calendario.SumarMeses(caso.Hoy, mesesRestantes));
    }

    /// <summary>Porcentaje·10 = pagado·1000/inicial, redondeado a la mitad hacia el par y acotado a [0, 1000].</summary>
    public static int PorcentajeDecimas(long inicialCent, long pagadoCent)
    {
        if (inicialCent <= 0) return 0;

        var numerador = checked(pagadoCent * 1000);
        var (cociente, resto) = Math.DivRem(Math.Abs(numerador), inicialCent);
        var dobleResto = resto * 2;
        if (dobleResto > inicialCent || (dobleResto == inicialCent && cociente % 2 != 0)) cociente++;

        var redondeado = numerador < 0 ? -cociente : cociente;
        return (int)Math.Clamp(redondeado, 0, 1000);
    }

    private static long DividirHaciaArriba(long dividendo, long divisor) => (dividendo + divisor - 1) / divisor;
}
