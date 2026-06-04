/**
 * config.ts — URLs centralizadas del sistema
 * Garantiza que nunca se use una URL relativa en producción.
 */

const _raw = import.meta.env.VITE_API_URL ?? '';

// Si VITE_API_URL es relativa (ej: "/api") o vacía, usa el backend correcto.
// import.meta.env.DEV es true solo en `vite dev`, false en el build de Vercel.
export const API_BASE_URL: string =
  _raw && _raw.startsWith('http')
    ? _raw
    : import.meta.env.DEV
      ? 'http://localhost:3001/api'
      : 'https://sarai-app-backend.vercel.app/api';

const _rawWhisper = import.meta.env.VITE_WHISPER_URL ?? '';
export const WHISPER_BASE_URL: string =
  _rawWhisper && _rawWhisper.startsWith('http')
    ? _rawWhisper
    : import.meta.env.DEV
      ? 'http://localhost:8000'
      : 'https://sarai-app-backend.vercel.app';
