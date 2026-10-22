/**
 * Tipos e interfaces para el módulo de prescripción médica (ambulatoria e intrahospitalaria).
 */

import type { SubmoduloProps } from '../../types/submodulo';
import type { ModoCalculoCantidad } from './compartido';

/**
 * Medicamento proveniente del catálogo maestro / farmacia institucional.
 */
export interface BaseMedicamentoCatalogo {
  id: string;
  cum: string;
  principioActivo: string;
  concentracion: string;
  formaFarmaceutica: string;
  nombreComercial?: string;
  codigoInterno?: string;
}

/**
 * Vía de administración de medicamentos según catálogo normativo.
 */
export interface ViaAdministracion {
  codigo: string;
  nombre: string;
}

/**
 * Fila / ítem de prescripción médica ambulatoria (dispensación por farmacia).
 */
export interface ItemPrescripcionAmb extends BaseMedicamentoCatalogo {
  diasTratamiento: number;
  cantidadDispensar: number;
  indicaciones: string;

  // Campos clínicos generales de dosificación
  dosisCantidad: number | '';
  dosisUnidad: string;
  viaAdministracionCodigo: string;
  viaAdministracionNombre?: string;
  frecuenciaIntervalo: number | '';
  frecuenciaUnidad: 'HORAS' | 'DIAS';
  diagnosticoAsociadoCie?: string;

  // Campos de compatibilidad con API existente y DTO de guardado
  articuloId?: string;
  duracionTratamientoDias?: number | '';
  cantidadTotalDispensar?: number | '';
  indicacionesPaciente?: string;
  ambitoAtencion?: 'AMBULATORIO';
}

/** Frecuencia de la orden: las del servidor y las propias del ámbito hospitalario. */
export type UnidadFrecuenciaHosp = 'HORAS' | 'DIAS' | 'DOSIS_UNICA' | 'CONTINUA';

/**
 * Orden de prescripción médica intrahospitalaria (administración interna).
 * Se prescribe por MOLDE genérico, igual que la ambulatoria: la presentación
 * comercial la elige Farmacia al despachar la solicitud de enfermería.
 */
export interface ItemPrescripcionHosp {
  /** Molde genérico prescrito (inv_catalogo_clinico.id). */
  catalogoClinicoId: string;
  nombreGenerico: string;
  principioActivo?: string;
  concentracion?: string;
  formaFarmaceuticaCodigo?: string;
  formaFarmaceutica?: string;
  modoCalculoCantidad?: ModoCalculoCantidad;
  /** Unidad de la dosis en una líquida clasificada (mL). */
  unidadVolumen?: string | null;
  viasPermitidas?: ViaAdministracion[];

  fechaInicio: string;
  fechaSuspension?: string;
  diluyente?: string;
  velocidadInfusion?: string;
  observacionesEnfermeria?: string;

  /** En unidades de la forma farmacéutica (1 tableta) o en mL en una líquida clasificada. */
  dosisCantidad: number | '';
  viaAdministracionCodigo: string;
  viaAdministracionNombre?: string;
  frecuenciaIntervalo: number | '';
  frecuenciaUnidad: UnidadFrecuenciaHosp;
  /**
   * Duración en días enteros. SIMPLIFICACIÓN TEMPORAL: el servidor no admite
   * horas, así que una orden de menos de 24 horas (o la dosis única) es 1 día.
   */
  duracionTratamientoDias: number | '';
  /**
   * Tope de unidades que indicó el médico; solo en formas NO discretas (en las
   * discretas manda el cálculo). Sin él, se usa el sugerido (cantidadHosp).
   */
  cantidadTotalDispensar?: number | '';
  diagnosticoAsociadoCie: string;
  diagnosticoAsociadoDescripcion?: string;

  estado: 'EN_TRATAMIENTO' | 'SUSPENDIDO';
  ambitoAtencion?: 'INTRAHOSPITALARIO';
}

/**
 * Propiedades del formulario intrahospitalario.
 * (Las del ambulatorio viven en PrescripcionAmbForm.tsx.)
 */
export interface PrescripcionHospFormProps extends SubmoduloProps<Partial<ItemPrescripcionHosp>[]> {
  onSave?: (items: ItemPrescripcionHosp[]) => void;
}
