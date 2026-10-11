import { MONTO_MAXIMO_CENT } from '../api/demo/limites'

/** Demo del portafolio: tope de los montos (999,999,999.99), el mismo que valida la API demo. */
export const MONTO_MAXIMO = MONTO_MAXIMO_CENT / 100

export function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
