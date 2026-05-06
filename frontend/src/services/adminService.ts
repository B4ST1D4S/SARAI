// src/services/adminService.ts — Parametrización del Sistema

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('accessToken') || '';
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API}/admin${url}`, { headers: headers(), ...options });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Error en la solicitud');
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
export const getTiposConsulta   = ()          => req('/tipos-consulta');
export const getTipoConsultaById= (id: string)=> req(`/tipos-consulta/${id}`);
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
