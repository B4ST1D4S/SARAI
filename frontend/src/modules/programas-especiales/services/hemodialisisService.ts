// ============================================================
// Servicio REST – Módulo Hemodiálisis / Programas Especiales
// ============================================================
import { API_BASE_URL } from '../../../config';
import type {
  InscripcionPrograma,
  HistoriaClinicaRenal,
  AccesoVascular,
  MaquinaDialisis,
  SesionHemodialisis,
  LaboratorioRenal,
  EventoAdversoPE,
  EvolucionMultidisciplinaria,
  TamizajePE,
  DashboardRenal,
} from '../types';

const BASE = `${API_BASE_URL}/programas-especiales/renal`;

function token() {
  return localStorage.getItem('accessToken') ?? '';
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data as T;
}

// ── Dashboard ────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardRenal> {
  const res = await fetch(`${BASE}/dashboard`, { headers: headers() });
  return handleResponse<DashboardRenal>(res);
}

// ── Máquinas ─────────────────────────────────────────────────

export async function getMaquinas(): Promise<MaquinaDialisis[]> {
  const res = await fetch(`${BASE}/maquinas`, { headers: headers() });
  return handleResponse<MaquinaDialisis[]>(res);
}

export async function crearMaquina(data: Partial<MaquinaDialisis>): Promise<MaquinaDialisis> {
  const res = await fetch(`${BASE}/maquinas`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse<MaquinaDialisis>(res);
}

export async function actualizarMaquina(
  id: string,
  data: Partial<MaquinaDialisis>
): Promise<MaquinaDialisis> {
  const res = await fetch(`${BASE}/maquinas/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse<MaquinaDialisis>(res);
}

// ── Inscripciones ────────────────────────────────────────────

export interface InscripcionesParams {
  estado?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export async function getInscripciones(
  params: InscripcionesParams = {}
): Promise<{ total: number; inscripciones: InscripcionPrograma[] }> {
  const q = new URLSearchParams();
  if (params.estado) q.set('estado', params.estado);
  if (params.search) q.set('search', params.search);
  if (params.skip != null) q.set('skip', String(params.skip));
  if (params.take != null) q.set('take', String(params.take));
  const res = await fetch(`${BASE}/inscripciones?${q}`, { headers: headers() });
  return handleResponse(res);
}

export async function getInscripcion(id: string): Promise<InscripcionPrograma> {
  const res = await fetch(`${BASE}/inscripciones/${id}`, { headers: headers() });
  return handleResponse(res);
}

export async function inscribirPaciente(data: any): Promise<InscripcionPrograma> {
  const res = await fetch(`${BASE}/inscripciones`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function actualizarInscripcion(
  id: string,
  data: any
): Promise<InscripcionPrograma> {
  const res = await fetch(`${BASE}/inscripciones/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Historia Clínica Renal ───────────────────────────────────

export async function getHistoriaRenal(inscripcionId: string): Promise<HistoriaClinicaRenal> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/historia`, {
    headers: headers(),
  });
  return handleResponse(res);
}

export async function actualizarHistoriaRenal(
  inscripcionId: string,
  data: Partial<HistoriaClinicaRenal>
): Promise<HistoriaClinicaRenal> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/historia`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Accesos Vasculares ───────────────────────────────────────

export async function getAccesos(inscripcionId: string): Promise<AccesoVascular[]> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/accesos`, {
    headers: headers(),
  });
  return handleResponse(res);
}

export async function crearAcceso(
  inscripcionId: string,
  data: Partial<AccesoVascular>
): Promise<AccesoVascular> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/accesos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function actualizarAcceso(
  id: string,
  data: Partial<AccesoVascular>
): Promise<AccesoVascular> {
  const res = await fetch(`${BASE}/accesos/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Sesiones de Hemodiálisis ─────────────────────────────────

export interface SesionesParams {
  skip?: number;
  take?: number;
  desde?: string;
  hasta?: string;
}

export async function getSesiones(
  inscripcionId: string,
  params: SesionesParams = {}
): Promise<{ total: number; sesiones: SesionHemodialisis[] }> {
  const q = new URLSearchParams();
  if (params.skip != null) q.set('skip', String(params.skip));
  if (params.take != null) q.set('take', String(params.take));
  if (params.desde) q.set('desde', params.desde);
  if (params.hasta) q.set('hasta', params.hasta);
  const res = await fetch(
    `${BASE}/inscripciones/${inscripcionId}/sesiones?${q}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function getSesion(id: string): Promise<SesionHemodialisis> {
  const res = await fetch(`${BASE}/sesiones/${id}`, { headers: headers() });
  return handleResponse(res);
}

export async function crearSesion(
  inscripcionId: string,
  data: Partial<SesionHemodialisis>
): Promise<SesionHemodialisis> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/sesiones`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function actualizarSesion(
  id: string,
  data: Partial<SesionHemodialisis>
): Promise<SesionHemodialisis> {
  const res = await fetch(`${BASE}/sesiones/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Laboratorios ─────────────────────────────────────────────

export async function getLaboratorios(
  inscripcionId: string,
  tipo?: string
): Promise<{ total: number; laboratorios: LaboratorioRenal[] }> {
  const q = new URLSearchParams();
  if (tipo) q.set('tipo', tipo);
  const res = await fetch(
    `${BASE}/inscripciones/${inscripcionId}/laboratorios?${q}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function crearLaboratorio(
  inscripcionId: string,
  data: Partial<LaboratorioRenal>
): Promise<LaboratorioRenal> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/laboratorios`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Eventos Adversos ─────────────────────────────────────────

export async function getEventos(inscripcionId: string): Promise<EventoAdversoPE[]> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/eventos`, {
    headers: headers(),
  });
  return handleResponse(res);
}

export async function crearEvento(
  inscripcionId: string,
  data: Partial<EventoAdversoPE>
): Promise<EventoAdversoPE> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/eventos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Evoluciones ───────────────────────────────────────────────

export async function getEvoluciones(
  inscripcionId: string,
  disciplina?: string
): Promise<EvolucionMultidisciplinaria[]> {
  const q = new URLSearchParams();
  if (disciplina) q.set('disciplina', disciplina);
  const res = await fetch(
    `${BASE}/inscripciones/${inscripcionId}/evoluciones?${q}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function crearEvolucion(
  inscripcionId: string,
  data: Partial<EvolucionMultidisciplinaria>
): Promise<EvolucionMultidisciplinaria> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/evoluciones`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Tamizajes ─────────────────────────────────────────────────

export async function getTamizajes(inscripcionId: string): Promise<TamizajePE[]> {
  const res = await fetch(`${BASE}/inscripciones/${inscripcionId}/tamizajes`, {
    headers: headers(),
  });
  return handleResponse(res);
}

export async function actualizarTamizaje(
  id: string,
  data: Partial<TamizajePE>
): Promise<TamizajePE> {
  const res = await fetch(`${BASE}/tamizajes/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── HD-02: Turnos ─────────────────────────────────────────────

export async function getTurnos(params?: {
  esquema?: string;
  jornada?: string;
}): Promise<import('../types').TurnoHD[]> {
  const q = new URLSearchParams();
  if (params?.esquema) q.set('esquema', params.esquema);
  if (params?.jornada) q.set('jornada', params.jornada);
  const res = await fetch(`${BASE}/turnos?${q}`, { headers: headers() });
  return handleResponse(res);
}

export async function getTurnoInscripcion(
  inscripcionId: string
): Promise<import('../types').TurnoHD | null> {
  const res = await fetch(
    `${BASE}/inscripciones/${inscripcionId}/turno`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function asignarTurno(data: {
  inscripcionId: string;
  esquema: string;
  jornada: string;
  sillaNumero?: string;
  maquinaId?: string;
  observaciones?: string;
}): Promise<import('../types').TurnoHD> {
  const res = await fetch(`${BASE}/turnos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function inactivarTurno(inscripcionId: string): Promise<void> {
  const res = await fetch(`${BASE}/turnos/${inscripcionId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return handleResponse(res);
}

// ── P6: Contadores del día ────────────────────────────────────

export async function getContadoresDia(): Promise<import('../types').ContadoresDia> {
  const res = await fetch(`${BASE}/contadores-dia`, { headers: headers() });
  return handleResponse(res);
}

// ── P3: Serología ─────────────────────────────────────────────

export async function getSerologia(
  inscripcionId: string
): Promise<import('../types').SerologiaData> {
  const res = await fetch(
    `${BASE}/inscripciones/${inscripcionId}/serologia`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function guardarSerologia(
  inscripcionId: string,
  data: {
    marcador: string;
    resultado: string;
    valorNumerico?: number;
    fechaToma?: string;
    fechaResultado?: string;
    laboratorio?: string;
    observaciones?: string;
  }
): Promise<import('../types').ResultadoSerologico> {
  const res = await fetch(
    `${BASE}/inscripciones/${inscripcionId}/serologia`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    }
  );
  return handleResponse(res);
}

// ── Parametrización HD ────────────────────────────────────────

export async function getParametrizacion(): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion`, { headers: headers() });
  return handleResponse(res);
}

export async function saveParametrizacion(
  data: import('../types').ParametrizacionHD
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function crearSillon(
  sillon: Omit<import('../types').SillonHD, 'id'>
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/sillones`, {
    method: 'POST', headers: headers(), body: JSON.stringify(sillon),
  });
  return handleResponse(res);
}

export async function actualizarSillon(
  id: string, updates: Partial<import('../types').SillonHD>
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/sillones/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function eliminarSillon(id: string): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/sillones/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return handleResponse(res);
}

export async function crearEsquema(
  esquema: Omit<import('../types').EsquemaConfig, 'id'>
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/esquemas`, {
    method: 'POST', headers: headers(), body: JSON.stringify(esquema),
  });
  return handleResponse(res);
}

export async function actualizarEsquema(
  id: string, updates: Partial<import('../types').EsquemaConfig>
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/esquemas/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function eliminarEsquema(id: string): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/esquemas/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return handleResponse(res);
}

export async function crearJornada(
  jornada: Omit<import('../types').JornadaConfig, 'id'>
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/jornadas`, {
    method: 'POST', headers: headers(), body: JSON.stringify(jornada),
  });
  return handleResponse(res);
}

export async function actualizarJornada(
  id: string, updates: Partial<import('../types').JornadaConfig>
): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/jornadas/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function eliminarJornada(id: string): Promise<import('../types').ParametrizacionHD> {
  const res = await fetch(`${BASE}/parametrizacion/jornadas/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return handleResponse(res);
}
