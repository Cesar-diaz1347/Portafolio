import { Anchor, Button, Group, Modal, Paper, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { reiniciarDemo } from '../api/demo/api'

/**
 * Demo del portafolio: aviso de datos simulados, «Reiniciar demo» (borra solo la clave de esta
 * demo, controlPagos.demo.v1) y regreso al portafolio.
 */
export function DemoBanner() {
  const [confirmando, { open: abrirConfirmacion, close: cerrarConfirmacion }] = useDisclosure(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function reiniciar() {
    reiniciarDemo()
    cerrarConfirmacion()
    await queryClient.resetQueries()
    navigate('/')
    notifications.show({ message: 'Demo reiniciada: volvieron los datos de ejemplo.', color: 'green' })
  }

  return (
    <>
      <Paper
        component="section"
        aria-label="Aviso de demo"
        withBorder
        radius="md"
        px="md"
        py="xs"
        mb="md"
        bg="var(--mantine-color-blue-light)"
      >
        <Group justify="space-between" gap="xs">
          <Text size="sm" fw={600}>
            Demo · datos simulados en tu navegador
          </Text>
          <Group gap="xs">
            <Button variant="default" size="sm" h={44} onClick={abrirConfirmacion}>
              Reiniciar demo
            </Button>
            <Anchor href="../../index.html#proyectos" size="sm" fw={600} py="sm">
              <span aria-hidden="true">← </span>Volver al portafolio
            </Anchor>
          </Group>
        </Group>
      </Paper>

      <Modal opened={confirmando} onClose={cerrarConfirmacion} title="¿Reiniciar la demo?">
        <Text size="sm" mb="md">
          Se borran los cambios que hiciste y vuelven los datos de ejemplo. Solo afecta a esta demo.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={cerrarConfirmacion}>
            Cancelar
          </Button>
          <Button color="red" onClick={() => void reiniciar()}>
            Reiniciar demo
          </Button>
        </Group>
      </Modal>
    </>
  )
}
