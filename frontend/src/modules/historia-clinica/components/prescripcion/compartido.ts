/**
 * Lo que comparten la prescripción ambulatoria y la intrahospitalaria: ambas se
 * formulan contra el MOLDE genérico (Diccionario §1.5 regla 2; el servidor
 * rechaza articuloId en los dos ámbitos). La presentación comercial la elige
 * Farmacia al despachar. Ningún formulario importa del otro: solo de aquí.
 */
import { apiClient } from '../../../../core/api/client';
import type { DiagnosticoCatalogoCie } from '../../services/diagnostico-cie';
import type { ViaAdministracion } from './types';

export type ModoCalculoCantidad = 'DISCRETA' | 'LIQUIDA' | 'CRITERIO_MEDICO';

/** Molde genérico (MDC) de GET /farmacia/moldes/prescripcion. */
export interface MoldePrescribible {
  /** catalogo_clinico_id. */
  id: string;
  iumNivel1: string | null;
  /** Descripción genérica del molde. */
  nombre: string;
  principioActivo: string;
  /** Ya formateada: "500 mg", "150 mg/5 ML". */
  concentracion: string;
  formaFarmaceuticaCodigo: string;
  formaFarmaceutica: string;
  modoCalculoCantidad: ModoCalculoCantidad;
  formaDiscreta: boolean;
  formaLiquida: boolean;
  /** Unidad de la dosis en las formas líquidas clasificadas (mL). */
  unidadVolumen: string | null;
  viasPermitidas: ViaAdministracion[];
}

/**
 * Diagnóstico de GET /catalogos/diagnosticos (mismo catálogo que la impresión
 * diagnóstica). La prescripción solo guarda el CIE-10: no usa las equivalencias.
 */
export type DiagnosticoCie = DiagnosticoCatalogoCie;

export type SeveridadCdss = 'ALTA' | 'MEDIA' | 'BAJA';

/** Advertencia del CDSS del servidor (alergia activa vs medicamento); no bloquea el guardado. */
export interface AlertaCdss {
  sustancia: string;
  medicamento: string;
  severidad: SeveridadCdss;
  mensaje: string;
}

/** Respuesta del PUT /prescripciones: las guardadas y las advertencias del CDSS (no bloquean). */
export interface RespuestaGuardado {
  alertasCdss?: AlertaCdss[];
}

export const ESTILO_ALERTA: Record<SeveridadCdss, string> = {
  ALTA: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  MEDIA: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  BAJA: 'border-amber-200 bg-amber-50/60 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400',
};

export function mensajeError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const respuesta = (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (Array.isArray(respuesta)) return respuesta.join(' · ');
    if (typeof respuesta === 'string') return respuesta;
    const propio = (err as { message?: unknown }).message;
    if (typeof propio === 'string') return propio;
  }
  return 'No se pudo guardar la prescripción.';
}

export const buscarMoldes = async (texto: string) =>
  (await apiClient.get<MoldePrescribible[]>('/farmacia/moldes/prescripcion', { params: { buscar: texto } })).data;
export const buscarDiagnosticos = async (texto: string) =>
  (await apiClient.get<DiagnosticoCie[]>('/catalogos/diagnosticos', { params: { q: texto } })).data;

/** Texto del diagnóstico elegido: "R509 — Fiebre, no especificada". */
export const textoDiagnostico = (cie?: string, descripcion?: string | null) =>
  cie ? `${cie}${descripcion ? ` — ${descripcion}` : ''}` : '';

const positivo = (v: number | '' | undefined) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Modo de cálculo (las prescripciones guardadas antes de traerlo se deducen de formaDiscreta). */
export function modoDeFila(f: { modoCalculoCantidad?: ModoCalculoCantidad; formaDiscreta?: boolean }): ModoCalculoCantidad {
  return f.modoCalculoCantidad ?? (f.formaDiscreta ? 'DISCRETA' : 'CRITERIO_MEDICO');
}

/**
 * Tomas (administraciones) del tratamiento:
 *   ⌈ días × 24 / intervalo ⌉  (cada N horas)  ·  ⌈ días / intervalo ⌉  (cada N días)
 * Igual que tomasTratamiento del servidor (his-core: cantidad-dispensar.ts).
 */
export function tomasTratamiento(
  frecuenciaIntervalo: number | '' | undefined,
  frecuenciaUnidad: 'HORAS' | 'DIAS' | string,
  dias: number | '' | undefined,
): number | '' {
  if (!positivo(frecuenciaIntervalo) || !positivo(dias)) return '';
  if (frecuenciaUnidad !== 'HORAS' && frecuenciaUnidad !== 'DIAS') return '';
  const d = dias as number;
  const i = frecuenciaIntervalo as number;
  return Math.ceil(frecuenciaUnidad === 'HORAS' ? (d * 24) / i : d / i);
}

/**
 * Cantidad a dispensar de una forma farmacéutica DISCRETA (tableta, cápsula,
 * óvulo, supositorio, parche...): la dosis va en unidades de la forma, así que
 *   cantidad = ⌈ tomas × dosis ⌉
 * Es la misma función del servidor (cantidadDispensarDiscreta), que la
 * recalcula y rechaza otro valor: es el tope de dispensación de Farmacia.
 *
 * ⚠ FORMAS NO DISCRETAS: no se usa. Al prescribir por molde no se conoce el
 * envase: en una líquida clasificada se calcula el VOLUMEN (volumenTratamiento).
 */
export function calcularCantidadDispensar(
  dosis: number | '' | undefined,
  frecuenciaIntervalo: number | '' | undefined,
  frecuenciaUnidad: 'HORAS' | 'DIAS' | string,
  dias: number | '' | undefined,
): number | '' {
  const tomas = tomasTratamiento(frecuenciaIntervalo, frecuenciaUnidad, dias);
  if (!positivo(dosis) || tomas === '') return '';
  // toFixed: 0.1 × 30 en coma flotante es 3.0000000000000004 y no debe subir a 4.
  return Math.ceil(Number((tomas * (dosis as number)).toFixed(6)));
}

/**
 * Volumen total del tratamiento de una líquida clasificada (la dosis va en mL):
 * tomas × dosis, sin redondear a envases. Igual que volumenTotalPrescrito del servidor.
 */
export function volumenTratamiento(
  dosis: number | '' | undefined,
  frecuenciaIntervalo: number | '' | undefined,
  frecuenciaUnidad: 'HORAS' | 'DIAS' | string,
  dias: number | '' | undefined,
): number | '' {
  const tomas = tomasTratamiento(frecuenciaIntervalo, frecuenciaUnidad, dias);
  if (!positivo(dosis) || tomas === '') return '';
  return Number((tomas * (dosis as number)).toFixed(6));
}
