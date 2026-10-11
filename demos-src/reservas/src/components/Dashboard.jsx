import React from 'react';
import { ArrowRight, Bell, CalendarCheck, CalendarPlus, Check, Clock } from 'lucide-react';

import Cargando from './Cargando.jsx';
import ErrorConReintento from './ErrorConReintento.jsx';
import { mensajeDeError, useRecurso } from '../hooks/useRecurso.js';
import { describirLimite, primeraFechaReservable } from '../services/reglas.js';
import { reservasApi } from '../services/reservasApi.js';
import { capitalizar, fechaConDia, fechaCorta } from '../utils/calendar.js';

const TARJETA = 'rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800';

/**
 * Pantalla de inicio: dos accesos rápidos y el estado de la semana que se está gestionando.
 * `onNavegar(destino, fecha?)` cambia de pantalla (y, si se indica, preselecciona esa fecha).
 */
export default function Dashboard({ usuario, version, onNavegar }) {
  const semana = useRecurso(() => reservasApi.obtenerReservasSemana(usuario.id), [usuario.id, version]);
  const limite = describirLimite(primeraFechaReservable(new Date()));
  const dias = semana.datos;

  return (
    <div>
      <div className="bg-blue-700 px-4 py-10 text-white dark:bg-blue-900 md:px-10 md:py-14">
        <h1 className="text-2xl font-bold md:text-3xl">¡Bienvenida, {usuario.nombre.split(' ')[0]}!</h1>
        <p className="mt-2 text-blue-100">Gestiona tus citas médicas de la semana de forma rápida y sencilla.</p>
      </div>

      <div className="px-4 py-6 md:px-8">
        <p className="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 px-5 py-3 text-sm text-gray-800 dark:bg-blue-950/50 dark:text-gray-100">
          <Bell size={18} className="mt-0.5 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
          <span>
            Reservas y cancelaciones disponibles hasta el{' '}
            <strong className="font-semibold text-orange-800 dark:text-orange-300">{limite}</strong>
          </span>
        </p>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <section className={TARJETA} aria-labelledby="titulo-reservar">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-lg bg-orange-100 p-2 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                <CalendarPlus size={20} aria-hidden="true" />
              </span>
              <h2 id="titulo-reservar" className="font-semibold text-gray-900 dark:text-gray-100">
                Reservar cita
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Realiza tu reserva de forma rápida y sencilla.</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <p className="text-gray-600 dark:text-gray-300">Límite para reservar:</p>
                <p className="font-semibold text-orange-800 dark:text-orange-300">{capitalizar(limite)}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavegar('reservar')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-orange-700 px-4 text-sm font-semibold text-white hover:bg-orange-800"
              >
                Reservar ahora <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className={TARJETA} aria-labelledby="titulo-ver">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-lg bg-blue-100 p-2 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                <CalendarCheck size={20} aria-hidden="true" />
              </span>
              <h2 id="titulo-ver" className="font-semibold text-gray-900 dark:text-gray-100">
                Ver reservas
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Consulta, modifica o cancela tus reservas.</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <p className="text-gray-600 dark:text-gray-300">Límite para cancelar:</p>
                <p className="font-semibold text-blue-800 dark:text-blue-300">{capitalizar(limite)}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavegar('misReservas')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-blue-950 px-4 text-sm font-semibold text-blue-950 hover:bg-blue-50 dark:border-blue-300 dark:text-blue-200 dark:hover:bg-blue-950"
              >
                Ver mis reservas <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>

        <section aria-labelledby="titulo-semana">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h2 id="titulo-semana" className="font-semibold text-gray-900 dark:text-gray-100">
                Mis reservas de la semana
              </h2>
              {dias && dias.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Semana del {fechaCorta(dias[0].fecha)} al {fechaCorta(dias[dias.length - 1].fecha)}
                </p>
              )}
            </div>
            {dias && dias.length > 0 && <ProgresoSemana dias={dias} />}
          </div>

          {semana.tipo === 'error' && (
            <ErrorConReintento
              titulo="No pudimos cargar tus reservas de la semana"
              mensaje={mensajeDeError(semana.error)}
              onReintentar={semana.reintentar}
            />
          )}

          {dias === null && semana.tipo !== 'error' && (
            <>
              <Cargando texto="Cargando tus reservas de la semana…" />
              <ul aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[0, 1, 2, 3, 4].map((n) => (
                  <li key={n} className="h-36 animate-pulse rounded-lg bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
                ))}
              </ul>
            </>
          )}

          {dias && dias.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
              No hay días para gestionar esta semana.
            </p>
          )}

          {dias && dias.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {dias.map((dia) => (
                <TarjetaDia key={dia.fecha} dia={dia} onNavegar={onNavegar} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** «3 de 5 días reservados», con una barra y un mensaje cuando la semana está vacía o completa. */
function ProgresoSemana({ dias }) {
  const reservados = dias.filter((dia) => dia.estado === 'reservado').length;
  const porcentaje = Math.round((reservados / dias.length) * 100);
  const mensaje =
    reservados === dias.length
      ? '¡Semana completa! Ya reservaste todas tus citas.'
      : reservados === 0
        ? 'Aún no reservas ninguna cita de esta semana.'
        : null;

  return (
    <div className="text-sm text-gray-700 dark:text-gray-200">
      <div className="flex items-center gap-3">
        <p className="font-medium">
          {reservados} de {dias.length} días reservados
        </p>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true">
          <div className="h-full rounded-full bg-green-700 dark:bg-green-400" style={{ width: `${porcentaje}%` }} />
        </div>
      </div>
      {mensaje && <p className="mt-1 text-gray-600 dark:text-gray-300">{mensaje}</p>}
    </div>
  );
}

function TarjetaDia({ dia, onNavegar }) {
  const reservado = dia.estado === 'reservado';

  return (
    <li
      className={
        'flex flex-col rounded-lg border border-l-4 p-4 ' +
        (reservado
          ? 'border-green-200 border-l-green-700 bg-green-50 dark:border-green-800 dark:border-l-green-500 dark:bg-green-900/20'
          : 'border-gray-200 border-l-gray-400 bg-white dark:border-gray-700 dark:border-l-gray-500 dark:bg-gray-800')
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {dia.dia} <span className="font-normal text-gray-600 dark:text-gray-300">{fechaCorta(dia.fecha)}</span>
        </p>
        {reservado ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-800 dark:text-green-300">
            <Check size={12} aria-hidden="true" /> Reservado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Clock size={12} aria-hidden="true" /> Sin reserva
          </span>
        )}
      </div>
      <p className="mb-3 flex-1 text-sm text-gray-700 dark:text-gray-200">{dia.plato ?? 'Aún no reservas este día.'}</p>

      {reservado && (
        <button
          type="button"
          onClick={() => onNavegar('misReservas', dia.fecha)}
          aria-label={`Ver reserva del ${fechaConDia(dia.fecha)}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-green-800 px-3 text-sm font-semibold text-green-900 hover:bg-green-100 dark:border-green-400 dark:text-green-200 dark:hover:bg-green-900/40"
        >
          Ver reserva
        </button>
      )}
      {!reservado && dia.gestionable && (
        <button
          type="button"
          onClick={() => onNavegar('reservar', dia.fecha)}
          aria-label={`Reservar el ${fechaConDia(dia.fecha)}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-orange-800 px-3 text-sm font-semibold text-orange-900 hover:bg-orange-50 dark:border-orange-300 dark:text-orange-200 dark:hover:bg-orange-950/40"
        >
          Reservar
        </button>
      )}
      {!reservado && !dia.gestionable && (
        <p className="text-xs text-gray-600 dark:text-gray-300">Plazo vencido el {describirLimite(dia.fecha)}</p>
      )}
    </li>
  );
}
