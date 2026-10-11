import { useEffect } from 'react'
import {
  Alert,
  Button,
  Group,
  LoadingOverlay,
  NumberInput,
  Paper,
  SegmentedControl,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { describeApiError } from '../api/client'
import { createDeuda, getDeuda, updateDeuda } from '../api/deudas'
import type { DeudaFormInput, TipoDeuda } from '../types/deuda'
import { parseDDMMYYYY } from '../utils/dateParser'
import { erroresDeCampo, esNoEncontrado } from '../utils/errores'
import { MONTO_MAXIMO } from '../utils/format'

type DeudaFormValues = Omit<DeudaFormInput, 'saldoInicial' | 'cuotaMensual'> & {
  saldoInicial: number | ''
  cuotaMensual: number | ''
}

export function DeudaFormPage() {
  const { id } = useParams()
  const deudaId = id ? Number(id) : undefined
  const isEdit = deudaId !== undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: existente,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['deuda', deudaId],
    queryFn: () => getDeuda(deudaId!),
    enabled: isEdit,
  })

  const form = useForm<DeudaFormValues>({
    initialValues: {
      nombre: '',
      tipo: 'Recibido',
      fechaInicio: '',
      fechaFinPropuesta: '',
      saldoInicial: '',
      cuotaMensual: '',
    },
    validate: {
      nombre: (value) => (value.trim().length === 0 ? 'El nombre es obligatorio' : null),
      fechaInicio: (value) => (value ? null : 'Requerido'),
      fechaFinPropuesta: (value) => (value ? null : 'Requerido'),
      saldoInicial: (value) => (typeof value === 'number' && value > 0 ? null : 'Debe ser mayor a 0'),
      cuotaMensual: (value) => (typeof value === 'number' && value > 0 ? null : 'Debe ser mayor a 0'),
    },
  })

  useEffect(() => {
    if (existente) {
      form.setValues({
        nombre: existente.nombre,
        tipo: existente.tipo,
        fechaInicio: existente.fechaInicio,
        fechaFinPropuesta: existente.fechaFinPropuesta,
        saldoInicial: existente.saldoInicial,
        cuotaMensual: existente.cuotaMensual,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existente])

  const mutation = useMutation({
    mutationFn: async (values: DeudaFormInput): Promise<void> => {
      if (isEdit) await updateDeuda(deudaId!, values)
      else await createDeuda(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deudas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] })
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['deuda', deudaId] })
      notifications.show({
        message: isEdit ? 'Deuda actualizada' : 'Deuda creada',
        color: 'green',
      })
      navigate(isEdit ? `/deudas/${deudaId}` : '/deudas')
    },
    // Demo del portafolio: el mensaje real de la API y, si es un 400, cada error junto a su campo.
    onError: (errorMutacion) => {
      const campos = erroresDeCampo(errorMutacion)
      if (campos) form.setErrors(campos)
      notifications.show({
        title: 'No se pudo guardar la deuda',
        message: describeApiError(errorMutacion),
        color: 'red',
      })
    },
  })

  if (isEdit && isError) {
    return (
      <Alert color="red" title={esNoEncontrado(error) ? 'No se encontró la deuda.' : 'No se pudo cargar la deuda.'}>
        <Text size="sm">{describeApiError(error)}</Text>
      </Alert>
    )
  }

  return (
    <Paper withBorder p="lg" maw={520} pos="relative">
      <LoadingOverlay visible={isEdit && isLoading} />
      <Title order={2} mb="md">
        {isEdit ? 'Editar deuda' : 'Nueva deuda'}
      </Title>

      <form
        noValidate
        onSubmit={form.onSubmit((values) =>
          mutation.mutate({
            ...values,
            saldoInicial: values.saldoInicial as number,
            cuotaMensual: values.cuotaMensual as number,
          }),
        )}
      >
        <TextInput label="Nombre" placeholder="Nombre de la persona/entidad" {...form.getInputProps('nombre')} mb="sm" />

        <SegmentedControl
          fullWidth
          aria-label="Tipo de deuda"
          data={[
            { label: 'Recibido (me deben)', value: 'Recibido' },
            { label: 'Realizado (yo debo)', value: 'Realizado' },
          ]}
          value={form.values.tipo}
          onChange={(value) => form.setFieldValue('tipo', value as TipoDeuda)}
          mb={form.errors.tipo ? 4 : 'sm'}
        />
        {form.errors.tipo && (
          <Text c="red" size="xs" mb="sm" role="alert">
            {form.errors.tipo}
          </Text>
        )}

        <DateInput
          label="Fecha inicio deuda"
          valueFormat="DD/MM/YYYY"
          dateParser={parseDDMMYYYY}
          value={form.values.fechaInicio || null}
          onChange={(value) => form.setFieldValue('fechaInicio', value ?? '')}
          error={form.errors.fechaInicio}
          mb="sm"
        />

        <DateInput
          label="Fecha fin propuesta"
          valueFormat="DD/MM/YYYY"
          dateParser={parseDDMMYYYY}
          value={form.values.fechaFinPropuesta || null}
          onChange={(value) => form.setFieldValue('fechaFinPropuesta', value ?? '')}
          error={form.errors.fechaFinPropuesta}
          mb="sm"
        />

        <NumberInput
          label="Saldo inicial"
          placeholder="0.00"
          decimalScale={2}
          fixedDecimalScale
          thousandSeparator=","
          min={0}
          max={MONTO_MAXIMO}
          allowNegative={false}
          {...form.getInputProps('saldoInicial')}
          mb="sm"
        />

        <NumberInput
          label="Cuota al mes"
          placeholder="0.00"
          decimalScale={2}
          fixedDecimalScale
          thousandSeparator=","
          min={0}
          max={MONTO_MAXIMO}
          allowNegative={false}
          {...form.getInputProps('cuotaMensual')}
          mb="md"
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Guardar
          </Button>
        </Group>
      </form>
    </Paper>
  )
}
