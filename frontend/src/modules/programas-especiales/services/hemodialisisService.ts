// ============================================================
// Servicio REST – Módulo Hemodiálisis / Programas Especiales (his-core)
// ============================================================
import { API_URL, authFetch } from '../../../services/api';
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
  TurnoHD,
  ContadoresDia,
  SerologiaData,
  ResultadoSerologico,
  ParametrizacionHD,
  SillonHD,
  EsquemaConfig,
  JornadaConfig,
} from '../types';

// authFetch agrega el header de tenant, Authorization y refresca el access
// token ante un 401 (RTR), igual que el resto de módulos conectados a his-core.
function req<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  return authFetch<T>(`${API_URL}/programas-especiales/renal${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface ProgramaEspecial {
  codigo: string;
  activo: boolean;
}

export const getProgramas = () => req<ProgramaEspecial[]>('/programas');

export const actualizarEstadoPrograma = (codigo: string, activo: boolean) =>
  req<ProgramaEspecial>(`/programas/${encodeURIComponent(codigo)}`, 'PATCH', { activo });

// ── Dashboard ────────────────────────────────────────────────

export const getDashboard = () => req<DashboardRenal>('/dashboard');

// ── Máquinas ─────────────────────────────────────────────────

export const getMaquinas = () => req<MaquinaDialisis[]>('/maquinas');

export const crearMaquina = (data: Partial<MaquinaDialisis>) =>
  req<MaquinaDialisis>('/maquinas', 'POST', data);

export const actualizarMaquina = (id: string, data: Partial<MaquinaDialisis>) =>
  req<MaquinaDialisis>(`/maquinas/${id}`, 'PATCH', data);

// ── Inscripciones ────────────────────────────────────────────

export interface InscripcionesParams {
  estado?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export const getInscripciones = (params: InscripcionesParams = {}) =>
  req<{ total: number; inscripciones: InscripcionPrograma[] }>(
    `/inscripciones${query({ ...params })}`,
  );

export const getInscripcion = (id: string) => req<InscripcionPrograma>(`/inscripciones/${id}`);

export const inscribirPaciente = (data: any) =>
  req<InscripcionPrograma>('/inscripciones', 'POST', data);

export const actualizarInscripcion = (id: string, data: any) =>
  req<InscripcionPrograma>(`/inscripciones/${id}`, 'PATCH', data);

// ── Historia Clínica Renal ───────────────────────────────────

export const getHistoriaRenal = (inscripcionId: string) =>
  req<HistoriaClinicaRenal>(`/inscripciones/${inscripcionId}/historia`);

export const actualizarHistoriaRenal = (inscripcionId: string, data: Partial<HistoriaClinicaRenal>) =>
  req<HistoriaClinicaRenal>(`/inscripciones/${inscripcionId}/historia`, 'PATCH', data);

// ── Accesos Vasculares ───────────────────────────────────────

export const getAccesos = (inscripcionId: string) =>
  req<AccesoVascular[]>(`/inscripciones/${inscripcionId}/accesos`);

export const crearAcceso = (inscripcionId: string, data: Partial<AccesoVascular>) =>
  req<AccesoVascular>(`/inscripciones/${inscripcionId}/accesos`, 'POST', data);

export const actualizarAcceso = (id: string, data: Partial<AccesoVascular>) =>
  req<AccesoVascular>(`/accesos/${id}`, 'PATCH', data);

// ── Sesiones de Hemodiálisis ─────────────────────────────────

export interface SesionesParams {
  skip?: number;
  take?: number;
  desde?: string;
  hasta?: string;
}

export const getSesiones = (inscripcionId: string, params: SesionesParams = {}) =>
  req<{ total: number; sesiones: SesionHemodialisis[] }>(
    `/inscripciones/${inscripcionId}/sesiones${query({ ...params })}`,
  );

export const getSesion = (id: string) => req<SesionHemodialisis>(`/sesiones/${id}`);

export const crearSesion = (inscripcionId: string, data: Partial<SesionHemodialisis>) =>
  req<SesionHemodialisis>(`/inscripciones/${inscripcionId}/sesiones`, 'POST', data);

export const actualizarSesion = (id: string, data: Partial<SesionHemodialisis>) =>
  req<SesionHemodialisis>(`/sesiones/${id}`, 'PATCH', data);

// ── Laboratorios ─────────────────────────────────────────────

export const getLaboratorios = (inscripcionId: string, tipo?: string) =>
  req<{ total: number; laboratorios: LaboratorioRenal[] }>(
    `/inscripciones/${inscripcionId}/laboratorios${query({ tipo })}`,
  );

export const crearLaboratorio = (inscripcionId: string, data: Partial<LaboratorioRenal>) =>
  req<LaboratorioRenal>(`/inscripciones/${inscripcionId}/laboratorios`, 'POST', data);

// ── Eventos Adversos ─────────────────────────────────────────

export const getEventos = (inscripcionId: string) =>
  req<EventoAdversoPE[]>(`/inscripciones/${inscripcionId}/eventos`);

export const crearEvento = (inscripcionId: string, data: Partial<EventoAdversoPE>) =>
  req<EventoAdversoPE>(`/inscripciones/${inscripcionId}/eventos`, 'POST', data);

// ── Evoluciones ──────────────────────────────────────────────

export const getEvoluciones = (inscripcionId: string, disciplina?: string) =>
  req<EvolucionMultidisciplinaria[]>(
    `/inscripciones/${inscripcionId}/evoluciones${query({ disciplina })}`,
  );

export const crearEvolucion = (inscripcionId: string, data: Partial<EvolucionMultidisciplinaria>) =>
  req<EvolucionMultidisciplinaria>(`/inscripciones/${inscripcionId}/evoluciones`, 'POST', data);

// ── Tamizajes ────────────────────────────────────────────────

export const getTamizajes = (inscripcionId: string) =>
  req<TamizajePE[]>(`/inscripciones/${inscripcionId}/tamizajes`);

export const actualizarTamizaje = (id: string, data: Partial<TamizajePE>) =>
  req<TamizajePE>(`/tamizajes/${id}`, 'PATCH', data);

// ── HD-02: Turnos ────────────────────────────────────────────

export const getTurnos = (params?: { esquema?: string; jornada?: string }) =>
  req<TurnoHD[]>(`/turnos${query({ ...params })}`);

export const getTurnoInscripcion = (inscripcionId: string) =>
  req<TurnoHD | null>(`/inscripciones/${inscripcionId}/turno`);

export const asignarTurno = (data: {
  inscripcionId: string;
  esquema: string;
  jornada: string;
  sillaNumero?: string;
  maquinaId?: string;
  observaciones?: string;
}) => req<TurnoHD>('/turnos', 'POST', data);

export const inactivarTurno = (inscripcionId: string) =>
  req<{ success: boolean }>(`/turnos/${inscripcionId}`, 'DELETE');

// ── P6: Contadores del día ───────────────────────────────────

export const getContadoresDia = () => req<ContadoresDia>('/contadores-dia');

// ── P3: Serología ────────────────────────────────────────────

export const getSerologia = (inscripcionId: string) =>
  req<SerologiaData>(`/inscripciones/${inscripcionId}/serologia`);

export const guardarSerologia = (
  inscripcionId: string,
  data: {
    marcador: string;
    resultado: string;
    valorNumerico?: number;
    fechaToma?: string;
    fechaResultado?: string;
    laboratorio?: string;
    observaciones?: string;
  },
) => req<ResultadoSerologico>(`/inscripciones/${inscripcionId}/serologia`, 'POST', data);

// ── Parametrización HD ───────────────────────────────────────

export const getParametrizacion = () => req<ParametrizacionHD>('/parametrizacion');

export const saveParametrizacion = (data: ParametrizacionHD) =>
  req<ParametrizacionHD>('/parametrizacion', 'PUT', data);

export const crearSillon = (sillon: Omit<SillonHD, 'id'>) =>
  req<ParametrizacionHD>('/parametrizacion/sillones', 'POST', sillon);

export const actualizarSillon = (id: string, updates: Partial<SillonHD>) =>
  req<ParametrizacionHD>(`/parametrizacion/sillones/${id}`, 'PATCH', updates);

export const eliminarSillon = (id: string) =>
  req<ParametrizacionHD>(`/parametrizacion/sillones/${id}`, 'DELETE');

export const crearEsquema = (esquema: Omit<EsquemaConfig, 'id'>) =>
  req<ParametrizacionHD>('/parametrizacion/esquemas', 'POST', esquema);

export const actualizarEsquema = (id: string, updates: Partial<EsquemaConfig>) =>
  req<ParametrizacionHD>(`/parametrizacion/esquemas/${id}`, 'PATCH', updates);

export const eliminarEsquema = (id: string) =>
  req<ParametrizacionHD>(`/parametrizacion/esquemas/${id}`, 'DELETE');

export const crearJornada = (jornada: Omit<JornadaConfig, 'id'>) =>
  req<ParametrizacionHD>('/parametrizacion/jornadas', 'POST', jornada);

export const actualizarJornada = (id: string, updates: Partial<JornadaConfig>) =>
  req<ParametrizacionHD>(`/parametrizacion/jornadas/${id}`, 'PATCH', updates);

export const eliminarJornada = (id: string) =>
  req<ParametrizacionHD>(`/parametrizacion/jornadas/${id}`, 'DELETE');
