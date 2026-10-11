import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/** Error recuperable: el mensaje de la API y un botón para volver a intentar. */
export default function ErrorConReintento({ titulo, mensaje, onReintentar }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">{titulo}</p>
          <p>{mensaje}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 font-semibold text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-transparent dark:text-red-100 dark:hover:bg-red-900/40"
      >
        <RotateCcw size={16} aria-hidden="true" /> Reintentar
      </button>
    </div>
  );
}
