using ControlPagos.Api.Dtos;

namespace ParidadDeudas;

/// <summary>Supuestos que el port TS da por buenos. Si alguno falla, el informe lo lista y la consola sale con 2.</summary>
internal static class Invariantes
{
    public static List<string> Revisar(IReadOnlyList<ResultadoCaso> casos, IReadOnlyList<ResultadoCaso> sondas)
    {
        List<string> problemas = [];

        foreach (var caso in casos)
        {
            var id = caso.Entrada.Id;
            if (caso.ExcepcionProyeccion is not null)
                problemas.Add($"{id}: el C# lanzó {caso.ExcepcionProyeccion} y el caso está en el fixture.");
            if (decimal.Round(caso.PorcentajeAvance, 1) != caso.PorcentajeAvance)
                problemas.Add($"{id}: el porcentaje {caso.PorcentajeAvance} tiene más de 1 decimal.");
            if (caso.DivergePorcentaje)
                problemas.Add($"{id}: porcentaje C# {caso.PorcentajeAvance} distinto del exacto {caso.PorcentajeExactoDecimas / 10m}.");
            if (caso.DivergeProyeccion && !EsDivergenciaDocumentada(caso))
                problemas.Add($"{id}: proyección C# {Calendario.Iso(caso.FechaFinProyectada)} frente a exacta "
                    + $"{Calendario.Iso(caso.Exacta.Fecha)}, fuera de la clase documentada.");
        }

        problemas.AddRange(sondas
            .Where(s => s.ExcepcionProyeccion is null)
            .Select(s => $"{s.Entrada.Id}: se esperaba una excepción del C# y devolvió {Calendario.Iso(s.FechaFinProyectada)}."));

        foreach (var origen in Enum.GetValues<Origen>())
        {
            var estados = casos.Where(c => c.Entrada.Origen == origen).Select(c => c.Estado).ToHashSet();
            problemas.AddRange(Enum.GetValues<EstadoDeuda>()
                .Where(e => !estados.Contains(e))
                .Select(e => $"Los casos de origen {origen} no cubren el estado {e}."));
        }

        return problemas;
    }

    /// <summary>La clase documentada: cociente exacto entero y el C# da exactamente un mes más.</summary>
    public static bool EsDivergenciaDocumentada(ResultadoCaso caso) =>
        caso.CocienteExactoEntero && caso.MesesRestantesCs == caso.Exacta.MesesRestantes + 1;
}
