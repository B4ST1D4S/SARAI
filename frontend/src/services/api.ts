// src/services/api.ts - Servicio API para comunicar con el backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Función genérica para hacer peticiones
export async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    token,
  } = options;

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      // Token inválido/expirado: limpiar sesión y recargar para ir al login
      if (response.status === 401 || response.status === 403) {
        const isAuthError =
          data.error?.toLowerCase().includes('token') ||
          data.error?.toLowerCase().includes('no autenticado') ||
          data.error?.toLowerCase().includes('expirado') ||
          data.error?.toLowerCase().includes('inválido');
        if (isAuthError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.reload();
          return { error: 'Sesión expirada. Vuelve a iniciar sesión.', status: response.status };
        }
      }
      return {
        error: data.error || 'Error en la solicitud',
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error: any) {
    return {
      error: error.message || 'Error de conexión',
      status: 0,
    };
  }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export async function login(credentials: LoginRequest) {
  return apiCall<AuthResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export async function getMe(token: string) {
  return apiCall('/auth/me', {
    method: 'GET',
    token,
  });
}

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

export async function createPaciente(data: CreatePacienteRequest, token: string) {
  return apiCall('/pacientes', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getPaciente(id: string, token: string) {
  return apiCall(`/pacientes/${id}`, {
    method: 'GET',
    token,
  });
}

export async function getAllPacientes(page: number = 1, limit: number = 10, token: string) {
  return apiCall(`/pacientes?page=${page}&limit=${limit}`, {
    method: 'GET',
    token,
  });
}

export async function updatePaciente(
  id: string,
  data: Partial<CreatePacienteRequest>,
  token: string
) {
  return apiCall(`/pacientes/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function deletePaciente(id: string, token: string) {
  return apiCall(`/pacientes/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function searchPacientes(query: string, token: string) {
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
  token: string
) {
  return apiCall('/historia-clinica', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getHistoriaClinica(id: string, token: string) {
  return apiCall(`/historia-clinica/${id}`, {
    method: 'GET',
    token,
  });
}

export async function getHistoriasPaciente(pacienteId: string, token: string) {
  return apiCall(`/historia-clinica/paciente/${pacienteId}`, {
    method: 'GET',
    token,
  });
}

export async function getHistoriasMedico(page: number = 1, limit: number = 20, token: string) {
  return apiCall(`/historia-clinica/por-medico?page=${page}&limit=${limit}`, {
    method: 'GET',
    token,
  });
}

export async function updateHistoriaClinica(
  id: string,
  data: Partial<CreateHistoriaClinicaRequest>,
  token: string
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

export async function getCitasMedico(token: string) {
  return apiCall('/citas/medico/agenda', { method: 'GET', token });
}

export async function completarCita(citaId: string, token: string) {
  return apiCall(`/citas/${citaId}/completar`, { method: 'POST', token });
}

export async function cancelarCitaApi(citaId: string, token: string) {
  return apiCall(`/citas/${citaId}`, { method: 'DELETE', token });
}

export async function updateCitaEstado(citaId: string, estado: string, token: string) {
  return apiCall(`/citas/${citaId}`, { method: 'PUT', body: { estado }, token });
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
  // Campos para profesionales (MEDICO, AUXILIAR)
  tipoDocumento?: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  registroMedico?: string;
  firmaBase64?: string;
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {
  password?: string;
}

export async function createUsuario(data: CreateUserRequest, token: string) {
  return apiCall('/usuarios', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getAllUsuarios(token: string) {
  return apiCall('/usuarios', {
    method: 'GET',
    token,
  });
}

export async function getUsuarioById(id: string, token: string) {
  return apiCall(`/usuarios/${id}`, {
    method: 'GET',
    token,
  });
}

export async function updateUsuario(id: string, data: UpdateUserRequest, token: string) {
  return apiCall(`/usuarios/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function toggleUsuarioStatus(id: string, token: string) {
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

export async function getEspecialidades(token: string) {
  return apiCall<EspecialidadItem[]>('/especialidades', {
    method: 'GET',
    token,
  });
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

export async function saveMapaCorporal(data: SaveMapaCorporalRequest, token: string) {
  return apiCall('/mapa-corporal', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getMapaCorporalByProcedimiento(
  procedimientoId: string,
  pacienteId: string,
  token: string
) {
  return apiCall(
    `/mapa-corporal/procedimiento/${procedimientoId}/${pacienteId}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function getMapaCorporalPorPaciente(pacienteId: string, token: string) {
  return apiCall(`/mapa-corporal/paciente/${pacienteId}`, {
    method: 'GET',
    token,
  });
}

export async function updateMapaCorporal(
  id: string,
  data: Partial<SaveMapaCorporalRequest>,
  token: string
) {
  return apiCall(`/mapa-corporal/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function deleteMapaCorporal(id: string, token: string) {
  return apiCall(`/mapa-corporal/${id}`, {
    method: 'DELETE',
    token,
  });
}
