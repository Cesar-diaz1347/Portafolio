import { describe, expect, it } from 'vitest'

import { construirEnlaceWhatsApp, construirMailto } from './contacto'

describe('construirEnlaceWhatsApp', () => {
  it('codifica el mensaje y deja solo dígitos en el número', () => {
    expect(
      construirEnlaceWhatsApp(
        '+502 4290-9263',
        'Hola César, vi tu portafolio y me gustaría conversar contigo.',
      ),
    ).toBe(
      'https://wa.me/50242909263?text=Hola%20C%C3%A9sar%2C%20vi%20tu%20portafolio%20y%20me%20gustar%C3%ADa%20conversar%20contigo.',
    )
  })
})

describe('construirMailto', () => {
  it('codifica el asunto con %20', () => {
    expect(construirMailto('cesar.diaz1347@gmail.com', 'Contacto desde tu portafolio')).toBe(
      'mailto:cesar.diaz1347@gmail.com?subject=Contacto%20desde%20tu%20portafolio',
    )
  })
})
