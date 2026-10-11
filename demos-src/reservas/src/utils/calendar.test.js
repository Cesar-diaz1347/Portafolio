// @ts-check
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { nombreDia, sumarDias } from '../services/reglas.js';
import { diasVisiblesDelMes, fechaNumerica, moverFecha, sumarMeses } from './calendar.js';

describe('fechaNumerica', () => {
  test('lleva día y mes con dos dígitos', () => {
    assert.equal(fechaNumerica('2026-10-08'), '08/10/2026');
    assert.equal(fechaNumerica('2026-12-31'), '31/12/2026');
  });
});

describe('diasVisiblesDelMes', () => {
  test('octubre de 2026 empieza el lunes 28 de septiembre y termina el domingo 8 de noviembre', () => {
    const dias = diasVisiblesDelMes(2026, 9);
    assert.equal(dias.length, 42);
    assert.equal(dias[0], '2026-09-28');
    assert.equal(dias[41], '2026-11-08');
  });

  test('si el mes empieza en lunes, ese día abre el calendario', () => {
    const dias = diasVisiblesDelMes(2027, 1); // febrero de 2027 empieza en lunes y tiene 28 días
    assert.equal(dias[0], '2027-02-01');
    assert.equal(dias[41], '2027-03-14');
  });

  test('en todos los meses de 2026 a 2028: 6 semanas seguidas desde un lunes que incluyen el mes completo', () => {
    for (let anio = 2026; anio <= 2028; anio++) {
      for (let mes = 0; mes < 12; mes++) {
        const dias = diasVisiblesDelMes(anio, mes);
        const etiqueta = `${anio}-${mes + 1}`;
        assert.equal(dias.length, 42, etiqueta);
        assert.equal(nombreDia(dias[0]), 'Lunes', etiqueta);
        dias.forEach((dia, posicion) => {
          if (posicion > 0) assert.equal(dia, sumarDias(dias[posicion - 1], 1), etiqueta);
        });
        const primero = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
        const ultimoDia = new Date(anio, mes + 1, 0).getDate();
        const ultimo = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
        assert.ok(dias.includes(primero) && dias.includes(ultimo), etiqueta);
      }
    }
  });
});

describe('sumarMeses', () => {
  test('conserva el día cuando existe en el mes de destino', () => {
    assert.equal(sumarMeses('2026-10-21', 1), '2026-11-21');
    assert.equal(sumarMeses('2026-10-21', -1), '2026-09-21');
  });

  test('si el día no existe, queda el último día del mes de destino', () => {
    assert.equal(sumarMeses('2026-01-31', 1), '2026-02-28');
    assert.equal(sumarMeses('2028-01-31', 1), '2028-02-29');
    assert.equal(sumarMeses('2026-03-31', -1), '2026-02-28');
  });

  test('cruza el cambio de año y suma años completos', () => {
    assert.equal(sumarMeses('2026-12-15', 1), '2027-01-15');
    assert.equal(sumarMeses('2026-01-10', -1), '2025-12-10');
    assert.equal(sumarMeses('2026-10-21', 12), '2027-10-21');
    assert.equal(sumarMeses('2028-02-29', 12), '2029-02-28');
    assert.equal(sumarMeses('2028-02-29', -12), '2027-02-28');
  });
});

describe('moverFecha', () => {
  const miercoles = '2026-10-21';

  test('flechas: un día a los lados y una semana arriba o abajo', () => {
    assert.equal(moverFecha(miercoles, 'ArrowLeft'), '2026-10-20');
    assert.equal(moverFecha(miercoles, 'ArrowRight'), '2026-10-22');
    assert.equal(moverFecha(miercoles, 'ArrowUp'), '2026-10-14');
    assert.equal(moverFecha(miercoles, 'ArrowDown'), '2026-10-28');
  });

  test('pasa al mes siguiente o al anterior al salirse del actual', () => {
    assert.equal(moverFecha('2026-10-31', 'ArrowRight'), '2026-11-01');
    assert.equal(moverFecha('2026-11-01', 'ArrowLeft'), '2026-10-31');
    assert.equal(moverFecha('2026-10-28', 'ArrowDown'), '2026-11-04');
  });

  test('Inicio y Fin llevan al lunes y al domingo de la semana', () => {
    assert.equal(moverFecha(miercoles, 'Home'), '2026-10-19');
    assert.equal(moverFecha(miercoles, 'End'), '2026-10-25');
    assert.equal(moverFecha('2026-10-25', 'Home'), '2026-10-19');
  });

  test('RePág y AvPág cambian de mes; con Mayús, de año', () => {
    assert.equal(moverFecha(miercoles, 'PageUp'), '2026-09-21');
    assert.equal(moverFecha(miercoles, 'PageDown'), '2026-11-21');
    assert.equal(moverFecha(miercoles, 'PageDown', { conMayus: true }), '2027-10-21');
    assert.equal(moverFecha(miercoles, 'PageUp', { conMayus: true }), '2025-10-21');
  });

  test('otras teclas no mueven nada', () => {
    for (const tecla of ['Enter', ' ', 'Tab', 'a', 'Escape']) assert.equal(moverFecha(miercoles, tecla), null, tecla);
  });

  test('nunca pasa de la primera fecha reservable', () => {
    const minimo = '2026-10-19';
    assert.equal(moverFecha('2026-10-19', 'ArrowLeft', { minimo }), '2026-10-19');
    assert.equal(moverFecha('2026-10-22', 'ArrowUp', { minimo }), '2026-10-19');
    assert.equal(moverFecha('2026-10-20', 'Home', { minimo }), '2026-10-19');
    assert.equal(moverFecha('2026-11-05', 'PageUp', { minimo }), '2026-10-19');
    assert.equal(moverFecha('2026-10-21', 'PageUp', { minimo, conMayus: true }), '2026-10-19');
    // Hacia delante no hay tope, y por encima del mínimo se mueve igual que sin él.
    assert.equal(moverFecha('2026-10-21', 'ArrowDown', { minimo }), '2026-10-28');
  });
});
