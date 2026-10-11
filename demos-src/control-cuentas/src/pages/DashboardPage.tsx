import { Alert, Card, Group, Loader, SimpleGrid, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { describeApiError } from '../api/client'
import { getDashboardResumen } from '../api/deudas'
import { useCurrency } from '../context/CurrencyContext'

export function DashboardPage() {
  const { format } = useCurrency()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: getDashboardResumen,
  })

  if (isLoading) return <Loader />
  if (isError || !data)
    return (
      <Alert color="red" title="No se pudo cargar el resumen.">
        <Text size="sm">{describeApiError(error)}</Text>
      </Alert>
    )

  return (
    <>
      <Title order={2} mb="md">
        Dashboard
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">
            Total por cobrar
          </Text>
          <Text size="xl" fw={700} c="green">
            {format(data.totalPorCobrar)}
          </Text>
        </Card>

        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">
            Total por pagar
          </Text>
          <Text size="xl" fw={700} c="red">
            {format(data.totalPorPagar)}
          </Text>
        </Card>

        <Card withBorder padding="lg" component={Link} to="/deudas">
          <Text size="sm" c="dimmed">
            Próximas a vencer
          </Text>
          <Text size="xl" fw={700} c="yellow">
            {data.cantidadProximas}
          </Text>
        </Card>

        <Card withBorder padding="lg" component={Link} to="/deudas">
          <Text size="sm" c="dimmed">
            Vencidas
          </Text>
          <Text size="xl" fw={700} c="red">
            {data.cantidadVencidas}
          </Text>
        </Card>
      </SimpleGrid>

      <Group mt="xl">
        <Text component={Link} to="/deudas" c="blue" display="inline-block" py="sm">
          Ver listado de deudas →
        </Text>
      </Group>
    </>
  )
}
