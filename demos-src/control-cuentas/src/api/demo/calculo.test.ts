import { describe, expect, it } from 'vitest';

import { calcularEstado, calcularFechaFinProyectada, calcularPorcentajeAvance } from './calculo';
import { mesesEntre } from './fechas';
import { CASOS_PARIDAD } from './paridad.fixture';

describe('paridad con DeudaCalculoService (C# real, paridad.fixture.ts)', () => {
  it.each(CASOS_PARIDAD)('$id', (caso) => {
    const remanente = caso.saldoInicialCent - caso.saldoPagadoCent;

    expect(calcularPorcentajeAvance(caso.saldoInicialCent, caso.saldoPagadoCent)).toBe(caso.porcentajeAvance);
    expect(calcularEstado(remanente, caso.fechaInicio, caso.fechaFinPropuesta, caso.ultimoPago, caso.hoy)).toBe(
      caso.estado,
    );
    // Excepción documentada 1: en la clase de divergencia vale el cálculo exacto, no el del C#.
    expect(calcularFechaFinProyectada(caso.saldoPagadoCent, remanente, caso.fechaInicio, caso.hoy)).toBe(
      caso.fechaFinProyectadaExacta ?? caso.fechaFinProyectada,
    );
  });

  it('la clase de divergencia es solo «el C# suma un mes» con cociente exacto entero', () => {
    const divergentes = CASOS_PARIDAD.filter((caso) => caso.fechaFinProyectadaExacta !== undefined);
    expect(divergentes.map((caso) => caso.id)).toContain('F41'); // el caso 100/3

    for (const caso of divergentes) {
      const remanente = caso.saldoInicialCent - caso.saldoPagadoCent;
      const meses = Math.max(1, mesesEntre(caso.fechaInicio, caso.hoy));
      expect((remanente * meses) % caso.saldoPagadoCent, caso.id).toBe(0);
      const mesesCs = mesesEntre(caso.hoy, caso.fechaFinProyectada ?? '');
      const mesesExactos = mesesEntre(caso.hoy, caso.fechaFinProyectadaExacta ?? '');
      expect(mesesCs, caso.id).toBe(mesesExactos + 1);
    }
  });
});

describe('calcularFechaFinProyectada fuera del rango de fechas (excepción documentada 2)', () => {
  it('X01: pago de Q1.00 sobre Q100,000 el mismo mes da null; el C# lanza ArgumentOutOfRangeException', () => {
    expect(calcularFechaFinProyectada(100, 9_999_900, '2026-10-01', '2026-10-04')).toBeNull();
  });

  it('X02: Q0.01 sobre Q100,000,000 da null; el C# lanza OverflowException', () => {
    expect(calcularFechaFinProyectada(1, 9_999_999_999, '2026-10-01', '2026-10-04')).toBeNull();
  });

  it('el último mes representable todavía se proyecta', () => {
    // 95,678 meses desde 2026-10-04 llegan a diciembre de 9999; uno más ya no cabe.
    expect(calcularFechaFinProyectada(100, 9_567_800, '2026-10-01', '2026-10-04')).toBe('9999-12-04');
    expect(calcularFechaFinProyectada(100, 9_567_900, '2026-10-01', '2026-10-04')).toBeNull();
  });
});

describe('calcularPorcentajeAvance', () => {
  it('redondea la mitad hacia el dígito par, como Math.Round de .NET', () => {
    expect(calcularPorcentajeAvance(40_000, 4_900)).toBe(12.2); // 12.25
    expect(calcularPorcentajeAvance(200_000, 24_700)).toBe(12.4); // 12.35
    expect(calcularPorcentajeAvance(400_000, 1_000)).toBe(0.2); // 0.25
  });

  it('es exacto con el monto máximo de la demo y con sumas de pagos enormes', () => {
    expect(calcularPorcentajeAvance(99_999_999_999, 99_999_999_998)).toBe(100); // 99.99999… → 100.0
    expect(calcularPorcentajeAvance(99_999_999_999, 50_000_000_000)).toBe(50); // 50.0000000005 → 50.0
    expect(calcularPorcentajeAvance(99_999_999_999, 10 ** 15)).toBe(100);
  });
});
