// src/services/fevRipsService.ts — Integración FEV-RIPS (Docker API MSPS)

import { API_BASE_URL as API } from '../config';

function getToken() {
  return localStorage.getItem('accessToken') || '';
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API}/fev-rips${url}`, { headers: headers(), ...options });
  const data = await r.json();
  if (!r.ok) {
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
  return data as T;
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Ambiente = 'stage' | 'produccion';

export interface UsuarioSispro {
  id: string;
  nombre: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nit: string;
  tipoUsuario: string | null;
  ambiente: 'STAGE' | 'PRODUCCION';
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RipsPrueba {
  id: string;
  nombre: string;
  modulo: string;
  numDocumentoIdObligado: string;
  numFactura: string | null;
  tipoNota: string | null;
  numNota: string | null;
  ripsJson: unknown;
  xmlFevFile: string | null;
  ultimoResultado: ResultadoEnvioFevRips | null;
  cuv: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResultadoValidacion {
  Clase: 'RECHAZADO' | 'NOTIFICACION' | string;
  Codigo: string;
  Descripcion: string;
  Observaciones: string;
  PathFuente: string;
  Fuente: string;
}

export interface ResultadoEnvioFevRips {
  ResultState: boolean;
  ProcesoId: number;
  NumFactura: string;
  CodigoUnicoValidacion: string;
  FechaRadicacion: string;
  RutaArchivos: string | null;
  Ambiente: string;
  Modulo: string;
  ModalidadPago: string;
  PeriodoAtencion: { FechaInicio: string | null; FechaFin: string | null };
  ResultadosValidacion: ResultadoValidacion[];
  login?: { token: string | null; login: boolean; registrado: boolean; errors: string[] | null };
}

// ─── Usuarios SISPRO ─────────────────────────────────────────────────────────

export const getUsuariosSispro = (ambiente?: 'STAGE' | 'PRODUCCION') =>
  req<UsuarioSispro[]>(`/usuarios-sispro${ambiente ? `?ambiente=${ambiente}` : ''}`);

export const createUsuarioSispro = (body: Partial<UsuarioSispro> & { clave: string }) =>
  req<UsuarioSispro>('/usuarios-sispro', { method: 'POST', body: JSON.stringify(body) });

export const deleteUsuarioSispro = (id: string) =>
  req<void>(`/usuarios-sispro/${id}`, { method: 'DELETE' });

// ─── RIPS de prueba ─────────────────────────────────────────────────────────

export const getRipsPruebas = () => req<RipsPrueba[]>('/rips-pruebas');

export const getRipsPrueba = (id: string) => req<RipsPrueba>(`/rips-pruebas/${id}`);

export const createRipsPrueba = (body: {
  nombre: string;
  modulo?: string;
  numDocumentoIdObligado: string;
  numFactura?: string;
  ripsJson: unknown;
  xmlFevFile?: string;
}) => req<RipsPrueba>('/rips-pruebas', { method: 'POST', body: JSON.stringify(body) });

export const deleteRipsPrueba = (id: string) => req<void>(`/rips-pruebas/${id}`, { method: 'DELETE' });

// ─── Envío — rutas separadas stage / producción ────────────────────────────

export const enviarRipsPrueba = (ambiente: Ambiente, ripsPruebaId: string, usuarioSisproId?: string) =>
  req<ResultadoEnvioFevRips>(`/${ambiente}/enviar/${ripsPruebaId}`, {
    method: 'POST',
    body: JSON.stringify({ usuarioSisproId }),
  });

export const loginFevRips = (ambiente: Ambiente, usuarioSisproId?: string) =>
  req<{ token: string | null; login: boolean; registrado: boolean; errors: string[] | null }>(
    `/${ambiente}/login`,
    { method: 'POST', body: JSON.stringify({ usuarioSisproId }) }
  );
