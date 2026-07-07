// src/services/odontologiaService.ts — Módulo de Odontología (Odontograma)

import { API_BASE_URL as API } from '../config';

function getToken() {
  return localStorage.getItem('accessToken') || '';
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API}/odontologia${url}`, { headers: headers(), ...options });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 || r.status === 403) {
      const msg = ((data as any).error || '').toLowerCase();
      if (msg.includes('token') || msg.includes('expirad') || msg.includes('inválid') || msg.includes('autenticad')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    throw new Error((data as any).error || 'Error en la solicitud');
  }
  return data as T;
}

// ─── Tipos ──────────────────────────────────────────────────
export interface OdontoHallazgo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  color: string;
  icono?: string | null;
  categoria?: string | null;
  generaTratamiento: boolean;
  prioridadDefault?: string | null;
  orden: number;
  activo: boolean;
  sugerencias?: { id: string; cargo: { id: string; codigo: string; descripcion: string }; porDefecto?: boolean }[];
}

export interface OdontoCatalogoItem {
  id: string;
  codigo: string;
  nombre: string;
  color: string;
  orden: number;
  activo: boolean;
  nivel?: number;
}

export interface OdontoCatalogos {
  hallazgos: OdontoHallazgo[];
  estados: OdontoCatalogoItem[];
  prioridades: OdontoCatalogoItem[];
  riesgos: OdontoCatalogoItem[];
}

export interface PiezaHallazgo {
  id?: string;
  diente: number;
  superficie?: string | null;
  hallazgoId: string;
  estadoId?: string | null;
  observaciones?: string | null;
  colorOverride?: string | null;
  hallazgo?: { id: string; codigo: string; nombre: string; color: string; categoria?: string | null };
  estado?: { id: string; codigo: string; nombre: string; color: string } | null;
}

export type EstadoTratamiento =
  | 'PLANEADO'
  | 'AGENDADO'
  | 'EN_TRATAMIENTO'
  | 'FINALIZADO'
  | 'SUSPENDIDO'
  | 'CANCELADO';

export interface PlanItem {
  id: string;
  odontogramaId: string;
  pacienteId: string;
  diente?: number | null;
  superficie?: string | null;
  hallazgoId?: string | null;
  diagnostico: string;
  cargoId?: string | null;
  codigoCups?: string | null;
  descripcionProcedimiento: string;
  prioridadId?: string | null;
  estadoTratamiento: EstadoTratamiento;
  observaciones?: string | null;
  evolucion?: string | null;
  precio: number;
  fechaProgramada?: string | null;
  fechaEjecucion?: string | null;
  facturado: boolean;
  orden: number;
  hallazgo?: { id: string; codigo: string; nombre: string; color: string } | null;
  prioridad?: { id: string; codigo: string; nombre: string; color: string; nivel: number } | null;
  cargo?: { id: string; codigo: string; descripcion: string; cupsCodigoStr?: string | null } | null;
}

export interface Odontograma {
  id: string;
  pacienteId: string;
  medicoId?: string | null;
  historiaClinicaId?: string | null;
  citaId?: string | null;
  tipo: 'PRIMERA_VEZ' | 'TRATAMIENTO';
  denticion: string;
  estado: string;
  hallazgosGenerales?: any;
  estetica?: any;
  resumenIA?: string | null;
  riesgoId?: string | null;
  firmado: boolean;
  createdAt: string;
  updatedAt: string;
  paciente?: { id: string; nombreCompleto: string; numeroDocumento: string; tipoDocumento?: string; fechaNacimiento?: string };
  medico?: { id: string; nombre: string; apellido: string } | null;
  riesgo?: OdontoCatalogoItem | null;
  piezas?: PiezaHallazgo[];
  planItems?: PlanItem[];
  _count?: { piezas: number; planItems: number };
}

export interface CargoBusqueda {
  id: string;
  codigo: string;
  descripcion: string;
  cupsCodigoStr?: string | null;
  precioSugerido: number;
}

export interface Evolucion {
  id: string;
  odontogramaId: string;
  pacienteId: string;
  planItemId?: string | null;
  tipo: string;
  descripcion: string;
  medicoId?: string | null;
  fecha: string;
}

export interface ResumenOdonto {
  totalOdontogramas: number;
  planAbierto: number;
  finalizados: number;
  facturados: number;
}

// ─── Catálogos / utilidades ─────────────────────────────────
export const getCatalogos = () => req<OdontoCatalogos>('/catalogos');
export const buscarCargos = (q: string) =>
  req<CargoBusqueda[]>(`/cargos?q=${encodeURIComponent(q)}`);
export const getResumen = () => req<ResumenOdonto>('/resumen');

// ─── Odontogramas ───────────────────────────────────────────
export const getOdontogramasByPaciente = (pacienteId: string, tipo?: string) =>
  req<Odontograma[]>(`/paciente/${pacienteId}${tipo ? `?tipo=${tipo}` : ''}`);
export const getOdontograma = (id: string) => req<Odontograma>(`/${id}`);
export const crearOdontograma = (payload: Partial<Odontograma>) =>
  req<Odontograma>('/', { method: 'POST', body: JSON.stringify(payload) });
export const updateOdontograma = (id: string, payload: Partial<Odontograma>) =>
  req<Odontograma>(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const guardarPiezas = (id: string, piezas: PiezaHallazgo[]) =>
  req<PiezaHallazgo[]>(`/${id}/piezas`, { method: 'PUT', body: JSON.stringify({ piezas }) });

// ─── Plan de tratamiento ────────────────────────────────────
export const generarPlan = (id: string) =>
  req<{ creados: number; planItems: PlanItem[] }>(`/${id}/plan/generar`, { method: 'POST' });
export const addPlanItem = (id: string, payload: Partial<PlanItem>) =>
  req<PlanItem>(`/${id}/plan`, { method: 'POST', body: JSON.stringify(payload) });
export const updatePlanItem = (id: string, itemId: string, payload: Partial<PlanItem>) =>
  req<PlanItem>(`/${id}/plan/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deletePlanItem = (id: string, itemId: string) =>
  req<{ ok: boolean }>(`/${id}/plan/${itemId}`, { method: 'DELETE' });
export const cambiarEstadoTratamiento = (
  id: string,
  itemId: string,
  estadoTratamiento: EstadoTratamiento,
  evolucion?: string,
) =>
  req<{ item: PlanItem; facturacion: any }>(`/${id}/plan/${itemId}/estado`, {
    method: 'POST',
    body: JSON.stringify({ estadoTratamiento, evolucion }),
  });

// ─── Evolución / Timeline ───────────────────────────────────
export const getTimeline = (id: string) => req<Evolucion[]>(`/${id}/timeline`);
export const addEvolucion = (id: string, payload: { tipo?: string; descripcion: string; planItemId?: string }) =>
  req<Evolucion>(`/${id}/evolucion`, { method: 'POST', body: JSON.stringify(payload) });

// ─── Parametrización (catálogos CRUD) ───────────────────────
export const getHallazgos = (todos = true) => req<OdontoHallazgo[]>(`/parametrizacion/hallazgos?todos=${todos}`);
export const createHallazgo = (b: Partial<OdontoHallazgo>) =>
  req<OdontoHallazgo>('/parametrizacion/hallazgos', { method: 'POST', body: JSON.stringify(b) });
export const updateHallazgo = (id: string, b: Partial<OdontoHallazgo>) =>
  req<OdontoHallazgo>(`/parametrizacion/hallazgos/${id}`, { method: 'PUT', body: JSON.stringify(b) });
export const deleteHallazgo = (id: string) =>
  req<{ ok: boolean }>(`/parametrizacion/hallazgos/${id}`, { method: 'DELETE' });
export const setSugerencias = (id: string, cargoIds: string[], porDefectoCargoId?: string) =>
  req(`/parametrizacion/hallazgos/${id}/sugerencias`, {
    method: 'PUT',
    body: JSON.stringify({ cargoIds, porDefectoCargoId }),
  });

type CatKey = 'estados' | 'prioridades' | 'riesgos';
export const getCatalogo = (k: CatKey) => req<OdontoCatalogoItem[]>(`/parametrizacion/${k}?todos=true`);
export const createCatalogo = (k: CatKey, b: Partial<OdontoCatalogoItem>) =>
  req<OdontoCatalogoItem>(`/parametrizacion/${k}`, { method: 'POST', body: JSON.stringify(b) });
export const updateCatalogo = (k: CatKey, id: string, b: Partial<OdontoCatalogoItem>) =>
  req<OdontoCatalogoItem>(`/parametrizacion/${k}/${id}`, { method: 'PUT', body: JSON.stringify(b) });
export const deleteCatalogo = (k: CatKey, id: string) =>
  req<{ ok: boolean }>(`/parametrizacion/${k}/${id}`, { method: 'DELETE' });
