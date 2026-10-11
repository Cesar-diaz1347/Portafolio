# ParidadDeudas

Consola .NET 10 que genera el fixture de paridad de la demo Control de cuentas,
`demos-src/control-cuentas/src/api/demo/paridad.fixture.ts`.

Enlaza sin cambios `DeudaCalculoService.cs` y `EstadoDeuda.cs` del repo
[Control-de-Pagos](https://github.com/Cesar-diaz1347/Control-de-Pagos), sin compilar ese proyecto.
Con ese C# real calcula 1551 casos:

- **51 fijos:** redondeo bancario, clamp, inicio futuro a 7 y 8 días, fin de mes, año bisiesto,
  el caso 100/3 y otros.
- **1500 aleatorios** con semilla fija.

También escribe `paridad-informe.md`. Ahí quedan:

- la clase de divergencia documentada: el C# suma un mes cuando aplica `Math.Ceiling` a una
  división decimal, como en 100/3, que da 7 meses en vez de 6;
- las proyecciones con las que el C# lanza una excepción.

## Requisitos

- SDK de .NET 10.
- El repo Control-de-Pagos en una carpeta hermana del portafolio (`..\Control de pagos`). Si está en
  otra ruta, se indica con `ControlPagosRaiz`.

## Regenerar el fixture

```powershell
cd tools/paridad-deudas
dotnet run -c Release -- "<carpeta de salida>"
```

Con el repo en otra ruta:

```powershell
dotnet run -c Release --property:ControlPagosRaiz="C:\ruta\Control de pagos" -- "<carpeta de salida>"
```

Luego:

1. Copia `<carpeta de salida>/paridad.fixture.ts` a `demos-src/control-cuentas/src/api/demo/`.
2. Corre `npm test` en esa copia.

Con el mismo SDK y el mismo código de origen, el archivo sale idéntico byte a byte. Su encabezado
registra el SHA-256 de los `.cs` enlazados, el SDK y la semilla.

Códigos de salida:

| Código | Significado |
|---|---|
| 0 | Archivos generados e invariantes OK |
| 2 | Archivos generados, pero alguna invariante falló (ver el informe) |
| 1 | Error |
