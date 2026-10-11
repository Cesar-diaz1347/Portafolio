import React from 'react';
import { Loader2 } from 'lucide-react';

/** Indicador de carga con texto, anunciado a lectores de pantalla (no solo un spinner). */
export default function Cargando({ texto = 'Cargando…', className = '' }) {
  return (
    <p role="status" className={`flex items-center gap-2 py-6 text-sm text-gray-600 dark:text-gray-300 ${className}`}>
      <Loader2 size={18} className="animate-spin text-blue-700 motion-reduce:animate-none dark:text-blue-300" aria-hidden="true" />
      {texto}
    </p>
  );
}
