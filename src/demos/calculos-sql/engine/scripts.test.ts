import { describe, expect, it } from 'vitest'

import { SCRIPT_DATOS, SCRIPT_LOGICA } from './scripts'

async function sha256(texto: string): Promise<string> {
  const resumen = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
  return [...new Uint8Array(resumen)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

describe('copias de los scripts en sql/', () => {
  it('son byte a byte las del repo CalculoConteoValor (commit 65cb895)', async () => {
    expect(await sha256(SCRIPT_LOGICA)).toBe('ffa7fc79cbeee9fafc15fe2db4c2a44ff04e14cf6512ec90f023ee7749fd11bc')
    expect(await sha256(SCRIPT_DATOS)).toBe('f1b7f732a819d0b55a0726d6a937b20903c445e987d29358063bedf0516636dc')
  })
})
