import React, { useEffect, useRef } from 'react';
import { Calendar, CalendarPlus, Home, X } from 'lucide-react';

const ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'misReservas', label: 'Mis reservas', icon: Calendar },
  { id: 'reservar', label: 'Reservar cita', icon: CalendarPlus },
];

/**
 * Menú lateral. Desde md es una columna fija; por debajo es un panel que entra desde la
 * izquierda: Esc lo cierra, el foco queda dentro mientras está abierto y se cierra al navegar.
 * Cerrado en móvil queda `invisible`, así que sus botones no reciben foco.
 */
export default function Sidebar({ id, pantallaActiva, onNavegar, abierto, onCerrar }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const panel = panelRef.current;
    const enfocables = () => [...panel.querySelectorAll('button')];
    enfocables()[0]?.focus();

    function alTeclear(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCerrar();
        return;
      }
      if (evento.key !== 'Tab') return;
      const lista = enfocables();
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  return (
    <>
      {abierto && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onCerrar} aria-hidden="true" />}
      <aside
        id={id}
        ref={panelRef}
        aria-label="Menú principal"
        className={
          // La visibilidad cambia al instante al abrir (así admite el foco) y tras el deslizamiento al cerrar.
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-shrink-0 flex-col bg-blue-950 [transition-property:transform,visibility] [transition-duration:200ms,0s] motion-reduce:transition-none dark:bg-gray-950 ' +
          'md:visible md:static md:z-auto md:translate-x-0 md:transition-none ' +
          (abierto ? 'visible translate-x-0' : 'invisible -translate-x-full [transition-delay:0s,200ms]')
        }
      >
        <div className="flex items-center justify-between gap-2 bg-green-700 px-6 py-5 dark:bg-green-800">
          <p className="text-lg font-bold text-white">Citas médicas</p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-green-800 md:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 py-4" aria-label="Secciones">
          <ul>
            {ITEMS.map((item) => {
              const Icon = item.icon;
              const activo = pantallaActiva === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavegar(item.id)}
                    aria-current={activo ? 'page' : undefined}
                    className={
                      'flex min-h-[44px] w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium transition-colors ' +
                      (activo ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-900 dark:hover:bg-gray-800')
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
