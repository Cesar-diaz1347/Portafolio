import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { esFechaISO, hoyISO } from '../services/reglas.js';
import {
  DIAS_SEMANA,
  MESES,
  diasVisiblesDelMes,
  fechaLarga,
  fechaNumerica,
  moverFecha,
  partesFecha,
  sumarMeses,
} from '../utils/calendar.js';

const BOTON_MES =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';
const BOTON_MES_SIN_DESTINO =
  'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-gray-600 dark:hover:bg-transparent dark:hover:text-gray-300';
// El foco de cada día se dibuja en su círculo, no en toda la celda (que es tan ancha como una columna).
// En la celda y en el campo se anula el contorno global con `outline-0` (ancho cero): `outline-none` no basta,
// porque `html.dark :focus-visible` (index.css) es más específica y le devuelve el color a un contorno transparente.
const FOCO_DIA =
  'group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-blue-700 dark:group-focus-visible:outline-blue-300';

/**
 * Campo de fecha con un calendario propio, del mismo ancho que el campo. El `<input type="date">` del
 * navegador solo abre su calendario desde el icono de la derecha y no admite ajustar su tamaño; aquí abre un
 * clic (o Enter, Espacio o ↓) en cualquier parte de la tarjeta.
 *
 * Teclado en el calendario: flechas entre días, Inicio y Fin (lunes y domingo), RePág y AvPág (mes; con Mayús,
 * año), Enter o Espacio para elegir y Esc para cerrar. Los días anteriores a `minimo` no se pueden elegir.
 * `onCambiar(fecha)` se llama solo cuando la fecha elegida es otra; `describedBy` es el id del texto de ayuda.
 */
export default function SelectorFecha({ etiqueta, valor, minimo, onCambiar, describedBy }) {
  const idPanel = useId();
  const idTitulo = useId();
  const raizRef = useRef(null);
  const disparadorRef = useRef(null);
  const panelRef = useRef(null);
  const botonesDia = useRef(new Map());
  const enfocarDia = useRef(false);

  const [hoy] = useState(() => hoyISO());
  const [abierto, setAbierto] = useState(false);
  // Día con el foco del teclado. El mes que se muestra es siempre el suyo.
  const [fechaFoco, setFechaFoco] = useState(minimo);

  const { anio, mes } = partesFecha(fechaFoco);
  const dias = useMemo(() => diasVisiblesDelMes(anio, mes), [anio, mes]);
  const mesMostrado = fechaFoco.slice(0, 7);
  const puedeIrAtras = mesMostrado > minimo.slice(0, 7);
  const fechaValida = esFechaISO(valor);

  function abrir() {
    setFechaFoco(fechaValida && valor >= minimo ? valor : minimo);
    enfocarDia.current = true;
    setAbierto(true);
  }

  function cerrar(devolverFoco) {
    setAbierto(false);
    if (devolverFoco) disparadorRef.current?.focus();
  }

  function elegir(fecha) {
    if (fecha < minimo) return;
    if (fecha !== valor) onCambiar(fecha);
    cerrar(true);
  }

  function irAlMes(meses) {
    if (meses < 0 && !puedeIrAtras) return;
    const destino = sumarMeses(fechaFoco, meses);
    setFechaFoco(destino < minimo ? minimo : destino);
  }

  function alTeclearDia(evento) {
    const destino = moverFecha(fechaFoco, evento.key, { minimo, conMayus: evento.shiftKey });
    if (destino === null) return;
    evento.preventDefault();
    if (destino === fechaFoco) return;
    enfocarDia.current = true;
    setFechaFoco(destino);
  }

  function alTeclearCampo(evento) {
    if (evento.key === 'ArrowDown' && !abierto) {
      evento.preventDefault();
      abrir();
    }
  }

  // Esc cierra desde cualquier punto del campo o del calendario y devuelve el foco al campo.
  function alTeclearRaiz(evento) {
    if (evento.key !== 'Escape' || !abierto) return;
    evento.preventDefault();
    evento.stopPropagation();
    cerrar(true);
  }

  // Con Tab el foco sale del calendario hacia otro control: se cierra. (Si no hay destino, como al
  // quitarse el día enfocado al cambiar de mes, no se hace nada; los clics fuera los atiende el efecto de abajo.)
  function alPerderFoco(evento) {
    const destino = evento.relatedTarget;
    if (abierto && destino instanceof Node && !raizRef.current?.contains(destino)) setAbierto(false);
  }

  // Al abrir y al moverse con el teclado, el foco va al día elegido.
  useEffect(() => {
    if (!abierto || !enfocarDia.current) return;
    enfocarDia.current = false;
    botonesDia.current.get(fechaFoco)?.focus({ preventScroll: true });
  }, [abierto, fechaFoco]);

  // Si el calendario se sale de la pantalla al abrirse, la página se desplaza lo justo para verlo entero.
  useEffect(() => {
    if (abierto) panelRef.current?.scrollIntoView({ block: 'nearest' });
  }, [abierto]);

  // Un clic o un toque fuera del campo lo cierra.
  useEffect(() => {
    if (!abierto) return undefined;
    function alPulsar(evento) {
      if (!raizRef.current?.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener('pointerdown', alPulsar);
    return () => document.removeEventListener('pointerdown', alPulsar);
  }, [abierto]);

  return (
    <div ref={raizRef} className="relative" onKeyDown={alTeclearRaiz} onBlur={alPerderFoco}>
      <button
        ref={disparadorRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={abierto ? idPanel : undefined}
        aria-describedby={describedBy}
        aria-label={`${etiqueta}: ${fechaValida ? fechaLarga(valor) : 'sin elegir'}`}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        onKeyDown={alTeclearCampo}
        className={
          'flex h-full w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-400 focus-visible:outline-0 focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500 dark:focus-visible:ring-blue-300 ' +
          (abierto ? 'ring-2 ring-blue-700 dark:ring-blue-300' : '')
        }
      >
        <CalendarDays size={20} className="flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
        <span className="flex-1">
          <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{etiqueta}</span>
          <span className="flex min-h-[44px] items-center text-sm font-medium text-gray-900 dark:text-gray-100">
            {fechaValida ? fechaNumerica(valor) : 'Elige una fecha'}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={
            'flex-shrink-0 text-gray-500 transition-transform motion-reduce:transition-none dark:text-gray-400 ' +
            (abierto ? 'rotate-180' : '')
          }
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div
          ref={panelRef}
          id={idPanel}
          role="dialog"
          aria-label={`Elegir ${etiqueta.toLowerCase()}`}
          // Un clic en una zona vacía deja el foco en el calendario (y no en la página), para que Esc lo siga cerrando.
          tabIndex={-1}
          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-4"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Mes anterior"
              aria-disabled={!puedeIrAtras}
              onClick={() => irAlMes(-1)}
              className={`${BOTON_MES} ${puedeIrAtras ? '' : BOTON_MES_SIN_DESTINO}`}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p id={idTitulo} aria-live="polite" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {MESES[mes]} {anio}
            </p>
            <button type="button" aria-label="Mes siguiente" onClick={() => irAlMes(1)} className={BOTON_MES}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div aria-hidden="true" className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-600 dark:text-gray-300">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>

          <div role="group" aria-labelledby={idTitulo} className="grid grid-cols-7">
            {dias.map((fecha) => {
              const disponible = fecha >= minimo;
              const seleccionado = fecha === valor;
              const esHoy = fecha === hoy;
              const delMesMostrado = fecha.startsWith(mesMostrado);
              return (
                <button
                  key={fecha}
                  ref={(boton) => {
                    if (boton) botonesDia.current.set(fecha, boton);
                    else botonesDia.current.delete(fecha);
                  }}
                  type="button"
                  tabIndex={fecha === fechaFoco ? 0 : -1}
                  aria-pressed={seleccionado}
                  aria-current={esHoy ? 'date' : undefined}
                  aria-disabled={disponible ? undefined : true}
                  aria-label={`${fechaLarga(fecha)}${esHoy ? ', hoy' : ''}${disponible ? '' : ', no disponible'}`}
                  onClick={() => elegir(fecha)}
                  // Un día no disponible no toma el foco al pulsarlo: el teclado sigue desde el día que se ve elegido.
                  onMouseDown={disponible ? undefined : (evento) => evento.preventDefault()}
                  onKeyDown={alTeclearDia}
                  className={
                    'group flex h-11 w-full items-center justify-center focus-visible:outline-0 ' +
                    (disponible ? '' : 'cursor-not-allowed')
                  }
                >
                  <span
                    className={
                      `flex h-10 w-10 items-center justify-center rounded-full text-sm ${FOCO_DIA} ` +
                      (seleccionado
                        ? 'bg-blue-950 font-semibold text-white dark:bg-blue-300 dark:text-blue-950'
                        : disponible
                          ? 'group-hover:bg-gray-100 dark:group-hover:bg-gray-700 ' +
                            (delMesMostrado ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400')
                          : 'text-gray-400 dark:text-gray-500') +
                      (esHoy && !seleccionado ? ' ring-2 ring-inset ring-blue-700 dark:ring-blue-300' : '')
                    }
                  >
                    {partesFecha(fecha).dia}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
