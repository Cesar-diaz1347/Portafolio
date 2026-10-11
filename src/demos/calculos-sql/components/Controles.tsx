import { useId, useRef, useState } from 'react'

import { cx } from '../../../lib/cx'
import boton from '../../../styles/boton.module.css'
import type { Escenario } from '../engine'
import { describirCampo, PARAMETROS_EDITABLES, rutaParametro, type Formulario, type ParametroEditable } from '../lib/formulario'
import { Icono } from '../../../components/Icono/Icono'
import { CampoNumerico } from './CampoNumerico'
import styles from './Controles.module.css'
import { TablasDatos } from './TablasDatos'

interface ControlesProps {
  escenarios: readonly Escenario[]
  escenario: Escenario
  formulario: Formulario
  errores: Readonly<Record<string, string>>
  editado: boolean
  onEscenario: (id: string) => void
  onCambioCampo: (ruta: string, texto: string) => void
  onSalirCampo: (ruta: string) => void
  onModo: (aplicarBorrado: boolean) => void
  onRestablecer: () => void
}

const ETIQUETA_PARAMETRO: Readonly<Record<ParametroEditable, string>> = {
  yy: '@YY (año)',
  mm: '@MM (mes)',
  indiceId: '@INDICEID',
  usuarioId: '@USUARIOID',
}

/** Escenario, parámetros del script (DECLARE) y datos de las tablas, todo editable. */
export function Controles({
  escenarios,
  escenario,
  formulario,
  errores,
  editado,
  onEscenario,
  onCambioCampo,
  onSalirCampo,
  onModo,
  onRestablecer,
}: ControlesProps) {
  const idSelector = useId()
  const idDescripcion = `${idSelector}-descripcion`
  const selectorRef = useRef<HTMLSelectElement>(null)
  // Si el visitante no lo abrió ni lo cerró, un error dentro de las tablas lo abre para que no quede escondido.
  const [tablasPorVisitante, setTablasPorVisitante] = useState<boolean | null>(null)
  const hayErrorEnTablas = Object.keys(errores).some((ruta) => !ruta.startsWith('parametros.'))
  const tablasAbiertas = tablasPorVisitante ?? hayErrorEnTablas

  // El botón desaparece al restablecer: el foco pasa al selector para no perderlo.
  const restablecer = () => {
    onRestablecer()
    selectorRef.current?.focus()
  }

  return (
    <section className={styles.controles} aria-labelledby="titulo-controles">
      <h2 id="titulo-controles" className={styles.titulo}>
        Datos de entrada
      </h2>

      <div className={styles.fila}>
        <div className={styles.escenario}>
          <label className={styles.etiqueta} htmlFor={idSelector}>
            Escenario
          </label>
          <select
            id={idSelector}
            ref={selectorRef}
            className={styles.selector}
            value={escenario.id}
            aria-describedby={idDescripcion}
            onChange={(evento) => onEscenario(evento.target.value)}
          >
            {escenarios.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.titulo}
              </option>
            ))}
          </select>
          <p id={idDescripcion} className={styles.descripcion} aria-live="polite">
            {escenario.descripcion}
          </p>
        </div>

        <fieldset className={styles.parametros}>
          <legend className={styles.leyenda}>Parámetros del script (DECLARE)</legend>
          <div className={styles.camposParametros}>
            {PARAMETROS_EDITABLES.map((nombre) => (
              <CampoNumerico
                key={nombre}
                ruta={rutaParametro(nombre)}
                valor={formulario.campos[rutaParametro(nombre)] ?? ''}
                modo="entero"
                etiqueta={ETIQUETA_PARAMETRO[nombre]}
                error={errores[rutaParametro(nombre)]}
                onCambio={onCambioCampo}
                onSalir={onSalirCampo}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.modo}>
          <legend className={styles.leyenda}>Paso 2 del script: depuración</legend>
          <div className={styles.opciones}>
            {[
              { aplicar: false, texto: 'Vista previa', detalle: '@AplicarBorrado = 0' },
              { aplicar: true, texto: 'Borrar de verdad', detalle: '@AplicarBorrado = 1' },
            ].map((opcion) => (
              <label key={opcion.texto} className={styles.opcion}>
                <input
                  className="solo-lectores"
                  type="radio"
                  name="modo-paso-2"
                  checked={formulario.aplicarBorrado === opcion.aplicar}
                  onChange={() => onModo(opcion.aplicar)}
                />
                <span className={styles.opcionTexto}>
                  <strong>{opcion.texto}</strong> <span className={styles.detalle}>{opcion.detalle}</span>
                </span>
              </label>
            ))}
          </div>
          {formulario.aplicarBorrado && (
            <p className={styles.nota}>El DELETE solo afecta a la copia de los datos en la memoria de esta página.</p>
          )}
        </fieldset>
      </div>

      <details
        className={styles.detalles}
        open={tablasAbiertas}
        onToggle={(evento) => setTablasPorVisitante(evento.currentTarget.open)}
      >
        <summary className={styles.resumen}>
          Editar los datos de las tablas
          {editado && <span className={styles.editado}>editado</span>}
        </summary>
        <p className={styles.ayuda}>
          Escribe los montos como quieras: 11,637.25 y 11637.25 valen lo mismo. Todo se recalcula al instante.
        </p>
        <TablasDatos
          dataset={escenario.dataset}
          formulario={formulario}
          errores={errores}
          onCambioCampo={onCambioCampo}
          onSalirCampo={onSalirCampo}
        />
      </details>

      {Object.keys(errores).length > 0 && (
        <p className={styles.resumenErrores}>
          Campos con error: {Object.keys(errores).map(describirCampo).join(' · ')}. Corrígelos para recalcular.
        </p>
      )}

      {editado && (
        <button type="button" className={cx(boton.boton, boton.compacto)} onClick={restablecer}>
          <Icono nombre="restablecer" />
          Restablecer el escenario
        </button>
      )}
    </section>
  )
}
