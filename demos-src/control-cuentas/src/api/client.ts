import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

type ProblemDetails = {
  title?: string;
  detail?: string;
};

/**
 * Convierte el error de una peticion en un texto util para mostrar en pantalla.
 * En desarrollo agrega el detalle tecnico (status, ProblemDetails) para no
 * tener que ir a buscarlo a la terminal del backend.
 */
export function describeApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Error desconocido.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'La API tardo demasiado en responder.';
  }

  if (!error.response) {
    return 'No se pudo contactar la API (¿el backend esta corriendo?).';
  }

  const { status } = error.response;
  const base =
    status >= 500
      ? 'La API respondio con un error interno.'
      : 'La API rechazo la peticion.';

  if (!import.meta.env.DEV) return base;

  const problem = error.response.data as ProblemDetails | undefined;
  const detalle = problem?.detail ?? problem?.title ?? error.message;

  return `${base} (HTTP ${status}: ${detalle})`;
}
