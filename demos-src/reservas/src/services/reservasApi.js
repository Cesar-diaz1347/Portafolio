// @ts-check
/**
 * API simulada de la demo de reservas: reemplaza los endpoints .NET marcados con `BACKEND:`
 * en la app original. Una sola fuente de datos (clave `reservas.demo.v2`), sembrada en
 * relación con hoy: la semana visible trae 3 días reservados y 2 pendientes, más historial.
 *
 * No importa React ni toca `window` ni `localStorage` al cargar: el storage se busca en cada uso.
 */
import {
  describirLimite,
  esDiaHabil,
  esFechaISO,
  esGestionable,
  fechaLimiteGestion,
  hoyISO,
  menusDelDia,
  nombreDia,
  primeraFechaReservable,
  semanaVisible,
  sumarDias,
} from './reglas.js';

/** @typedef {import('./reglas.js').FechaISO} FechaISO */
/** @typedef {import('./reglas.js').Menu} Menu */

/** @typedef {'NO_ENCONTRADO' | 'VALIDACION' | 'DUPLICADA' | 'FUERA_DE_PLAZO' | 'NO_DISPONIBLE'} CodigoError */

/**
 * @typedef {object} Usuario
 * @property {number} id
 * @property {string} nombre
 * @property {string} iniciales
 */

/**
 * Un día de «Mis reservas de la semana».
 * @typedef {object} DiaSemana
 * @property {string} dia «Lunes» a «Viernes».
 * @property {FechaISO} fecha
 * @property {'reservado' | 'pendiente'} estado
 * @property {string | null} plato
 * @property {number | null} reservaId
 * @property {string | null} lugar
 * @property {boolean} gestionable Si todavía se puede reservar o cancelar.
 * @property {string} limiteGestion Límite local con formato `yyyy-MM-ddTHH:mm`.
 */

/**
 * Una reserva, como la muestra el calendario de «Mis reservas».
 * @typedef {object} ReservaDelDia
 * @property {number} id
 * @property {FechaISO} fecha
 * @property {string} plato
 * @property {string} lugar
 * @property {string} horario
 * @property {boolean} gestionable
 * @property {string} limiteGestion
 */

/**
 * @typedef {object} SolicitudReserva
 * @property {number} usuarioId
 * @property {string} sucursal
 * @property {FechaISO} fecha
 * @property {number} menuId Id del plato, de `obtenerMenus`.
 */

/**
 * @typedef {object} ReservaGuardada
 * @property {number} id
 * @property {number} usuarioId
 * @property {FechaISO} fecha
 * @property {string} sucursal
 * @property {number} menuId
 * @property {string} plato
 */

/**
 * @typedef {object} Notificacion
 * @property {number} id
 * @property {string} texto
 * @property {boolean} leida
 */

/**
 * @typedef {object} DatosReservas
 * @property {1} version
 * @property {FechaISO} sembradoEl Día local de la siembra.
 * @property {FechaISO} semanaSembrada Lunes de la semana visible al sembrar.
 * @property {boolean} modificado true desde el primer cambio del usuario.
 * @property {number} siguienteId
 * @property {ReservaGuardada[]} reservas
 * @property {Notificacion[]} notificaciones
 */

/** @typedef {Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>} StorageMinimo */

/**
 * @typedef {object} ReservasApi
 * @property {() => Promise<Usuario>} obtenerUsuario
 * @property {() => Promise<string[]>} obtenerSucursales
 * @property {(sucursal: string, fecha: FechaISO) => Promise<Menu[]>} obtenerMenus Lista vacía en fin de semana.
 * @property {(usuarioId: number) => Promise<DiaSemana[]>} obtenerReservasSemana
 * @property {(usuarioId: number, mes1a12: number, anio: number) => Promise<Record<FechaISO, ReservaDelDia>>} obtenerReservasCalendario
 * @property {(usuarioId: number) => Promise<number>} obtenerNotificacionesNoLeidas
 * @property {(solicitud: SolicitudReserva) => Promise<ReservaDelDia>} crearReserva
 * @property {(id: number) => Promise<void>} cancelarReserva
 * @property {() => Promise<void>} cerrarSesion
 * @property {() => void} reiniciarDemo Borra solo la clave de esta demo; la próxima lectura vuelve a sembrar.
 */

/** Clave propia: todo cesar-diaz1347.github.io comparte el mismo localStorage. */
export const CLAVE_DEMO = 'reservas.demo.v2';

const USUARIO_DEMO = Object.freeze({ id: 1, nombre: 'María García', iniciales: 'MG' });
const SUCURSALES = Object.freeze(['Torre Norte', 'Campus Sur']);
const HORARIO = '8:00 a.m. a 4:00 p.m.';

/** @type {Record<CodigoError, number>} */
const STATUS_POR_CODIGO = {
  NO_ENCONTRADO: 404,
  VALIDACION: 400,
  DUPLICADA: 409,
  FUERA_DE_PLAZO: 422,
  NO_DISPONIBLE: 503,
};

/** @type {Record<CodigoError, string>} */
const MENSAJE_POR_CODIGO = {
  NO_ENCONTRADO: 'No se encontró lo que buscabas.',
  VALIDACION: 'Revisa los datos de la reserva.',
  DUPLICADA: 'Ya tienes una reserva para ese día.',
  FUERA_DE_PLAZO: 'Ya pasó el plazo para gestionar esa reserva.',
  NO_DISPONIBLE: 'El servicio de reservas no está disponible. Intenta de nuevo en unos segundos.',
};

/** Error de la API simulada: `status` HTTP, `codigo` estable para la UI y `message` en español. */
export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {CodigoError} codigo
   * @param {string} [mensaje]
   */
  constructor(status, codigo, mensaje = MENSAJE_POR_CODIGO[codigo]) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
  }
}

/**
 * @param {object} [opciones]
 * @param {StorageMinimo | null} [opciones.storage] Sin indicar: localStorage si existe. null: solo memoria.
 * @param {() => Date} [opciones.ahora]
 * @param {() => number} [opciones.latenciaMs] Espera simulada por petición (por defecto 0).
 * @param {() => boolean} [opciones.fallar] Si devuelve true, la petición falla con 503.
 * @returns {ReservasApi}
 */
export function crearReservasApi({ storage, ahora = () => new Date(), latenciaMs = () => 0, fallar = () => false } = {}) {
  const almacen = crearAlmacen(storage, ahora);

  /**
   * @template T
   * @param {() => T} operacion
   * @returns {Promise<T>}
   */
  async function atender(operacion) {
    await esperar(latenciaMs());
    if (fallar()) throw crearError('NO_DISPONIBLE');
    return structuredClone(operacion());
  }

  return {
    obtenerUsuario: () => atender(() => ({ ...USUARIO_DEMO })),

    obtenerSucursales: () => atender(() => [...SUCURSALES]),

    obtenerMenus: (sucursal, fecha) =>
      atender(() => {
        validarSucursal(sucursal);
        validarFecha(fecha);
        return menusDelDia(fecha);
      }),

    obtenerReservasSemana: (usuarioId) =>
      atender(() => {
        validarUsuario(usuarioId);
        const momento = ahora();
        const datos = almacen.leer();
        return semanaVisible(momento).map((fecha) => diaSemana(datos, fecha, momento));
      }),

    obtenerReservasCalendario: (usuarioId, mes1a12, anio) =>
      atender(() => {
        validarUsuario(usuarioId);
        if (!Number.isInteger(mes1a12) || mes1a12 < 1 || mes1a12 > 12) {
          throw crearError('VALIDACION', 'El mes debe ser un número del 1 al 12.');
        }
        if (!Number.isInteger(anio) || anio < 1 || anio > 9999) throw crearError('VALIDACION', 'El año no es válido.');

        const prefijo = `${String(anio).padStart(4, '0')}-${String(mes1a12).padStart(2, '0')}-`;
        const momento = ahora();
        /** @type {Record<FechaISO, ReservaDelDia>} */
        const calendario = {};
        for (const reserva of almacen.leer().reservas) {
          if (reserva.usuarioId === usuarioId && reserva.fecha.startsWith(prefijo)) {
            calendario[reserva.fecha] = reservaDelDia(reserva, momento);
          }
        }
        return calendario;
      }),

    obtenerNotificacionesNoLeidas: (usuarioId) =>
      atender(() => {
        validarUsuario(usuarioId);
        return almacen.leer().notificaciones.filter((notificacion) => !notificacion.leida).length;
      }),

    crearReserva: ({ usuarioId, sucursal, fecha, menuId }) =>
      atender(() => {
        validarUsuario(usuarioId);
        validarSucursal(sucursal);
        validarFecha(fecha);
        if (!esDiaHabil(fecha)) throw crearError('VALIDACION', 'Solo se reservan citas de lunes a viernes.');
        const menu = menusDelDia(fecha).find((opcion) => opcion.id === menuId);
        if (!menu) throw crearError('VALIDACION', 'Ese servicio no está disponible el día elegido.');

        const momento = ahora();
        if (!esGestionable(fecha, momento)) {
          throw crearError('FUERA_DE_PLAZO', `El plazo para reservar ese día venció el ${describirLimite(fecha)}`);
        }
        const datos = almacen.leer();
        if (datos.reservas.some((reserva) => reserva.usuarioId === usuarioId && reserva.fecha === fecha)) {
          throw crearError('DUPLICADA');
        }

        /** @type {ReservaGuardada} */
        const reserva = { id: datos.siguienteId, usuarioId, fecha, sucursal, menuId: menu.id, plato: menu.plato };
        datos.reservas.push(reserva);
        datos.siguienteId += 1;
        notificar(datos, `Reserva confirmada: ${describirDia(fecha)}, ${menu.plato}.`);
        almacen.guardar(datos);
        return reservaDelDia(reserva, momento);
      }),

    cancelarReserva: (id) =>
      atender(() => {
        const datos = almacen.leer();
        const reserva = datos.reservas.find((guardada) => guardada.id === id);
        if (!reserva) throw crearError('NO_ENCONTRADO', 'No se encontró la reserva.');
        if (!esGestionable(reserva.fecha, ahora())) {
          throw crearError('FUERA_DE_PLAZO', `Ya no se puede cancelar: el plazo venció el ${describirLimite(reserva.fecha)}`);
        }

        datos.reservas = datos.reservas.filter((guardada) => guardada.id !== id);
        notificar(datos, `Reserva cancelada: ${describirDia(reserva.fecha)}.`);
        almacen.guardar(datos);
      }),

    cerrarSesion: () => atender(() => undefined),

    reiniciarDemo: () => almacen.reiniciar(),
  };
}

/** API que usa la app: localStorage (o memoria) y latencia de 250 a 600 ms. */
export const reservasApi = crearReservasApi({ latenciaMs: () => 250 + Math.random() * 350 });

// --- Datos --------------------------------------------------------------------------------------

/**
 * @param {StorageMinimo | null | undefined} storage
 * @param {() => Date} ahora
 */
function crearAlmacen(storage, ahora) {
  /** @type {DatosReservas | null} */
  let memoria = null;
  // Si el navegador bloquea o llena el storage, la demo sigue funcionando en memoria.
  let storageDisponible = true;

  /** @returns {StorageMinimo | null} */
  function obtenerStorage() {
    if (storage === null || !storageDisponible) return null;
    if (storage !== undefined) return storage;
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null; // SecurityError con las cookies bloqueadas
    }
  }

  /** @returns {DatosReservas | null} */
  function leerGuardados() {
    const destino = obtenerStorage();
    if (!destino) return memoria;
    try {
      const texto = destino.getItem(CLAVE_DEMO);
      return texto === null ? null : interpretar(texto);
    } catch {
      storageDisponible = false;
      return memoria;
    }
  }

  /** @param {DatosReservas} datos */
  function escribir(datos) {
    memoria = datos;
    const destino = obtenerStorage();
    if (!destino) return;
    try {
      destino.setItem(CLAVE_DEMO, JSON.stringify(datos));
    } catch {
      storageDisponible = false;
    }
  }

  return {
    /**
     * Copia de los datos. Vuelve a sembrar si no hay datos, si están corruptos o si el usuario
     * no cambió nada y ya cambió el día o la semana visible (así las fechas no envejecen).
     * @returns {DatosReservas}
     */
    leer() {
      const momento = ahora();
      const guardados = leerGuardados();
      const vigentes =
        guardados !== null &&
        (guardados.modificado ||
          (guardados.sembradoEl === hoyISO(momento) && guardados.semanaSembrada === primeraFechaReservable(momento)));
      if (guardados && vigentes) return structuredClone(guardados);

      const semilla = crearSemilla(momento);
      escribir(semilla);
      return structuredClone(semilla);
    },

    /** @param {DatosReservas} datos */
    guardar(datos) {
      escribir(structuredClone({ ...datos, modificado: true }));
    },

    reiniciar() {
      memoria = null;
      const destino = obtenerStorage();
      if (!destino) return;
      try {
        destino.removeItem(CLAVE_DEMO);
      } catch {
        storageDisponible = false;
      }
    },
  };
}

/**
 * Semana visible: lunes, martes y jueves reservados, miércoles y viernes pendientes (como en la
 * app original). Historial: las 4 semanas anteriores, que ya están fuera de plazo.
 * @param {Date} ahora
 * @returns {DatosReservas}
 */
function crearSemilla(ahora) {
  const semana = semanaVisible(ahora);
  /** @type {ReservaGuardada[]} */
  const reservas = [];

  /**
   * @param {FechaISO} fecha
   * @param {number} posicionMenu
   */
  function reservar(fecha, posicionMenu) {
    const menus = menusDelDia(fecha);
    const menu = menus[posicionMenu % menus.length];
    reservas.push({
      id: reservas.length + 1,
      usuarioId: USUARIO_DEMO.id,
      fecha,
      sucursal: SUCURSALES[0],
      menuId: menu.id,
      plato: menu.plato,
    });
  }

  for (let semanasAtras = 4; semanasAtras >= 1; semanasAtras -= 1) {
    const lunes = sumarDias(semana[0], -7 * semanasAtras);
    const dias = semanasAtras % 2 === 0 ? [0, 2, 3] : [1, 4];
    for (const dia of dias) reservar(sumarDias(lunes, dia), semanasAtras + dia);
  }
  for (const dia of [0, 1, 3]) reservar(semana[dia], dia);

  return {
    version: 1,
    sembradoEl: hoyISO(ahora),
    semanaSembrada: semana[0],
    modificado: false,
    siguienteId: reservas.length + 1,
    reservas,
    notificaciones: [
      { id: 1, texto: `Tu reserva del ${describirDia(semana[0])} quedó confirmada.`, leida: false },
      { id: 2, texto: 'Nuevo servicio disponible: Oftalmología.', leida: false },
      { id: 3, texto: 'Recuerda: puedes reservar o cancelar hasta el jueves a las 5:00 p.m.', leida: false },
    ],
  };
}

/** @param {string} texto */
function interpretar(texto) {
  try {
    /** @type {unknown} */
    const valor = JSON.parse(texto);
    return esDatosReservas(valor) ? valor : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} valor
 * @returns {valor is DatosReservas}
 */
function esDatosReservas(valor) {
  if (!esObjeto(valor)) return false;
  const { version, sembradoEl, semanaSembrada, modificado, siguienteId, reservas, notificaciones } = valor;
  if (version !== 1 || !esFechaISO(sembradoEl) || !esFechaISO(semanaSembrada) || typeof modificado !== 'boolean') {
    return false;
  }
  if (!esEnteroPositivo(siguienteId) || !Array.isArray(reservas) || !Array.isArray(notificaciones)) return false;
  if (!reservas.every(esReservaGuardada) || !notificaciones.every(esNotificacion)) return false;

  const ids = new Set(reservas.map((reserva) => reserva.id));
  const dias = new Set(reservas.map((reserva) => `${reserva.usuarioId}|${reserva.fecha}`));
  return ids.size === reservas.length && dias.size === reservas.length && reservas.every((reserva) => reserva.id < siguienteId);
}

/**
 * @param {unknown} valor
 * @returns {valor is ReservaGuardada}
 */
function esReservaGuardada(valor) {
  return (
    esObjeto(valor) &&
    esEnteroPositivo(valor.id) &&
    esEnteroPositivo(valor.usuarioId) &&
    esFechaISO(valor.fecha) &&
    typeof valor.sucursal === 'string' &&
    esEnteroPositivo(valor.menuId) &&
    typeof valor.plato === 'string'
  );
}

/**
 * @param {unknown} valor
 * @returns {valor is Notificacion}
 */
function esNotificacion(valor) {
  return esObjeto(valor) && esEnteroPositivo(valor.id) && typeof valor.texto === 'string' && typeof valor.leida === 'boolean';
}

/**
 * @param {unknown} valor
 * @returns {valor is Record<string, unknown>}
 */
function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * @param {unknown} valor
 * @returns {valor is number}
 */
function esEnteroPositivo(valor) {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0;
}

// --- Respuestas -----------------------------------------------------------------------------

/**
 * @param {DatosReservas} datos
 * @param {FechaISO} fecha
 * @param {Date} momento
 * @returns {DiaSemana}
 */
function diaSemana(datos, fecha, momento) {
  const reserva = datos.reservas.find((guardada) => guardada.usuarioId === USUARIO_DEMO.id && guardada.fecha === fecha);
  return {
    dia: nombreDia(fecha),
    fecha,
    estado: reserva ? 'reservado' : 'pendiente',
    plato: reserva?.plato ?? null,
    reservaId: reserva?.id ?? null,
    lugar: reserva?.sucursal ?? null,
    gestionable: esGestionable(fecha, momento),
    limiteGestion: instanteLocal(fechaLimiteGestion(fecha)),
  };
}

/**
 * @param {ReservaGuardada} reserva
 * @param {Date} momento
 * @returns {ReservaDelDia}
 */
function reservaDelDia(reserva, momento) {
  return {
    id: reserva.id,
    fecha: reserva.fecha,
    plato: reserva.plato,
    lugar: reserva.sucursal,
    horario: HORARIO,
    gestionable: esGestionable(reserva.fecha, momento),
    limiteGestion: instanteLocal(fechaLimiteGestion(reserva.fecha)),
  };
}

/**
 * @param {DatosReservas} datos
 * @param {string} texto
 */
function notificar(datos, texto) {
  const id = datos.notificaciones.reduce((maximo, notificacion) => Math.max(maximo, notificacion.id), 0) + 1;
  datos.notificaciones.push({ id, texto, leida: false });
}

// --- Validación y utilidades ----------------------------------------------------------------

/** @param {unknown} usuarioId */
function validarUsuario(usuarioId) {
  if (usuarioId !== USUARIO_DEMO.id) throw crearError('NO_ENCONTRADO', 'No se encontró el usuario.');
}

/** @param {unknown} sucursal */
function validarSucursal(sucursal) {
  if (typeof sucursal !== 'string' || !SUCURSALES.includes(sucursal)) {
    throw crearError('VALIDACION', 'Elige una sede de la lista.');
  }
}

/** @param {unknown} fecha */
function validarFecha(fecha) {
  if (!esFechaISO(fecha)) throw crearError('VALIDACION', 'La fecha no es válida (usa AAAA-MM-DD).');
}

/**
 * @param {CodigoError} codigo
 * @param {string} [mensaje]
 */
function crearError(codigo, mensaje) {
  return new ApiError(STATUS_POR_CODIGO[codigo], codigo, mensaje);
}

/** «lunes 12/10» @param {FechaISO} fecha */
function describirDia(fecha) {
  const [, mes, dia] = fecha.split('-').map(Number);
  return `${nombreDia(fecha).toLowerCase()} ${dia}/${mes}`;
}

/** `yyyy-MM-ddTHH:mm` en hora local. @param {Date} instante */
function instanteLocal(instante) {
  const hora = String(instante.getHours()).padStart(2, '0');
  const minuto = String(instante.getMinutes()).padStart(2, '0');
  return `${hoyISO(instante)}T${hora}:${minuto}`;
}

/** @param {number} ms */
function esperar(ms) {
  return ms > 0 ? new Promise((resolver) => setTimeout(resolver, ms)) : Promise.resolve();
}
