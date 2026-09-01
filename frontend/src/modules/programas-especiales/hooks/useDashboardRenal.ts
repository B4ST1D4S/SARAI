import { useState, useEffect, useCallback } from 'react';
import * as svc from '../services/hemodialisisService';
import type { DashboardRenal, MaquinaDialisis } from '../types';

export function useDashboardRenal() {
  const [data, setData] = useState<DashboardRenal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await svc.getDashboard();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useMaquinas() {
  const [maquinas, setMaquinas] = useState<MaquinaDialisis[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const m = await svc.getMaquinas();
      setMaquinas(m);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const crearMaquina = async (data: Partial<MaquinaDialisis>) => {
    setGuardando(true);
    try {
      await svc.crearMaquina(data);
      await fetch();
    } finally {
      setGuardando(false);
    }
  };

  const actualizarMaquina = async (id: string, data: Partial<MaquinaDialisis>) => {
    setGuardando(true);
    try {
      await svc.actualizarMaquina(id, data);
      await fetch();
    } finally {
      setGuardando(false);
    }
  };

  return { maquinas, loading, guardando, refetch: fetch, crearMaquina, actualizarMaquina };
}
