/** Códigos HTTP que puede devolver la API simulada. */
export type StatusDemo = 400 | 404 | 503;

/** Cuerpo de error al estilo ProblemDetails (RFC 9457), como lo devolvería ASP.NET Core. */
export interface ProblemDetailsDemo {
  status: StatusDemo;
  title: string;
  detail?: string;
  /** Errores de validación por campo; las claves son los nombres de los campos del formulario. */
  errors?: Record<string, string[]>;
}

/**
 * Error de la API simulada. `message` va en español y es lo que muestra `describeApiError`,
 * que para errores que no vienen de axios usa `error.message`.
 */
export class DemoApiError extends Error {
  readonly status: StatusDemo;
  readonly problem: ProblemDetailsDemo;

  constructor(problem: ProblemDetailsDemo) {
    super(problem.detail ?? problem.title);
    this.name = 'DemoApiError';
    this.status = problem.status;
    this.problem = problem;
  }
}

export function errorValidacion(errors: Record<string, string[]>): DemoApiError {
  return new DemoApiError({
    status: 400,
    title: 'Uno o más datos no son válidos.',
    detail: Object.values(errors).flat().join(' '),
    errors,
  });
}

export function errorNoEncontrado(detalle: string): DemoApiError {
  return new DemoApiError({ status: 404, title: 'No encontrado.', detail: detalle });
}

export function errorServicioNoDisponible(): DemoApiError {
  return new DemoApiError({
    status: 503,
    title: 'Servicio no disponible.',
    detail: 'La API de demostración no respondió. Intenta de nuevo en unos segundos.',
  });
}
