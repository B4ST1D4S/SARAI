// ============================================================
// Servicio: Parametrización HD (sillones, esquemas, jornadas)
// Almacenado en ConfiguracionPE.parametros JSON
// ============================================================
import prisma from '../../lib/prisma.js';

// ── Tipos de parametrización ──────────────────────────────────

export interface SillonHD {
  id: string;
  numero: string;        // "A1", "5", "B-3"
  descripcion?: string;
  estado: 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA';
  maquinaAsignada?: string;  // código de máquina asignada por defecto
}

export interface EsquemaConfig {
  id: string;
  codigo: string;        // "LMV", "MJS", "LDMJVS", custom
  nombre: string;        // "Lunes-Miércoles-Viernes"
  dias: number[];        // [1,3,5] — 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  activo: boolean;
}

export interface JornadaConfig {
  id: string;
  codigo: string;        // "MANANA", "TARDE", "NOCHE", "MADRUGADA", custom
  nombre: string;        // "Mañana"
  horaInicio: string;    // "06:00"
  horaFin: string;       // "12:00"
  activo: boolean;
  orden: number;         // para ordenar en UI
}

export interface ParametrizacionHD {
  sillones: SillonHD[];
  esquemas: EsquemaConfig[];
  jornadas: JornadaConfig[];
}

// ── Valores por defecto ───────────────────────────────────────

function parametrizacionDefault(): ParametrizacionHD {
  return {
    sillones: [
      { id: 's1', numero: '1',  estado: 'ACTIVO' },
      { id: 's2', numero: '2',  estado: 'ACTIVO' },
      { id: 's3', numero: '3',  estado: 'ACTIVO' },
      { id: 's4', numero: '4',  estado: 'ACTIVO' },
      { id: 's5', numero: '5',  estado: 'ACTIVO' },
      { id: 's6', numero: '6',  estado: 'ACTIVO' },
    ],
    esquemas: [
      { id: 'e1', codigo: 'LMV', nombre: 'Lunes – Miércoles – Viernes', dias: [1, 3, 5], activo: true },
      { id: 'e2', codigo: 'MJS', nombre: 'Martes – Jueves – Sábado',   dias: [2, 4, 6], activo: true },
    ],
    jornadas: [
      { id: 'j1', codigo: 'MADRUGADA', nombre: 'Madrugada', horaInicio: '00:00', horaFin: '06:00', activo: true, orden: 1 },
      { id: 'j2', codigo: 'MANANA',    nombre: 'Mañana',    horaInicio: '06:00', horaFin: '12:00', activo: true, orden: 2 },
      { id: 'j3', codigo: 'TARDE',     nombre: 'Tarde',     horaInicio: '12:00', horaFin: '18:00', activo: true, orden: 3 },
      { id: 'j4', codigo: 'NOCHE',     nombre: 'Noche',     horaInicio: '18:00', horaFin: '00:00', activo: true, orden: 4 },
    ],
  };
}

// ── Obtener configuración del programa RENAL ─────────────────

async function obtenerConfigRenal() {
  const programa = await prisma.programaEspecial.findUnique({
    where: { codigo: 'RENAL' },
    include: { configuracion: true },
  });
  if (!programa) throw new Error('Programa RENAL no encontrado');
  return { programa, config: programa.configuracion };
}

// ── GET Parametrización HD ────────────────────────────────────

export async function getParametrizacionHD(): Promise<ParametrizacionHD> {
  const { config } = await obtenerConfigRenal();

  if (!config) return parametrizacionDefault();

  const params = config.parametros as any;
  if (!params?.parametrizacionHD) return parametrizacionDefault();

  // Merge con defaults para asegurar que nunca falten campos
  const defaults = parametrizacionDefault();
  const stored = params.parametrizacionHD as ParametrizacionHD;

  return {
    sillones: stored.sillones?.length ? stored.sillones : defaults.sillones,
    esquemas: stored.esquemas?.length ? stored.esquemas : defaults.esquemas,
    jornadas: stored.jornadas?.length ? stored.jornadas : defaults.jornadas,
  };
}

// ── PUT Parametrización HD ────────────────────────────────────

export async function saveParametrizacionHD(
  data: ParametrizacionHD
): Promise<ParametrizacionHD> {
  const { programa, config } = await obtenerConfigRenal();

  if (config) {
    const currentParams = (config.parametros as any) ?? {};
    await prisma.configuracionPE.update({
      where: { programaId: programa.id },
      data: {
        parametros: {
          ...currentParams,
          parametrizacionHD: data,
        },
      },
    });
  } else {
    await prisma.configuracionPE.create({
      data: {
        programaId: programa.id,
        parametros: { parametrizacionHD: data },
      },
    });
  }

  return data;
}

// ── CRUD de Sillones ──────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function crearSillon(
  sillon: Omit<SillonHD, 'id'>
): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.sillones.push({ id: genId(), ...sillon });
  return saveParametrizacionHD(param);
}

export async function actualizarSillon(
  id: string,
  updates: Partial<SillonHD>
): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.sillones = param.sillones.map((s) =>
    s.id === id ? { ...s, ...updates } : s
  );
  return saveParametrizacionHD(param);
}

export async function eliminarSillon(id: string): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.sillones = param.sillones.filter((s) => s.id !== id);
  return saveParametrizacionHD(param);
}

// ── CRUD de Esquemas ──────────────────────────────────────────

export async function crearEsquema(
  esquema: Omit<EsquemaConfig, 'id'>
): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.esquemas.push({ id: genId(), ...esquema });
  return saveParametrizacionHD(param);
}

export async function actualizarEsquema(
  id: string,
  updates: Partial<EsquemaConfig>
): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.esquemas = param.esquemas.map((e) =>
    e.id === id ? { ...e, ...updates } : e
  );
  return saveParametrizacionHD(param);
}

export async function eliminarEsquema(id: string): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.esquemas = param.esquemas.filter((e) => e.id !== id);
  return saveParametrizacionHD(param);
}

// ── CRUD de Jornadas ──────────────────────────────────────────

export async function crearJornada(
  jornada: Omit<JornadaConfig, 'id'>
): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.jornadas.push({ id: genId(), ...jornada });
  return saveParametrizacionHD(param);
}

export async function actualizarJornada(
  id: string,
  updates: Partial<JornadaConfig>
): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.jornadas = param.jornadas.map((j) =>
    j.id === id ? { ...j, ...updates } : j
  );
  return saveParametrizacionHD(param);
}

export async function eliminarJornada(id: string): Promise<ParametrizacionHD> {
  const param = await getParametrizacionHD();
  param.jornadas = param.jornadas.filter((j) => j.id !== id);
  return saveParametrizacionHD(param);
}
