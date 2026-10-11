import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

import Cargando from './components/Cargando.jsx';
import Dashboard from './components/Dashboard.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import ErrorConReintento from './components/ErrorConReintento.jsx';
import Header from './components/Header.jsx';
import MisReservas from './components/MisReservas.jsx';
import Reservar from './components/Reservar.jsx';
import SesionCerrada from './components/SesionCerrada.jsx';
import Sidebar from './components/Sidebar.jsx';
import { mensajeDeError, useRecurso } from './hooks/useRecurso.js';
import { reservasApi } from './services/reservasApi.js';
import { fechaConDia } from './utils/calendar.js';

// Clave propia: todo cesar-diaz1347.github.io comparte el mismo localStorage.
const CLAVE_MODO_OSCURO = 'reservas.modoOscuro';
const MEDIA_ESCRITORIO = '(min-width: 768px)';

function obtenerPreferenciaInicial() {
  try {
    const guardada = localStorage.getItem(CLAVE_MODO_OSCURO);
    if (guardada !== null) return guardada === 'true';
  } catch {
    // localStorage bloqueado: se usa la preferencia del sistema.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export default function App() {
  const [pantalla, setPantalla] = useState('inicio'); // 'inicio' | 'reservar' | 'misReservas'
  const [modoOscuro, setModoOscuro] = useState(obtenerPreferenciaInicial);
  const [menuAbierto, setMenuAbierto] = useState(false);
  // Sube con cada cambio de datos (reservar, cancelar, reiniciar): cada pantalla vuelve a pedir lo suyo.
  const [version, setVersion] = useState(0);
  const [fechaReservar, setFechaReservar] = useState(null);
  const [fechaMisReservas, setFechaMisReservas] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [sesionCerrada, setSesionCerrada] = useState(false);
  // Cuenta las navegaciones: tras cada una, el foco pasa al contenido nuevo.
  const [navegaciones, setNavegaciones] = useState(0);

  const idMenu = useId();
  const botonMenuRef = useRef(null);
  const principalRef = useRef(null);
  const navegacionesVistas = useRef(0);
  const devolverFocoAlMenu = useRef(false);

  const usuario = useRecurso(() => reservasApi.obtenerUsuario(), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modoOscuro);
    try {
      localStorage.setItem(CLAVE_MODO_OSCURO, String(modoOscuro));
    } catch {
      // Sin localStorage el tema vale solo para esta visita.
    }
  }, [modoOscuro]);

  // Con el menú abierto (solo en móvil) la página de fondo no se desplaza, y al pasar a escritorio se cierra.
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const consulta = window.matchMedia(MEDIA_ESCRITORIO);
    const alCambiar = () => {
      if (consulta.matches) setMenuAbierto(false);
    };
    consulta.addEventListener('change', alCambiar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      consulta.removeEventListener('change', alCambiar);
    };
  }, [menuAbierto]);

  useEffect(() => {
    if (menuAbierto || !devolverFocoAlMenu.current) return;
    devolverFocoAlMenu.current = false;
    botonMenuRef.current?.focus();
  }, [menuAbierto]);

  // Al navegar, el foco y el scroll van al contenido nuevo (así lo anuncian los lectores de pantalla).
  useEffect(() => {
    if (navegacionesVistas.current === navegaciones) return;
    navegacionesVistas.current = navegaciones;
    window.scrollTo(0, 0);
    principalRef.current?.focus({ preventScroll: true });
  }, [navegaciones]);

  const irA = useCallback((destino, fecha = null) => {
    setAviso(null);
    if (destino === 'reservar') setFechaReservar(fecha);
    if (destino === 'misReservas') setFechaMisReservas(fecha);
    setPantalla(destino);
    setMenuAbierto(false);
    setNavegaciones((n) => n + 1);
  }, []);

  const alReservar = useCallback((reserva) => {
    setVersion((n) => n + 1);
    setFechaMisReservas(reserva.fecha);
    setPantalla('misReservas');
    setAviso(`Reserva confirmada: ${fechaConDia(reserva.fecha)} · ${reserva.plato}.`);
    setNavegaciones((n) => n + 1);
  }, []);

  const alCancelar = useCallback((reserva) => {
    setVersion((n) => n + 1);
    setAviso(`Reserva cancelada: ${fechaConDia(reserva.fecha)} · ${reserva.plato}.`);
  }, []);

  // El foco vuelve a la hamburguesa cuando ya no está dentro del bloque inert (ver el efecto de arriba).
  const cerrarMenu = useCallback(() => {
    devolverFocoAlMenu.current = true;
    setMenuAbierto(false);
  }, []);

  const reiniciarDemo = useCallback(() => {
    reservasApi.reiniciarDemo();
    setVersion((n) => n + 1);
    setFechaReservar(null);
    setFechaMisReservas(null);
    setSesionCerrada(false);
    setPantalla('inicio');
    setAviso('Demo reiniciada: volvieron las reservas de ejemplo.');
    setNavegaciones((n) => n + 1);
  }, []);

  // Se muestra de inmediato; la llamada a la API simulada sigue en segundo plano.
  const cerrarSesion = useCallback(() => {
    setSesionCerrada(true);
    reservasApi.cerrarSesion().catch(() => {});
  }, []);

  const volverAEntrar = useCallback(() => {
    setSesionCerrada(false);
    setNavegaciones((n) => n + 1);
  }, []);

  if (sesionCerrada) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <DemoBanner onReiniciar={reiniciarDemo} />
        <SesionCerrada usuario={usuario.datos} onVolverAEntrar={volverAEntrar} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-blue-900 focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <DemoBanner onReiniciar={reiniciarDemo} />

      <div className="flex flex-1">
        <Sidebar id={idMenu} pantallaActiva={pantalla} onNavegar={irA} abierto={menuAbierto} onCerrar={cerrarMenu} />

        {/* `inert` deja fuera del teclado y de los lectores lo que queda detrás del menú abierto. */}
        <div className="flex min-w-0 flex-1 flex-col" inert={menuAbierto ? '' : undefined}>
          <Header
            usuario={usuario.datos}
            version={version}
            modoOscuro={modoOscuro}
            onToggleModoOscuro={() => setModoOscuro((valor) => !valor)}
            menuAbierto={menuAbierto}
            onAbrirMenu={() => setMenuAbierto(true)}
            botonMenuRef={botonMenuRef}
            idMenu={idMenu}
            onCerrarSesion={cerrarSesion}
          />

          <main id="contenido" ref={principalRef} tabIndex={-1} className="flex-1 outline-none">
            {/* Región viva siempre presente: anuncia las confirmaciones sin robar el foco. */}
            <div role="status" aria-live="polite" className={aviso ? 'px-4 pt-4 md:px-8' : ''}>
              {aviso && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-950 dark:border-green-800 dark:bg-green-900/30 dark:text-green-100">
                  <p className="flex items-start gap-2">
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-green-800 dark:text-green-300" aria-hidden="true" />
                    {aviso}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAviso(null)}
                    aria-label="Cerrar aviso"
                    className="-m-2 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {usuario.tipo === 'error' && usuario.datos === null && (
              <div className="p-4 md:p-8">
                <ErrorConReintento
                  titulo="No pudimos cargar tu cuenta"
                  mensaje={mensajeDeError(usuario.error)}
                  onReintentar={usuario.reintentar}
                />
              </div>
            )}
            {usuario.datos === null && usuario.tipo !== 'error' && (
              <div className="px-4 md:px-8">
                <Cargando texto="Cargando tu cuenta…" />
              </div>
            )}

            {usuario.datos && pantalla === 'inicio' && <Dashboard usuario={usuario.datos} version={version} onNavegar={irA} />}
            {usuario.datos && pantalla === 'reservar' && (
              <Reservar
                usuario={usuario.datos}
                fechaInicial={fechaReservar}
                onReservaCompletada={alReservar}
                onVerReserva={(fecha) => irA('misReservas', fecha)}
              />
            )}
            {usuario.datos && pantalla === 'misReservas' && (
              <MisReservas
                usuario={usuario.datos}
                version={version}
                fechaInicial={fechaMisReservas}
                onCancelada={alCancelar}
                onReservarDia={(fecha) => irA('reservar', fecha)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
