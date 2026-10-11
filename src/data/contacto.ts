import { construirEnlaceWhatsApp, construirMailto } from '../lib/contacto'

export const CORREO = 'cesar.diaz1347@gmail.com'

export const WHATSAPP = {
  numero: '50242909263',
  visible: '+502 4290-9263',
  mensaje: 'Hola César, vi tu portafolio y me gustaría conversar contigo.',
} as const

export const ENLACE_WHATSAPP = construirEnlaceWhatsApp(WHATSAPP.numero, WHATSAPP.mensaje)
export const ENLACE_CORREO = construirMailto(CORREO, 'Contacto desde tu portafolio')

/** URL de LinkedIn tomada de Portafolio1.2. */
export const REDES = {
  github: { url: 'https://github.com/Cesar-diaz1347', visible: 'github.com/Cesar-diaz1347' },
  linkedin: {
    url: 'https://www.linkedin.com/in/cesar-diaz-desarrollador',
    visible: 'linkedin.com/in/cesar-diaz-desarrollador',
  },
} as const

export interface Cv {
  idioma: 'es' | 'en'
  etiqueta: string
  href: string
  kb: number
}

/** Rutas relativas a public/; el tamaño lo calcula vite.config.ts a partir de los archivos. */
export const CVS: readonly Cv[] = [
  { idioma: 'es', etiqueta: 'CV en español', href: './cv/CV_Cesar_Diaz.pdf', kb: __CV_KB__.es },
  { idioma: 'en', etiqueta: 'CV en inglés', href: './cv/CV_Cesar_Diaz_EN.pdf', kb: __CV_KB__.en },
]
