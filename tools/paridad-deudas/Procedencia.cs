using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace ParidadDeudas;

internal sealed record FuenteEnlazada(string RutaRelativa, string Sha256);

/// <summary>Con qué se generó el fixture: SDK, runtime, semilla y versión exacta de las fuentes enlazadas.</summary>
internal sealed record Procedencia(string Sdk, string Runtime, int Semilla, IReadOnlyList<FuenteEnlazada> Fuentes)
{
    // Los metadatos los escribe el .csproj (AssemblyMetadata) al compilar.
    public static Procedencia Leer(int semilla)
    {
        var metadatos = typeof(Procedencia).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .ToDictionary(a => a.Key, a => a.Value ?? "");
        var raiz = metadatos["ControlPagosRaiz"];

        var fuentes = metadatos
            .Where(m => m.Key.StartsWith("Fuente.", StringComparison.Ordinal))
            .OrderBy(m => m.Key, StringComparer.Ordinal)
            .Select(m => new FuenteEnlazada(m.Value.Replace('\\', '/'), Sha256(Path.Combine(raiz, m.Value))))
            .ToList();

        return new Procedencia(metadatos["SdkVersion"], RuntimeInformation.FrameworkDescription, semilla, fuentes);
    }

    private static string Sha256(string ruta) => Convert.ToHexStringLower(SHA256.HashData(File.ReadAllBytes(ruta)));
}
