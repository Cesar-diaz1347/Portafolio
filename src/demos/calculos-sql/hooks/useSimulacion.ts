import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ESCENARIOS,
  ejecutarConteoYValor,
  type Escenario,
  type IdEscenario,
  type PasoTraza,
  type ResultadoConteo,
} from '../engine'
import { construirBusqueda, leerEnlace } from '../lib/enlaceProfundo'
import { analizarDecimal, analizarEntero } from '../lib/entradaFlexible'
import { construirEntrada, erroresPorCampo, estaEditado, formularioInicial, type Formulario } from '../lib/formulario'

const IDS: readonly string[] = ESCENARIOS.map((escenario) => escenario.id)
const ESCENARIO_POR_DEFECTO: IdEscenario = 'original'

function escenarioPorId(id: string | null): Escenario {
  const encontrado = ESCENARIOS.find((escenario) => escenario.id === id)
  const respaldo = ESCENARIOS.find((escenario) => escenario.id === ESCENARIO_POR_DEFECTO)
  const elegido = encontrado ?? respaldo
  if (!elegido) throw new Error('No hay escenarios definidos.')
  return elegido
}

/** Los pasos del recorrido: vacío si los datos no llegaron a ejecutarse. */
export function trazaDe(resultado: ResultadoConteo): readonly PasoTraza[] {
  if (resultado.ok) return resultado.traza
  return resultado.tipo === 'GUARDA' ? resultado.traza : []
}

/** Ejecuta el script con lo que hay en el formulario. Si algún texto no es un número, ni lo intenta. */
function calcular(escenario: Escenario, formulario: Formulario): ResultadoConteo {
  const entrada = construirEntrada(escenario, formulario)
  if (entrada.errores.length > 0) return { ok: false, tipo: 'ENTRADA_INVALIDA', errores: entrada.errores }
  try {
    return ejecutarConteoYValor(entrada.dataset, entrada.parametros)
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'error desconocido'
    return {
      ok: false,
      tipo: 'ENTRADA_INVALIDA',
      errores: [{ campo: 'general', mensaje: `No se pudo ejecutar el script con estos datos (${detalle}).` }],
    }
  }
}

/**
 * Estado del simulador: escenario, lo que el visitante edita, el resultado del motor y el paso
 * actual. Todo se recalcula al instante; el enlace (`?escenario=&paso=`) se mantiene al día.
 */
export function useSimulacion() {
  const [enlaceInicial] = useState(() => leerEnlace(window.location.search, IDS))
  const [escenario, setEscenario] = useState(() => escenarioPorId(enlaceInicial.escenario))
  const [formulario, setFormulario] = useState(() => formularioInicial(escenarioPorId(enlaceInicial.escenario)))
  const [paso, setPaso] = useState(() => (enlaceInicial.paso ?? 1) - 1)

  const base = useMemo(() => formularioInicial(escenario), [escenario])
  const resultado = useMemo(() => calcular(escenario, formulario), [escenario, formulario])
  const traza = useMemo(() => trazaDe(resultado), [resultado])
  const totalPasos = traza.length
  // Si al editar el recorrido se acorta, el paso se queda en el último que exista.
  const pasoActual = Math.min(paso, Math.max(totalPasos - 1, 0))
  const errores = useMemo(
    () => (!resultado.ok && resultado.tipo === 'ENTRADA_INVALIDA' ? erroresPorCampo(resultado.errores) : {}),
    [resultado],
  )

  useEffect(() => {
    const busqueda = construirBusqueda(window.location.search, escenario.id, pasoActual + 1)
    if (busqueda !== window.location.search) {
      window.history.replaceState(null, '', `${window.location.pathname}${busqueda}${window.location.hash}`)
    }
  }, [escenario.id, pasoActual])

  const seleccionarEscenario = useCallback((id: string) => {
    const nuevo = escenarioPorId(id)
    setEscenario(nuevo)
    setFormulario(formularioInicial(nuevo))
    setPaso(0)
  }, [])

  const restablecer = useCallback(() => setFormulario(formularioInicial(escenario)), [escenario])

  const cambiarCampo = useCallback((ruta: string, texto: string) => {
    setFormulario((actual) => ({ ...actual, campos: { ...actual.campos, [ruta]: texto } }))
  }, [])

  /** Al salir del campo, lo escrito se reemplaza por su forma canónica («11,637.25» → «11637.25»). */
  const normalizarCampo = useCallback((ruta: string) => {
    setFormulario((actual) => {
      const texto = actual.campos[ruta]
      if (texto === undefined) return actual
      const lectura = ruta.startsWith('parametros.') ? analizarEntero(texto) : analizarDecimal(texto)
      if (!lectura.ok || lectura.valor === texto) return actual
      return { ...actual, campos: { ...actual.campos, [ruta]: lectura.valor } }
    })
  }, [])

  const cambiarModo = useCallback((aplicarBorrado: boolean) => {
    setFormulario((actual) => ({ ...actual, aplicarBorrado }))
  }, [])

  const irAPaso = useCallback((indice: number) => setPaso(Math.max(0, indice)), [])

  return {
    escenario,
    formulario,
    editado: estaEditado(formulario, base),
    resultado,
    traza,
    totalPasos,
    pasoActual,
    errores,
    seleccionarEscenario,
    restablecer,
    cambiarCampo,
    normalizarCampo,
    cambiarModo,
    irAPaso,
  }
}
