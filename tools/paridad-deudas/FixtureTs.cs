using System.Globalization;
using ControlPagos.Api.Dtos;

namespace ParidadDeudas;

/// <summary>Escribe paridad.fixture.ts: un objeto por línea, con las claves en el orden de la interfaz.</summary>
internal static class FixtureTs
{
    public static string Generar(IReadOnlyList<ResultadoCaso> casos, Procedencia procedencia)
    {
        var fijos = casos.Count(c => c.Entrada.Origen == Origen.Fijo);
        var divergentes = casos.Count(c => c.DivergeProyeccion);
        var idCaso100Entre3 = casos.Single(c => c.Entrada.Nota == CasosFijos.NotaCaso100Entre3).Entrada.Id;
        var estados = string.Join(" | ", Enum.GetValues<EstadoDeuda>().Select(e => Literal(SerializacionApi.Texto(e))));

        List<string> ts =
        [
            "// GENERADO por la consola ParidadDeudas (.NET 10). No editar a mano: se regenera con",
            "// `dotnet run -c Release -- <directorio de salida>`.",
            "//",
            "// Las salidas las calcula el C# real de Control-de-Pagos, enlazado sin cambios:",
            .. procedencia.Fuentes.Select(f => $"//   {f.RutaRelativa}  sha256 {f.Sha256}"),
            $"// SDK {procedencia.Sdk} · {procedencia.Runtime} · semilla {procedencia.Semilla}.",
            $"// {casos.Count} casos: {fijos} fijos y {casos.Count - fijos} aleatorios; {divergentes} en la clase de divergencia.",
            "",
            "export interface CasoParidad {",
            "  /** F01… casos fijos; A0001… lote aleatorio. */",
            "  id: string;",
            "  origen: 'fijo' | 'aleatorio';",
            "  nota?: string;",
            "  /** Montos en centavos enteros. Remanente = inicial − pagado, como la columna calculada de la BD. */",
            "  saldoInicialCent: number;",
            "  saldoPagadoCent: number;",
            "  /** Fechas ISO yyyy-MM-dd (DateOnly). */",
            "  fechaInicio: string;",
            "  fechaFinPropuesta: string;",
            "  /** Fecha del pago más reciente; null si la deuda no tiene pagos. */",
            "  ultimoPago: string | null;",
            "  hoy: string;",
            "  /** Salidas del C# real, tal como las serializa la API. */",
            "  porcentajeAvance: number;",
            $"  estado: {estados};",
            "  fechaFinProyectada: string | null;",
            "  /**",
            "   * Solo en la clase de divergencia documentada: hoy + ceil(remanente·meses/pagado) con",
            "   * aritmética exacta. Ahí remanente·meses es múltiplo de pagado y el C# da un mes más,",
            $"   * porque aplica Math.Ceiling a un cociente decimal ya redondeado (caso {idCaso100Entre3}: 100/3).",
            "   */",
            "  fechaFinProyectadaExacta?: string;",
            "}",
            "",
            "export const CASOS_PARIDAD: CasoParidad[] = [",
            .. casos.Select(Linea),
            "];",
        ];
        return string.Join('\n', ts) + "\n";
    }

    private static string Linea(ResultadoCaso caso)
    {
        var e = caso.Entrada;
        List<string> campos = [$"id: {Literal(e.Id)}", $"origen: {Literal(e.Origen == Origen.Fijo ? "fijo" : "aleatorio")}"];
        if (e.Nota is not null) campos.Add($"nota: {Literal(e.Nota)}");
        campos.AddRange(
        [
            $"saldoInicialCent: {e.SaldoInicialCent}",
            $"saldoPagadoCent: {e.SaldoPagadoCent}",
            $"fechaInicio: {Fecha(e.FechaInicio)}",
            $"fechaFinPropuesta: {Fecha(e.FechaFinPropuesta)}",
            $"ultimoPago: {Fecha(e.UltimoPago)}",
            $"hoy: {Fecha(e.Hoy)}",
            $"porcentajeAvance: {Numero(caso.PorcentajeAvance)}",
            $"estado: {Literal(SerializacionApi.Texto(caso.Estado))}",
            $"fechaFinProyectada: {Fecha(caso.FechaFinProyectada)}",
        ]);
        if (caso.DivergeProyeccion) campos.Add($"fechaFinProyectadaExacta: {Fecha(caso.Exacta.Fecha)}");
        return $"  {{ {string.Join(", ", campos)} }},";
    }

    private static string Fecha(DateOnly? fecha) => fecha is { } valor ? Literal(SerializacionApi.Texto(valor)) : "null";

    // Forma más corta del número (12.2, 50, 100): mismo valor que el decimal que serializa la API.
    private static string Numero(decimal valor)
    {
        if (valor == 0) return "0";
        var texto = valor.ToString(CultureInfo.InvariantCulture);
        return texto.Contains('.') ? texto.TrimEnd('0').TrimEnd('.') : texto;
    }

    private static string Literal(string texto) => $"'{texto.Replace("\\", "\\\\").Replace("'", "\\'")}'";
}
