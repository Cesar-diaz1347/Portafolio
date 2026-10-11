import { Progress } from '@mantine/core'
import type { EstadoDeuda } from '../types/deuda'

const COLOR_POR_ESTADO: Record<EstadoDeuda, string> = {
  AlDia: 'green',
  Proximo: 'yellow',
  Vencido: 'red',
  Pagada: 'blue',
  Lejana: 'gray',
}

export function ProgresoBar({ porcentaje, estado }: { porcentaje: number; estado: EstadoDeuda }) {
  return <Progress value={porcentaje} color={COLOR_POR_ESTADO[estado]} size="lg" radius="sm" />
}
