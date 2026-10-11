import type { AlmacenamientoWeb } from './almacen';

/** Storage en memoria para las pruebas; `datos` deja ver y preparar lo guardado. */
export function crearStoragePrueba(inicial: Record<string, string> = {}): {
  storage: AlmacenamientoWeb;
  datos: Map<string, string>;
} {
  const datos = new Map(Object.entries(inicial));
  const storage: AlmacenamientoWeb = {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
  };
  return { storage, datos };
}
