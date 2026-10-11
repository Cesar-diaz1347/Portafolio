/** Enlace de WhatsApp con mensaje prellenado; el número va solo con dígitos. */
export function construirEnlaceWhatsApp(numero: string, mensaje: string): string {
  const soloDigitos = numero.replace(/\D/g, '')
  return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`
}

/** Enlace mailto con asunto; encodeURIComponent usa %20 para espacios, como pide RFC 6068. */
export function construirMailto(correo: string, asunto: string): string {
  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}`
}
