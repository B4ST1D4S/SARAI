// src/services/adminService.ts — Parametrización del Sistema

import { API_BASE_URL as API } from '../config';

function getToken() {
  return localStorage.getItem('accessToken') || '';
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

// ─── In-memory cache (TTL 60 s) ─────────────────────────────
type CacheEntry = { data: unknown; ts: number };
const _cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60_000; // 5 minutos

function cacheGet<T>(key: string): T | null {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return e.data as T;
}
function cacheSet(key: string, data: unknown) {
  _cache.set(key, { data, ts: Date.now() });
}
function cacheInvalidate(prefix: string) {
  for (const k of _cache.keys()) { if (k.startsWith(prefix)) _cache.delete(k); }
}

async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isGet  = method === 'GET';

  if (isGet) {
    const hit = cacheGet<T>(url);
    if (hit !== null) return hit;
  }

  const r = await fetch(`${API}/admin${url}`, { headers: headers(), ...options });
  const data = await r.json();
  if (!r.ok) {
    // Token expirado/inválido → limpiar sesión y recargar como api.ts
    if (r.status === 401 || r.status === 403) {
      const msg = (data.error || '').toLowerCase();
      if (msg.includes('token') || msg.includes('expirad') || msg.includes('inválid') || msg.includes('autenticad')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    throw new Error(data.error || 'Error en la solicitud');
  }

  if (isGet) {
    cacheSet(url, data);
  } else {
    // Invalidar colección base (ej: PUT /tipos-consulta/123 → borra /tipos-consulta*)
    const base = '/' + url.split('/').filter(Boolean)[0];
    cacheInvalidate(base);
    // Dependencias cruzadas
    if (base === '/especialidades' || base === '/departamentos') {
      cacheInvalidate('/tipos-consulta');
      cacheInvalidate('/preparaciones');
    }
  }

  return data as T;
}

// ─── Especialidades ────────────────────────────────────────────
export const getEspecialidades   = ()          => req('/especialidades');
export const createEspecialidad  = (body: any) => req('/especialidades', { method: 'POST', body: JSON.stringify(body) });
export const updateEspecialidad  = (id: string, body: any) => req(`/especialidades/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteEspecialidad  = (id: string) => req(`/especialidades/${id}`, { method: 'DELETE' });

// ─── HC Módulos ────────────────────────────────────────────────
export const getHCModulos   = ()          => req('/hc-modulos');
export const createHCModulo = (body: any) => req('/hc-modulos', { method: 'POST', body: JSON.stringify(body) });
export const updateHCModulo = (id: string, body: any) => req(`/hc-modulos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteHCModulo = (id: string) => req(`/hc-modulos/${id}`, { method: 'DELETE' });

// ─── Departamentos ─────────────────────────────────────────────
export const getDepartamentos   = ()          => req('/departamentos');
export const createDepartamento = (body: any) => req('/departamentos', { method: 'POST', body: JSON.stringify(body) });
export const updateDepartamento = (id: string, body: any) => req(`/departamentos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteDepartamento = (id: string) => req(`/departamentos/${id}`, { method: 'DELETE' });

// ─── Servicios CUPS ────────────────────────────────────────────
export const getServicios   = (params?: string) => req(`/servicios${params ? '?' + params : ''}`);
export const createServicio = (body: any)  => req('/servicios', { method: 'POST', body: JSON.stringify(body) });
export const updateServicio = (id: string, body: any) => req(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteServicio = (id: string) => req(`/servicios/${id}`, { method: 'DELETE' });

// ─── Tipos de Consulta ─────────────────────────────────────────
export const getTiposConsulta       = ()          => req('/tipos-consulta');
export const getTipoConsultaById    = (id: string)=> req(`/tipos-consulta/${id}`);
export const getServiciosDeConsulta   = (tcId: string) => req(`/tipos-consulta/${tcId}/servicios`);
export const addServicioAConsulta     = (tcId: string, body: any) => req(`/tipos-consulta/${tcId}/servicios`, { method: 'POST', body: JSON.stringify(body) });
export const removeServicioDeConsulta = (confId: string) => req(`/config-servicios/${confId}`, { method: 'DELETE' });
export const createTipoConsulta = (body: any) => req('/tipos-consulta', { method: 'POST', body: JSON.stringify(body) });
export const updateTipoConsulta = (id: string, body: any) => req(`/tipos-consulta/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteTipoConsulta = (id: string) => req(`/tipos-consulta/${id}`, { method: 'DELETE' });

// ─── Preparaciones ─────────────────────────────────────────────
export const getPreparaciones   = (params?: string) => req(`/preparaciones${params ? '?' + params : ''}`);
export const createPreparacion  = (body: any) => req('/preparaciones', { method: 'POST', body: JSON.stringify(body) });
export const updatePreparacion  = (id: string, body: any) => req(`/preparaciones/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deletePreparacion  = (id: string) => req(`/preparaciones/${id}`, { method: 'DELETE' });

// ─── Reglas operativas ─────────────────────────────────────────
export const getReglasOperativas  = (depId: string) => req(`/departamentos/${depId}/reglas`);
export const upsertReglaOperativa = (depId: string, body: any) => req(`/departamentos/${depId}/reglas`, { method: 'POST', body: JSON.stringify(body) });

// ─── Cargos de Consulta Externa ────────────────────────────────
export const getCargos   = (params?: string) => req(`/cargos${params ? '?' + params : ''}`);
export const createCargo = (body: any) => req('/cargos', { method: 'POST', body: JSON.stringify(body) });
export const updateCargo = (id: string, body: any) => req(`/cargos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteCargo = (id: string) => req(`/cargos/${id}`, { method: 'DELETE' });
export const bulkCargos  = (items: any[]) => req('/cargos/bulk', { method: 'POST', body: JSON.stringify({ items }) });

// ─── Cargue masivo genérico ────────────────────────────────────
export const bulkEspecialidades = (items: any[]) => req('/especialidades/bulk', { method: 'POST', body: JSON.stringify({ items }) });
export const bulkDepartamentos  = (items: any[]) => req('/departamentos/bulk',  { method: 'POST', body: JSON.stringify({ items }) });
export const bulkTiposConsulta  = (items: any[]) => req('/tipos-consulta/bulk', { method: 'POST', body: JSON.stringify({ items }) });

// ─── Tipos de Consultorio ──────────────────────────────────────
export const getTiposConsultorio   = ()                => req('/tipos-consultorio');
export const createTipoConsultorio = (body: any)       => req('/tipos-consultorio', { method: 'POST', body: JSON.stringify(body) });
export const updateTipoConsultorio = (id: string, body: any) => req(`/tipos-consultorio/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteTipoConsultorio = (id: string)      => req(`/tipos-consultorio/${id}`, { method: 'DELETE' });

// ─── Departamento × Cargo ──────────────────────────────────────
export const getDepartamentoCargos   = (depId: string)        => req(`/departamentos/${depId}/cargos`);
export const createDepartamentoCargo = (depId: string, body: any) => req(`/departamentos/${depId}/cargos`, { method: 'POST', body: JSON.stringify(body) });
export const updateDepartamentoCargo = (id: string, body: any) => req(`/departamento-cargos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteDepartamentoCargo = (id: string)           => req(`/departamento-cargos/${id}`, { method: 'DELETE' });
// ─── Campos del Formulario de Paciente ──────────────────────────────────
export const getCamposPaciente   = (seccion?: string)       => req(`/campos-paciente${seccion ? '?seccion=' + seccion : ''}`);
export const createCampoPaciente = (body: any)              => req('/campos-paciente', { method: 'POST', body: JSON.stringify(body) });
export const updateCampoPaciente = (id: string, body: any)  => req(`/campos-paciente/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteCampoPaciente = (id: string)             => req(`/campos-paciente/${id}`, { method: 'DELETE' });
export const resetCamposPaciente = ()                       => req('/campos-paciente/reset', { method: 'POST' });

// ─── Parámetros del Sistema ────────────────────────────────────────────
export const getParametrosSistema   = (grupo: string)             => req(`/parametros-sistema/${grupo}`);
export const updateParametroSistema = (grupo: string, clave: string, valor: string) =>
  req(`/parametros-sistema/${grupo}/${clave}`, { method: 'PUT', body: JSON.stringify({ valor }) });

// ─── Listas de Valores ──────────────────────────────────────────────────────
export const getListasValores   = (grupo?: string) => req(`/listas-valores${grupo ? '?grupo=' + grupo : ''}`);
export const createListaValor   = (body: any)      => req('/listas-valores', { method: 'POST', body: JSON.stringify(body) });
export const updateListaValor   = (id: string, body: any) => req(`/listas-valores/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteListaValor   = (id: string)     => req(`/listas-valores/${id}`, { method: 'DELETE' });

// ─── Motivos de Cita ─────────────────────────────────────────────────────────
export const getMotivosCita   = (tipo?: string) => req(`/motivos-cita${tipo ? '?tipo=' + tipo : ''}`);
export const createMotivoCita = (body: any)     => req('/motivos-cita', { method: 'POST', body: JSON.stringify(body) });
export const updateMotivoCita = (id: string, body: any) => req(`/motivos-cita/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteMotivoCita = (id: string)    => req(`/motivos-cita/${id}`, { method: 'DELETE' });