import React, { useId, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Info, Loader2, MapPin, Stethoscope } from 'lucide-react';

import Cargando from './Cargando.jsx';
import Dialogo from './Dialogo.jsx';
import ErrorConReintento from './ErrorConReintento.jsx';
import SelectorFecha from './SelectorFecha.jsx';
import { mensajeDeError, useRecurso } from '../hooks/useRecurso.js';
import { describirLimite, esDiaHabil, esFechaISO, esGestionable, primeraFechaReservable } from '../services/reglas.js';
import { reservasApi } from '../services/reservasApi.js';
import { fechaConDia, fechaLarga, siguienteDiaHabil } from '../utils/calendar.js';

const PASOS = [
  { n: 1, label: 'Sede', desc: 'Selecciona dónde te atenderemos' },
  { n: 2, label: 'Fecha', desc: 'Elige el día de tu cita' },
  { n: 3, label: 'Servicio', desc: 'Selecciona la especialidad' },
  { n: 4, label: 'Confirmar', desc: 'Revisa y confirma tu reserva' },
];

const CAMPO =
  'flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 focus-within:ring-2 focus-within:ring-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:ring-blue-300';
const CONTROL =
  'min-h-[44px] w-full bg-transparent text-sm font-medium text-gray-900 outline-none dark:text-gray-100 dark:[color-scheme:dark]';
// Las opciones de un <select> las pinta el navegador: sin fondo propio salen blancas en modo oscuro.
const OPCION = 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100';
const BOTON_SECUNDARIO =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-400 px-4 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-700';

/** Por qué una fecha sirve o no para reservar: 'vacia' | 'fin_de_semana' | 'fuera_de_plazo' | 'ok'. */
function diagnosticarFecha(fecha, ahora) {
  if (!esFechaISO(fecha)) return 'vacia';
  if (!esDiaHabil(fecha)) return 'fin_de_semana';
  if (!esGestionable(fecha, ahora)) return 'fuera_de_plazo';
  return 'ok';
}

/**
 * Reservar una cita médica en tres pasos (sede, fecha y servicio) más una confirmación.
 * `fechaInicial` preselecciona un día (por ejemplo, desde una tarjeta de la semana).
 * `onReservaCompletada(reserva)` se llama cuando la API confirmó la reserva.
 * `onVerReserva(fecha)` lleva a «Mis reservas» (por ejemplo, si ese día ya está reservado).
 */
export default function Reservar({ usuario, fechaInicial, onReservaCompletada, onVerReserva }) {
  const idSucursal = useId();
  const idAyudaFecha = useId();
  const idTituloMenus = useId();
  const idAyudaBoton = useId();

  const [minimo] = useState(() => primeraFechaReservable(new Date()));
  const [sucursalElegida, setSucursalElegida] = useState('');
  const [fecha, setFecha] = useState(() =>
    fechaInicial && fechaInicial >= minimo && esDiaHabil(fechaInicial) ? fechaInicial : minimo,
  );
  const [menuId, setMenuId] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const sucursales = useRecurso(() => reservasApi.obtenerSucursales(), []);
  const sucursal = sucursalElegida || sucursales.datos?.[0] || '';
  const diagnostico = diagnosticarFecha(fecha, new Date());

  // Los menús llevan su clave: así nunca se muestran los de otra fecha mientras llegan los nuevos.
  const clave = `${sucursal}|${fecha}`;
  const menusRecurso = useRecurso(
    async () => ({ clave, menus: await reservasApi.obtenerMenus(sucursal, fecha) }),
    [sucursal, fecha],
    { habilitado: diagnostico === 'ok' && sucursal !== '' },
  );
  const menus = diagnostico === 'ok' && menusRecurso.datos?.clave === clave ? menusRecurso.datos.menus : null;
  const errorMenus = diagnostico === 'ok' && menus === null && menusRecurso.tipo === 'error';
  const cargandoMenus = diagnostico === 'ok' && menus === null && !errorMenus;
  const menuSeleccionado = menus?.find((menu) => menu.id === menuId) ?? null;
  const pasoActual = confirmando ? 4 : diagnostico === 'ok' ? 3 : 2;

  function cambiarFecha(nueva) {
    setFecha(nueva);
    setMenuId(null);
  }

  function cerrarConfirmacion() {
    if (!enviando) setConfirmando(false);
  }

  async function confirmar() {
    if (enviando || !menuSeleccionado) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const reserva = await reservasApi.crearReserva({
        usuarioId: usuario.id,
        sucursal,
        fecha,
        menuId: menuSeleccionado.id,
      });
      setEnviando(false);
      setConfirmando(false);
      setMenuId(null);
      onReservaCompletada(reserva);
    } catch (error) {
      setEnviando(false);
      setErrorEnvio({ mensaje: mensajeDeError(error), codigo: error?.codigo ?? null });
    }
  }

  return (
    <div>
      <div className="bg-blue-700 px-4 py-10 text-center text-white dark:bg-blue-900 md:px-10 md:py-14">
        <h1 className="text-2xl font-bold">Reserva tu cita médica</h1>
        <p className="mt-2 text-blue-100">Elige sede, fecha y servicio. Son 3 pasos y toma menos de un minuto.</p>
      </div>

      <div className="px-4 py-6 md:px-8">
        <ol aria-label="Pasos de la reserva" className="mb-8 flex items-center">
          {PASOS.map((paso) => {
            const completado = paso.n < pasoActual;
            const actual = paso.n === pasoActual;
            return (
              <li
                key={paso.n}
                aria-current={actual ? 'step' : undefined}
                className={'flex items-center ' + (paso.n < PASOS.length ? 'flex-1' : '')}
              >
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ' +
                      (completado || actual
                        ? 'bg-orange-700 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200')
                    }
                  >
                    {completado ? <Check size={16} /> : paso.n}
                  </span>
                  <div className={actual ? '' : 'sr-only sm:not-sr-only'}>
                    <p
                      className={
                        'text-sm font-semibold ' +
                        (completado || actual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300')
                      }
                    >
                      {paso.label}
                      {completado && <span className="sr-only"> (completado)</span>}
                    </p>
                    <p className="hidden text-xs text-gray-600 dark:text-gray-300 sm:block">{paso.desc}</p>
                  </div>
                </div>
                {paso.n < PASOS.length && (
                  <span
                    aria-hidden="true"
                    className={
                      'mx-3 h-0.5 min-w-6 flex-1 sm:mx-4 ' +
                      (completado ? 'bg-orange-700' : 'bg-gray-300 dark:bg-gray-600')
                    }
                  />
                )}
              </li>
            );
          })}
        </ol>

        {sucursales.tipo === 'error' ? (
          <div className="mb-8">
            <ErrorConReintento
              titulo="No pudimos cargar las sedes"
              mensaje={mensajeDeError(sucursales.error)}
              onReintentar={sucursales.reintentar}
            />
          </div>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className={CAMPO}>
                <MapPin size={20} className="flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
                <div className="flex-1">
                  <label htmlFor={idSucursal} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Sede de atención
                  </label>
                  <select
                    id={idSucursal}
                    value={sucursal}
                    disabled={sucursales.datos === null}
                    onChange={(evento) => setSucursalElegida(evento.target.value)}
                    className={CONTROL}
                  >
                    {sucursales.datos === null && (
                      <option value="" className={OPCION}>
                        Cargando sedes…
                      </option>
                    )}
                    {sucursales.datos?.map((nombre) => (
                      <option key={nombre} value={nombre} className={OPCION}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <SelectorFecha
                etiqueta="Fecha de la cita"
                valor={fecha}
                minimo={minimo}
                onCambiar={cambiarFecha}
                describedBy={idAyudaFecha}
              />
            </div>
            <p id={idAyudaFecha} className="mb-8 text-sm text-gray-600 dark:text-gray-300">
              Puedes reservar desde el {fechaConDia(minimo)}. Cada semana cierra el jueves anterior, a las 5:00 p.m.
            </p>
          </>
        )}

        <section aria-labelledby={idTituloMenus}>
          <h2 id={idTituloMenus} className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
            Servicios disponibles
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Selecciona el servicio que necesitas.</p>

          {/* Una sola región viva y siempre presente: anuncia el resultado de cada cambio de fecha. */}
          <p role="status" className="sr-only">
            {mensajeDeEstado(diagnostico, menus, fecha)}
          </p>

          {diagnostico === 'vacia' && (
            <EstadoVacio titulo="Elige una fecha" texto="Selecciona el día de tu cita para ver los servicios disponibles." />
          )}
          {diagnostico === 'fin_de_semana' && (
            <EstadoVacio
              titulo="No hay citas los fines de semana"
              texto="La atención es de lunes a viernes. Elige otro día."
              accion={{
                texto: `Elegir ${fechaConDia(siguienteDiaHabil(fecha < minimo ? minimo : fecha))}`,
                onClick: () => cambiarFecha(siguienteDiaHabil(fecha < minimo ? minimo : fecha)),
              }}
            />
          )}
          {diagnostico === 'fuera_de_plazo' && (
            <EstadoVacio
              titulo="Ya pasó el plazo para reservar ese día"
              texto={`El plazo venció el ${describirLimite(fecha)} La primera fecha disponible es el ${fechaConDia(minimo)}.`}
              accion={{ texto: `Elegir ${fechaConDia(minimo)}`, onClick: () => cambiarFecha(minimo) }}
            />
          )}

          {cargandoMenus && (
            <>
              <Cargando texto="Cargando servicios…" />
              <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className="h-44 animate-pulse rounded-xl bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
                ))}
              </div>
            </>
          )}
          {errorMenus && (
            <ErrorConReintento
              titulo="No pudimos cargar los servicios"
              mensaje={mensajeDeError(menusRecurso.error)}
              onReintentar={menusRecurso.reintentar}
            />
          )}
          {menus && menus.length === 0 && (
            <EstadoVacio titulo="No hay servicios para ese día" texto="Prueba con otra fecha." />
          )}
          {menus && menus.length > 0 && (
            <ListaMenus menus={menus} fecha={fecha} menuId={menuSeleccionado?.id ?? null} onElegir={setMenuId} />
          )}
        </section>

        {menuSeleccionado && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle2 size={20} className="flex-shrink-0 text-green-800 dark:text-green-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Servicio seleccionado</p>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {menuSeleccionado.plato} · {fechaConDia(fecha)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            disabled={!menuSeleccionado}
            aria-describedby={menuSeleccionado ? undefined : idAyudaBoton}
            onClick={() => {
              setErrorEnvio(null);
              setConfirmando(true);
            }}
            className={
              'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-4 font-semibold ' +
              (menuSeleccionado
                ? 'bg-orange-700 text-white hover:bg-orange-800'
                : 'cursor-not-allowed bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300')
            }
          >
            <Stethoscope size={18} aria-hidden="true" /> Reservar cita
          </button>
          {!menuSeleccionado && (
            <p id={idAyudaBoton} className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              Elige un servicio para continuar.
            </p>
          )}
        </div>
      </div>

      <Dialogo abierto={confirmando && menuSeleccionado !== null} titulo="Confirma tu reserva" onCerrar={cerrarConfirmacion}>
        {menuSeleccionado && (
          <>
            <dl className="mb-4 space-y-2 text-sm">
              <Fila etiqueta="Sede" valor={sucursal} />
              <Fila etiqueta="Fecha" valor={fechaLarga(fecha)} />
              <Fila etiqueta="Servicio" valor={menuSeleccionado.plato} />
            </dl>
            <p className="mb-6 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-gray-800 dark:bg-blue-950/50 dark:text-gray-100">
              <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
              Podrás cancelarla hasta el {describirLimite(fecha)}
            </p>

            {errorEnvio && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
              >
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p>{errorEnvio.mensaje}</p>
                  {errorEnvio.codigo === 'DUPLICADA' && (
                    <button
                      type="button"
                      onClick={() => onVerReserva(fecha)}
                      className="mt-1 min-h-[44px] font-semibold underline underline-offset-2"
                    >
                      Ver mi reserva de ese día
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={cerrarConfirmacion} disabled={enviando} className={`${BOTON_SECUNDARIO} flex-1`}>
                Volver
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={enviando}
                aria-busy={enviando}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 text-sm font-semibold text-white hover:bg-orange-800 disabled:cursor-wait disabled:opacity-80"
              >
                {enviando ? (
                  <>
                    <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Reservando…
                  </>
                ) : errorEnvio && errorEnvio.codigo !== 'DUPLICADA' ? (
                  'Reintentar'
                ) : (
                  'Confirmar reserva'
                )}
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </div>
  );
}

/** Texto para la región viva: el resultado de elegir fecha, en una frase. */
function mensajeDeEstado(diagnostico, menus, fecha) {
  if (diagnostico === 'vacia') return 'Elige una fecha para ver los servicios.';
  if (diagnostico === 'fin_de_semana') return 'No hay citas los fines de semana. Elige un día de lunes a viernes.';
  if (diagnostico === 'fuera_de_plazo') return `Ya pasó el plazo para reservar el ${fechaConDia(fecha)}.`;
  if (menus === null) return '';
  if (menus.length === 0) return 'No hay servicios para ese día.';
  return `${menus.length} servicios disponibles para el ${fechaConDia(fecha)}.`;
}

function EstadoVacio({ titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-400 bg-white p-8 text-center dark:border-gray-500 dark:bg-gray-800">
      <Stethoscope size={28} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
      <p className="font-semibold text-gray-900 dark:text-gray-100">{titulo}</p>
      <p className="max-w-md text-sm text-gray-700 dark:text-gray-300">{texto}</p>
      {accion && (
        <button type="button" onClick={accion.onClick} className={BOTON_SECUNDARIO}>
          {accion.texto}
        </button>
      )}
    </div>
  );
}

/** Un menú por tarjeta, como grupo de opciones (radio): con teclado se recorre con las flechas. */
function ListaMenus({ menus, fecha, menuId, onElegir }) {
  // Si todos los servicios traen la misma descripción, se dice una vez en lugar de repetirla en cada tarjeta.
  const descripcionComun =
    menus.length > 1 && menus.every((menu) => menu.descripcion === menus[0].descripcion) ? menus[0].descripcion : null;

  return (
    <fieldset>
      <legend className="sr-only">Servicios del {fechaConDia(fecha)}</legend>
      {descripcionComun && (
        <p className="mb-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {descripcionComun}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {menus.map((menu) => (
          <TarjetaMenu
            key={menu.id}
            menu={menu}
            conDescripcion={!descripcionComun}
            seleccionado={menu.id === menuId}
            onElegir={onElegir}
          />
        ))}
      </div>
    </fieldset>
  );
}

function TarjetaMenu({ menu, conDescripcion, seleccionado, onElegir }) {
  return (
    <label className="block cursor-pointer">
      <input
        type="radio"
        name="servicio"
        value={menu.id}
        checked={seleccionado}
        onChange={() => onElegir(menu.id)}
        className="peer sr-only"
      />
      <span
        className={
          'flex h-full flex-col rounded-xl border bg-white p-4 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-700 dark:bg-gray-800 dark:peer-focus-visible:outline-blue-300 ' +
          (seleccionado
            ? 'border-orange-700 ring-2 ring-orange-700 dark:border-orange-400 dark:ring-orange-400'
            : 'border-gray-300 hover:border-gray-500 dark:border-gray-600 dark:hover:border-gray-400')
        }
      >
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{menu.nombre}</span>
        <span className={'text-sm font-semibold text-gray-900 dark:text-gray-100 ' + (conDescripcion ? '' : 'flex-1')}>{menu.plato}</span>
        {conDescripcion && <span className="mt-2 flex-1 text-xs text-gray-600 dark:text-gray-300">{menu.descripcion}</span>}
        <span
          className={
            'mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs font-semibold ' +
            (seleccionado
              ? 'bg-orange-700 text-white'
              : 'border border-orange-800 text-orange-900 dark:border-orange-300 dark:text-orange-200')
          }
        >
          {seleccionado ? (
            <>
              <Check size={14} aria-hidden="true" /> Seleccionado
            </>
          ) : (
            'Seleccionar servicio'
          )}
        </span>
      </span>
    </label>
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
