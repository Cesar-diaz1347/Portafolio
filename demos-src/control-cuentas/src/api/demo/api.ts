import type {
  DashboardResumen,
  DeudaDetail,
  DeudaFormInput,
  DeudaListItem,
  Pago,
  PagoCreateInput,
  TipoDeuda,
} from '../../types/deuda';
import {
  crearAlmacen,
  type Almacen,
  type AlmacenamientoWeb,
  type DatosDemo,
  type DeudaGuardada,
  type PagoGuardado,
} from './almacen';
import { calcularEstado, calcularFechaFinProyectada, calcularPorcentajeAvance } from './calculo';
import { errorNoEncontrado, errorServicioNoDisponible, errorValidacion } from './errores';
import { esFechaIso, hoyLocal, type FechaIso } from './fechas';
import { MONTO_MAXIMO_CENT, MONTO_MINIMO_CENT, NOMBRE_MAXIMO, NOTA_MAXIMA } from './limites';

/** Respuesta exitosa con el status que devuelve el controller original. */
export interface RespuestaDemo<T> {
  status: 200 | 201 | 204;
  data: T;
}

/**
 * Los endpoints de `DeudasController` y `DashboardController`, simulados en el navegador.
 * Los errores se lanzan como `DemoApiError`: 400 (validación), 404 (no existe) o 503 (falla simulada).
 */
export interface ApiDemo {
  /** GET /api/deudas?tipo=: ordenadas por fecha fin propuesta. */
  getDeudas(tipo?: TipoDeuda): Promise<RespuestaDemo<DeudaListItem[]>>;
  /** GET /api/deudas/{id}: detalle con los pagos del más reciente al más antiguo. */
  getDeuda(id: number): Promise<RespuestaDemo<DeudaDetail>>;
  /** POST /api/deudas: 201 con el detalle de la deuda creada. */
  createDeuda(input: DeudaFormInput): Promise<RespuestaDemo<DeudaDetail>>;
  /** PUT /api/deudas/{id}: 204. */
  updateDeuda(id: number, input: DeudaFormInput): Promise<RespuestaDemo<undefined>>;
  /** DELETE /api/deudas/{id}: 204; borra también sus pagos (ON DELETE CASCADE). */
  deleteDeuda(id: number): Promise<RespuestaDemo<undefined>>;
  /** POST /api/deudas/{id}/pagos: 200 con el detalle recalculado. */
  createPago(deudaId: number, input: PagoCreateInput): Promise<RespuestaDemo<DeudaDetail>>;
  /** PUT /api/deudas/{id}/pagos/{pagoId}: 200 con el detalle recalculado. */
  updatePago(deudaId: number, pagoId: number, input: PagoCreateInput): Promise<RespuestaDemo<DeudaDetail>>;
  /** DELETE /api/deudas/{id}/pagos/{pagoId}: 200 con el detalle recalculado. */
  deletePago(deudaId: number, pagoId: number): Promise<RespuestaDemo<DeudaDetail>>;
  /** GET /api/dashboard/resumen. */
  getDashboardResumen(): Promise<RespuestaDemo<DashboardResumen>>;
}

export interface OpcionesApiDemo {
  almacen: Almacen;
  hoy: () => FechaIso;
  /** Espera simulada por petición, en milisegundos. Por defecto, 0. */
  latenciaMs?: () => number;
  /** Si devuelve true, la petición falla con 503. Por defecto, nunca. */
  fallar?: () => boolean;
}

type ErroresPorCampo = Record<string, string[]>;
type ValoresDeuda = Omit<DeudaGuardada, 'id'>;
type ValoresPago = Omit<PagoGuardado, 'id' | 'deudaId'>;

export function crearApiDemo({
  almacen,
  hoy,
  latenciaMs = () => 0,
  fallar = () => false,
}: OpcionesApiDemo): ApiDemo {
  async function atender<T>(status: RespuestaDemo<T>['status'], operacion: () => T): Promise<RespuestaDemo<T>> {
    await esperar(latenciaMs());
    if (fallar()) throw errorServicioNoDisponible();
    return { status, data: structuredClone(operacion()) };
  }

  return {
    getDeudas: (tipo) =>
      atender(200, () => {
        if (tipo !== undefined && !esTipoDeuda(tipo)) {
          throw errorValidacion({ tipo: ['El tipo debe ser Recibido o Realizado.'] });
        }
        const datos = almacen.leer();
        const fecha = hoy();
        return datos.deudas
          .filter((deuda) => tipo === undefined || deuda.tipo === tipo)
          .sort(porFechaFinPropuesta)
          .map((deuda) => aListItem(deuda, pagosDe(datos, deuda.id), fecha));
      }),

    getDeuda: (id) =>
      atender(200, () => {
        const datos = almacen.leer();
        return aDetalle(datos, buscarDeuda(datos, id), hoy());
      }),

    createDeuda: (input) =>
      atender(201, () => {
        const valores = validarDeuda(input);
        const datos = almacen.leer();
        const deuda: DeudaGuardada = { id: datos.siguienteIdDeuda, ...valores };
        datos.deudas.push(deuda);
        datos.siguienteIdDeuda += 1;
        almacen.guardar(datos);
        return aDetalle(datos, deuda, hoy());
      }),

    updateDeuda: (id, input) =>
      atender(204, () => {
        // Como en ASP.NET con [ApiController]: el modelo se valida antes de buscar la deuda.
        const valores = validarDeuda(input);
        const datos = almacen.leer();
        Object.assign(buscarDeuda(datos, id), valores);
        almacen.guardar(datos);
        return undefined;
      }),

    deleteDeuda: (id) =>
      atender(204, () => {
        const datos = almacen.leer();
        const deuda = buscarDeuda(datos, id);
        datos.deudas = datos.deudas.filter((d) => d.id !== deuda.id);
        datos.pagos = datos.pagos.filter((p) => p.deudaId !== deuda.id);
        almacen.guardar(datos);
        return undefined;
      }),

    createPago: (deudaId, input) =>
      atender(200, () => {
        const valores = validarPago(input);
        const datos = almacen.leer();
        const deuda = buscarDeuda(datos, deudaId);
        datos.pagos.push({ id: datos.siguienteIdPago, deudaId: deuda.id, ...valores });
        datos.siguienteIdPago += 1;
        almacen.guardar(datos);
        return aDetalle(datos, deuda, hoy());
      }),

    updatePago: (deudaId, pagoId, input) =>
      atender(200, () => {
        const valores = validarPago(input);
        const datos = almacen.leer();
        Object.assign(buscarPago(datos, deudaId, pagoId), valores);
        almacen.guardar(datos);
        return aDetalle(datos, buscarDeuda(datos, deudaId), hoy());
      }),

    deletePago: (deudaId, pagoId) =>
      atender(200, () => {
        const datos = almacen.leer();
        const pago = buscarPago(datos, deudaId, pagoId);
        datos.pagos = datos.pagos.filter((p) => p.id !== pago.id);
        almacen.guardar(datos);
        return aDetalle(datos, buscarDeuda(datos, deudaId), hoy());
      }),

    getDashboardResumen: () => atender(200, () => resumenDashboard(almacen.leer(), hoy())),
  };
}

const almacenNavegador = crearAlmacen({ storage: localStorageDisponible(), hoy: () => hoyLocal() });

/** API que usa la app: datos en localStorage (o en memoria) y latencia de 200 a 450 ms. */
export const apiDemo: ApiDemo = crearApiDemo({
  almacen: almacenNavegador,
  hoy: () => hoyLocal(),
  latenciaMs: () => 200 + Math.random() * 250,
});

/** Borra solo los datos de esta demo; la próxima petición vuelve a sembrarlos. */
export function reiniciarDemo(): void {
  almacenNavegador.reiniciar();
}

function localStorageDisponible(): AlmacenamientoWeb | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Algunos navegadores lanzan SecurityError al tocar localStorage con las cookies bloqueadas.
    return null;
  }
}

function esperar(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

// --- Consultas ------------------------------------------------------------------------------

function buscarDeuda(datos: DatosDemo, id: number): DeudaGuardada {
  // Un id no entero no casa con la ruta {id:int}: en ASP.NET también es 404.
  const deuda = Number.isInteger(id) ? datos.deudas.find((d) => d.id === id) : undefined;
  if (!deuda) throw errorNoEncontrado(`No se encontró la deuda ${id}.`);
  return deuda;
}

function buscarPago(datos: DatosDemo, deudaId: number, pagoId: number): PagoGuardado {
  const pago = datos.pagos.find((p) => p.id === pagoId && p.deudaId === deudaId);
  if (!pago) throw errorNoEncontrado(`No se encontró el pago ${pagoId} de la deuda ${deudaId}.`);
  return pago;
}

/** Pagos de una deuda, del más reciente al más antiguo (a igual fecha, el último registrado primero). */
function pagosDe(datos: DatosDemo, deudaId: number): PagoGuardado[] {
  return datos.pagos
    .filter((pago) => pago.deudaId === deudaId)
    .sort((a, b) => compararTexto(b.fecha, a.fecha) || b.id - a.id);
}

function porFechaFinPropuesta(a: DeudaGuardada, b: DeudaGuardada): number {
  // ORDER BY FechaFinPropuesta; a igual fecha, por id para que el orden sea estable.
  return compararTexto(a.fechaFinPropuesta, b.fechaFinPropuesta) || a.id - b.id;
}

/** Las fechas ISO con año de 4 dígitos se ordenan bien como texto. */
function compararTexto(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

// --- DTO --------------------------------------------------------------------------------------

/** Saldo pagado = suma de los pagos (SaldoRecalculoService); remanente = inicial − pagado (columna calculada). */
function saldosDe(deuda: DeudaGuardada, pagos: PagoGuardado[]): { pagadoCent: number; remanenteCent: number } {
  const pagadoCent = pagos.reduce((total, pago) => total + pago.montoCent, 0);
  return { pagadoCent, remanenteCent: deuda.saldoInicialCent - pagadoCent };
}

/** `pagos` debe venir de `pagosDe`: el primero es el más reciente. */
function aListItem(deuda: DeudaGuardada, pagos: PagoGuardado[], hoy: FechaIso): DeudaListItem {
  const { pagadoCent, remanenteCent } = saldosDe(deuda, pagos);
  return {
    id: deuda.id,
    nombre: deuda.nombre,
    tipo: deuda.tipo,
    fechaFinPropuesta: deuda.fechaFinPropuesta,
    saldoInicial: aMonto(deuda.saldoInicialCent),
    saldoPagado: aMonto(pagadoCent),
    saldoRemanente: aMonto(remanenteCent),
    cuotaMensual: aMonto(deuda.cuotaMensualCent),
    porcentajeAvance: calcularPorcentajeAvance(deuda.saldoInicialCent, pagadoCent),
    estado: calcularEstado(remanenteCent, deuda.fechaInicio, deuda.fechaFinPropuesta, pagos[0]?.fecha ?? null, hoy),
  };
}

function aDetalle(datos: DatosDemo, deuda: DeudaGuardada, hoy: FechaIso): DeudaDetail {
  const pagos = pagosDe(datos, deuda.id);
  const { pagadoCent, remanenteCent } = saldosDe(deuda, pagos);
  return {
    ...aListItem(deuda, pagos, hoy),
    fechaInicio: deuda.fechaInicio,
    fechaFinProyectada: calcularFechaFinProyectada(pagadoCent, remanenteCent, deuda.fechaInicio, hoy),
    pagos: pagos.map(aPago),
  };
}

function aPago(pago: PagoGuardado): Pago {
  return { id: pago.id, fecha: pago.fecha, monto: aMonto(pago.montoCent), nota: pago.nota };
}

function resumenDashboard(datos: DatosDemo, hoy: FechaIso): DashboardResumen {
  let porCobrarCent = 0;
  let porPagarCent = 0;
  let cantidadVencidas = 0;
  let cantidadProximas = 0;

  for (const deuda of datos.deudas) {
    const pagos = pagosDe(datos, deuda.id);
    const { remanenteCent } = saldosDe(deuda, pagos);
    // Como el backend: suma los remanentes tal cual, también los negativos de una deuda sobrepagada.
    if (deuda.tipo === 'Recibido') porCobrarCent += remanenteCent;
    else porPagarCent += remanenteCent;

    const estado = calcularEstado(remanenteCent, deuda.fechaInicio, deuda.fechaFinPropuesta, pagos[0]?.fecha ?? null, hoy);
    if (estado === 'Vencido') cantidadVencidas += 1;
    if (estado === 'Proximo') cantidadProximas += 1;
  }

  return {
    totalPorCobrar: aMonto(porCobrarCent),
    totalPorPagar: aMonto(porPagarCent),
    cantidadVencidas,
    cantidadProximas,
  };
}

function aMonto(centavos: number): number {
  return centavos / 100;
}

// --- Validación (DataAnnotations de los DTO del backend) --------------------------------------

function validarDeuda(input: DeudaFormInput): ValoresDeuda {
  const errores: ErroresPorCampo = {};
  const nombre = validarNombre(input.nombre, errores);
  const tipo = esTipoDeuda(input.tipo) ? input.tipo : agregarError(errores, 'tipo', 'El tipo debe ser Recibido o Realizado.');
  const fechaInicio = validarFecha(input.fechaInicio, 'fechaInicio', 'La fecha de inicio', errores);
  const fechaFinPropuesta = validarFecha(input.fechaFinPropuesta, 'fechaFinPropuesta', 'La fecha fin propuesta', errores);
  const saldoInicialCent = validarMonto(input.saldoInicial, 'saldoInicial', 'El saldo inicial', errores);
  const cuotaMensualCent = validarMonto(input.cuotaMensual, 'cuotaMensual', 'La cuota mensual', errores);

  if (
    nombre === null ||
    tipo === null ||
    fechaInicio === null ||
    fechaFinPropuesta === null ||
    saldoInicialCent === null ||
    cuotaMensualCent === null
  ) {
    throw errorValidacion(errores);
  }
  return { nombre, tipo, fechaInicio, fechaFinPropuesta, saldoInicialCent, cuotaMensualCent };
}

function validarPago(input: PagoCreateInput): ValoresPago {
  const errores: ErroresPorCampo = {};
  const fecha = validarFecha(input.fecha, 'fecha', 'La fecha del pago', errores);
  const montoCent = validarMonto(input.monto, 'monto', 'El monto', errores);
  const nota = validarNota(input.nota, errores);

  if (fecha === null || montoCent === null || nota === undefined) throw errorValidacion(errores);
  return { fecha, montoCent, nota };
}

function validarNombre(valor: unknown, errores: ErroresPorCampo): string | null {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return agregarError(errores, 'nombre', 'El nombre es obligatorio.');
  }
  if (valor.length > NOMBRE_MAXIMO) {
    return agregarError(errores, 'nombre', `El nombre no puede tener más de ${NOMBRE_MAXIMO} caracteres.`);
  }
  return valor;
}

function validarFecha(valor: unknown, campo: string, etiqueta: string, errores: ErroresPorCampo): FechaIso | null {
  if (esFechaIso(valor)) return valor;
  const vacia = valor === undefined || valor === null || valor === '';
  return agregarError(errores, campo, vacia ? `${etiqueta} es obligatoria.` : `${etiqueta} no es válida (usa AAAA-MM-DD).`);
}

function validarMonto(valor: unknown, campo: string, etiqueta: string, errores: ErroresPorCampo): number | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    return agregarError(errores, campo, `${etiqueta} debe ser un número.`);
  }
  // Mismo texto que [Range(0.01, …, ErrorMessage = "… debe ser mayor a 0.")] del backend.
  if (valor < MONTO_MINIMO_CENT / 100) return agregarError(errores, campo, `${etiqueta} debe ser mayor a 0.`);
  if (valor > MONTO_MAXIMO_CENT / 100) {
    return agregarError(errores, campo, `${etiqueta} no puede superar 999,999,999.99 en esta demo.`);
  }
  return aCentavos(valor) ?? agregarError(errores, campo, `${etiqueta} admite como máximo 2 decimales.`);
}

/** undefined si la nota no es válida (null es una nota vacía válida). */
function validarNota(valor: unknown, errores: ErroresPorCampo): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') {
    agregarError(errores, 'nota', 'La nota debe ser texto.');
    return undefined;
  }
  if (valor.length > NOTA_MAXIMA) {
    agregarError(errores, 'nota', `La nota no puede tener más de ${NOTA_MAXIMA} caracteres.`);
    return undefined;
  }
  return valor;
}

/** Centavos exactos de un número con 2 decimales o menos; null si tiene más. */
function aCentavos(valor: number): number | null {
  // String() da la forma decimal más corta del número (12.34 → "12.34"); entre 0.01 y
  // 999,999,999.99 nunca usa notación exponencial.
  const coincidencia = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(valor));
  if (!coincidencia) return null;
  return Number(coincidencia[1]) * 100 + Number((coincidencia[2] ?? '').padEnd(2, '0'));
}

function esTipoDeuda(valor: unknown): valor is TipoDeuda {
  return valor === 'Recibido' || valor === 'Realizado';
}

function agregarError(errores: ErroresPorCampo, campo: string, mensaje: string): null {
  (errores[campo] ??= []).push(mensaje);
  return null;
}
