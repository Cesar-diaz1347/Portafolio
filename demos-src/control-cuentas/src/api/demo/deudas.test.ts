import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as deudas from '../deudas';
import { reiniciarDemo } from './api';

describe('src/api/deudas.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reiniciarDemo();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('conserva las 9 funciones que usan las páginas', () => {
    expect(Object.keys(deudas).sort()).toEqual(
      [
        'createDeuda',
        'createPago',
        'deleteDeuda',
        'deletePago',
        'getDashboardResumen',
        'getDeuda',
        'getDeudas',
        'updateDeuda',
        'updatePago',
      ].sort(),
    );
  });

  it('delega en la API simulada, con su latencia de 200 a 450 ms', async () => {
    const promesa = deudas.getDeudas();
    await vi.advanceTimersByTimeAsync(450);
    const lista = await promesa;
    expect(lista.length).toBeGreaterThanOrEqual(8);

    const detalle = deudas.getDeuda(lista[0].id);
    await vi.advanceTimersByTimeAsync(450);
    expect((await detalle).id).toBe(lista[0].id);
  });
});
