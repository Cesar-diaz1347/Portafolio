// @ts-check
/**
 * Reglas de calendario de la demo de reservas de citas médicas.
 *
 * Funciones puras: no leen el reloj (reciben `ahora`) ni tocan `window`, así se prueban con
 * `node --test`. Los días son texto `yyyy-MM-dd` en hora local y los instantes son `Date`.
 * Las fechas locales se construyen desde sus partes, nunca con `new Date('yyyy-MM-dd')`, que
 * el navegador interpreta como medianoche UTC (en Guatemala, el día anterior a las 18:00).
 */

/** @typedef {string} FechaISO Día local con formato `yyyy-MM-dd`. */

/**
 * @typedef {object} Menu
 * @property {number} id Id estable del servicio (1 a 4).
 * @property {string} nombre «Servicio 1» a «Servicio 4», según su posición en el día.
 * @property {string} plato
 * @property {string} descripcion
 */

/** Plazo de gestión: «Reservas y cancelaciones disponibles hasta jueves 5:00 p.m.». */
const HORA_LIMITE = 17;
const JUEVES_ANTES_DEL_LUNES = 4;
const PATRON_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Los 4 servicios médicos que se ofrecen cada día hábil. Se conservan los nombres internos
 * (`plato`, `menuId`) del contrato original para no tocar el resto de la app: aquí `plato` es el servicio.
 */
export const PLATOS = Object.freeze([
  { id: 1, plato: 'Dermatología', descripcion: 'Consulta de la piel, el cabello y las uñas.' },
  { id: 2, plato: 'Pediatría', descripcion: 'Control y atención médica para niños y adolescentes.' },
  { id: 3, plato: 'Medicina general', descripcion: 'Consulta médica integral y chequeo preventivo.' },
  { id: 4, plato: 'Oftalmología', descripcion: 'Examen de la vista y cuidado de los ojos.' },
]);

/**
 * Día local de un instante.
 * @param {Date} [ahora]
 * @returns {FechaISO}
 */
export function hoyISO(ahora = new Date()) {
  return formatear(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate());
}

/**
 * true si el valor es un día real con formato `yyyy-MM-dd`.
 * @param {unknown} valor
 * @returns {valor is FechaISO}
 */
export function esFechaISO(valor) {
  if (typeof valor !== 'string') return false;
  const coincidencia = PATRON_ISO.exec(valor);
  if (!coincidencia) return false;
  const [anio, mes, dia] = coincidencia.slice(1).map(Number);
  if (anio < 1) return false;
  const fecha = fechaLocal(anio, mes, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

/**
 * Lunes a viernes.
 * @param {FechaISO} fecha
 */
export function esDiaHabil(fecha) {
  const diaSemana = aFechaLocal(fecha).getDay();
  return diaSemana >= 1 && diaSemana <= 5;
}

/**
 * «Lunes», «Martes»…
 * @param {FechaISO} fecha
 */
export function nombreDia(fecha) {
  return NOMBRES_DIA[aFechaLocal(fecha).getDay()];
}

/**
 * @param {FechaISO} fecha
 * @param {number} dias
 * @returns {FechaISO}
 */
export function sumarDias(fecha, dias) {
  const [anio, mes, dia] = partes(fecha);
  return hoyISO(fechaLocal(anio, mes, dia + dias));
}

/**
 * Lunes de la semana (de lunes a domingo) que contiene la fecha.
 * @param {FechaISO} fecha
 * @returns {FechaISO}
 */
export function lunesDeLaSemana(fecha) {
  const diasDesdeLunes = (aFechaLocal(fecha).getDay() + 6) % 7;
  return sumarDias(fecha, -diasDesdeLunes);
}

/**
 * Último instante para reservar o cancelar la cita de `fecha`: el jueves de la semana
 * anterior a las 5:00 p.m. (17:00 en punto ya está fuera de plazo).
 * @param {FechaISO} fecha
 * @returns {Date}
 */
export function fechaLimiteGestion(fecha) {
  const [anio, mes, dia] = partes(sumarDias(lunesDeLaSemana(fecha), -JUEVES_ANTES_DEL_LUNES));
  return fechaLocal(anio, mes, dia, HORA_LIMITE);
}

/**
 * Se puede reservar o cancelar: es día hábil y todavía no llega el jueves anterior a las 17:00.
 * @param {FechaISO} fecha
 * @param {Date} ahora
 */
export function esGestionable(fecha, ahora) {
  return esDiaHabil(fecha) && ahora.getTime() < fechaLimiteGestion(fecha).getTime();
}

/**
 * Primer día que aún se puede reservar: el lunes de la próxima semana o, si ya pasó el jueves
 * a las 17:00, el de la semana siguiente.
 * @param {Date} ahora
 * @returns {FechaISO}
 */
export function primeraFechaReservable(ahora) {
  const lunesProximo = sumarDias(lunesDeLaSemana(hoyISO(ahora)), 7);
  return esGestionable(lunesProximo, ahora) ? lunesProximo : sumarDias(lunesProximo, 7);
}

/**
 * Los 5 días hábiles de la semana que se gestiona (la de `primeraFechaReservable`). Es la
 * semana de «Mis reservas de la semana»: la que el usuario todavía puede completar.
 * @param {Date} ahora
 * @returns {FechaISO[]}
 */
export function semanaVisible(ahora) {
  const lunes = primeraFechaReservable(ahora);
  return [0, 1, 2, 3, 4].map((dias) => sumarDias(lunes, dias));
}

/**
 * Los 4 servicios disponibles del día, siempre en el mismo orden.
 * Fines de semana: lista vacía (no hay atención).
 * @param {FechaISO} fecha
 * @returns {Menu[]}
 */
export function menusDelDia(fecha) {
  if (!esDiaHabil(fecha)) return [];
  return PLATOS.map(({ id, plato, descripcion }, posicion) => ({
    id,
    nombre: `Servicio ${posicion + 1}`,
    plato,
    descripcion,
  }));
}

/**
 * «Jueves 8/10 a las 5:00 p.m.»: texto del límite para mensajes al usuario.
 * @param {FechaISO} fecha
 */
export function describirLimite(fecha) {
  const limite = fechaLimiteGestion(fecha);
  return `${NOMBRES_DIA[limite.getDay()].toLowerCase()} ${limite.getDate()}/${limite.getMonth() + 1} a las 5:00 p.m.`;
}

/**
 * @param {FechaISO} fecha
 * @returns {[number, number, number]}
 */
function partes(fecha) {
  if (!esFechaISO(fecha)) throw new RangeError(`Fecha inválida: "${fecha}" (se espera yyyy-MM-dd).`);
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return [anio, mes, dia];
}

/** @param {FechaISO} fecha */
function aFechaLocal(fecha) {
  const [anio, mes, dia] = partes(fecha);
  return fechaLocal(anio, mes, dia);
}

/**
 * Instante local; `setFullYear` evita que los años 0–99 se lean como 1900–1999.
 * @param {number} anio
 * @param {number} mes 1 a 12 (se normaliza si se pasa de rango).
 * @param {number} dia
 * @param {number} [hora]
 */
function fechaLocal(anio, mes, dia, hora = 0) {
  const fecha = new Date(2000, 0, 1, hora, 0, 0, 0);
  fecha.setFullYear(anio, mes - 1, dia);
  return fecha;
}

/**
 * @param {number} anio
 * @param {number} mes
 * @param {number} dia
 * @returns {FechaISO}
 */
function formatear(anio, mes, dia) {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}
