import type { EstadoDeuda } from '../../types/deuda';
import { mesesEntre, numeroDia, sumarMeses, type FechaIso } from './fechas';

/**
 * Port de `DeudaCalculoService` (backend .NET de Control-de-Pagos) con montos en centavos
 * enteros. Las funciones y el orden de los parámetros son los del C#.
 *
 * Paridad: `paridad.fixture.ts` guarda 1551 casos calculados por el C# real y las pruebas
 * comparan este port con ellos. Hay dos diferencias documentadas, ambas en la fecha fin
 * proyectada:
 * 1. Se usa `ceil(remanente·meses / pagado)` exacto. El C# divide en `decimal` y, cuando el
 *    cociente exacto es entero, a veces suma un mes de más (100/3 → 7 meses en vez de 6).
 * 2. Si la proyección sale del rango de fechas (después del año 9999), se devuelve null y la
 *    pantalla muestra «—». El C# lanza una excepción y la API respondería 500.
 */

const DIAS_MARGEN_PROXIMO = 7;

/** Porcentaje pagado con 1 decimal, redondeado a la mitad hacia el par como `Math.Round` de .NET. */
export function calcularPorcentajeAvance(saldoInicialCent: number, saldoPagadoCent: number): number {
  if (saldoInicialCent <= 0) return 0;
  // El Math.Clamp(…, 0, 100) del C# se resuelve antes de multiplicar para que la cuenta
  // entera no pase de 2^53, por grande que sea la suma de los pagos.
  if (saldoPagadoCent <= 0) return 0;
  if (saldoPagadoCent >= saldoInicialCent) return 100;
  return redondearMitadAlPar(saldoPagadoCent * 1000, saldoInicialCent) / 10;
}

export function calcularEstado(
  saldoRemanenteCent: number,
  fechaInicio: FechaIso,
  fechaFinPropuesta: FechaIso,
  ultimoPago: FechaIso | null,
  hoy: FechaIso,
): EstadoDeuda {
  if (saldoRemanenteCent <= 0) return 'Pagada';

  const diaHoy = numeroDia(hoy);
  const diasParaInicio = numeroDia(fechaInicio) - diaHoy;
  if (diasParaInicio > 0) return diasParaInicio <= DIAS_MARGEN_PROXIMO ? 'Proximo' : 'Lejana';

  const fechaProximoPago = sumarMeses(ultimoPago ?? fechaInicio, 1);
  // Solo ocurre con fechas de diciembre de 9999; ahí el C# también lanza.
  if (fechaProximoPago === null) throw new RangeError('La fecha del próximo pago sale del rango de fechas.');

  const diasParaFin = numeroDia(fechaFinPropuesta) - diaHoy;
  const diasParaProximoPago = numeroDia(fechaProximoPago) - diaHoy;
  if (diasParaFin < 0 || diasParaProximoPago < 0) return 'Vencido';

  return Math.min(diasParaFin, diasParaProximoPago) <= DIAS_MARGEN_PROXIMO ? 'Proximo' : 'AlDia';
}

/** Fecha en que se terminaría de pagar al ritmo mensual de lo pagado hasta hoy, o null. */
export function calcularFechaFinProyectada(
  saldoPagadoCent: number,
  saldoRemanenteCent: number,
  fechaInicio: FechaIso,
  hoy: FechaIso,
): FechaIso | null {
  if (saldoRemanenteCent <= 0) return null;

  const mesesTranscurridos = Math.max(1, mesesEntre(fechaInicio, hoy));
  if (saldoPagadoCent <= 0) return null;

  const mesesRestantes = dividirHaciaArriba(saldoRemanenteCent * mesesTranscurridos, saldoPagadoCent);
  return sumarMeses(hoy, mesesRestantes);
}

function redondearMitadAlPar(numerador: number, denominador: number): number {
  const { cociente, resto } = dividirEntero(numerador, denominador);
  const dobleResto = resto * 2;
  const subir = dobleResto > denominador || (dobleResto === denominador && cociente % 2 !== 0);
  return subir ? cociente + 1 : cociente;
}

function dividirHaciaArriba(dividendo: number, divisor: number): number {
  const { cociente, resto } = dividirEntero(dividendo, divisor);
  return resto > 0 ? cociente + 1 : cociente;
}

/** División entera exacta de enteros no negativos menores que 2^53. */
function dividirEntero(dividendo: number, divisor: number): { cociente: number; resto: number } {
  let cociente = Math.floor(dividendo / divisor);
  let resto = dividendo - cociente * divisor;
  // El cociente en coma flotante puede quedar a una unidad del exacto: se corrige con el resto.
  if (resto < 0) {
    cociente -= 1;
    resto += divisor;
  } else if (resto >= divisor) {
    cociente += 1;
    resto -= divisor;
  }
  return { cociente, resto };
}
