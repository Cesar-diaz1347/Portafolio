import { useState } from 'react'
import { Alert, Anchor, Box, Button, Group, Loader, SegmentedControl, Table, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { describeApiError } from '../api/client'
import { getDeudas } from '../api/deudas'
import { EstadoBadge } from '../components/EstadoBadge'
import { ProgresoBar } from '../components/ProgresoBar'
import { useCurrency } from '../context/CurrencyContext'
import type { TipoDeuda } from '../types/deuda'
import { formatDate } from '../utils/format'

type Filtro = 'Todos' | TipoDeuda

export function DeudasListPage() {
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const navigate = useNavigate()
  const { format } = useCurrency()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['deudas', filtro],
    queryFn: () => getDeudas(filtro === 'Todos' ? undefined : filtro),
  })

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Deudas</Title>
        <Button component={Link} to="/deudas/nueva">
          Nueva deuda
        </Button>
      </Group>

      <SegmentedControl
        value={filtro}
        onChange={(value) => setFiltro(value as Filtro)}
        data={[
          { label: 'Todos', value: 'Todos' },
          { label: 'Recibidos', value: 'Recibido' },
          { label: 'Realizados', value: 'Realizado' },
        ]}
        mb="md"
      />

      {isLoading && <Loader />}
      {isError && (
        <Alert color="red" title="No se pudo cargar el listado.">
          <Text size="sm">{describeApiError(error)}</Text>
        </Alert>
      )}

      {data && data.length === 0 && <Alert color="gray">No hay deudas registradas todavía.</Alert>}

      {data && data.length > 0 && (
        // Demo del portafolio: en pantallas angostas la tabla se desplaza en horizontal.
        <Table.ScrollContainer minWidth={760}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Saldo remanente</Table.Th>
                <Table.Th>Cuota mensual</Table.Th>
                <Table.Th>Vencimiento propuesto</Table.Th>
                <Table.Th>Avance</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((d) => (
                <Table.Tr
                  key={d.id}
                  onClick={(evento) => {
                    // El enlace del nombre ya navega; el resto de la fila es un atajo con el mouse.
                    if (evento.target instanceof Element && evento.target.closest('a')) return
                    navigate(`/deudas/${d.id}`)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Anchor component={Link} to={`/deudas/${d.id}`} fw={600}>
                      {d.nombre}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{d.tipo === 'Recibido' ? 'Recibido' : 'Realizado'}</Table.Td>
                  <Table.Td>{format(d.saldoRemanente)}</Table.Td>
                  <Table.Td>{format(d.cuotaMensual)}</Table.Td>
                  <Table.Td>{formatDate(d.fechaFinPropuesta)}</Table.Td>
                  <Table.Td>
                    <Box miw={120}>
                      <ProgresoBar porcentaje={d.porcentajeAvance} estado={d.estado} />
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <EstadoBadge estado={d.estado} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  )
}
