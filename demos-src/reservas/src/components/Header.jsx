import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun } from 'lucide-react';

import { useRecurso } from '../hooks/useRecurso.js';
import { reservasApi } from '../services/reservasApi.js';

const BOTON_ICONO =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';

export default function Header({
  usuario,
  version,
  modoOscuro,
  onToggleModoOscuro,
  menuAbierto,
  onAbrirMenu,
  botonMenuRef,
  idMenu,
  onCerrarSesion,
}) {
  const [menuUsuario, setMenuUsuario] = useState(false);
  const contenedorMenuRef = useRef(null);
  const botonUsuarioRef = useRef(null);

  const notificaciones = useRecurso(
    () => reservasApi.obtenerNotificacionesNoLeidas(usuario.id),
    [usuario?.id, version],
    { habilitado: Boolean(usuario) },
  );
  const noLeidas = notificaciones.datos ?? 0;

  // El menú del usuario se cierra con Esc (y devuelve el foco) o al hacer clic fuera.
  useEffect(() => {
    if (!menuUsuario) return undefined;
    function alTeclear(evento) {
      if (evento.key !== 'Escape') return;
      setMenuUsuario(false);
      botonUsuarioRef.current?.focus();
    }
    function alPulsar(evento) {
      if (!contenedorMenuRef.current?.contains(evento.target)) setMenuUsuario(false);
    }
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('mousedown', alPulsar);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('mousedown', alPulsar);
    };
  }, [menuUsuario]);

  return (
    <header className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 md:px-8">
      <button
        ref={botonMenuRef}
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        aria-expanded={menuAbierto}
        aria-controls={idMenu}
        className={`${BOTON_ICONO} -ml-2 md:hidden`}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-1 md:gap-3">
        <button
          type="button"
          onClick={onToggleModoOscuro}
          aria-label="Tema oscuro"
          aria-pressed={modoOscuro}
          className={BOTON_ICONO}
        >
          {modoOscuro ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </button>

        <span
          role="img"
          aria-label={
            notificaciones.tipo === 'listo'
              ? `${noLeidas} ${noLeidas === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}`
              : 'Notificaciones'
          }
          className="relative inline-flex h-11 w-11 items-center justify-center text-gray-600 dark:text-gray-300"
        >
          <Bell size={22} aria-hidden="true" />
          {noLeidas > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-700 px-1 text-[10px] font-semibold text-white"
            >
              {noLeidas}
            </span>
          )}
        </span>

        <div className="relative" ref={contenedorMenuRef}>
          <button
            ref={botonUsuarioRef}
            type="button"
            onClick={() => setMenuUsuario((abierto) => !abierto)}
            aria-expanded={menuUsuario}
            aria-controls="menu-usuario"
            className="flex min-h-[44px] items-center gap-2 rounded-lg px-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-950 text-xs font-semibold text-white"
            >
              {usuario?.iniciales ?? '··'}
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
              <span className="sr-only">Cuenta de </span>
              {usuario?.nombre ?? 'Cargando…'}
            </span>
            <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </button>

          {menuUsuario && (
            <div
              id="menu-usuario"
              className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuUsuario(false);
                  onCerrarSesion();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <LogOut size={16} aria-hidden="true" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
