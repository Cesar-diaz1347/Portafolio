// @ts-check
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { esDiaHabil, sumarDias } from './reglas.js';
import { ApiError, CLAVE_DEMO, crearReservasApi } from './reservasApi.js';

/** Lunes 5 de octubre de 2026 a las 10:00: la semana visible es la del lunes 12. */
const LUNES_10AM = new Date(2026, 9, 5, 10, 0);
const USUARIO = 1;

/** @param {Record<string, string>} [inicial] */
function crearStorage(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  /** @type {Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>} */
  const storage = {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => void datos.set(clave, valor),
    removeItem: (clave) => void datos.delete(clave),
  };
  return { storage, datos };
}

/**
 * API con storage en memoria y un reloj que la prueba puede mover.
 * @param {{ ahora?: Date, inicial?: Record<string, string>, fallar?: () => boolean }} [opciones]
 */
function crearApi({ ahora = LUNES_10AM, inicial, fallar } = {}) {
  const { storage, datos } = crearStorage(inicial);
  let momento = ahora;
  const api = crearReservasApi({ storage, ahora: () => momento, fallar });
  return {
    api,
    datos,
    /** @param {Date} nuevo */
    mover: (nuevo) => {
      momento = nuevo;
    },
  };
}

/**
 * @param {Promise<unknown>} promesa
 * @param {string} codigo
 * @param {number} status
 */
async function rechazaCon(promesa, codigo, status) {
  await assert.rejects(promesa, (error) => {
    assert.ok(error instanceof ApiError, `se esperaba ApiError y llegó ${String(error)}`);
    assert.equal(error.codigo, codigo);
    assert.equal(error.status, status);
    assert.ok(error.message.length > 0);
    return true;
  });
}

describe('semilla', () => {
  test('la semana visible trae 3 días reservados y 2 pendientes, todos gestionables', async () => {
    const { api } = crearApi();
    const semana = await api.obtenerReservasSemana(USUARIO);

    assert.deepEqual(
      semana.map((dia) => dia.dia),
      ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    );
    assert.equal(semana[0].fecha, '2026-10-12');
    assert.deepEqual(
      semana.map((dia) => dia.estado),
      ['reservado', 'reservado', 'pendiente', 'reservado', 'pendiente'],
    );
    assert.ok(semana.every((dia) => dia.gestionable && dia.limiteGestion === '2026-10-08T17:00'));
    assert.equal(await api.obtenerNotificacionesNoLeidas(USUARIO), 3);
  });

  test('el historial está en el calendario y ya no se puede cancelar', async () => {
    const { api } = crearApi();
    const septiembre = await api.obtenerReservasCalendario(USUARIO, 9, 2026);
    const octubre = await api.obtenerReservasCalendario(USUARIO, 10, 2026);
    const historial = [...Object.values(septiembre), ...Object.values(octubre)].filter((r) => r.fecha < '2026-10-12');

    assert.ok(historial.length >= 5);
    assert.ok(historial.every((reserva) => !reserva.gestionable && reserva.horario === '8:00 a.m. a 4:00 p.m.'));
    await rechazaCon(api.cancelarReserva(historial[0].id), 'FUERA_DE_PLAZO', 422);
  });

  test('cumple las invariantes cualquier día de 2026 y 2027, antes y después del jueves 17:00', async () => {
    /** @type {string[]} */
    const fallos = [];
    for (let dia = '2026-01-01'; dia <= '2027-12-31'; dia = sumarDias(dia, 1)) {
      const [anio, mes, d] = dia.split('-').map(Number);
      for (const hora of [10, 17]) {
        const ahora = new Date(anio, mes - 1, d, hora, 30);
        const api = crearReservasApi({ storage: null, ahora: () => ahora });
        const semana = await api.obtenerReservasSemana(USUARIO);
        const reservados = semana.filter((dia) => dia.estado === 'reservado').length;
        if (reservados !== 3) fallos.push(`${dia} ${hora}:30: ${reservados} reservados`);
        if (!semana.every((dia) => dia.gestionable)) fallos.push(`${dia} ${hora}:30: semana no gestionable`);

        const [anioVisible, mesVisible] = semana[0].fecha.split('-').map(Number);
        const calendario = await api.obtenerReservasCalendario(USUARIO, mesVisible, anioVisible);
        for (const reserva of Object.values(calendario)) {
          const enSemana = semana.some((dia) => dia.fecha === reserva.fecha);
          if (!enSemana && reserva.gestionable) fallos.push(`${dia} ${hora}:30: historial ${reserva.fecha} gestionable`);
          if (!esDiaHabil(reserva.fecha)) fallos.push(`${dia} ${hora}:30: reserva en fin de semana ${reserva.fecha}`);
        }
      }
    }
    assert.deepEqual(fallos, []);
  });
});

describe('crear y cancelar', () => {
  test('crear una reserva actualiza la semana, el calendario y las notificaciones', async () => {
    const { api } = crearApi();
    const pendiente = (await api.obtenerReservasSemana(USUARIO)).find((dia) => dia.estado === 'pendiente');
    assert.ok(pendiente);
    const menus = await api.obtenerMenus('Torre Norte', pendiente.fecha);
    assert.equal(menus.length, 4);

    const creada = await api.crearReserva({
      usuarioId: USUARIO,
      sucursal: 'Torre Norte',
      fecha: pendiente.fecha,
      menuId: menus[2].id,
    });
    assert.equal(creada.plato, menus[2].plato);
    assert.equal(creada.lugar, 'Torre Norte');

    const semana = await api.obtenerReservasSemana(USUARIO);
    assert.equal(semana.filter((dia) => dia.estado === 'reservado').length, 4);
    const [anio, mes] = pendiente.fecha.split('-').map(Number);
    const calendario = await api.obtenerReservasCalendario(USUARIO, mes, anio);
    assert.equal(calendario[pendiente.fecha]?.id, creada.id);
    assert.equal(await api.obtenerNotificacionesNoLeidas(USUARIO), 4);
  });

  test('cancelar actualiza la semana y el calendario', async () => {
    const { api } = crearApi();
    const lunes = (await api.obtenerReservasSemana(USUARIO))[0];
    assert.ok(lunes.reservaId);

    await api.cancelarReserva(lunes.reservaId);
    const semana = await api.obtenerReservasSemana(USUARIO);
    assert.equal(semana[0].estado, 'pendiente');
    assert.equal(semana[0].plato, null);
    const calendario = await api.obtenerReservasCalendario(USUARIO, 10, 2026);
    assert.equal(calendario[lunes.fecha], undefined);
    assert.equal(await api.obtenerNotificacionesNoLeidas(USUARIO), 4);
    await rechazaCon(api.cancelarReserva(lunes.reservaId), 'NO_ENCONTRADO', 404);
  });

  test('valida usuario, sucursal, fecha, día hábil, menú y duplicados', async () => {
    const { api } = crearApi();
    const semana = await api.obtenerReservasSemana(USUARIO);
    const miercoles = semana[2].fecha;
    const [menu] = await api.obtenerMenus('Campus Sur', miercoles);
    const solicitud = { usuarioId: USUARIO, sucursal: 'Campus Sur', fecha: miercoles, menuId: menu.id };

    await rechazaCon(api.crearReserva({ ...solicitud, usuarioId: 99 }), 'NO_ENCONTRADO', 404);
    await rechazaCon(api.crearReserva({ ...solicitud, sucursal: 'Otra' }), 'VALIDACION', 400);
    await rechazaCon(api.crearReserva({ ...solicitud, fecha: '2026-02-30' }), 'VALIDACION', 400);
    await rechazaCon(api.crearReserva({ ...solicitud, fecha: sumarDias(semana[4].fecha, 1) }), 'VALIDACION', 400);
    await rechazaCon(api.crearReserva({ ...solicitud, menuId: 99 }), 'VALIDACION', 400);
    assert.deepEqual(await api.obtenerMenus('Campus Sur', sumarDias(semana[4].fecha, 1)), []);

    // Cada caso con un menú que sí se sirve ese día: el menú se valida antes que el plazo y el duplicado.
    const conMenuDelDia = async (/** @type {string} */ fecha) => {
      const [menuDelDia] = await api.obtenerMenus('Campus Sur', fecha);
      return { ...solicitud, fecha, menuId: menuDelDia.id };
    };
    await rechazaCon(api.crearReserva(await conMenuDelDia(semana[0].fecha)), 'DUPLICADA', 409);
    await rechazaCon(api.crearReserva(await conMenuDelDia('2026-10-07')), 'FUERA_DE_PLAZO', 422);
  });

  test('a las 16:59 del jueves se puede reservar; a las 17:00 ya no se puede cancelar', async () => {
    const { api, mover } = crearApi({ ahora: new Date(2026, 9, 8, 16, 59) });
    const [menu] = await api.obtenerMenus('Torre Norte', '2026-10-14');
    const creada = await api.crearReserva({
      usuarioId: USUARIO,
      sucursal: 'Torre Norte',
      fecha: '2026-10-14',
      menuId: menu.id,
    });
    assert.equal(creada.gestionable, true);

    mover(new Date(2026, 9, 8, 17, 0));
    await rechazaCon(api.cancelarReserva(creada.id), 'FUERA_DE_PLAZO', 422);
    const calendario = await api.obtenerReservasCalendario(USUARIO, 10, 2026);
    assert.equal(calendario['2026-10-14']?.gestionable, false);
  });
});

describe('almacenamiento', () => {
  test('reiniciarDemo borra solo su clave y vuelve a la semilla', async () => {
    const { api, datos } = crearApi({ inicial: { 'cd-tema': 'oscuro', 'controlPagos.demo.v1': '{}' } });
    const lunes = (await api.obtenerReservasSemana(USUARIO))[0];
    assert.ok(lunes.reservaId);
    await api.cancelarReserva(lunes.reservaId);

    api.reiniciarDemo();
    assert.equal(datos.has(CLAVE_DEMO), false);
    assert.equal(datos.get('cd-tema'), 'oscuro');
    assert.equal(datos.get('controlPagos.demo.v1'), '{}');
    assert.equal((await api.obtenerReservasSemana(USUARIO))[0].estado, 'reservado');
  });

  test('vuelve a sembrar si los datos están corruptos', async () => {
    const { api } = crearApi({ inicial: { [CLAVE_DEMO]: '{no es json' } });
    const semana = await api.obtenerReservasSemana(USUARIO);
    assert.equal(semana.filter((dia) => dia.estado === 'reservado').length, 3);
  });

  test('sin cambios del usuario, vuelve a sembrar cuando cambia la semana visible', async () => {
    const { api, mover } = crearApi();
    assert.equal((await api.obtenerReservasSemana(USUARIO))[0].fecha, '2026-10-12');

    mover(new Date(2026, 9, 9, 10, 0)); // viernes: ya pasó el jueves 17:00
    const semana = await api.obtenerReservasSemana(USUARIO);
    assert.equal(semana[0].fecha, '2026-10-19');
    assert.equal(semana.filter((dia) => dia.estado === 'reservado').length, 3);
  });

  test('con cambios del usuario, conserva sus datos aunque cambie el día', async () => {
    const { api, mover } = crearApi();
    const lunes = (await api.obtenerReservasSemana(USUARIO))[0];
    await api.cancelarReserva(lunes.reservaId ?? 0);

    mover(new Date(2026, 9, 9, 10, 0));
    const semana = await api.obtenerReservasSemana(USUARIO);
    assert.equal(semana[0].fecha, '2026-10-19');
    assert.equal(semana.filter((dia) => dia.estado === 'reservado').length, 0); // semana nueva, sin resembrar
    const octubre = await api.obtenerReservasCalendario(USUARIO, 10, 2026);
    assert.equal(octubre[lunes.fecha], undefined); // la cancelación sigue ahí
    assert.ok(octubre['2026-10-13']);
  });

  test('sin storage funciona en memoria y con fallar() responde 503', async () => {
    const enMemoria = crearReservasApi({ storage: null, ahora: () => LUNES_10AM });
    const lunes = (await enMemoria.obtenerReservasSemana(USUARIO))[0];
    await enMemoria.cancelarReserva(lunes.reservaId ?? 0);
    assert.equal((await enMemoria.obtenerReservasSemana(USUARIO))[0].estado, 'pendiente');

    const { api } = crearApi({ fallar: () => true });
    await rechazaCon(api.obtenerSucursales(), 'NO_DISPONIBLE', 503);
  });

  test('cargar el módulo no toca localStorage; usarlo sí, y sin storage cae a memoria', async () => {
    let accesos = 0;
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        accesos += 1;
        return undefined;
      },
    });
    try {
      // La query string obliga a Node a evaluar el módulo de nuevo, aunque ya esté en caché.
      const modulo = await import(new URL('./reservasApi.js?carga-aislada', import.meta.url).href);
      assert.equal(accesos, 0);
      const api = modulo.crearReservasApi({ ahora: () => LUNES_10AM });
      assert.equal((await api.obtenerReservasSemana(USUARIO)).length, 5);
      assert.ok(accesos > 0);
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});

describe('respuestas', () => {
  test('usuario, sucursales y copias independientes', async () => {
    const { api } = crearApi();
    assert.deepEqual(await api.obtenerUsuario(), { id: 1, nombre: 'María García', iniciales: 'MG' });
    const sucursales = await api.obtenerSucursales();
    assert.deepEqual(sucursales, ['Torre Norte', 'Campus Sur']);
    sucursales.length = 0;
    assert.equal((await api.obtenerSucursales()).length, 2);
    await assert.doesNotReject(api.cerrarSesion());
    await rechazaCon(api.obtenerReservasCalendario(USUARIO, 13, 2026), 'VALIDACION', 400);
  });
});
