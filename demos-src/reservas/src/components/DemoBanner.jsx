import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

import Dialogo from './Dialogo.jsx';

/**
 * Demo del portafolio: aviso de datos simulados, «Reiniciar demo» (borra solo la clave
 * reservas.demo.v2) y regreso al portafolio.
 */
export default function DemoBanner({ onReiniciar }) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section
      aria-label="Aviso de demo"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-1 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100 md:px-8"
    >
      <p className="py-2 font-semibold">Demo · datos simulados en tu navegador</p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40"
        >
          <RotateCcw size={16} aria-hidden="true" /> Reiniciar demo
        </button>
        <a
          href="../../index.html#proyectos"
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 font-semibold underline underline-offset-2 hover:bg-amber-100 dark:hover:bg-amber-900/40"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Volver al portafolio
        </a>
      </div>

      <Dialogo abierto={confirmando} titulo="¿Reiniciar la demo?" onCerrar={() => setConfirmando(false)}>
        <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
          Se borran tus cambios y vuelven las reservas de ejemplo. Solo afecta a esta demo.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmando(false);
              onReiniciar();
            }}
            className="min-h-[44px] flex-1 rounded-lg bg-orange-700 text-sm font-semibold text-white hover:bg-orange-800"
          >
            Reiniciar demo
          </button>
        </div>
      </Dialogo>
    </section>
  );
}
