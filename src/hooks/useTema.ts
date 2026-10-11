import { useCallback, useEffect, useState } from 'react'

import { escribir, leer } from '../lib/almacenamiento'
import { aplicarTema, CLAVE_TEMA, esTema, temaDelDocumento, temaDelSistema, type Tema } from '../lib/tema'

/**
 * Tema claro/oscuro. El script inline de index.html lo aplica antes del primer
 * pintado; aquí solo se alterna, se guarda y se sincroniza entre pestañas.
 */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaDelDocumento)

  useEffect(() => {
    aplicarTema(tema)
  }, [tema])

  // Si el visitante cambia el tema en otra pestaña (o en una demo), se refleja aquí.
  useEffect(() => {
    const alCambiarAlmacenamiento = (evento: StorageEvent) => {
      if (evento.key === CLAVE_TEMA && esTema(evento.newValue)) setTema(evento.newValue)
    }
    window.addEventListener('storage', alCambiarAlmacenamiento)
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento)
  }, [])

  // Sin una elección guardada, el sitio sigue la preferencia del sistema.
  useEffect(() => {
    const preferencia = window.matchMedia('(prefers-color-scheme: light)')
    const alCambiarSistema = () => {
      if (!esTema(leer(CLAVE_TEMA))) setTema(temaDelSistema())
    }
    preferencia.addEventListener('change', alCambiarSistema)
    return () => preferencia.removeEventListener('change', alCambiarSistema)
  }, [])

  const alternar = useCallback(() => {
    const nuevo: Tema = tema === 'light' ? 'dark' : 'light'
    escribir(CLAVE_TEMA, nuevo)
    setTema(nuevo)
  }, [tema])

  return { tema, alternar }
}
