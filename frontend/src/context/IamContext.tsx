/**
 * IamContext — Contexto global de permisos IAM
 *
 * - null mapa → usuario sin perfil IAM → acceso total (backward-compatible)
 * - {} mapa → usuario con perfil pero sin permisos → denegado todo
 * - { 'CLINICA.PACIENTES': { VER: true, CREAR: false } } → aplica reglas
 *
 * canDo('CLINICA.PACIENTES', 'CREAR') → false si el mapa existe y no tiene ese permiso
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

export function IamProvider({ children }: { children: ReactNode }) {
  const [mapa, setMapa] = useState<MapaPermisos>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/seguridad/permisos/mapa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMapa(data); // null = sin perfil = acceso total
      }
    } catch {
      setMapa(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // Recargar si cambia el token (login/logout)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') cargar();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * canDo('CLINICA.PACIENTES', 'CREAR')
   * - mapa === null → true (sin perfil IAM, acceso legacy total)
   * - mapa existe  → mapa['CLINICA.PACIENTES']?.CREAR ?? false
   */
  const canDo = (recurso: string, accion: string): boolean => {
    if (mapa === null) return true;                          // sin perfil → acceso total
    return mapa[recurso]?.[accion] ?? false;                 // sin entrada → denegado
  };

  return (
    <IamContext.Provider value={{ mapa, cargando, canDo, recargar: cargar }}>
      {children}
    </IamContext.Provider>
  );
}

export const useIam = () => useContext(IamContext);
