import { describe, expect, it } from 'vitest';

import { esFechaIso, fechaDesdeNumeroDia, hoyLocal, mesesEntre, numeroDia, sumarDias, sumarMeses } from './fechas';

const MS_POR_DIA = 86_400_000;
const NUMERO_DIA_EPOCA_UNIX = 719_162;

describe('numeroDia y fechaDesdeNumeroDia', () => {
  it('coinciden con DateOnly.DayNumber en los extremos y en la época Unix', () => {
    expect(numeroDia('0001-01-01')).toBe(0);
    expect(numeroDia('1970-01-01')).toBe(NUMERO_DIA_EPOCA_UNIX);
    expect(numeroDia('9999-12-31')).toBe(3_652_058);
    expect(fechaDesdeNumeroDia(0)).toBe('0001-01-01');
    expect(fechaDesdeNumeroDia(3_652_058)).toBe('9999-12-31');
  });

  it('coinciden con el calendario UTC de JavaScript todos los días de 1900 a 2100', () => {
    const fallos: string[] = [];
    for (let n = numeroDia('1900-01-01'); n <= numeroDia('2100-12-31'); n += 1) {
      // Fecha construida desde milisegundos (nunca desde texto) como oráculo independiente.
      const esperada = new Date((n - NUMERO_DIA_EPOCA_UNIX) * MS_POR_DIA).toISOString().slice(0, 10);
      const obtenida = fechaDesdeNumeroDia(n);
      if (obtenida !== esperada || numeroDia(obtenida) !== n) fallos.push(`${n}: ${obtenida} ≠ ${esperada}`);
    }
    expect(fallos).toEqual([]);
  });

  it('rechaza números fuera del rango de DateOnly', () => {
    expect(() => fechaDesdeNumeroDia(-1)).toThrow(RangeError);
    expect(() => fechaDesdeNumeroDia(3_652_059)).toThrow(RangeError);
    expect(() => sumarDias('9999-12-31', 1)).toThrow(RangeError);
  });
});

describe('sumarMeses (DateOnly.AddMonths)', () => {
  it.each([
    ['2027-01-31', 1, '2027-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2028-02-29', 1, '2028-03-29'],
    ['2028-02-29', 12, '2029-02-28'],
    ['2027-03-31', 1, '2027-04-30'],
    ['2026-03-31', -1, '2026-02-28'],
    ['2026-01-15', -1, '2025-12-15'],
    ['2026-12-15', 1, '2027-01-15'],
    ['2026-10-04', 7, '2027-05-04'],
  ])('%s + %i meses = %s', (fecha, meses, esperada) => {
    expect(sumarMeses(fecha, meses)).toBe(esperada);
  });

  it('devuelve null donde .NET lanzaría por salir del rango de fechas', () => {
    expect(sumarMeses('2026-10-04', 95_678)).toBe('9999-12-04');
    expect(sumarMeses('2026-10-04', 95_679)).toBeNull();
    expect(sumarMeses('9999-12-01', 1)).toBeNull();
    expect(sumarMeses('0001-01-31', -1)).toBeNull();
    expect(sumarMeses('2026-10-04', 9_999_999_999)).toBeNull();
  });
});

describe('mesesEntre', () => {
  it('cuenta cambios de mes calendario sin mirar el día', () => {
    expect(mesesEntre('2027-01-31', '2027-02-01')).toBe(1);
    expect(mesesEntre('2026-10-01', '2026-10-31')).toBe(0);
    expect(mesesEntre('2026-11-02', '2026-10-04')).toBe(-1);
    expect(mesesEntre('2025-12-31', '2027-01-01')).toBe(13);
  });
});

describe('hoyLocal', () => {
  it('usa la fecha local y no la UTC, a cualquier hora del día', () => {
    expect(hoyLocal(new Date(2026, 9, 4, 0, 0))).toBe('2026-10-04');
    expect(hoyLocal(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04');
    expect(hoyLocal(new Date(2028, 1, 29, 12, 0))).toBe('2028-02-29');
  });
});

describe('esFechaIso', () => {
  it('acepta solo fechas reales con formato yyyy-MM-dd', () => {
    expect(esFechaIso('2028-02-29')).toBe(true);
    expect(esFechaIso('0001-01-01')).toBe(true);
    for (const valor of ['2027-02-29', '2026-13-01', '2026-04-31', '0000-01-01', '2026-1-01', '26-01-01', '', null, 20261004]) {
      expect(esFechaIso(valor)).toBe(false);
    }
  });
});
