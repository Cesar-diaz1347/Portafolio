// Genera paridad.fixture.ts y paridad-informe.md con las salidas del DeudaCalculoService real.
// Uso: dotnet run -c Release -- [directorio de salida, por defecto el actual]
// Salida: 0 = archivos generados e invariantes OK · 2 = archivos generados con invariantes incumplidas · 1 = error.
using System.Text;
using ControlPagos.Api.Dtos;
using ParidadDeudas;

const int Semilla = 20261004;
const int CasosAleatorios = 1500;

Console.OutputEncoding = Encoding.UTF8;

try
{
    var directorioSalida = Path.GetFullPath(args.Length > 0 ? args[0] : ".");
    var procedencia = Procedencia.Leer(Semilla);

    List<ResultadoCaso> casos =
    [
        .. CasosFijos.Crear().Select(Evaluador.Evaluar),
        .. new GeneradorAleatorio(Semilla).Generar(CasosAleatorios).Select(Evaluador.Evaluar),
    ];
    var sondas = CasosFijos.SondasDeExcepcion().Select(Evaluador.Evaluar).ToList();
    var problemas = Invariantes.Revisar(casos, sondas);

    var utf8SinBom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);
    var rutaFixture = Path.Combine(directorioSalida, "paridad.fixture.ts");
    var rutaInforme = Path.Combine(directorioSalida, "paridad-informe.md");
    File.WriteAllText(rutaFixture, FixtureTs.Generar(casos, procedencia), utf8SinBom);
    File.WriteAllText(rutaInforme, InformeMarkdown.Generar(casos, sondas, procedencia, problemas), utf8SinBom);

    var fijos = casos.Count(c => c.Entrada.Origen == Origen.Fijo);
    var caso100 = casos.Single(c => c.Entrada.Nota == CasosFijos.NotaCaso100Entre3);
    var divergentes = casos.Where(c => c.DivergeProyeccion).Select(c => c.Entrada.Id).ToList();

    Console.WriteLine($"SDK {procedencia.Sdk} · {procedencia.Runtime}");
    foreach (var fuente in procedencia.Fuentes) Console.WriteLine($"Fuente {fuente.RutaRelativa} sha256 {fuente.Sha256}");
    Console.WriteLine($"Casos: {casos.Count} ({fijos} fijos, {casos.Count - fijos} aleatorios) · sondas de excepción: {sondas.Count}");
    Console.WriteLine("Estados: " + string.Join(", ", Enum.GetValues<EstadoDeuda>().Select(e => $"{e}={casos.Count(c => c.Estado == e)}")));
    Console.WriteLine($"Caso 100/3 ({caso100.Entrada.Id}): C# = {Calendario.Iso(caso100.FechaFinProyectada)} ({caso100.MesesRestantesCs} meses) · "
        + $"exacto = {Calendario.Iso(caso100.Exacta.Fecha)} ({caso100.Exacta.MesesRestantes} meses)");
    Console.WriteLine($"Math.Ceiling(200m / (100m / 3m)) = {InformeMarkdown.CeilingConLiterales(200m, 100m, 3)}");
    Console.WriteLine($"Clase de divergencia: {divergentes.Count} casos ({string.Join(", ", divergentes.Take(12))}{(divergentes.Count > 12 ? ", …" : "")})");
    Console.WriteLine($"Porcentaje distinto del redondeo bancario exacto: {casos.Count(c => c.DivergePorcentaje)}");
    foreach (var sonda in sondas) Console.WriteLine($"{sonda.Entrada.Id}: {sonda.ExcepcionProyeccion ?? "(no lanzó)"}");
    Console.WriteLine(problemas.Count == 0 ? "Invariantes: OK" : $"Invariantes incumplidas: {problemas.Count}");
    foreach (var problema in problemas) Console.WriteLine($"  - {problema}");
    Console.WriteLine($"Escrito: {rutaFixture}");
    Console.WriteLine($"Escrito: {rutaInforme}");

    return problemas.Count == 0 ? 0 : 2;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Error: {ex}");
    return 1;
}
