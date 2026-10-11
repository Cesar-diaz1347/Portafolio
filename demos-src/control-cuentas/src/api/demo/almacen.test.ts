import { describe, expect, it } from 'vitest';

import { CLAVE_ALMACEN, crearAlmacen, type AlmacenamientoWeb, type DatosDemo } from './almacen';
import { crearSemilla } from './semilla';
import { crearStoragePrueba } from './storagePrueba';

const HOY = '2026-10-04';
const MANANA = '2026-10-05';

describe('crearAlmacen', () => {
  it('siembra la primera vez y guarda solo en su propia clave', () => {
    const { storage, datos } = crearStoragePrueba({ 'cd-tema': 'oscuro' });
    const almacen = crearAlmacen({ storage, hoy: () => HOY });

    expect(almacen.leer()).toEqual(crearSemilla(HOY));
    expect([...datos.keys()].sort()).toEqual([CLAVE_ALMACEN, 'cd-tema'].sort());
    expect(CLAVE_ALMACEN).toBe('controlPagos.demo.v1');
  });

  it.each([
    ['JSON inválido', '{no es json'],
    ['otra versión', JSON.stringify({ ...crearSemilla(HOY), version: 2 })],
    ['un pago sin su deuda', JSON.stringify({ ...crearSemilla(HOY), deudas: [] })],
    ['un monto con decimales', JSON.stringify(conPrimerMonto(crearSemilla(HOY), 10.5))],
  ])('vuelve a sembrar si los datos están corruptos: %s', (_, guardado) => {
    const { storage } = crearStoragePrueba({ [CLAVE_ALMACEN]: guardado });
    expect(crearAlmacen({ storage, hoy: () => HOY }).leer()).toEqual(crearSemilla(HOY));
  });

  it('vuelve a sembrar al día siguiente si el usuario no cambió nada', () => {
    const { storage } = crearStoragePrueba();
    let hoy = HOY;
    const almacen = crearAlmacen({ storage, hoy: () => hoy });
    almacen.leer();

    hoy = MANANA;
    expect(almacen.leer()).toEqual(crearSemilla(MANANA));
  });

  it('conserva los cambios del usuario aunque cambie el día', () => {
    const { storage } = crearStoragePrueba();
    let hoy = HOY;
    const almacen = crearAlmacen({ storage, hoy: () => hoy });
    const datos = almacen.leer();
    datos.deudas[0].nombre = 'Editada por el usuario';
    almacen.guardar(datos);

    hoy = MANANA;
    const leidos = almacen.leer();
    expect(leidos.modificado).toBe(true);
    expect(leidos.sembradoEl).toBe(HOY);
    expect(leidos.deudas[0].nombre).toBe('Editada por el usuario');
  });

  it('reiniciar borra solo su clave y la próxima lectura vuelve a sembrar', () => {
    const { storage, datos } = crearStoragePrueba({ 'cd-tema': 'claro', 'reservas.demo.v1': '{}' });
    const almacen = crearAlmacen({ storage, hoy: () => HOY });
    const leidos = almacen.leer();
    leidos.deudas.pop();
    almacen.guardar(leidos);

    almacen.reiniciar();
    expect(datos.has(CLAVE_ALMACEN)).toBe(false);
    expect(datos.get('cd-tema')).toBe('claro');
    expect(datos.get('reservas.demo.v1')).toBe('{}');
    expect(almacen.leer()).toEqual(crearSemilla(HOY));
  });

  it('sin storage, guarda en memoria', () => {
    const almacen = crearAlmacen({ storage: null, hoy: () => HOY });
    const datos = almacen.leer();
    datos.deudas.pop();
    almacen.guardar(datos);
    expect(almacen.leer().deudas).toHaveLength(datos.deudas.length);
  });

  it('si el storage lanza (bloqueado o lleno), sigue en memoria sin perder cambios', () => {
    const storageRoto: AlmacenamientoWeb = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const almacen = crearAlmacen({ storage: storageRoto, hoy: () => HOY });
    const datos = almacen.leer();
    datos.deudas.pop();
    almacen.guardar(datos);

    expect(almacen.leer().deudas).toHaveLength(datos.deudas.length);
    expect(() => almacen.reiniciar()).not.toThrow();
  });

  it('leer devuelve copias: modificarlas sin guardar no cambia los datos', () => {
    const almacen = crearAlmacen({ storage: null, hoy: () => HOY });
    almacen.leer().deudas.length = 0;
    expect(almacen.leer().deudas.length).toBeGreaterThan(0);
  });
});

function conPrimerMonto(datos: DatosDemo, montoCent: number): DatosDemo {
  const [primero, ...resto] = datos.pagos;
  return { ...datos, pagos: [{ ...primero, montoCent }, ...resto] };
}
