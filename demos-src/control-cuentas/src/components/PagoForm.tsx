import { useEffect } from 'react'
import { Button, Group, Modal, NumberInput, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'

import type { Pago, PagoCreateInput } from '../types/deuda'
import { parseDDMMYYYY } from '../utils/dateParser'
import { MONTO_MAXIMO, toDateInputValue } from '../utils/format'

interface PagoFormProps {
  opened: boolean
  onClose: () => void
  onSubmit: (input: PagoCreateInput) => void
  loading: boolean
  pagoInicial?: Pago
  /** Demo del portafolio: errores por campo que devolvió la API (fecha, monto, nota). */
  erroresServidor?: Record<string, string> | null
}

type PagoFormValues = Omit<PagoCreateInput, 'monto'> & { monto: number | '' }

export function PagoForm({ opened, onClose, onSubmit, loading, pagoInicial, erroresServidor }: PagoFormProps) {
  const form = useForm<PagoFormValues>({
    initialValues: {
      fecha: pagoInicial?.fecha ?? toDateInputValue(new Date()),
      monto: pagoInicial?.monto ?? '',
      nota: pagoInicial?.nota ?? '',
    },
    validate: {
      fecha: (value) => (value ? null : 'Requerido'),
      monto: (value) => (typeof value === 'number' && value > 0 ? null : 'Debe ser mayor a 0'),
    },
  })

  useEffect(() => {
    if (opened) {
      form.setValues({
        fecha: pagoInicial?.fecha ?? toDateInputValue(new Date()),
        monto: pagoInicial?.monto ?? '',
        nota: pagoInicial?.nota ?? '',
      })
      form.clearErrors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, pagoInicial])

  useEffect(() => {
    if (erroresServidor) form.setErrors(erroresServidor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erroresServidor])

  return (
    <Modal opened={opened} onClose={onClose} title={pagoInicial ? 'Editar pago' : 'Registrar pago'}>
      <form
        noValidate
        onSubmit={form.onSubmit((values) => {
          // Demo del portafolio: sin form.reset() aquí; si la API rechaza el pago, lo escrito se conserva.
          onSubmit({ ...values, monto: values.monto as number })
        })}
      >
        <DateInput
          label="Fecha"
          valueFormat="DD/MM/YYYY"
          dateParser={parseDDMMYYYY}
          value={form.values.fecha || null}
          onChange={(value) => form.setFieldValue('fecha', value ?? '')}
          error={form.errors.fecha}
          mb="sm"
        />

        <NumberInput
          label="Monto"
          placeholder="0.00"
          decimalScale={2}
          fixedDecimalScale
          thousandSeparator=","
          min={0}
          max={MONTO_MAXIMO}
          allowNegative={false}
          {...form.getInputProps('monto')}
          mb="sm"
        />

        <TextInput label="Nota (opcional)" {...form.getInputProps('nota')} mb="md" />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </Group>
      </form>
    </Modal>
  )
}
