// URL hardcodeada — inmune a variables incorrectas en el dashboard de Vercel
// import.meta.env.DEV es true solo en `vite dev` local, nunca en build de producción
export const API_BASE_URL: string = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : 'https://sarai-app-backend.vercel.app/api';

export const WHISPER_BASE_URL: string = import.meta.env.DEV
  ? 'http://localhost:8000'
  : 'https://sarai-app-backend.vercel.app';
