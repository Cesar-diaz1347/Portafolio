import { useCallback, useEffect, useState } from 'react';

/**
 * Carga datos asíncronos con estados explícitos: `cargando`, `error` y `listo`.
 * Mientras recarga conserva los datos anteriores (sin parpadeo) y expone `reintentar`.
 *
 * @template T
 * @param {() => Promise<T>} cargar
 * @param {unknown[]} dependencias Cuándo volver a cargar.
 * @param {{ habilitado?: boolean }} [opciones] Con `habilitado: false` espera sin llamar.
 */
export function useRecurso(cargar, dependencias, { habilitado = true } = {}) {
  const [estado, setEstado] = useState(
    /** @type {{ tipo: 'cargando' | 'error' | 'listo', datos: T | null, error: unknown }} */ ({
      tipo: 'cargando',
      datos: null,
      error: null,
    }),
  );
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!habilitado) return undefined;
    let vigente = true;
    setEstado((previo) => ({ tipo: 'cargando', datos: previo.datos, error: null }));
    cargar().then(
      (datos) => {
        if (vigente) setEstado({ tipo: 'listo', datos, error: null });
      },
      (error) => {
        if (vigente) setEstado({ tipo: 'error', datos: null, error });
      },
    );
    return () => {
      vigente = false;
    };
    // La función `cargar` cambia en cada render; lo que manda son las dependencias explícitas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, habilitado, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { ...estado, reintentar };
}

/** Mensaje en español de un error de la API (o uno genérico si no lo trae). */
export function mensajeDeError(error) {
  // Algunos mensajes terminan en «p.m.» y la API les añade otro punto: se colapsa.
  return error instanceof Error && error.message ? error.message.replace(/[.]{2,}$/, '.') : 'Ocurrió un error inesperado.';
}
