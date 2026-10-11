/**
 * Fechas de calendario como texto ISO `yyyy-MM-dd`, con la semántica de `DateOnly` de .NET.
 *
 * Nunca se usa `new Date('yyyy-MM-dd')`: el navegador lo interpreta como medianoche UTC y, en
 * zonas al oeste de UTC (Guatemala es UTC−6), la fecha local queda un día antes. Los días se
 * cuentan con aritmética entera de calendario, sin depender de la zona horaria.
 */

/** Fecha de calendario `yyyy-MM-dd`, equivalente a `DateOnly`. */
export type FechaIso = string;

interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
}

const PATRON_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
/** `DateOnly.DayNumber` de 1970-01-01 (días desde 0001-01-01). */
const NUMERO_DIA_EPOCA_UNIX = 719_162;
/** `DateOnly.MaxValue.DayNumber` (9999-12-31). */
const NUMERO_DIA_MAXIMO = 3_652_058;
/** Índice de mes (año·12 + mes − 1) de enero del año 1 y de diciembre de 9999. */
const INDICE_MES_MINIMO = 12;
const INDICE_MES_MAXIMO = 9999 * 12 + 11;

/** true si el valor es una fecha real `yyyy-MM-dd` entre 0001-01-01 y 9999-12-31. */
export function esFechaIso(valor: unknown): valor is FechaIso {
  return typeof valor === 'string' && leerPartes(valor) !== null;
}

/** Fecha local de hoy (no UTC): la misma que el usuario ve en su calendario. */
export function hoyLocal(ahora: Date = new Date()): FechaIso {
  return formatear({ anio: ahora.getFullYear(), mes: ahora.getMonth() + 1, dia: ahora.getDate() });
}

/** Días transcurridos desde 0001-01-01, igual que `DateOnly.DayNumber`. */
export function numeroDia(fecha: FechaIso): number {
  const { anio, mes, dia } = partesObligatorias(fecha);
  return diasDesdeEpocaUnix(anio, mes, dia) + NUMERO_DIA_EPOCA_UNIX;
}

/** Inversa de `numeroDia` (`DateOnly.FromDayNumber`). */
export function fechaDesdeNumeroDia(numero: number): FechaIso {
  if (!Number.isInteger(numero) || numero < 0 || numero > NUMERO_DIA_MAXIMO) {
    throw new RangeError(`El día ${numero} está fuera del rango de fechas (0001-01-01 a 9999-12-31).`);
  }
  return formatear(civilDesdeDiasEpocaUnix(numero - NUMERO_DIA_EPOCA_UNIX));
}

/** `DateOnly.AddDays`. */
export function sumarDias(fecha: FechaIso, dias: number): FechaIso {
  return fechaDesdeNumeroDia(numeroDia(fecha) + dias);
}

/** Cambios de mes calendario entre dos fechas, `(año₂ − año₁)·12 + mes₂ − mes₁`; ignora el día. */
export function mesesEntre(desde: FechaIso, hasta: FechaIso): number {
  const a = partesObligatorias(desde);
  const b = partesObligatorias(hasta);
  return (b.anio - a.anio) * 12 + b.mes - a.mes;
}

/**
 * `DateOnly.AddMonths`: el mismo día del mes destino o, si no existe, el último
 * (31 ene + 1 mes = 28 feb, o 29 en bisiesto). Devuelve null si el resultado sale del
 * rango de `DateOnly` (años 1 a 9999), donde .NET lanza `ArgumentOutOfRangeException`.
 */
export function sumarMeses(fecha: FechaIso, meses: number): FechaIso | null {
  if (!Number.isSafeInteger(meses)) throw new RangeError(`Los meses deben ser un entero: ${meses}.`);
  const { anio, mes, dia } = partesObligatorias(fecha);
  const indiceDestino = anio * 12 + mes - 1 + meses;
  if (indiceDestino < INDICE_MES_MINIMO || indiceDestino > INDICE_MES_MAXIMO) return null;

  const anioDestino = Math.floor(indiceDestino / 12);
  const mesDestino = (indiceDestino % 12) + 1;
  return formatear({ anio: anioDestino, mes: mesDestino, dia: Math.min(dia, diasEnMes(anioDestino, mesDestino)) });
}

function leerPartes(texto: string): PartesFecha | null {
  const coincidencia = PATRON_ISO.exec(texto);
  if (!coincidencia) return null;
  const [anio, mes, dia] = coincidencia.slice(1).map(Number);
  if (anio < 1 || mes < 1 || mes > 12 || dia < 1 || dia > diasEnMes(anio, mes)) return null;
  return { anio, mes, dia };
}

function partesObligatorias(fecha: FechaIso): PartesFecha {
  const partes = leerPartes(fecha);
  if (!partes) throw new RangeError(`Fecha inválida: "${fecha}" (se espera yyyy-MM-dd).`);
  return partes;
}

function formatear({ anio, mes, dia }: PartesFecha): FechaIso {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

function diasEnMes(anio: number, mes: number): number {
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return mes === 4 || mes === 6 || mes === 9 || mes === 11 ? 30 : 31;
}

// Algoritmos days_from_civil y civil_from_days de Howard Hinnant (calendario gregoriano
// proléptico, el mismo de DateOnly), con 1970-01-01 como día 0.
function diasDesdeEpocaUnix(anio: number, mes: number, dia: number): number {
  const y = mes <= 2 ? anio - 1 : anio;
  const era = Math.floor(y / 400);
  const anioDeEra = y - era * 400;
  const diaDelAnio = Math.floor((153 * (mes > 2 ? mes - 3 : mes + 9) + 2) / 5) + dia - 1;
  const diaDeEra = anioDeEra * 365 + Math.floor(anioDeEra / 4) - Math.floor(anioDeEra / 100) + diaDelAnio;
  return era * 146_097 + diaDeEra - 719_468;
}

function civilDesdeDiasEpocaUnix(dias: number): PartesFecha {
  const z = dias + 719_468;
  const era = Math.floor(z / 146_097);
  const diaDeEra = z - era * 146_097;
  const anioDeEra = Math.floor(
    (diaDeEra - Math.floor(diaDeEra / 1460) + Math.floor(diaDeEra / 36_524) - Math.floor(diaDeEra / 146_096)) / 365,
  );
  const diaDelAnio = diaDeEra - (365 * anioDeEra + Math.floor(anioDeEra / 4) - Math.floor(anioDeEra / 100));
  const mesDesdeMarzo = Math.floor((5 * diaDelAnio + 2) / 153);
  const dia = diaDelAnio - Math.floor((153 * mesDesdeMarzo + 2) / 5) + 1;
  const mes = mesDesdeMarzo < 10 ? mesDesdeMarzo + 3 : mesDesdeMarzo - 9;
  const anio = anioDeEra + era * 400 + (mes <= 2 ? 1 : 0);
  return { anio, mes, dia };
}
