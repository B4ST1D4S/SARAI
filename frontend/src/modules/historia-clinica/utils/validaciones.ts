import type { AlergiasData, IncapacidadMedicaData, PlanManejoData } from '@/types/historiaClinica.types';

/**
 * Reglas clínicas de los submódulos de historia clínica. Viven fuera de los
 * componentes para que el Workbench las importe sin romper la carga diferida
 * de cada submódulo: el formulario y la validación de cierre comparten la
 * misma regla.
 */

/** Regla de un campo de texto clínico: longitud mínima tras recortar espacios. */
export interface ReglaTexto {
  minimo: number;
  mensaje: string;
}

type ValoresTexto<K extends string> = Partial<Record<K, string | null>>;

export const REGLAS_MOTIVO_CONSULTA: Record<'motivo' | 'enfermedadActual', ReglaTexto> = {
  motivo: { minimo: 5, mensaje: 'El motivo debe ser descriptivo (mínimo 5 caracteres)' },
  enfermedadActual: { minimo: 10, mensaje: 'Detalle la enfermedad actual (mínimo 10 caracteres)' },
};

export const REGLAS_EVOLUCION_NOTA: Record<'notaEvolucion', ReglaTexto> = {
  notaEvolucion: { minimo: 10, mensaje: 'La nota de evolución debe ser descriptiva (mínimo 10 caracteres)' },
};

/**
 * Error de un campo mientras se diligencia. Un campo vacío no es error aquí:
 * la obligatoriedad la exige la validación de cierre.
 */
export function errorDeTexto(valor: string | null | undefined, regla: ReglaTexto): string | undefined {
  const recortado = (valor ?? '').trim();
  if (recortado === '') return undefined;
  return recortado.length < regla.minimo ? regla.mensaje : undefined;
}

/** Errores al cerrar la atención: un campo vacío o por debajo del mínimo no pasa. */
export function erroresDeCierre<K extends string>(
  data: ValoresTexto<K> | null | undefined,
  reglas: Record<K, ReglaTexto>,
): string[] {
  return (Object.keys(reglas) as K[])
    .filter((campo) => (data?.[campo] ?? '').trim().length < reglas[campo].minimo)
    .map((campo) => reglas[campo].mensaje);
}

// ---------------------------------------------------------------------------
// Signos vitales: rangos admitidos, IMC y semáforo de alertas clínicas.
// ---------------------------------------------------------------------------

/** Signos que se digitan (claves de draft.datos.signos_vitales). El IMC se deriva. */
export interface SignosVitalesMedidos {
  paSistolica?: number;
  paDiastolica?: number;
  fc?: number;
  fr?: number;
  temp?: number;
  spo2?: number;
  pesoKg?: number;
  tallaCm?: number;
}

export type CampoSigno = keyof SignosVitalesMedidos;

export interface RangoSigno {
  etiqueta: string;
  min: number;
  max: number;
  unidad: string;
  entero: boolean;
}

/** Rango fisiológicamente admisible de cada signo: fuera de él es un error de digitación. */
export const RANGOS_SIGNOS_VITALES: Record<CampoSigno, RangoSigno> = {
  paSistolica: { etiqueta: 'TA sistólica', min: 50, max: 300, unidad: 'mmHg', entero: true },
  paDiastolica: { etiqueta: 'TA diastólica', min: 30, max: 200, unidad: 'mmHg', entero: true },
  fc: { etiqueta: 'F. cardíaca', min: 30, max: 250, unidad: 'lpm', entero: true },
  fr: { etiqueta: 'F. respiratoria', min: 5, max: 60, unidad: 'rpm', entero: true },
  temp: { etiqueta: 'Temperatura', min: 30, max: 45, unidad: '°C', entero: false },
  spo2: { etiqueta: 'SpO2', min: 50, max: 100, unidad: '%', entero: true },
  pesoKg: { etiqueta: 'Peso', min: 0.5, max: 500, unidad: 'kg', entero: false },
  tallaCm: { etiqueta: 'Talla', min: 20, max: 250, unidad: 'cm', entero: false },
};

/** Error de rango de un signo; sin dato no hay error (la obligatoriedad la exige el cierre). */
export function errorRangoSigno(campo: CampoSigno, valor: number | null | undefined): string | undefined {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return undefined;
  const { etiqueta, min, max, unidad, entero } = RANGOS_SIGNOS_VITALES[campo];
  if (valor < min || valor > max) return `${etiqueta} fuera de rango (${min}–${max} ${unidad})`;
  if (entero && !Number.isInteger(valor)) return `${etiqueta} debe ser un número entero`;
  return undefined;
}

/** Errores de rango de todos los signos diligenciados, para la validación de cierre. */
export function erroresRangoSignos(data: SignosVitalesMedidos | null | undefined): string[] {
  return (Object.keys(RANGOS_SIGNOS_VITALES) as CampoSigno[])
    .map((campo) => errorRangoSigno(campo, data?.[campo]))
    .filter((e): e is string => Boolean(e));
}

/** IMC = peso (kg) / talla (m)², con un decimal; null si falta o es inválido alguno de los dos. */
export function calcularImc(pesoKg?: number | null, tallaCm?: number | null): number | null {
  if (!pesoKg || !tallaCm || pesoKg <= 0 || tallaCm <= 0) return null;
  const tallaM = tallaCm / 100;
  return Math.round((pesoKg / (tallaM * tallaM)) * 10) / 10;
}

export type NivelAlerta = 'ambar' | 'rojo';

export interface AlertaSigno {
  nivel: NivelAlerta;
  mensaje: string;
}

/** Clasificación nutricional OMS del IMC en adultos. */
export function clasificarImc(imc: number | null): AlertaSigno | { nivel: 'normal'; mensaje: string } | null {
  if (imc === null) return null;
  if (imc < 18.5) return { nivel: 'ambar', mensaje: 'Bajo peso' };
  if (imc < 25) return { nivel: 'normal', mensaje: 'Peso normal' };
  if (imc < 30) return { nivel: 'ambar', mensaje: 'Sobrepeso' };
  if (imc < 35) return { nivel: 'rojo', mensaje: 'Obesidad I' };
  return { nivel: 'rojo', mensaje: 'Obesidad II / Mórbida' };
}

/** TA: rojo ≥ 180/120 (crisis); ámbar ≥ 160/100 (HTA estadio II) o < 90/60 (hipotensión). */
export function evaluarTensionArterial(pas?: number, pad?: number): AlertaSigno | undefined {
  const sis = pas ?? null;
  const dia = pad ?? null;
  if ((sis !== null && sis >= 180) || (dia !== null && dia >= 120)) return { nivel: 'rojo', mensaje: 'Crisis HTA' };
  if ((sis !== null && sis >= 160) || (dia !== null && dia >= 100)) return { nivel: 'ambar', mensaje: 'HTA estadio II' };
  if ((sis !== null && sis < 90) || (dia !== null && dia < 60)) return { nivel: 'ambar', mensaje: 'Hipotensión' };
  return undefined;
}

/** FC: rojo < 40 o > 140; ámbar 40–49 o 121–140; normal 50–120. */
export function evaluarFrecuenciaCardiaca(fc?: number): AlertaSigno | undefined {
  if (fc === undefined) return undefined;
  if (fc < 40) return { nivel: 'rojo', mensaje: 'Bradicardia extrema' };
  if (fc < 50) return { nivel: 'ambar', mensaje: 'Bradicardia moderada' };
  if (fc > 140) return { nivel: 'rojo', mensaje: 'Taquicardia severa' };
  if (fc > 120) return { nivel: 'ambar', mensaje: 'Taquicardia moderada' };
  return undefined;
}

/** SpO2: rojo < 90 (hipoxemia). */
export function evaluarSaturacion(spo2?: number): AlertaSigno | undefined {
  return spo2 !== undefined && spo2 < 90 ? { nivel: 'rojo', mensaje: 'Hipoxemia' } : undefined;
}

/** Temperatura: ámbar ≥ 38.5 (fiebre) o < 35 (hipotermia). */
export function evaluarTemperatura(temp?: number): AlertaSigno | undefined {
  if (temp === undefined) return undefined;
  if (temp >= 38.5) return { nivel: 'ambar', mensaje: 'Fiebre' };
  if (temp < 35) return { nivel: 'ambar', mensaje: 'Hipotermia' };
  return undefined;
}

export interface AlertasSignos {
  tension?: AlertaSigno;
  frecuenciaCardiaca?: AlertaSigno;
  saturacion?: AlertaSigno;
  temperatura?: AlertaSigno;
}

/** Semáforo de signos vitales: solo informativo, no bloquea el guardado ni el cierre. */
export function evaluarSignosVitales(data: SignosVitalesMedidos): AlertasSignos {
  const alertas: AlertasSignos = {
    tension: evaluarTensionArterial(data.paSistolica, data.paDiastolica),
    frecuenciaCardiaca: evaluarFrecuenciaCardiaca(data.fc),
    saturacion: evaluarSaturacion(data.spo2),
    temperatura: evaluarTemperatura(data.temp),
  };
  return Object.fromEntries(Object.entries(alertas).filter(([, a]) => a)) as AlertasSignos;
}

// ---------------------------------------------------------------------------
// Plan de manejo e incapacidad médica
// ---------------------------------------------------------------------------

export const CONDUCTA_MIN_CARACTERES = 5;
/** Tope de días por certificado (CHECK de hc_incapacidades). */
export const DIAS_INCAPACIDAD_MAX = 180;

/** Código CIE-10 con o sin punto: J06, J069, J06.9. */
const CIE10 = /^[A-Z]\d{2}(\.?[0-9A-Z]{1,2})?$/;

/** Fecha `YYYY-MM-DD` que existe en el calendario. */
export function esFechaIsoValida(valor: string | undefined): boolean {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

/** Hoy en la zona del navegador (toISOString daría el día UTC, que en Colombia cambia a las 7 p. m.). */
export function hoyLocal(ahora: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
}

/** Último día de la incapacidad (inicio + días - 1), o undefined si faltan datos. Igual que fecha_fin en la BD. */
export function fechaFinIncapacidad(fechaInicio?: string, dias?: number): string | undefined {
  if (!esFechaIsoValida(fechaInicio) || dias === undefined || !Number.isInteger(dias) || dias < 1) return undefined;
  const fin = new Date(`${fechaInicio}T00:00:00Z`);
  fin.setUTCDate(fin.getUTCDate() + dias - 1);
  return fin.toISOString().slice(0, 10);
}

export type CampoIncapacidad = keyof IncapacidadMedicaData;

/** Problemas del certificado; solo se exige el detalle si se otorga incapacidad. */
export function erroresIncapacidad(
  inc: IncapacidadMedicaData | undefined,
  hoy: string = hoyLocal(),
): Partial<Record<CampoIncapacidad, string>> {
  if (!inc?.requiere) return {};
  const e: Partial<Record<CampoIncapacidad, string>> = {};
  if (!inc.tipoIncapacidad) e.tipoIncapacidad = 'Seleccione el tipo de incapacidad.';
  if (!inc.modalidadServicio) e.modalidadServicio = 'Seleccione la modalidad del servicio.';
  const { dias } = inc;
  if (dias === undefined || !Number.isInteger(dias) || dias < 1 || dias > DIAS_INCAPACIDAD_MAX) {
    e.dias = `Indique los días (entero entre 1 y ${DIAS_INCAPACIDAD_MAX}).`;
  }
  if (inc.esProrroga === undefined) e.esProrroga = 'Indique si es prórroga.';
  if (!CIE10.test(inc.codigoCie10?.trim() ?? '')) e.codigoCie10 = 'Indique un código CIE-10 válido (ej. J06.9).';
  if (!inc.observaciones?.trim()) e.observaciones = 'Escriba la observación de la incapacidad.';
  if (!inc.fechaInicio || !esFechaIsoValida(inc.fechaInicio)) {
    e.fechaInicio = 'Indique una fecha de inicio válida.';
  } else if (inc.esRetroactiva === undefined) {
    e.esRetroactiva = 'Indique si es retroactiva.';
  } else if (inc.esRetroactiva !== inc.fechaInicio < hoy) {
    e.esRetroactiva = inc.esRetroactiva
      ? 'Una incapacidad retroactiva debe iniciar antes de hoy.'
      : 'La fecha de inicio es anterior a hoy: márquela como retroactiva.';
  }
  return e;
}

/** Errores al cerrar la atención: conducta obligatoria y certificado completo si se otorga. */
export function erroresCierrePlanManejo(data: PlanManejoData | null | undefined, hoy?: string): string[] {
  const errores: string[] = [];
  if ((data?.conducta ?? '').trim().length < CONDUCTA_MIN_CARACTERES) {
    errores.push(`Describa la conducta médica (mínimo ${CONDUCTA_MIN_CARACTERES} caracteres).`);
  }
  return [...errores, ...Object.values(erroresIncapacidad(data?.incapacidad ?? undefined, hoy)).filter((m): m is string => Boolean(m))];
}

// ---------------------------------------------------------------------------
// Alergias
// ---------------------------------------------------------------------------

/**
 * Al cerrar, el médico debe declarar el estado alérgico: «Sin alergias
 * conocidas» o al menos una alergia diligenciada (una fila en blanco no cuenta).
 */
export function erroresCierreAlergias(data: AlergiasData | null | undefined): string[] {
  if (data?.sinAlergiasConocidas) return [];
  const diligenciadas = (data?.alergias ?? []).filter((a) => a.sustancia.trim() !== '' || a.manifestacion.trim() !== '');
  return diligenciadas.length > 0
    ? []
    : ['Registre las alergias del paciente o marque «Sin alergias conocidas».'];
}
