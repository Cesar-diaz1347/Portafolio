import calculosSql1280 from '../assets/proyectos/calculos-sql.webp'
import calculosSql800 from '../assets/proyectos/calculos-sql-800.webp'
import controlCuentas1280 from '../assets/proyectos/control-cuentas.webp'
import controlCuentas800 from '../assets/proyectos/control-cuentas-800.webp'
import pokedex1280 from '../assets/proyectos/pokedex.webp'
import pokedex800 from '../assets/proyectos/pokedex-800.webp'
import reservas1280 from '../assets/proyectos/reservas.webp'
import reservas800 from '../assets/proyectos/reservas-800.webp'

/** Deben coincidir con demos.config.json (lo comprueba datos.test.ts). */
export type SlugProyecto = 'reservas' | 'pokedex' | 'control-cuentas' | 'calculos-sql'

/** Captura de la demo (la genera «npm run capturas»): todas miden 1280×800, con una versión de 800×500. */
export interface PortadaProyecto {
  src: string
  srcSet: string
  alt: string
  ancho: number
  alto: number
}

export interface Proyecto {
  slug: SlugProyecto
  titulo: string
  resumen: string
  stack: readonly string[]
  /** Etiqueta honesta del origen de los datos de la demo. */
  etiquetaDatos: string
  repo: string
  detalle: {
    reto: string
    hice: readonly string[]
    resultado: string
  }
  aviso?: string
  portada: PortadaProyecto
}

function portadaImagen(src1280: string, src800: string, alt: string): PortadaProyecto {
  return { src: src1280, srcSet: `${src800} 800w, ${src1280} 1280w`, alt, ancho: 1280, alto: 800 }
}

/** Enlace explícito a index.html: funciona igual en GitHub Pages y en `vite preview`. */
export function enlaceDemo(slug: SlugProyecto): string {
  return `./demos/${slug}/index.html`
}

export const PROYECTOS: readonly Proyecto[] = [
  {
    slug: 'reservas',
    titulo: 'Reserva de citas médicas',
    resumen:
      'Prototipo frontend para reservar citas médicas por especialidad (dermatología, pediatría, medicina general y oftalmología): flujo de 4 pasos, calendario mensual con el detalle de cada día y plazos de gestión.',
    stack: ['React 18', 'JavaScript', 'Vite', 'Tailwind CSS', 'lucide-react'],
    etiquetaDatos: 'API simulada en el navegador',
    repo: 'https://github.com/Cesar-diaz1347/Reservas-Front',
    detalle: {
      reto: 'Que reservar la cita de la semana fuera rápido y claro, respetando un plazo fijo de gestión: reservas y cancelaciones cierran el jueves a las 5:00 p.m.',
      hice: [
        'Diseñé el flujo de reserva en 4 pasos: sede, fecha, servicio y confirmación.',
        'Construí un calendario mensual con el detalle de cada día.',
        'Apliqué los plazos de gestión «jueves 5:00 p.m.» para reservar y cancelar.',
        'Agregué modo oscuro y documenté los endpoints del backend .NET.',
      ],
      resultado:
        'Un prototipo navegable de principio a fin, con los endpoints del backend .NET documentados para la integración.',
    },
    portada: portadaImagen(
      reservas1280,
      reservas800,
      'Inicio de la demo de citas médicas: bienvenida, aviso de que reservas y cancelaciones cierran el jueves a las 5:00 p.m., accesos para reservar y ver reservas, y el estado de la semana con tres días reservados.',
    ),
  },
  {
    slug: 'pokedex',
    titulo: 'Consumo de múltiples APIs',
    resumen:
      'Pokédex interactiva que combina 4 recursos de PokeAPI y la CDN de sprites, con búsqueda, filtro por tipo y ficha de estadísticas.',
    stack: ['React 18', 'TypeScript', 'Vite', 'CSS'],
    etiquetaDatos: 'Datos en vivo de PokeAPI',
    repo: 'https://github.com/Cesar-diaz1347/Pokedex',
    detalle: {
      reto: 'Combinar varios recursos de una API pública en una sola interfaz fluida, sin que la falla de uno deje la pantalla vacía.',
      hice: [
        'Consumí 4 recursos de PokeAPI (listado, tipos, detalle y especie) más la CDN de sprites.',
        'Lancé las peticiones en paralelo, con degradación elegante y caché en memoria.',
        'Implementé búsqueda con debounce de 300 ms, filtro por 18 tipos y paginación.',
        'Armé la ficha con estadísticas y el tema claro/oscuro.',
      ],
      resultado:
        'Exploración con búsqueda, filtro y paginación; la caché evita repetir peticiones y, si un recurso falla, la ficha muestra lo disponible.',
    },
    aviso:
      'Pokémon y sus nombres son marcas de Nintendo / Game Freak; proyecto educativo sin fines comerciales.',
    portada: portadaImagen(
      pokedex1280,
      pokedex800,
      'Pokédex Regional: buscador por nombre o número, filtro por tipo y cuadrícula de Pokémon con su imagen, número y nombre.',
    ),
  },
  {
    slug: 'control-cuentas',
    titulo: 'Control de cuentas',
    resumen:
      'Aplicación web full-stack para controlar cuentas por cobrar y por pagar: deudas, pagos, avance, estado y fecha estimada de liquidación.',
    stack: [
      '.NET 10 Web API',
      'EF Core 10',
      'SQL Server',
      'React 19',
      'TypeScript',
      'Mantine',
      'TanStack Query',
      'React Router',
    ],
    etiquetaDatos: 'API .NET simulada en el navegador',
    repo: 'https://github.com/Cesar-diaz1347/Control-de-Pagos',
    detalle: {
      reto: 'Dar seguimiento a lo que me deben y a lo que debo: cuánto se ha pagado, cuánto falta, si cada deuda va al día y cuándo quedaría liquidada al ritmo real de pago.',
      hice: [
        'Construí la API en .NET 10 con EF Core 10 y SQL Server, y el frontend en React 19 con TypeScript, Mantine, TanStack Query y React Router.',
        'Registré deudas (me deben / yo debo) y sus pagos, con saldo pagado, remanente y % de avance.',
        'Calculé el estado de cada deuda: al día, próximo, vencido, pagada o lejana.',
        'Proyecté la fecha de liquidación según el ritmo real de pago.',
        'Armé un dashboard con totales y alertas, selector de moneda y modo oscuro.',
      ],
      resultado:
        'Una vista única del estado de cada cuenta, con alertas de lo próximo a vencer y una fecha de liquidación estimada a partir de los pagos reales.',
    },
    portada: portadaImagen(
      controlCuentas1280,
      controlCuentas800,
      'Listado de deudas de Control de cuentas: nombre, tipo, saldo remanente, cuota mensual, vencimiento propuesto, barra de avance y estado de cada deuda.',
    ),
  },
  {
    slug: 'calculos-sql',
    titulo: 'Cálculos SQL',
    resumen:
      'Rutina T-SQL que, para un usuario y un periodo, elige la mejor combinación de cuentas para alcanzar el puntaje máximo de un indicador.',
    stack: ['T-SQL', 'SQL Server', 'Tablas temporales', 'WHILE', 'CASE en ORDER BY', 'NOT EXISTS'],
    etiquetaDatos: 'Lógica T-SQL replicada en el navegador',
    repo: 'https://github.com/Cesar-diaz1347/CalculoConteoValor',
    detalle: {
      reto: 'Alcanzar el puntaje máximo de un indicador con la mejor combinación de cuentas de un usuario en un periodo, sin pasarse del tope.',
      hice: [
        'Asigné puntos por rangos de monto.',
        'Tomé primero la cuenta de mayor monto y completé con la que mejor cubre lo que falta sin exceder el tope.',
        'Reporté el conteo (cuentas usadas) y el valor (puntos).',
        'Depuré los registros sobrantes, con una vista previa antes de borrar.',
      ],
      resultado:
        'Conteo y valor del indicador en una sola ejecución, con una vista previa que muestra qué registros se borrarán antes de hacerlo.',
    },
    portada: portadaImagen(
      calculosSql1280,
      calculosSql800,
      'Simulador del script T-SQL en el paso 15, «Relleno»: la explicación del paso, la tabla #candidatos con su ranking, #filtrado con la primera cuenta elegida y el script con el bloque activo resaltado.',
    ),
  },
]
