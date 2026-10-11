// @ts-check
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  PLATOS,
  esDiaHabil,
  esFechaISO,
  esGestionable,
  fechaLimiteGestion,
  hoyISO,
  lunesDeLaSemana,
  menusDelDia,
  nombreDia,
  primeraFechaReservable,
  semanaVisible,
  sumarDias,
} from './reglas.js';

/**
 * Instante en hora local.
 * @param {number} anio
 * @param {number} mes 1 a 12
 * @param {number} dia
 */
function local(anio, mes, dia, hora = 0, minuto = 0, segundo = 0) {
  return new Date(anio, mes - 1, dia, hora, minuto, segundo);
}

/** @param {string} desde @param {string} hasta */
function diasEntre(desde, hasta) {
  const [a1, m1, d1] = desde.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

describe('días hábiles', () => {
  test('lunes a viernes son hábiles; sábado y domingo no', () => {
    const semana = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'];
    assert.deepEqual(semana.map(nombreDia), ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    assert.deepEqual(semana.map(esDiaHabil), [true, true, true, true, true, false, false]);
    assert.ok(semana.every((fecha) => lunesDeLaSemana(fecha) === '2026-10-05'));
  });

  test('hoyISO usa la fecha local y esFechaISO solo acepta días reales', () => {
    assert.equal(hoyISO(local(2026, 10, 4, 23, 59)), '2026-10-04');
    assert.equal(hoyISO(local(2028, 2, 29, 0, 0)), '2028-02-29');
    assert.equal(esFechaISO('2028-02-29'), true);
    for (const valor of ['2027-02-29', '2026-13-01', '2026-10-4', '', null, 20261004]) {
      assert.equal(esFechaISO(valor), false, String(valor));
    }
  });
});

describe('fechaLimiteGestion', () => {
  test('es el jueves de la semana anterior a las 17:00, para cualquier día de la semana', () => {
    for (const fecha of ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16']) {
      assert.deepEqual(fechaLimiteGestion(fecha), local(2026, 10, 8, 17, 0));
    }
    // Cruza un cambio de mes y de año.
    assert.deepEqual(fechaLimiteGestion('2027-01-04'), local(2026, 12, 31, 17, 0));
  });
});

describe('límite del jueves: 16:59 frente a 17:00', () => {
  test('a las 16:59:59 todavía se gestiona la semana siguiente; a las 17:00 ya no', () => {
    const antes = local(2026, 10, 8, 16, 59, 59);
    const enPunto = local(2026, 10, 8, 17, 0, 0);

    assert.equal(esGestionable('2026-10-12', antes), true);
    assert.equal(esGestionable('2026-10-16', antes), true);
    assert.equal(esGestionable('2026-10-12', enPunto), false);
    assert.equal(esGestionable('2026-10-16', enPunto), false);
    assert.equal(primeraFechaReservable(antes), '2026-10-12');
    assert.equal(primeraFechaReservable(enPunto), '2026-10-19');
  });

  test('los fines de semana nunca son gestionables', () => {
    assert.equal(esGestionable('2026-10-17', local(2026, 10, 1)), false);
  });
});

describe('invariantes día a día en 2026 y 2027', () => {
  test('la semana visible es la primera gestionable y sus menús son válidos', () => {
    /** @type {string[]} */
    const fallos = [];
    const horas = [
      [0, 0],
      [9, 30],
      [16, 59],
      [17, 0],
      [23, 59],
    ];

    for (let dia = '2026-01-01'; dia <= '2027-12-31'; dia = sumarDias(dia, 1)) {
      const [anio, mes, d] = dia.split('-').map(Number);
      for (const [hora, minuto] of horas) {
        const ahora = local(anio, mes, d, hora, minuto);
        const momento = `${dia} ${hora}:${minuto}`;
        const primera = primeraFechaReservable(ahora);
        const semana = semanaVisible(ahora);

        if (nombreDia(primera) !== 'Lunes') fallos.push(`${momento}: ${primera} no es lunes`);
        const distancia = diasEntre(dia, primera);
        if (distancia < 1 || distancia > 14) fallos.push(`${momento}: ${primera} está a ${distancia} días`);
        if (esGestionable(sumarDias(primera, -3), ahora)) fallos.push(`${momento}: el viernes anterior sigue gestionable`);
        if (semana.length !== 5 || semana[0] !== primera) fallos.push(`${momento}: semana mal formada`);
        if (!semana.every((fecha, i) => fecha === sumarDias(primera, i) && esGestionable(fecha, ahora))) {
          fallos.push(`${momento}: algún día de la semana visible no es gestionable`);
        }
        for (const fecha of semana) {
          const ids = menusDelDia(fecha).map((menu) => menu.id);
          if (new Set(ids).size !== 4 || ids.some((id) => id < 1 || id > PLATOS.length)) fallos.push(`${fecha}: menús ${ids}`);
        }
      }
    }

    assert.deepEqual(fallos, []);
  });
});

describe('menusDelDia', () => {
  test('4 servicios fijos y deterministas, numerados Servicio 1 a Servicio 4', () => {
    const menus = menusDelDia('2026-10-14');
    assert.equal(menus.length, 4);
    assert.deepEqual(
      menus.map((menu) => menu.plato),
      ['Dermatología', 'Pediatría', 'Medicina general', 'Oftalmología'],
    );
    assert.deepEqual(
      menus.map((menu) => menu.nombre),
      ['Servicio 1', 'Servicio 2', 'Servicio 3', 'Servicio 4'],
    );
    assert.deepEqual(menusDelDia('2026-10-14'), menus);
    assert.deepEqual(menusDelDia('2026-10-15'), menus);
  });

  test('los 4 servicios se ofrecen cada día hábil y no hay servicio en fin de semana', () => {
    for (let fecha = '2026-10-05'; fecha <= '2026-10-09'; fecha = sumarDias(fecha, 1)) {
      assert.deepEqual(menusDelDia(fecha).map((menu) => menu.id), [1, 2, 3, 4]);
    }
    assert.equal(PLATOS.length, 4);
    assert.deepEqual(menusDelDia('2026-10-10'), []);
  });
});
