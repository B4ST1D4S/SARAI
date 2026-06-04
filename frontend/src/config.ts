/**
 * config.ts — URLs centralizadas del sistema
 * En producción siempre apunta al backend de Vercel, ignorando env vars.
 * import.meta.env.DEV = true solo en `vite dev` local.
 */

export const API_BASE_URL: string = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : 'https://sarai-app-backend.vercel.app/api';

export const WHISPER_BASE_URL: string = import.meta.env.DEV
  ? 'http://localhost:8000'
  : 'https://sarai-app-backend.vercel.app';
