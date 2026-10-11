import type { IdTarjeta } from '../../data/portada'
import { TarjetaContacto } from './tarjetas/TarjetaContacto'
import { TarjetaExperiencia } from './tarjetas/TarjetaExperiencia'
import { TarjetaFoto } from './tarjetas/TarjetaFoto'
import { TarjetaIntro } from './tarjetas/TarjetaIntro'
import { TarjetaStack } from './tarjetas/TarjetaStack'
import { TarjetaUbicacion } from './tarjetas/TarjetaUbicacion'

export function ContenidoTarjeta({ id }: { id: IdTarjeta }) {
  switch (id) {
    case 'intro':
      return <TarjetaIntro />
    case 'foto':
      return <TarjetaFoto />
    case 'experiencia':
      return <TarjetaExperiencia />
    case 'stack':
      return <TarjetaStack />
    case 'contacto':
      return <TarjetaContacto />
    case 'ubicacion':
      return <TarjetaUbicacion />
  }
}
