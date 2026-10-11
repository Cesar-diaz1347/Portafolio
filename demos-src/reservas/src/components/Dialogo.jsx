import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal accesible: role="dialog" con aria-modal, título asociado, Esc para cerrar,
 * foco atrapado dentro y devuelto al elemento que lo abrió (o a `enfocarAlCerrar`).
 */
export default function Dialogo({ abierto, titulo, onCerrar, children, enfocarAlCerrar, ancho = 'max-w-md' }) {
  const idTitulo = useId();
  const panelRef = useRef(null);
  // Refs para no reiniciar el efecto (y robar el foco) en cada render.
  const onCerrarRef = useRef(onCerrar);
  const enfocarAlCerrarRef = useRef(enfocarAlCerrar);
  onCerrarRef.current = onCerrar;
  enfocarAlCerrarRef.current = enfocarAlCerrar;

  useEffect(() => {
    if (!abierto) return undefined;
    const anterior = document.activeElement;
    const panel = panelRef.current;
    const enfocables = () => [...panel.querySelectorAll(ENFOCABLES)].filter((el) => el.offsetParent !== null);
    (enfocables()[0] ?? panel).focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function alTeclear(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCerrarRef.current();
        return;
      }
      if (evento.key !== 'Tab') return;
      const lista = enfocables();
      if (lista.length === 0) {
        evento.preventDefault();
        return;
      }
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
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowAnterior;
      // Si el botón que abrió el diálogo ya no existe (p. ej. tras cancelar), el foco va a otro sitio.
      const destino = enfocarAlCerrarRef.current?.() ?? anterior;
      if (destino instanceof HTMLElement && document.contains(destino)) destino.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`w-full ${ancho} rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-m-2 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
