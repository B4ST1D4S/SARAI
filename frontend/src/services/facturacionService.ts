// src/services/facturacionService.ts — Módulo de Facturación (his-core)

import { API_URL, authFetch } from './api';

// authFetch ya agrega el header de tenant, Authorization y refresca el
// access token automáticamente ante un 401 (RTR) — sin esto, igual que pasó
// antes en Config Agenda, la sesión "se caía" al expirar el token.
async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  return authFetch<T>(`${API_URL}/facturacion${url}`, options);
}

// ─── Tipos ──────────────────────────────────────────────────
export interface PacienteMin {
  id: string;
  nombreCompleto: string;
  numeroDocumento: string;
  tipoDocumento?: string;
}

export interface CuentaResumen {
  id: string;
  numero: number;
  estado: 'ABIERTA' | 'FACTURADA' | 'ANULADA';
  total: number;
  _count?: { items: number };
  factura?: { id: string; numero: number; prefijo: string; estado: string } | null;
}

export interface Ingreso {
  id: string;
  numero: number;
  estado: string;
  tipoIngreso: string;
  entidad?: string | null;
  plan?: string | null;
  fechaIngreso: string;
  paciente: PacienteMin;
  medico?: { id: string; nombre: string; apellido: string } | null;
  cuentas: CuentaResumen[];
}

export interface CuentaItem {
  id: string;
  cargoId?: string | null;
  codigo?: string | null;
  descripcion: string;
  departamento?: string | null;
  cantidad: number;
  precioUnitario: number;
  valorTotal: number;
}

export interface CuentaDetalle {
  id: string;
  numero: number;
  estado: 'ABIERTA' | 'FACTURADA' | 'ANULADA';
  total: number;
  items: CuentaItem[];
  factura?: Factura | null;
  ingreso: {
    id: string;
    numero: number;
    tipoIngreso: string;
    entidad?: string | null;
    plan?: string | null;
    paciente: PacienteMin & { fechaNacimiento?: string; genero?: string };
    medico?: { id: string; nombre: string; apellido: string } | null;
  };
}

export interface CargoBusqueda {
  id: string;
  codigo: string;
  descripcion: string;
  cupsCodigoStr?: string | null;
  grupo?: string | null;
  precioSugerido: number;
  tipoRips: string;
}

export interface Factura {
  id: string;
  numero: number;
  prefijo: string;
  estado: 'EMITIDA' | 'ANULADA' | 'PAGADA';
  subtotal: number;
  total: number;
  entidad?: string | null;
  plan?: string | null;
  fecha: string;
  paciente?: PacienteMin;
}

export interface ResumenFacturacion {
  cuentasAbiertas: number;
  facturasEmitidas: number;
  totalFacturado: number;
}

// ─── Endpoints ──────────────────────────────────────────────
export const getResumen = () => req<ResumenFacturacion>('/resumen');

export const getIngresos = (params: { search?: string; estado?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.estado) q.set('estado', params.estado);
  const s = q.toString();
  return req<Ingreso[]>(`/ingresos${s ? `?${s}` : ''}`);
};

export const createIngreso = (body: {
  pacienteId: string;
  tipoIngreso?: string;
  entidad?: string;
  plan?: string;
  observaciones?: string;
}) => req<Ingreso>('/ingresos', { method: 'POST', body: JSON.stringify(body) });

export const getCuenta = (id: string) => req<CuentaDetalle>(`/cuentas/${id}`);

export const buscarCargos = (search: string) =>
  req<CargoBusqueda[]>(`/cargos?search=${encodeURIComponent(search)}`);

export const addCuentaItem = (
  cuentaId: string,
  body: {
    cargoId?: string;
    codigo?: string;
    descripcion?: string;
    departamento?: string;
    cantidad?: number;
    precioUnitario?: number;
  }
) => req<CuentaItem>(`/cuentas/${cuentaId}/items`, { method: 'POST', body: JSON.stringify(body) });

export const updateCuentaItem = (
  cuentaId: string,
  itemId: string,
  body: { cantidad?: number; precioUnitario?: number; descripcion?: string; departamento?: string }
) => req<CuentaItem>(`/cuentas/${cuentaId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteCuentaItem = (cuentaId: string, itemId: string) =>
  req<{ success: boolean }>(`/cuentas/${cuentaId}/items/${itemId}`, { method: 'DELETE' });

export const facturarCuenta = (cuentaId: string, observaciones?: string, omitirValidacionRips?: boolean) =>
  req<Factura>(`/cuentas/${cuentaId}/facturar`, {
    method: 'POST',
    body: JSON.stringify({ observaciones, omitirValidacionRips }),
  });

export interface ResultadoValidacionRips {
  clase: 'RECHAZADO' | 'NOTIFICACION';
  codigo: string;
  descripcion: string;
  observaciones: string;
  pathFuente: string;
  fuente: 'Paciente' | 'CuentaItem' | 'Contrato';
}

export interface ReporteValidacionRips {
  cuentaId: string;
  totalErrores: number;
  totalNotificaciones: number;
  puedeFacturar: boolean;
  resultados: ResultadoValidacionRips[];
}

export const getValidacionRips = (cuentaId: string) =>
  req<ReporteValidacionRips>(`/cuentas/${cuentaId}/validar-rips`);

export const getFacturas = (params: { search?: string; estado?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.estado) q.set('estado', params.estado);
  const s = q.toString();
  return req<Factura[]>(`/facturas${s ? `?${s}` : ''}`);
};

export const getFactura = (id: string) =>
  req<Factura & { cuenta: CuentaDetalle }>(`/facturas/${id}`);

export const anularFactura = (id: string) =>
  req<{ success: boolean }>(`/facturas/${id}/anular`, { method: 'POST' });
