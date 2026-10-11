/** Une nombres de clase e ignora los valores falsos: cx('a', activo && 'b'). */
export function cx(...clases: ReadonlyArray<string | false | null | undefined>): string {
  return clases.filter((clase): clase is string => typeof clase === 'string' && clase !== '').join(' ')
}
