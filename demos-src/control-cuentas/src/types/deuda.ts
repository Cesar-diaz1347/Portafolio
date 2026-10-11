export type TipoDeuda = 'Recibido' | 'Realizado';

export type EstadoDeuda = 'AlDia' | 'Proximo' | 'Vencido' | 'Pagada' | 'Lejana';

export interface Pago {
  id: number;
  fecha: string;
  monto: number;
  nota: string | null;
}

export interface PagoCreateInput {
  fecha: string;
  monto: number;
  nota?: string | null;
}

export interface DeudaListItem {
  id: number;
  nombre: string;
  tipo: TipoDeuda;
  fechaFinPropuesta: string;
  saldoInicial: number;
  saldoPagado: number;
  saldoRemanente: number;
  cuotaMensual: number;
  porcentajeAvance: number;
  estado: EstadoDeuda;
}

export interface DeudaDetail extends DeudaListItem {
  fechaInicio: string;
  fechaFinProyectada: string | null;
  pagos: Pago[];
}

export interface DeudaFormInput {
  nombre: string;
  tipo: TipoDeuda;
  fechaInicio: string;
  fechaFinPropuesta: string;
  saldoInicial: number;
  cuotaMensual: number;
}

export interface DashboardResumen {
  totalPorCobrar: number;
  totalPorPagar: number;
  cantidadVencidas: number;
  cantidadProximas: number;
}
