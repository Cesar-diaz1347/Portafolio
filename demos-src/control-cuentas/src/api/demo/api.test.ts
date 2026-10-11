import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DeudaFormInput } from '../../types/deuda';
import { CLAVE_ALMACEN, crearAlmacen, type DatosDemo } from './almacen';
import { crearApiDemo, type OpcionesApiDemo } from './api';
import { DemoApiError } from './errores';
import { crearStoragePrueba } from './storagePrueba';

const HOY = '2026-10-04';

function crearApi(opciones: Partial<OpcionesApiDemo> = {}) {
  const { storage, datos } = crearStoragePrueba();
  const almacen = crearAlmacen({ storage, hoy: () => HOY });
  const api = crearApiDemo({ almacen, hoy: () => HOY, ...opciones });
  const guardados = (): DatosDemo => JSON.parse(datos.get(CLAVE_ALMACEN) ?? 'null') as DatosDemo;
  return { api, guardados };
}

const NUEVA: DeudaFormInput = {
  nombre: 'Préstamo de prueba',
  tipo: 'Realizado',
  fechaInicio: '2026-07-04',
  fechaFinPropuesta: '2027-07-04',
  saldoInicial: 300,
  cuotaMensual: 100,
};

afterEach(() => {
  vi.useRealTimers();
});

describe('GET /api/deudas', () => {
  it('devuelve la semilla ordenada por fecha fin propuesta, con status 200', async () => {
    const { api } = crearApi();
    const { status, data } = await api.getDeudas();
    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(8);
    const fechas = data.map((deuda) => deuda.fechaFinPropuesta);
    expect(fechas).toEqual([...fechas].sort());
  });

  it('filtra por tipo y rechaza un tipo desconocido con 400', async () => {
    const { api } = crearApi();
    const { data } = await api.getDeudas('Recibido');
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((deuda) => deuda.tipo === 'Recibido')).toBe(true);
    await expect(api.getDeudas('Otro' as never)).rejects.toMatchObject({ status: 400 });
  });
});

describe('GET /api/deudas/{id}', () => {
  it('devuelve el detalle con los pagos del más reciente al más antiguo', async () => {
    const { api } = crearApi();
    const { data } = await api.getDeuda(1);
    expect(data.id).toBe(1);
    const fechas = data.pagos.map((pago) => pago.fecha);
    expect(fechas).toEqual([...fechas].sort().reverse());
    expect(data.saldoPagado).toBe(data.pagos.reduce((total, pago) => total + pago.monto, 0));
  });

  it('responde 404 si la deuda no existe o el id no es un entero', async () => {
    const { api } = crearApi();
    for (const id of [999, Number.NaN, 1.5]) {
      const error = await api.getDeuda(id).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(DemoApiError);
      expect(error).toMatchObject({ status: 404 });
    }
  });
});

describe('POST /api/deudas', () => {
  it('crea la deuda con 201 y la marca como cambio del usuario', async () => {
    const { api, guardados } = crearApi();
    const { status, data } = await api.createDeuda(NUEVA);
    expect(status).toBe(201);
    expect(data).toMatchObject({ nombre: NUEVA.nombre, saldoPagado: 0, saldoRemanente: 300, pagos: [] });
    expect(guardados().modificado).toBe(true);
    expect((await api.getDeuda(data.id)).data.nombre).toBe(NUEVA.nombre);
  });

  it('valida cada campo con mensajes en español y status 400', async () => {
    const { api } = crearApi();
    const invalida = { nombre: '  ', tipo: 'Otro', fechaInicio: '2026-02-30', fechaFinPropuesta: '', saldoInicial: 0, cuotaMensual: 1.005 };
    const error = await api.createDeuda(invalida as unknown as DeudaFormInput).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DemoApiError);
    expect(error).toMatchObject({
      status: 400,
      problem: {
        errors: {
          nombre: ['El nombre es obligatorio.'],
          tipo: ['El tipo debe ser Recibido o Realizado.'],
          fechaInicio: ['La fecha de inicio no es válida (usa AAAA-MM-DD).'],
          fechaFinPropuesta: ['La fecha fin propuesta es obligatoria.'],
          saldoInicial: ['El saldo inicial debe ser mayor a 0.'],
          cuotaMensual: ['La cuota mensual admite como máximo 2 decimales.'],
        },
      },
    });
    expect((error as DemoApiError).message).toContain('El nombre es obligatorio.');
  });

  it('acepta hasta 999,999,999.99 y nombres de hasta 200 caracteres', async () => {
    const { api } = crearApi();
    await expect(api.createDeuda({ ...NUEVA, nombre: 'x'.repeat(200), saldoInicial: 999_999_999.99 })).resolves.toMatchObject({
      status: 201,
    });
    await expect(api.createDeuda({ ...NUEVA, saldoInicial: 1_000_000_000 })).rejects.toMatchObject({
      problem: { errors: { saldoInicial: ['El saldo inicial no puede superar 999,999,999.99 en esta demo.'] } },
    });
    await expect(api.createDeuda({ ...NUEVA, nombre: 'x'.repeat(201) })).rejects.toMatchObject({
      problem: { errors: { nombre: ['El nombre no puede tener más de 200 caracteres.'] } },
    });
  });
});

describe('PUT y DELETE /api/deudas/{id}', () => {
  it('actualiza con 204', async () => {
    const { api } = crearApi();
    const { status, data } = await api.updateDeuda(1, { ...NUEVA, nombre: 'Renombrada' });
    expect(status).toBe(204);
    expect(data).toBeUndefined();
    expect((await api.getDeuda(1)).data.nombre).toBe('Renombrada');
  });

  it('valida el cuerpo antes de buscar la deuda, como [ApiController]', async () => {
    const { api } = crearApi();
    await expect(api.updateDeuda(999, { ...NUEVA, nombre: '' })).rejects.toMatchObject({ status: 400 });
    await expect(api.updateDeuda(999, NUEVA)).rejects.toMatchObject({ status: 404 });
  });

  it('borra con 204 y en cascada sus pagos', async () => {
    const { api, guardados } = crearApi();
    const { data: detalle } = await api.getDeuda(1);
    expect(detalle.pagos.length).toBeGreaterThan(0);

    expect((await api.deleteDeuda(1)).status).toBe(204);
    expect(guardados().pagos.some((pago) => pago.deudaId === 1)).toBe(false);
    await expect(api.getDeuda(1)).rejects.toMatchObject({ status: 404 });
    await expect(api.deleteDeuda(1)).rejects.toMatchObject({ status: 404 });
  });
});

describe('pagos', () => {
  it('registrar un pago recalcula saldo, avance, estado y proyección (caso 100/3 exacto)', async () => {
    const { api } = crearApi();
    const { data: creada } = await api.createDeuda(NUEVA);
    expect(creada.estado).toBe('Vencido'); // sin pagos: el primero tocaba el 2026-08-04

    const { status, data } = await api.createPago(creada.id, { fecha: '2026-09-30', monto: 100, nota: null });
    expect(status).toBe(200);
    expect(data).toMatchObject({ saldoPagado: 100, saldoRemanente: 200, porcentajeAvance: 33.3, estado: 'AlDia' });
    // El C# daría 2027-05-04 (un mes de más por la división decimal); el port usa el cálculo exacto.
    expect(data.fechaFinProyectada).toBe('2027-04-04');
  });

  it('edita y borra pagos con 200 y el detalle recalculado', async () => {
    const { api } = crearApi();
    const { data: creada } = await api.createDeuda(NUEVA);
    const { data: conPago } = await api.createPago(creada.id, { fecha: '2026-09-30', monto: 100, nota: 'Primero' });
    const pagoId = conPago.pagos[0].id;

    const editado = await api.updatePago(creada.id, pagoId, { fecha: '2026-10-01', monto: 300, nota: null });
    expect(editado.status).toBe(200);
    expect(editado.data).toMatchObject({ saldoPagado: 300, saldoRemanente: 0, porcentajeAvance: 100, estado: 'Pagada' });

    const borrado = await api.deletePago(creada.id, pagoId);
    expect(borrado.status).toBe(200);
    expect(borrado.data).toMatchObject({ saldoPagado: 0, pagos: [] });
  });

  it('responde 404 si la deuda no existe o el pago es de otra deuda', async () => {
    const { api } = crearApi();
    const pago = { fecha: HOY, monto: 10, nota: null };
    await expect(api.createPago(999, pago)).rejects.toMatchObject({ status: 404 });

    const { data: deuda1 } = await api.getDeuda(1);
    const pagoDeOtra = deuda1.pagos[0].id;
    await expect(api.updatePago(2, pagoDeOtra, pago)).rejects.toMatchObject({ status: 404 });
    await expect(api.deletePago(2, pagoDeOtra)).rejects.toMatchObject({ status: 404 });
  });

  it('valida monto, fecha y nota', async () => {
    const { api } = crearApi();
    await expect(api.createPago(1, { fecha: 'ayer', monto: -5, nota: 'x'.repeat(501) })).rejects.toMatchObject({
      status: 400,
      problem: {
        errors: {
          fecha: ['La fecha del pago no es válida (usa AAAA-MM-DD).'],
          monto: ['El monto debe ser mayor a 0.'],
          nota: ['La nota no puede tener más de 500 caracteres.'],
        },
      },
    });
  });
});

describe('GET /api/dashboard/resumen', () => {
  it('suma los remanentes por tipo y cuenta vencidas y próximas', async () => {
    const { api } = crearApi();
    const { status, data } = await api.getDashboardResumen();
    expect(status).toBe(200);
    expect(data).toEqual({ totalPorCobrar: 29_100, totalPorPagar: 110_900, cantidadVencidas: 3, cantidadProximas: 3 });
  });
});

describe('comportamiento de la API simulada', () => {
  it('con fallar() responde 503 sin tocar los datos', async () => {
    const { api, guardados } = crearApi({ fallar: () => true });
    await expect(api.createDeuda(NUEVA)).rejects.toMatchObject({ status: 503 });
    expect(guardados()).toBeNull();
  });

  it('devuelve copias nuevas: modificarlas no cambia los datos', async () => {
    const { api } = crearApi();
    const { data } = await api.getDeuda(1);
    data.nombre = 'Cambiado afuera';
    data.pagos.length = 0;
    const { data: otraVez } = await api.getDeuda(1);
    expect(otraVez.nombre).not.toBe('Cambiado afuera');
    expect(otraVez.pagos.length).toBeGreaterThan(0);
  });

  it('espera la latencia indicada antes de responder', async () => {
    vi.useFakeTimers();
    const { api } = crearApi({ latenciaMs: () => 300 });
    let resuelta = false;
    const promesa = api.getDeudas().then(() => {
      resuelta = true;
    });

    await vi.advanceTimersByTimeAsync(299);
    expect(resuelta).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await promesa;
    expect(resuelta).toBe(true);
  });
});
