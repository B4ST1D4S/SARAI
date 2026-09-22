// URL base hacia el API de NestJS
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Función para extraer el subdominio del host actual o usar 'demo' por defecto
export const getSubdomain = (): string => {
  if (typeof window === 'undefined') return 'demo';
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return 'demo';
};

// ============================================
// HELPER CENTRAL APICALL CON ROTACIÓN AUTOMÁTICA
// ============================================

interface ApiCallOptions {
  method?: string;
  body?: any;
  token?: string;
  headers?: Record<string, string>;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export async function apiCall<T = any>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;

  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': getSubdomain(),
    ...headers,
  };

  if (currentToken) {
    requestHeaders['Authorization'] = `Bearer ${currentToken}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;

  const fetchConfig: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Crucial para transmitir la cookie __Host-refresh_token
  };

  if (body) {
    fetchConfig.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchConfig);

  // Manejo de expiración de token (401) y rotación silenciosa (RTR)
  if (response.status === 401 && !cleanEndpoint.includes('/auth/login')) {
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        return apiCall<T>(endpoint, { ...options, token: newToken });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getSubdomain(),
        },
        credentials: 'include',
        body: JSON.stringify({ subdomain: getSubdomain() }),
      });

      if (!refreshRes.ok) {
        throw new Error('Sesión expirada');
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData.accessToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
      }

      processQueue(null, newAccessToken);

      return apiCall<T>(endpoint, { ...options, token: newAccessToken });
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
          window.location.href = '/';
        }
      }
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `Error en la petición: ${response.statusText}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return response.json();
}

// ============================================
// CLIENTE HTTP PARA MÓDULOS QUE ARMAN SU PROPIA URL BASE
// (ej. `${API_URL}/agenda-organizacional`) EN VEZ DE USAR apiCall()
// ============================================
let isRefreshingDirect = false;
let refreshWaitersDirect: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

async function refrescarTokenDirect(): Promise<boolean> {
  if (isRefreshingDirect) {
    return new Promise((resolve) => {
      refreshWaitersDirect.push({ resolve: () => resolve(true), reject: () => resolve(false) });
    });
  }
  isRefreshingDirect = true;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': getSubdomain() },
      credentials: 'include',
      body: JSON.stringify({ subdomain: getSubdomain() }),
    });
    if (!res.ok) throw new Error('No se pudo refrescar la sesión');
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    refreshWaitersDirect.forEach((w) => w.resolve());
    return true;
  } catch (err) {
    refreshWaitersDirect.forEach((w) => w.reject(err));
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return false;
  } finally {
    isRefreshingDirect = false;
    refreshWaitersDirect = [];
  }
}

/**
 * fetch con header de tenant, Authorization y rotación automática (RTR) ante 401.
 * Sin esto, un módulo que construye su propia URL base (en vez de usar apiCall)
 * deja de funcionar en cuanto expira el access token de corta duración (~15min):
 * cualquier 401 se propagaba como error en vez de refrescar la sesión, lo que se
 * percibía como "se cae la conexión" al volver a una página tras un rato.
 */
export async function authFetch<T = any>(
  url: string,
  options: RequestInit = {},
  _reintentado = false,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': getSubdomain(),
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      ...options.headers,
    },
  });

  if (response.status === 401 && !_reintentado) {
    const refrescado = await refrescarTokenDirect();
    if (refrescado) return authFetch<T>(url, options, true);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data as any)?.message || (data as any)?.error || `Error HTTP ${response.status}`);
  }
  return data as T;
}

// ============================================
// AUTENTICACIÓN
// ============================================

export interface LoginPayload {
  username: string;
  password: string;
  subdomain?: string;
}

export const login = async (credentials: LoginPayload) => {
  try {
    const subdomain = credentials.subdomain || getSubdomain();
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: {
        identifier: credentials.username,
        password: credentials.password,
        subdomain,
      },
    });
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Error al iniciar sesión' };
  }
};

export const logout = async () => {
  try {
    const subdomain = getSubdomain();
    await apiCall('/auth/logout', {
      method: 'POST',
      body: { subdomain },
    });
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};

export const getProfile = async (token?: string) => {
  return apiCall('/auth/me', { method: 'GET', token });
};

// ============================================
// PACIENTES ENDPOINTS
// ============================================

export interface CreatePacienteRequest {
  numeroDocumento: string;
  tipoDocumento: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  genero: string;
  telefonos: string[];
  email?: string;
  whatsapp?: string;
  direccion?: string;
  ciudad?: string;
}

export async function createPaciente(data: CreatePacienteRequest, token?: string) {
  return apiCall('/pacientes', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getPaciente(id: string, token?: string) {
  return apiCall(`/pacientes/${id}`, {
    method: 'GET',
    token,
  });
}

export async function getAllPacientes(page: number = 1, limit: number = 10, token?: string) {
  return apiCall(`/pacientes?page=${page}&limit=${limit}`, {
    method: 'GET',
    token,
  });
}

export async function updatePaciente(
  id: string,
  data: Partial<CreatePacienteRequest>,
  token?: string
) {
  return apiCall(`/pacientes/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function deletePaciente(id: string, token?: string) {
  return apiCall(`/pacientes/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function searchPacientes(query: string, token?: string) {
  return apiCall(`/pacientes/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    token,
  });
}

// ============================================
// HISTORIA CLÍNICA ENDPOINTS
// ============================================

export interface CreateHistoriaClinicaRequest {
  pacienteId: string;
  tipoConsulta: string;
  quejaPrincipal: string;
  historiaEnfermedad?: string;
  observacionesAntropometricas?: string;
  diagnostico?: string;
  tratamientoRecomendado?: string;
}

export async function createHistoriaClinica(
  data: CreateHistoriaClinicaRequest,
  token?: string
) {
  return apiCall('/historia-clinica', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getHistoriaClinica(id: string, token?: string) {
  return apiCall(`/historia-clinica/${id}`, {
    method: 'GET',
    token,
  });
}

export async function getHistoriasPaciente(pacienteId: string, token?: string) {
  return apiCall(`/historia-clinica/paciente/${pacienteId}`, {
    method: 'GET',
    token,
  });
}

export async function getHistoriasMedico(page: number = 1, limit: number = 20, token?: string) {
  return apiCall(`/historia-clinica/por-medico?page=${page}&limit=${limit}`, {
    method: 'GET',
    token,
  });
}

export async function updateHistoriaClinica(
  id: string,
  data: Partial<CreateHistoriaClinicaRequest>,
  token?: string
) {
  return apiCall(`/historia-clinica/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

// ============================================
// CITAS ENDPOINTS
// ============================================

export async function getCitasMedico(fechaInicio: string, fechaFin: string, token?: string) {
  return apiCall(`/citas/medico/agenda?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`, { method: 'GET', token });
}

export async function completarCita(citaId: string, token?: string) {
  return apiCall(`/citas/${citaId}/completar`, { method: 'POST', token });
}

export async function cancelarCitaApi(citaId: string, token?: string) {
  return apiCall(`/citas/${citaId}`, { method: 'DELETE', token });
}

export async function updateCitaEstado(citaId: string, estado: string, token?: string) {
  return apiCall(`/citas/${citaId}`, { method: 'PUT', body: { estado }, token });
}

export async function registrarAdmisionCita(citaId: string, token?: string) {
  return apiCall(`/citas/${citaId}/admision`, { method: 'POST', token });
}

export interface CreateCitaPayload {
  turnoId: string;
  horaInicio: string;
  pacienteId: string;
  tipoConsultaId: string;
  motivoConsulta?: string;
}

export async function crearCita(data: CreateCitaPayload, token?: string) {
  return apiCall('/citas', { method: 'POST', body: data, token });
}

// ============================================
// TIPOS DE CONSULTA ENDPOINTS
// ============================================

export interface TipoConsultaItem {
  id: string;
  especialidadId: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  estado: boolean;
}

export async function getTiposConsulta(especialidadId?: string, token?: string) {
  const query = especialidadId ? `?especialidadId=${especialidadId}` : '';
  return apiCall<TipoConsultaItem[]>(`/tipos-consulta${query}`, { method: 'GET', token });
}

// ============================================
// AGENDA ORGANIZACIONAL — SEDES Y SLOTS
// ============================================

export interface SedeItem {
  id: string;
  codigo: string;
  nombre: string;
  ciudad?: string | null;
  activo: boolean;
}

export async function getSedesActivas(token?: string) {
  return apiCall<SedeItem[]>('/agenda-organizacional/sedes?soloActivos=true', { method: 'GET', token });
}

export interface SlotDisponible {
  slotId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  disponible: boolean;
}

export interface TurnoConSlots {
  turnoId: string;
  fecha: string;
  sede: { id: string; nombre: string };
  consultorio: { id: string; nombre: string };
  profesional: { id: string; nombreCompleto: string };
  especialidadId: string;
  slots: SlotDisponible[];
}

export async function getSlotsDisponibles(
  params: { sedeId: string; especialidadId: string; fechaInicio: string; fechaFin: string },
  token?: string,
) {
  const qs = new URLSearchParams(params).toString();
  return apiCall<TurnoConSlots[]>(`/agenda-organizacional/turnos/slots?${qs}`, { method: 'GET', token });
}

// ============================================
// USUARIOS ENDPOINTS
// ============================================

export interface CreateUserRequest {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  rol: string;
  especialidad?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  registroMedico?: string;
  firmaBase64?: string;
  perfilId?: string;
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {
  password?: string;
}

export async function createUsuario(data: CreateUserRequest, token?: string) {
  return apiCall('/usuarios', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getAllUsuarios(token?: string) {
  return apiCall('/usuarios', {
    method: 'GET',
    token,
  });
}

export async function getUsuarioById(id: string, token?: string) {
  return apiCall(`/usuarios/${id}`, {
    method: 'GET',
    token,
  });
}

export async function updateUsuario(id: string, data: UpdateUserRequest, token?: string) {
  return apiCall(`/usuarios/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function toggleUsuarioStatus(id: string, token?: string) {
  return apiCall(`/usuarios/${id}/toggle-status`, {
    method: 'PATCH',
    token,
  });
}

// ============================================
// ESPECIALIDADES ENDPOINTS
// ============================================

export interface EspecialidadItem {
  id: string;
  codigo: string;
  nombre: string;
}

export async function getEspecialidades(token?: string) {
  return apiCall<EspecialidadItem[]>('/especialidades', {
    method: 'GET',
    token,
  });
}

export async function createEspecialidad(data: Record<string, any>, token?: string) {
  return apiCall('/especialidades', { method: 'POST', body: data, token });
}

export async function updateEspecialidad(id: string, data: Record<string, any>, token?: string) {
  return apiCall(`/especialidades/${id}`, { method: 'PUT', body: data, token });
}

export async function deleteEspecialidad(id: string, token?: string) {
  return apiCall(`/especialidades/${id}`, { method: 'DELETE', token });
}

// ============================================
// MAPA CORPORAL ENDPOINTS
// ============================================

export interface MapaMark {
  id: string;
  tipo: string;
  posicionX: number;
  posicionY: number;
  intensidad: number;
  zona: string;
  fecha: string;
  vista: 'FRONTAL' | 'POSTERIOR' | 'LATERAL_IZQ' | 'LATERAL_DER';
  nota?: string;
}

export interface SaveMapaCorporalRequest {
  pacienteId: string;
  procedimientoId: string;
  zonasMarcadas: MapaMark[];
  edemaZonas?: Record<string, any>[];
  fibrosisZonas?: Record<string, any>[];
  dolorZonas?: Record<string, any>[];
  anotacionesClinics?: string;
}

export async function saveMapaCorporal(data: SaveMapaCorporalRequest, token?: string) {
  return apiCall('/mapa-corporal', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getMapaCorporalByProcedimiento(
  procedimientoId: string,
  pacienteId: string,
  token?: string
) {
  return apiCall(
    `/mapa-corporal/procedimiento/${procedimientoId}/${pacienteId}`,
    { method: 'GET', token }
  );
}

export async function getMapaCorporalPorPaciente(pacienteId: string, token?: string) {
  return apiCall(`/mapa-corporal/paciente/${pacienteId}`, {
    method: 'GET',
    token,
  });
}

export async function updateMapaCorporal(
  id: string,
  data: Partial<SaveMapaCorporalRequest>,
  token?: string
) {
  return apiCall(`/mapa-corporal/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function deleteMapaCorporal(id: string, token?: string) {
  return apiCall(`/mapa-corporal/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ============================================
// COTIZACIONES ENDPOINTS
// ============================================

export async function getCotizaciones(token?: string) {
  return apiCall<{ cotizaciones: any[] }>('/cotizaciones', { token });
}

export async function createCotizacion(data: any, token?: string) {
  return apiCall('/cotizaciones', { method: 'POST', body: data, token });
}

export async function aceptarCotizacion(id: string, token?: string) {
  return apiCall(`/cotizaciones/${id}/aceptar`, { method: 'POST', token });
}

export async function rechazarCotizacion(id: string, token?: string) {
  return apiCall(`/cotizaciones/${id}/rechazar`, { method: 'POST', token });
}