// Demo del portafolio: en lugar de axios contra la API .NET, una API simulada en el navegador
// con la misma lógica de cálculo y validación (ver src/api/demo/). Las firmas no cambian.
import { apiDemo } from './demo/api';
import type {
  DashboardResumen,
  DeudaDetail,
  DeudaFormInput,
  DeudaListItem,
  PagoCreateInput,
  TipoDeuda,
} from '../types/deuda';

export async function getDeudas(tipo?: TipoDeuda): Promise<DeudaListItem[]> {
  const { data } = await apiDemo.getDeudas(tipo);
  return data;
}

export async function getDeuda(id: number): Promise<DeudaDetail> {
  const { data } = await apiDemo.getDeuda(id);
  return data;
}

export async function createDeuda(input: DeudaFormInput): Promise<DeudaDetail> {
  const { data } = await apiDemo.createDeuda(input);
  return data;
}

export async function updateDeuda(id: number, input: DeudaFormInput): Promise<void> {
  await apiDemo.updateDeuda(id, input);
}

export async function deleteDeuda(id: number): Promise<void> {
  await apiDemo.deleteDeuda(id);
}

export async function createPago(deudaId: number, input: PagoCreateInput): Promise<DeudaDetail> {
  const { data } = await apiDemo.createPago(deudaId, input);
  return data;
}

export async function updatePago(
  deudaId: number,
  pagoId: number,
  input: PagoCreateInput,
): Promise<DeudaDetail> {
  const { data } = await apiDemo.updatePago(deudaId, pagoId, input);
  return data;
}

export async function deletePago(deudaId: number, pagoId: number): Promise<DeudaDetail> {
  const { data } = await apiDemo.deletePago(deudaId, pagoId);
  return data;
}

export async function getDashboardResumen(): Promise<DashboardResumen> {
  const { data } = await apiDemo.getDashboardResumen();
  return data;
}
