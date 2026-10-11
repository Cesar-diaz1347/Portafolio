using ControlPagos.Api.Services;

namespace ParidadDeudas;

/// <summary>Evalúa cada caso con el DeudaCalculoService real, con los mismos argumentos que usa DeudasController.</summary>
internal static class Evaluador
{
    public static ResultadoCaso Evaluar(EntradaCaso caso)
    {
        var saldoInicial = Dinero.DeCentavos(caso.SaldoInicialCent);
        var saldoPagado = Dinero.DeCentavos(caso.SaldoPagadoCent);
        var saldoRemanente = saldoInicial - saldoPagado;

        var porcentaje = DeudaCalculoService.CalcularPorcentajeAvance(saldoInicial, saldoPagado);
        var estado = DeudaCalculoService.CalcularEstado(
            saldoRemanente, caso.FechaInicio, caso.FechaFinPropuesta, caso.UltimoPago, caso.Hoy);
        var (fechaFinProyectada, excepcion) = ProyectarConCSharp(saldoPagado, saldoRemanente, caso);

        return new ResultadoCaso(
            caso, porcentaje, estado, fechaFinProyectada, excepcion,
            ModeloExacto.Proyeccion(caso),
            ModeloExacto.PorcentajeDecimas(caso.SaldoInicialCent, caso.SaldoPagadoCent));
    }

    private static (DateOnly? Fecha, string? Excepcion) ProyectarConCSharp(
        decimal saldoPagado, decimal saldoRemanente, EntradaCaso caso)
    {
        try
        {
            var fecha = DeudaCalculoService.CalcularFechaFinProyectada(
                saldoPagado, saldoRemanente, caso.FechaInicio, caso.Hoy);
            return (fecha, null);
        }
        // Con un ritmo diminuto los meses restantes desbordan int o el rango de DateOnly.
        catch (Exception ex) when (ex is OverflowException or ArgumentOutOfRangeException)
        {
            return (null, $"{ex.GetType().Name}: {ex.Message.ReplaceLineEndings(" ")}");
        }
    }
}
