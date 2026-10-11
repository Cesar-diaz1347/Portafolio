/** Mes de calendario: `mes` va de 1 (enero) a 12 (diciembre). */
export interface MesAnio {
  anio: number
  mes: number
}

/** Abreviaturas iguales a las del CV («Jul 2022 – Presente»). */
const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

function validarMes(mes: number): void {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new RangeError(`Mes fuera de rango: ${mes}. Debe ir de 1 a 12.`)
  }
}

export function mesAnioDeFecha(fecha: Date): MesAnio {
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 }
}

/**
 * Meses entre dos meses de calendario contando ambos extremos, como se lee un CV:
 * enero–junio son 6 meses. Si el fin es anterior al inicio devuelve 0.
 */
export function mesesInclusivos(inicio: MesAnio, fin: MesAnio): number {
  validarMes(inicio.mes)
  validarMes(fin.mes)
  const meses = (fin.anio - inicio.anio) * 12 + (fin.mes - inicio.mes) + 1
  return Math.max(meses, 0)
}

/** «2 años 4 meses», «1 año», «6 meses». */
export function formatearDuracion(meses: number): string {
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  const partes: string[] = []
  if (anios > 0) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`)
  if (resto > 0) partes.push(`${resto} ${resto === 1 ? 'mes' : 'meses'}`)
  return partes.length > 0 ? partes.join(' ') : 'Menos de 1 mes'
}

/** «Jul 2022». */
export function formatearMesAnio({ anio, mes }: MesAnio): string {
  validarMes(mes)
  return `${MESES_CORTOS[mes - 1]} ${anio}`
}

/** Valor para el atributo `dateTime` de `<time>`: «2022-07». */
export function aDateTime({ anio, mes }: MesAnio): string {
  validarMes(mes)
  return `${anio}-${String(mes).padStart(2, '0')}`
}
