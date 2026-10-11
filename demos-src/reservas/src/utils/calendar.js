import { esDiaHabil, lunesDeLaSemana, nombreDia, sumarDias } from '../services/reglas.js';

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Celdas del mes (lunes primero); `null` rellena hasta el primer día. `mes` va de 0 a 11. */
export function generarCeldasMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  let inicioSemana = primerDia.getDay(); // 0 = domingo
  inicioSemana = inicioSemana === 0 ? 6 : inicioSemana - 1; // lunes = 0

  const celdas = [];
  for (let i = 0; i < inicioSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);
  return celdas;
}

/** `yyyy-MM-dd` a partir de año, mes (0 a 11) y día. */
export function formatearFecha(anio, mes, dia) {
  const mm = String(mes + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

/** Año, mes (0 a 11) y día de una fecha `yyyy-MM-dd`, sin pasar por `new Date('yyyy-MM-dd')`. */
export function partesFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  return { anio, mes: mes - 1, dia };
}

/** «Lunes 12 de octubre». */
export function fechaConDia(fechaISO) {
  const { mes, dia } = partesFecha(fechaISO);
  return `${nombreDia(fechaISO)} ${dia} de ${MESES[mes].toLowerCase()}`;
}

/** «Lunes 12 de octubre de 2026». */
export function fechaLarga(fechaISO) {
  return `${fechaConDia(fechaISO)} de ${partesFecha(fechaISO).anio}`;
}

/** «12/10»: para tarjetas compactas. */
export function fechaCorta(fechaISO) {
  const { mes, dia } = partesFecha(fechaISO);
  return `${dia}/${mes + 1}`;
}

/** «12/10/2026»: día, mes y año con dos dígitos para día y mes. */
export function fechaNumerica(fechaISO) {
  const { anio, mes, dia } = partesFecha(fechaISO);
  return `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${anio}`;
}

/**
 * Los 42 días (6 semanas completas, lunes primero) que ocupa el calendario de un mes: los del mes y,
 * a los lados, los del mes anterior y el siguiente. Siempre son 6 filas, así el calendario no cambia de alto.
 * `mes` va de 0 a 11.
 */
export function diasVisiblesDelMes(anio, mes) {
  const inicio = lunesDeLaSemana(formatearFecha(anio, mes, 1));
  return Array.from({ length: 42 }, (_, posicion) => sumarDias(inicio, posicion));
}

/** Suma (o resta) meses; si el día no existe en el mes de destino, queda su último día (31 de enero + 1 mes = 28 de febrero). */
export function sumarMeses(fechaISO, meses) {
  const { anio, mes, dia } = partesFecha(fechaISO);
  const destino = new Date(anio, mes + meses, 1);
  const anioDestino = destino.getFullYear();
  const mesDestino = destino.getMonth();
  const ultimoDia = new Date(anioDestino, mesDestino + 1, 0).getDate();
  return formatearFecha(anioDestino, mesDestino, Math.min(dia, ultimoDia));
}

/**
 * Día al que lleva una tecla dentro de un calendario: flechas (±1 día y ±7 días), Inicio y Fin (el lunes y
 * el domingo de esa semana) y RePág / AvPág (±1 mes; con Mayús, ±1 año). Nunca pasa de `minimo`.
 * Devuelve `null` si la tecla no mueve el foco.
 */
export function moverFecha(fechaISO, tecla, { minimo, conMayus = false } = {}) {
  let destino;
  switch (tecla) {
    case 'ArrowLeft':
      destino = sumarDias(fechaISO, -1);
      break;
    case 'ArrowRight':
      destino = sumarDias(fechaISO, 1);
      break;
    case 'ArrowUp':
      destino = sumarDias(fechaISO, -7);
      break;
    case 'ArrowDown':
      destino = sumarDias(fechaISO, 7);
      break;
    case 'Home':
      destino = lunesDeLaSemana(fechaISO);
      break;
    case 'End':
      destino = sumarDias(lunesDeLaSemana(fechaISO), 6);
      break;
    case 'PageUp':
      destino = sumarMeses(fechaISO, conMayus ? -12 : -1);
      break;
    case 'PageDown':
      destino = sumarMeses(fechaISO, conMayus ? 12 : 1);
      break;
    default:
      return null;
  }
  return minimo && destino < minimo ? minimo : destino;
}

/** Primer día de lunes a viernes desde `fechaISO` (ella incluida). */
export function siguienteDiaHabil(fechaISO) {
  let fecha = fechaISO;
  while (!esDiaHabil(fecha)) fecha = sumarDias(fecha, 1);
  return fecha;
}

/** true si `fechaISO` cae en el mes (0 a 11) y el año indicados. */
export function perteneceAlMes(fechaISO, anio, mes) {
  const partes = partesFecha(fechaISO);
  return partes.anio === anio && partes.mes === mes;
}

/** Primera letra en mayúscula: «jueves 8/10» pasa a «Jueves 8/10». */
export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
