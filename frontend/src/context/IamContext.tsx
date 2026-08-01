/**
 * IamContext — Contexto global de permisos IAM
 *
 * - null mapa → usuario sin perfil IAM → acceso total (backward-compatible)
 * - {} mapa → usuario con perfil pero sin permisos → denegado todo
 * - { 'CLINICA.PACIENTES': { VER: true, CREAR: false } } → aplica reglas
 *
 * canDo('CLINICA.PACIENTES', 'CREAR') → false si el mapa existe y no tiene ese permiso
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { API_BASE_URL } from '../config';

type MapaPermisos = Record<string, Record<string, boolean>> | null;

interface IamContextValue {
  mapa: MapaPermisos;
  cargando: boolean;
  canDo: (recurso: string, accion: string) => boolean;
  recargar: () => void;
}

const IamContext = createContext<IamContextValue>({
  mapa: null,
  cargando: false,
  canDo: () => true,
  recargar: () => {},
});

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function IamProvider({ children }: { children: ReactNode }) {
  const [mapa, setMapa] = useState<MapaPermisos>(null);
  const [cargando, setCargando] = useState(false);
  const cacheTimestamp = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const cargar = useCallback(async (force = false) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Evitar re-fetch si la caché está vigente y no se fuerza
    const ahora = Date.now();
    if (!force && ahora - cacheTimestamp.current < CACHE_TTL_MS) return;

    // Cancelar petición anterior si sigue en vuelo
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/seguridad/permisos/mapa`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortRef.current.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setMapa(data); // null = sin perfil = acceso total
        cacheTimestamp.current = Date.now();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') setMapa(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Recargar si cambia el token (login/logout)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') cargar(true);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      abortRef.current?.abort();
    };
  }, [cargar]);

  /**
   * canDo('CLINICA.PACIENTES', 'CREAR')
   * - mapa === null → true (sin perfil IAM, acceso legacy total)
   * - mapa existe  → mapa['CLINICA.PACIENTES']?.CREAR ?? false
   */
  const canDo = useCallback((recurso: string, accion: string): boolean => {
    if (mapa === null) return true;                          // sin perfil → acceso total
    return mapa[recurso]?.[accion] ?? false;                 // sin entrada → denegado
  }, [mapa]);

  return (
    <IamContext.Provider value={{ mapa, cargando, canDo, recargar: () => cargar(true) }}>
      {children}
    </IamContext.Provider>
  );
}

export const useIam = () => useContext(IamContext);
