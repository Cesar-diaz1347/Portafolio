import type { TipoDeuda } from '../../types/deuda';
import { esFechaIso, type FechaIso } from './fechas';
import { MONTO_MAXIMO_CENT, MONTO_MINIMO_CENT, NOMBRE_MAXIMO, NOTA_MAXIMA } from './limites';
import { crearSemilla } from './semilla';

/** Clave propia de la demo: todo cesar-diaz1347.github.io comparte el mismo localStorage. */
export const CLAVE_ALMACEN = 'controlPagos.demo.v1';

/** Fila de la tabla Deudas. El saldo pagado no se guarda: es la suma de los pagos. */
export interface DeudaGuardada {
  id: number;
  nombre: string;
  tipo: TipoDeuda;
  fechaInicio: FechaIso;
  fechaFinPropuesta: FechaIso;
  saldoInicialCent: number;
  cuotaMensualCent: number;
}

/** Fila de la tabla Pagos. */
export interface PagoGuardado {
  id: number;
  deudaId: number;
  fecha: FechaIso;
  montoCent: number;
  nota: string | null;
}

export interface DatosDemo {
  version: 1;
  /** Día local en que se sembraron los datos. */
  sembradoEl: FechaIso;
  /** true desde el primer cambio del usuario; a partir de ahí ya no se vuelve a sembrar sola. */
  modificado: boolean;
  siguienteIdDeuda: number;
  siguienteIdPago: number;
  deudas: DeudaGuardada[];
  pagos: PagoGuardado[];
}

/** Lo que el almacén usa de `Storage`: localStorage en el navegador o un doble en las pruebas. */
export type AlmacenamientoWeb = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface Almacen {
  /**
   * Devuelve una copia de los datos. Vuelve a sembrar si no hay datos, si están corruptos o si
   * son de otro día y el usuario no los modificó (así las fechas relativas no envejecen).
   */
  leer(): DatosDemo;
  /** Guarda los datos y los marca como modificados por el usuario. */
  guardar(datos: DatosDemo): void;
  /** Borra solo la clave de esta demo; la próxima lectura vuelve a sembrar. */
  reiniciar(): void;
}

export interface OpcionesAlmacen {
  /** null o undefined: los datos viven solo en memoria. */
  storage?: AlmacenamientoWeb | null;
  hoy: () => FechaIso;
}

export function crearAlmacen({ storage, hoy }: OpcionesAlmacen): Almacen {
  let memoria: DatosDemo | null = null;
  // Si el navegador bloquea o llena el storage, la demo sigue funcionando en memoria.
  let storageDisponible = storage != null;

  function leerGuardados(): DatosDemo | null {
    if (storage && storageDisponible) {
      try {
        const texto = storage.getItem(CLAVE_ALMACEN);
        return texto === null ? null : interpretar(texto);
      } catch {
        storageDisponible = false;
      }
    }
    return memoria;
  }

  function escribir(datos: DatosDemo): void {
    memoria = datos;
    if (!storage || !storageDisponible) return;
    try {
      storage.setItem(CLAVE_ALMACEN, JSON.stringify(datos));
    } catch {
      storageDisponible = false;
    }
  }

  return {
    leer() {
      const guardados = leerGuardados();
      if (guardados && (guardados.modificado || guardados.sembradoEl === hoy())) {
        return structuredClone(guardados);
      }
      const semilla = crearSemilla(hoy());
      escribir(semilla);
      return structuredClone(semilla);
    },
    guardar(datos) {
      escribir(structuredClone({ ...datos, modificado: true }));
    },
    reiniciar() {
      memoria = null;
      if (!storage || !storageDisponible) return;
      try {
        storage.removeItem(CLAVE_ALMACEN);
      } catch {
        storageDisponible = false;
      }
    },
  };
}

function interpretar(texto: string): DatosDemo | null {
  try {
    const valor: unknown = JSON.parse(texto);
    return esDatosDemo(valor) ? valor : null;
  } catch {
    return null;
  }
}

function esDatosDemo(valor: unknown): valor is DatosDemo {
  if (!esObjeto(valor)) return false;
  const { version, sembradoEl, modificado, siguienteIdDeuda, siguienteIdPago, deudas, pagos } = valor;
  if (version !== 1 || !esFechaIso(sembradoEl) || typeof modificado !== 'boolean') return false;
  if (!Array.isArray(deudas) || !deudas.every(esDeudaGuardada)) return false;
  if (!Array.isArray(pagos) || !pagos.every(esPagoGuardado)) return false;

  const idsDeuda = new Set(deudas.map((d) => d.id));
  const idsPago = new Set(pagos.map((p) => p.id));
  return (
    idsDeuda.size === deudas.length &&
    idsPago.size === pagos.length &&
    pagos.every((p) => idsDeuda.has(p.deudaId)) &&
    esIdValido(siguienteIdDeuda) &&
    deudas.every((d) => d.id < siguienteIdDeuda) &&
    esIdValido(siguienteIdPago) &&
    pagos.every((p) => p.id < siguienteIdPago)
  );
}

function esDeudaGuardada(valor: unknown): valor is DeudaGuardada {
  return (
    esObjeto(valor) &&
    esIdValido(valor.id) &&
    typeof valor.nombre === 'string' &&
    valor.nombre.trim() !== '' &&
    valor.nombre.length <= NOMBRE_MAXIMO &&
    (valor.tipo === 'Recibido' || valor.tipo === 'Realizado') &&
    esFechaIso(valor.fechaInicio) &&
    esFechaIso(valor.fechaFinPropuesta) &&
    esMontoValido(valor.saldoInicialCent) &&
    esMontoValido(valor.cuotaMensualCent)
  );
}

function esPagoGuardado(valor: unknown): valor is PagoGuardado {
  return (
    esObjeto(valor) &&
    esIdValido(valor.id) &&
    esIdValido(valor.deudaId) &&
    esFechaIso(valor.fecha) &&
    esMontoValido(valor.montoCent) &&
    (valor.nota === null || (typeof valor.nota === 'string' && valor.nota.length <= NOTA_MAXIMA))
  );
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esIdValido(valor: unknown): valor is number {
  return Number.isSafeInteger(valor) && (valor as number) > 0;
}

function esMontoValido(valor: unknown): valor is number {
  return Number.isSafeInteger(valor) && (valor as number) >= MONTO_MINIMO_CENT && (valor as number) <= MONTO_MAXIMO_CENT;
}
