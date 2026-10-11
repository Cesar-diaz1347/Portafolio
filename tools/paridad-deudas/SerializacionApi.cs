using System.Text.Json;
using System.Text.Json.Serialization;

namespace ParidadDeudas;

/// <summary>Texto de enums y fechas tal como lo serializa la API original.</summary>
internal static class SerializacionApi
{
    // Las de AddControllers (JsonSerializerDefaults.Web) más el JsonStringEnumConverter de Program.cs del original.
    private static readonly JsonSerializerOptions Opciones = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public static string Texto<T>(T valor) =>
        JsonSerializer.Deserialize<string>(JsonSerializer.Serialize(valor, Opciones))
        ?? throw new InvalidOperationException($"{valor} no se serializa como texto.");
}
