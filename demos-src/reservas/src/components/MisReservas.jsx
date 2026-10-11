import React, { useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Info,
  Loader2,
  MapPin,
  Trash2,
  Stethoscope,
} from 'lucide-react';

import Cargando from './Cargando.jsx';
import Dialogo from './Dialogo.jsx';
import ErrorConReintento from './ErrorConReintento.jsx';
import { mensajeDeError, useRecurso } from '../hooks/useRecurso.js';
import { describirLimite, esDiaHabil, esGestionable, hoyISO } from '../services/reglas.js';
import { reservasApi } from '../services/reservasApi.js';
import {
  DIAS_SEMANA,
  MESES,
  fechaConDia,
  fechaLarga,
  formatearFecha,
  generarCeldasMes,
  partesFecha,
  perteneceAlMes,
} from '../utils/calendar.js';

const TARJETA = 'rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-800';
const BOTON_NAVEGACION =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';
const BOTON_SECUNDARIO =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-400 px-4 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-700';

/** Día que se muestra al abrir un mes sin haber elegido uno: la próxima reserva (o hoy, en el mes actual). */
function fechaPorDefecto(reservas, hoy, anio, mes) {
  const fechas = Object.keys(reservas).sort();
  if (perteneceAlMes(hoy, anio, mes)) return fechas.find((fecha) => fecha >= hoy) ?? hoy;
  return fechas[0] ?? null;
}

/**
 * Calendario del mes y detalle de la reserva del día elegido, con cancelación confirmada.
 * Abre en el mes de `fechaInicial` (o en el actual) y pide cada mes a la API al cambiarlo.
 * `onCancelada(reserva)` avisa a la app para que refresque notificaciones y confirme al usuario.
 * `onReservarDia(fecha)` lleva a «Reservar» con ese día preseleccionado.
 */
export default function MisReservas({ usuario, version, fechaInicial, onCancelada, onReservarDia }) {
  const idMotivo = useId();
  const idDetalle = useId();
  const [hoy] = useState(() => hoyISO());
  const [mesVisible, setMesVisible] = useState(() => {
    const { anio, mes } = partesFecha(fechaInicial ?? hoy);
    return { anio, mes };
  });
  const [seleccion, setSeleccion] = useState(fechaInicial ?? null);
  const [dialogo, setDialogo] = useState(null); // null | 'detalle' | 'cancelar'
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState(null);
  const [cancelados, setCancelados] = useState([]);
  const botonesDia = useRef(new Map());
  const huboCancelacion = useRef(false);

  const { anio, mes } = mesVisible;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  // El resultado lleva su mes: nunca se pintan reservas de otro mes mientras llegan las nuevas.
  const clave = `${anio}-${mes}`;
  const recurso = useRecurso(
    async () => ({ clave, reservas: await reservasApi.obtenerReservasCalendario(usuario.id, mes + 1, anio) }),
    [usuario.id, anio, mes, version],
  );
  const delMes = recurso.datos?.clave === clave ? recurso.datos.reservas : null;
  const errorCarga = delMes === null && recurso.tipo === 'error';
  const cargando = delMes === null && !errorCarga;

  // Una reserva cancelada desaparece al instante, sin esperar a que llegue el mes actualizado.
  const reservas = useMemo(() => {
    if (!delMes) return null;
    return Object.fromEntries(Object.entries(delMes).filter(([, reserva]) => !cancelados.includes(reserva.id)));
  }, [delMes, cancelados]);

  const fechaActiva = seleccion ?? (reservas ? fechaPorDefecto(reservas, hoy, anio, mes) : null);
  const reserva = fechaActiva && reservas ? (reservas[fechaActiva] ?? null) : null;
  const diaTab =
    fechaActiva && perteneceAlMes(fechaActiva, anio, mes)
      ? partesFecha(fechaActiva).dia
      : perteneceAlMes(hoy, anio, mes)
        ? partesFecha(hoy).dia
        : 1;

  function irAlMes(anioNuevo, mesNuevo) {
    const destino = new Date(anioNuevo, mesNuevo, 1);
    setMesVisible({ anio: destino.getFullYear(), mes: destino.getMonth() });
    setSeleccion(null);
    setDialogo(null);
  }

  function elegirDia(fecha) {
    setSeleccion(fecha);
    setDialogo(null);
  }

  // Flechas entre días (±1 y ±7), Inicio y Fin de la semana, y RePág/AvPág para cambiar de mes.
  function alTeclearDia(evento, dia) {
    const indiceSemana = (new Date(anio, mes, dia).getDay() + 6) % 7;
    let destino;
    switch (evento.key) {
      case 'ArrowLeft':
        destino = dia - 1;
        break;
      case 'ArrowRight':
        destino = dia + 1;
        break;
      case 'ArrowUp':
        destino = dia - 7;
        break;
      case 'ArrowDown':
        destino = dia + 7;
        break;
      case 'Home':
        destino = Math.max(1, dia - indiceSemana);
        break;
      case 'End':
        destino = Math.min(diasEnMes, dia + (6 - indiceSemana));
        break;
      case 'PageUp':
        evento.preventDefault();
        irAlMes(anio, mes - 1);
        return;
      case 'PageDown':
        evento.preventDefault();
        irAlMes(anio, mes + 1);
        return;
      default:
        return;
    }
    evento.preventDefault();
    if (destino < 1 || destino > diasEnMes) return;
    elegirDia(formatearFecha(anio, mes, destino));
    botonesDia.current.get(destino)?.focus();
  }

  function abrirCancelacion() {
    huboCancelacion.current = false;
    setErrorCancelar(null);
    setDialogo('cancelar');
  }

  function cerrarDialogo() {
    if (!cancelando) setDialogo(null);
  }

  async function cancelar() {
    if (!reserva || cancelando) return;
    setCancelando(true);
    setErrorCancelar(null);
    try {
      await reservasApi.cancelarReserva(reserva.id);
      huboCancelacion.current = true;
      setCancelados((previos) => [...previos, reserva.id]);
      setCancelando(false);
      setDialogo(null);
      onCancelada(reserva);
    } catch (error) {
      setCancelando(false);
      setErrorCancelar(mensajeDeError(error));
      // Si la reserva ya no existe o el plazo venció, el mes mostrado estaba desactualizado.
      if (error?.status === 404 || error?.status === 422) recurso.reintentar();
    }
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mis reservas</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">Consulta, modifica o cancela tus reservaciones.</p>

      {errorCarga && (
        <div className="mb-6">
          <ErrorConReintento
            titulo="No pudimos cargar las reservas de este mes"
            mensaje={mensajeDeError(recurso.error)}
            onReintentar={recurso.reintentar}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={TARJETA} aria-label="Calendario de reservas">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => irAlMes(anio, mes - 1)} aria-label="Mes anterior" className={BOTON_NAVEGACION}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <h2 aria-live="polite" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {MESES[mes]} {anio}
            </h2>
            <button type="button" onClick={() => irAlMes(anio, mes + 1)} aria-label="Mes siguiente" className={BOTON_NAVEGACION}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div aria-hidden="true" className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-600 dark:text-gray-300">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>

          <div
            role="group"
            aria-label={`Días de ${MESES[mes].toLowerCase()} de ${anio}`}
            aria-busy={cargando}
            className="grid grid-cols-7 gap-y-1 text-center text-sm"
          >
            {generarCeldasMes(anio, mes).map((dia, posicion) => {
              if (!dia) return <span key={`vacio-${posicion}`} aria-hidden="true" />;
              const fecha = formatearFecha(anio, mes, dia);
              const conReserva = Boolean(reservas?.[fecha]);
              const esSeleccionado = fecha === fechaActiva;
              const esHoy = fecha === hoy;
              return (
                <button
                  key={dia}
                  ref={(boton) => {
                    if (boton) botonesDia.current.set(dia, boton);
                    else botonesDia.current.delete(dia);
                  }}
                  type="button"
                  tabIndex={dia === diaTab ? 0 : -1}
                  aria-pressed={esSeleccionado}
                  aria-current={esHoy ? 'date' : undefined}
                  aria-label={`${fechaConDia(fecha)}${conReserva ? ', con reserva' : ''}${esHoy ? ', hoy' : ''}`}
                  onClick={() => elegirDia(fecha)}
                  onKeyDown={(evento) => alTeclearDia(evento, dia)}
                  className={
                    'relative mx-auto flex h-11 w-full max-w-[44px] items-center justify-center rounded-full ' +
                    (esSeleccionado
                      ? 'bg-blue-950 font-semibold text-white dark:bg-blue-300 dark:text-blue-950'
                      : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ' +
                        (conReserva ? 'font-semibold ' : '') +
                        (esHoy ? 'ring-2 ring-inset ring-blue-700 dark:ring-blue-300' : ''))
                  }
                >
                  {dia}
                  {conReserva && (
                    <span
                      aria-hidden="true"
                      className={
                        'absolute bottom-1 h-1.5 w-1.5 rounded-full ' +
                        (esSeleccionado ? 'bg-white dark:bg-blue-950' : 'bg-green-700 dark:bg-green-400')
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>

          {cargando && <Cargando texto="Cargando reservas del mes…" className="pb-0" />}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-700 dark:bg-green-400" /> Días con reserva
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-blue-950 dark:bg-blue-300" /> Día seleccionado
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full ring-2 ring-inset ring-blue-700 dark:ring-blue-300" /> Hoy
            </span>
          </div>

          {!perteneceAlMes(hoy, anio, mes) && (
            <button
              type="button"
              onClick={() => {
                const { anio: anioHoy, mes: mesHoy } = partesFecha(hoy);
                irAlMes(anioHoy, mesHoy);
              }}
              className="mt-3 min-h-[44px] text-sm font-semibold text-blue-800 underline underline-offset-2 dark:text-blue-300"
            >
              Volver al mes actual
            </button>
          )}

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-xs text-gray-700 dark:bg-blue-950/50 dark:text-gray-200">
            <Calendar size={16} className="mt-0.5 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">Fecha límite de gestión de reservas:</strong>{' '}
              las reservas podrán modificarse o cancelarse hasta las{' '}
              <strong className="font-semibold text-orange-800 dark:text-orange-300">5:00 p.m. del jueves</strong> de la semana anterior.
            </span>
          </p>
        </section>

        <section className={TARJETA} aria-labelledby={idDetalle}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={idDetalle} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Tu reserva del día
            </h2>
            {!cargando && !errorCarga && fechaActiva && (
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ' +
                  (reserva
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200')
                }
              >
                {reserva ? (
                  <>
                    <Check size={12} aria-hidden="true" /> Reservado
                  </>
                ) : (
                  'Sin reserva'
                )}
              </span>
            )}
          </div>

          {cargando && (
            <div aria-hidden="true" className="space-y-3">
              {['w-2/3', 'w-1/2', 'w-3/4', 'w-1/3'].map((ancho) => (
                <div key={ancho} className={`h-4 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700 ${ancho}`} />
              ))}
            </div>
          )}

          {!cargando && !errorCarga && !fechaActiva && (
            <p className="py-8 text-center text-sm text-gray-700 dark:text-gray-300">
              Elige un día del calendario para ver su reserva.
            </p>
          )}

          {reserva && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                  <Calendar size={18} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fechaLarga(reserva.fecha)}</p>
              </div>
              <div className="mb-3 flex items-start gap-3">
                <Stethoscope size={18} className="mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reserva.plato}</p>
              </div>
              <hr className="my-4 border-gray-200 dark:border-gray-700" />
              <div className="mb-2 flex items-center gap-3">
                <MapPin size={16} className="flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Sede de atención</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{reserva.lugar}</p>
                </div>
              </div>
              <div className="mb-6 flex items-center gap-3">
                <Clock size={16} className="flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Horario de atención</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{reserva.horario}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setDialogo('detalle')} className={BOTON_SECUNDARIO}>
                  <Eye size={16} aria-hidden="true" /> Ver detalle
                </button>
                <button
                  type="button"
                  onClick={abrirCancelacion}
                  disabled={!reserva.gestionable}
                  aria-describedby={idMotivo}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-red-700 px-4 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:border-red-400 dark:text-red-200 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={16} aria-hidden="true" /> Cancelar reserva
                </button>
              </div>
              <p id={idMotivo} className="mt-3 flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                <Info size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                {reserva.gestionable
                  ? `Puedes cancelarla hasta el ${describirLimite(reserva.fecha)}`
                  : `Ya no se puede cancelar: el plazo venció el ${describirLimite(reserva.fecha)}`}
              </p>
            </>
          )}

          {!cargando && !errorCarga && fechaActiva && !reserva && <SinReserva fecha={fechaActiva} onReservar={onReservarDia} />}
        </section>
      </div>

      <Dialogo abierto={dialogo === 'detalle' && reserva !== null} titulo="Detalle de la reserva" onCerrar={cerrarDialogo} ancho="max-w-sm">
        {reserva && (
          <>
            <dl className="mb-6 space-y-2 text-sm">
              <Fila etiqueta="Fecha" valor={fechaLarga(reserva.fecha)} />
              <Fila etiqueta="Servicio" valor={reserva.plato} />
              <Fila etiqueta="Lugar" valor={reserva.lugar} />
              <Fila etiqueta="Horario" valor={reserva.horario} />
              <Fila etiqueta="N.º de reserva" valor={`#${reserva.id}`} />
              <Fila
                etiqueta={reserva.gestionable ? 'Cancelable hasta' : 'Plazo para cancelar'}
                valor={reserva.gestionable ? describirLimite(reserva.fecha) : `venció el ${describirLimite(reserva.fecha)}`}
              />
            </dl>
            <button type="button" onClick={cerrarDialogo} className={`${BOTON_SECUNDARIO} w-full`}>
              Cerrar
            </button>
          </>
        )}
      </Dialogo>

      <Dialogo
        abierto={dialogo === 'cancelar' && reserva !== null}
        titulo="¿Cancelar esta reserva?"
        onCerrar={cerrarDialogo}
        enfocarAlCerrar={() => (huboCancelacion.current ? (botonesDia.current.get(diaTab) ?? null) : null)}
      >
        {reserva && (
          <>
            <dl className="mb-4 space-y-2 text-sm">
              <Fila etiqueta="Fecha" valor={fechaLarga(reserva.fecha)} />
              <Fila etiqueta="Servicio" valor={reserva.plato} />
              <Fila etiqueta="Lugar" valor={reserva.lugar} />
            </dl>
            <p className="mb-6 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-gray-800 dark:bg-blue-950/50 dark:text-gray-100">
              <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
              Podrás volver a reservar ese día hasta el {describirLimite(reserva.fecha)}
            </p>

            {errorCancelar && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
              >
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p>{errorCancelar}</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={cerrarDialogo} disabled={cancelando} className={`${BOTON_SECUNDARIO} flex-1`}>
                Mantener reserva
              </button>
              <button
                type="button"
                onClick={cancelar}
                disabled={cancelando}
                aria-busy={cancelando}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-80"
              >
                {cancelando ? (
                  <>
                    <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Cancelando…
                  </>
                ) : errorCancelar ? (
                  'Reintentar'
                ) : (
                  'Sí, cancelar reserva'
                )}
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </div>
  );
}

function SinReserva({ fecha, onReservar }) {
  const habil = esDiaHabil(fecha);
  const puedeReservar = habil && esGestionable(fecha, new Date());

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fechaLarga(fecha)}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">No tienes una reserva registrada para este día.</p>
      {!habil && <p className="text-xs text-gray-600 dark:text-gray-300">Los fines de semana no hay atención médica.</p>}
      {puedeReservar && (
        <button
          type="button"
          onClick={() => onReservar(fecha)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-orange-800 px-4 text-sm font-semibold text-orange-900 hover:bg-orange-50 dark:border-orange-300 dark:text-orange-200 dark:hover:bg-orange-950/40"
        >
          <CalendarPlus size={16} aria-hidden="true" /> Reservar este día
        </button>
      )}
    </div>
  );
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="font-semibold text-gray-900 dark:text-gray-100">{etiqueta}:</dt>
      <dd className="text-gray-700 dark:text-gray-300">{valor}</dd>
    </div>
  );
}
