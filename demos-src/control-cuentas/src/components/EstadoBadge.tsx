import { Badge } from '@mantine/core'
import type { EstadoDeuda } from '../types/deuda'

const ESTADO_CONFIG: Record<EstadoDeuda, { color: string; label: string }> = {
  AlDia: { color: 'green', label: 'Al día' },
  Proximo: { color: 'yellow', label: 'Próximo' },
  Vencido: { color: 'red', label: 'Vencido' },
  Pagada: { color: 'blue', label: 'Pagada' },
  Lejana: { color: 'gray', label: 'Lejana' },
}

export function EstadoBadge({ estado }: { estado: EstadoDeuda }) {
  const { color, label } = ESTADO_CONFIG[estado]
  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  )
}
