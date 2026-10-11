import { describe, expect, it } from 'vitest';

import type { EstadoDeuda } from '../../types/deuda';
import { crearAlmacen } from './almacen';
import { crearApiDemo } from './api';
import { sumarDias } from './fechas';
import { crearSemilla } from './semilla';

const ESTADOS: EstadoDeuda[] = ['AlDia', 'Proximo', 'Vencido', 'Pagada', 'Lejana'];

describe('crearSemilla', () => {
  it('cubre los 5 estados y los 2 tipos todos los días de 2026 a 2028, sin pagos futuros', async () => {
    const fallos: string[] = [];

    for (let hoy = '2026-01-01'; hoy <= '2028-12-31'; hoy = sumarDias(hoy, 1)) {
      const datos = crearSemilla(hoy);
      const api = crearApiDemo({ almacen: crearAlmacen({ storage: null, hoy: () => hoy }), hoy: () => hoy });
      const { data: deudas } = await api.getDeudas();

      const estados = new Set(deudas.map((deuda) => deuda.estado));
      const faltantes = ESTADOS.filter((estado) => !estados.has(estado));
      if (faltantes.length > 0) fallos.push(`${hoy}: faltan ${faltantes.join(', ')}`);
      if (new Set(deudas.map((deuda) => deuda.tipo)).size !== 2) fallos.push(`${hoy}: falta un tipo`);
      if (deudas.length < 8) fallos.push(`${hoy}: solo ${deudas.length} deudas`);

      for (const pago of datos.pagos) {
        const deuda = datos.deudas.find((d) => d.id === pago.deudaId);
        if (pago.fecha > hoy) fallos.push(`${hoy}: pago ${pago.id} con fecha futura ${pago.fecha}`);
        if (deuda && pago.fecha < deuda.fechaInicio) fallos.push(`${hoy}: pago ${pago.id} antes del inicio`);
      }
    }

    expect(fallos).toEqual([]);
  });

  it('es determinista y empieza sin cambios del usuario', () => {
    const semilla = crearSemilla('2026-10-04');
    expect(crearSemilla('2026-10-04')).toEqual(semilla);
    expect(semilla).toMatchObject({ version: 1, sembradoEl: '2026-10-04', modificado: false });
    expect(semilla.siguienteIdDeuda).toBe(semilla.deudas.length + 1);
    expect(semilla.siguienteIdPago).toBe(semilla.pagos.length + 1);
  });
});
