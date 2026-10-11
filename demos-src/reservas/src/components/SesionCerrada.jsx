import React, { useEffect, useRef } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';

/**
 * Pantalla al cerrar sesión. La demo no tiene inicio de sesión real, así que lo dice y ofrece
 * volver a entrar con un clic (o regresar al portafolio).
 */
export default function SesionCerrada({ usuario, onVolverAEntrar }) {
  const tituloRef = useRef(null);

  // Anuncia el cambio de pantalla a los lectores de pantalla.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 ref={tituloRef} tabIndex={-1} className="mb-2 text-xl font-bold text-gray-900 outline-none dark:text-gray-100">
          Cerraste tu sesión
        </h1>
        <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
          Esta es una demo: no hay inicio de sesión real. Vuelve a entrar para seguir probando las reservas.
        </p>
        <button
          type="button"
          onClick={onVolverAEntrar}
          className="mb-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 font-semibold text-white hover:bg-orange-800"
        >
          <LogIn size={18} aria-hidden="true" /> Volver a entrar{usuario ? ` como ${usuario.nombre}` : ''}
        </button>
        <a
          href="../../index.html#proyectos"
          className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-blue-800 underline underline-offset-2 dark:text-blue-300"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Volver al portafolio
        </a>
      </div>
    </main>
  );
}
