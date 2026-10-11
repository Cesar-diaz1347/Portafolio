/** Límites de la validación demo: los del backend .NET más el tope de montos propio de la demo. */

export const NOMBRE_MAXIMO = 200;
export const NOTA_MAXIMA = 500;

/** 0.01, como `[Range(0.01, …)]` en los DTO del backend. */
export const MONTO_MINIMO_CENT = 1;

/**
 * 999,999,999.99: límite propio de la demo (el backend acepta hasta `decimal(18,2)`). Con este
 * tope, todas las cuentas en centavos caben exactas en un `number` y no hace falta BigInt.
 */
export const MONTO_MAXIMO_CENT = 99_999_999_999;
