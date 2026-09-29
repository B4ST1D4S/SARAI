import { useState, useEffect, useCallback } from 'react';
import * as svc from '../services/hemodialisisService';
import type {
  InscripcionPrograma,
  SesionHemodialisis,
  AccesoVascular,
  LaboratorioRenal,
  EventoAdversoPE,
  EvolucionMultidisciplinaria,
  TamizajePE,
} from '../types';

// ── Inscripciones (lista) ────────────────────────────────────

export function useInscripciones(params: {
  estado?: string;
  search?: string;
} = {}) {
  const [data, setData] = useState<{ total: number; inscripciones: InscripcionPrograma[] }>({
    total: 0,
    inscripciones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await svc.getInscripciones(params);
      setData(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [params.estado, params.search]);

  useEffect(() => { load(); }, [load]);

  return { ...data, loading, error, refetch: load };
}

// ── Inscripción (detalle) ────────────────────────────────────

export function useInscripcion(id: string | null) {
  const [inscripcion, setInscripcion] = useState<InscripcionPrograma | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const r = await svc.getInscripcion(id);
      setInscripcion(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { inscripcion, loading, error, refetch: load };
}

// ── Sesiones ─────────────────────────────────────────────────

export function useSesiones(inscripcionId: string | null) {
  const [data, setData] = useState<{ total: number; sesiones: SesionHemodialisis[] }>({
    total: 0,
    sesiones: [],
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try {
      const r = await svc.getSesiones(inscripcionId, { take: 50 });
      setData(r);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  const crearSesion = async (d: Partial<SesionHemodialisis>) => {
    if (!inscripcionId) return;
    const s = await svc.crearSesion(inscripcionId, d);
    await load();
    return s;
  };

  const actualizarSesion = async (id: string, d: Partial<SesionHemodialisis>) => {
    const s = await svc.actualizarSesion(id, d);
    await load();
    return s;
  };

  return { ...data, loading, refetch: load, crearSesion, actualizarSesion };
}

// ── Accesos Vasculares ───────────────────────────────────────

export function useAccesos(inscripcionId: string | null) {
  const [accesos, setAccesos] = useState<AccesoVascular[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setAccesos(await svc.getAccesos(inscripcionId)); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  const crearAcceso = async (d: Partial<AccesoVascular>) => {
    if (!inscripcionId) return;
    const a = await svc.crearAcceso(inscripcionId, d);
    await load();
    return a;
  };

  const actualizarAcceso = async (id: string, d: Partial<AccesoVascular>) => {
    const a = await svc.actualizarAcceso(id, d);
    await load();
    return a;
  };

  return { accesos, loading, refetch: load, crearAcceso, actualizarAcceso };
}

// ── Laboratorios ─────────────────────────────────────────────

export function useLaboratorios(inscripcionId: string | null) {
  const [data, setData] = useState<{ total: number; laboratorios: LaboratorioRenal[] }>({
    total: 0,
    laboratorios: [],
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setData(await svc.getLaboratorios(inscripcionId)); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  const crearLaboratorio = async (d: Partial<LaboratorioRenal>) => {
    if (!inscripcionId) return;
    const l = await svc.crearLaboratorio(inscripcionId, d);
    await load();
    return l;
  };

  return { ...data, loading, refetch: load, crearLaboratorio };
}

// ── Eventos Adversos ─────────────────────────────────────────

export function useEventos(inscripcionId: string | null) {
  const [eventos, setEventos] = useState<EventoAdversoPE[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setEventos(await svc.getEventos(inscripcionId)); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  const crearEvento = async (d: Partial<EventoAdversoPE>) => {
    if (!inscripcionId) return;
    const e = await svc.crearEvento(inscripcionId, d);
    await load();
    return e;
  };

  return { eventos, loading, refetch: load, crearEvento };
}

// ── Evoluciones ───────────────────────────────────────────────

export function useEvoluciones(inscripcionId: string | null, disciplina?: string) {
  const [evoluciones, setEvoluciones] = useState<EvolucionMultidisciplinaria[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setEvoluciones(await svc.getEvoluciones(inscripcionId, disciplina)); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId, disciplina]);

  useEffect(() => { load(); }, [load]);

  const crearEvolucion = async (d: Partial<EvolucionMultidisciplinaria>) => {
    if (!inscripcionId) return;
    const e = await svc.crearEvolucion(inscripcionId, d);
    await load();
    return e;
  };

  return { evoluciones, loading, refetch: load, crearEvolucion };
}

// ── Tamizajes ─────────────────────────────────────────────────

export function useTamizajes(inscripcionId: string | null) {
  const [tamizajes, setTamizajes] = useState<TamizajePE[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setTamizajes(await svc.getTamizajes(inscripcionId)); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  const actualizarTamizaje = async (id: string, d: Partial<TamizajePE>) => {
    const t = await svc.actualizarTamizaje(id, d);
    await load();
    return t;
  };

  return { tamizajes, loading, refetch: load, actualizarTamizaje };
}

// ── HD-02: Turnos ─────────────────────────────────────────────

export function useTurnos(filtros?: { esquema?: string; jornada?: string }) {
  const [turnos, setTurnos] = useState<import('../types').TurnoHD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setTurnos(await svc.getTurnos(filtros)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filtros?.esquema, filtros?.jornada]);

  useEffect(() => { load(); }, [load]);

  const asignarTurno = async (data: {
    inscripcionId: string;
    esquema: string;
    jornada: string;
    sillaNumero?: string;
    maquinaId?: string;
    observaciones?: string;
  }) => {
    const t = await svc.asignarTurno(data);
    await load();
    return t;
  };

  const inactivarTurno = async (inscripcionId: string) => {
    await svc.inactivarTurno(inscripcionId);
    await load();
  };

  return { turnos, loading, error, refetch: load, asignarTurno, inactivarTurno };
}

export function useTurnoInscripcion(inscripcionId: string | null) {
  const [turno, setTurno] = useState<import('../types').TurnoHD | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setTurno(await svc.getTurnoInscripcion(inscripcionId)); }
    catch { setTurno(null); }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  return { turno, loading, refetch: load };
}

// ── P6: Contadores del día ────────────────────────────────────

export function useContadoresDia() {
  const [contadores, setContadores] = useState<import('../types').ContadoresDia>({
    programadosHoy: 0, enSala: 0, finalizados: 0, suspendidos: 0, ausentes: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setContadores(await svc.getContadoresDia()); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh cada 2 minutos
    const interval = setInterval(load, 120_000);
    return () => clearInterval(interval);
  }, [load]);

  return { contadores, loading, refetch: load };
}

// ── P3: Serología ─────────────────────────────────────────────

export function useSerologia(inscripcionId: string | null) {
  const [data, setData] = useState<import('../types').SerologiaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    if (!inscripcionId) return;
    setLoading(true);
    try { setData(await svc.getSerologia(inscripcionId)); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [inscripcionId]);

  useEffect(() => { load(); }, [load]);

  const guardar = async (data: {
    marcador: string;
    resultado: string;
    valorNumerico?: number;
    fechaToma?: string;
    fechaResultado?: string;
    laboratorio?: string;
    observaciones?: string;
  }) => {
    if (!inscripcionId) return;
    setGuardando(true);
    try {
      const r = await svc.guardarSerologia(inscripcionId, data);
      await load();
      return r;
    } finally {
      setGuardando(false);
    }
  };

  return { data, loading, guardando, refetch: load, guardar };
}

// ── Parametrización HD ────────────────────────────────────────

export function useParametrizacion() {
  const [param, setParam] = useState<import('../types').ParametrizacionHD | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setParam(await svc.getParametrizacion()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: () => Promise<import('../types').ParametrizacionHD>) {
    setGuardando(true);
    setError(null);
    try {
      const updated = await action();
      setParam(updated);
      return updated;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setGuardando(false);
    }
  }

  return {
    param,
    loading,
    guardando,
    error,
    refetch: load,
    // Sillones
    crearSillon:     (d: Omit<import('../types').SillonHD, 'id'>) =>
      doAction(() => svc.crearSillon(d)),
    actualizarSillon:(id: string, d: Partial<import('../types').SillonHD>) =>
      doAction(() => svc.actualizarSillon(id, d)),
    eliminarSillon:  (id: string) =>
      doAction(() => svc.eliminarSillon(id)),
    // Esquemas
    crearEsquema:    (d: Omit<import('../types').EsquemaConfig, 'id'>) =>
      doAction(() => svc.crearEsquema(d)),
    actualizarEsquema:(id: string, d: Partial<import('../types').EsquemaConfig>) =>
      doAction(() => svc.actualizarEsquema(id, d)),
    eliminarEsquema: (id: string) =>
      doAction(() => svc.eliminarEsquema(id)),
    // Jornadas
    crearJornada:    (d: Omit<import('../types').JornadaConfig, 'id'>) =>
      doAction(() => svc.crearJornada(d)),
    actualizarJornada:(id: string, d: Partial<import('../types').JornadaConfig>) =>
      doAction(() => svc.actualizarJornada(id, d)),
    eliminarJornada: (id: string) =>
      doAction(() => svc.eliminarJornada(id)),
  };
}
