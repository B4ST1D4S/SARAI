/**
 * Espejo en el frontend del contrato de his-core
 * (his-core/src/modules/clinical-record/dto/odontograma-data.dto.ts).
 * Objetos `as const` en lugar de `enum`: el tsconfig del frontend usa erasableSyntaxOnly.
 */

export const SuperficieDental = {
  MESIAL: 'MESIAL',
  DISTAL: 'DISTAL',
  OCLUSAL: 'OCLUSAL',
  INCISAL: 'INCISAL',
  VESTIBULAR: 'VESTIBULAR',
  LINGUAL: 'LINGUAL',
  PALATINO: 'PALATINO',
  /** Aplica a toda la pieza (ej. ausente, corona total). */
  GENERAL: 'GENERAL',
} as const;
export type SuperficieDental = (typeof SuperficieDental)[keyof typeof SuperficieDental];

export const EstadoPiezaDental = {
  SANO: 'SANO',
  CARIES: 'CARIES',
  OBTURADO_RESINA: 'OBTURADO_RESINA',
  OBTURADO_AMALGAMA: 'OBTURADO_AMALGAMA',
  CORONA: 'CORONA',
  ENDODONCIA: 'ENDODONCIA',
  PROTESIS_FIJA: 'PROTESIS_FIJA',
  AUSENTE_PERDIDO: 'AUSENTE_PERDIDO',
  EXODONCIA_INDICADA: 'EXODONCIA_INDICADA',
  IMPLANTE: 'IMPLANTE',
  FRACTURA: 'FRACTURA',
  SELLANTE: 'SELLANTE',
} as const;
export type EstadoPiezaDental = (typeof EstadoPiezaDental)[keyof typeof EstadoPiezaDental];

export interface HallazgoSuperficieDto {
  superficie: SuperficieDental;
  estado: EstadoPiezaDental;
  detalle?: string;
}

export interface PiezaDentalDto {
  /** Notación FDI: 11-48 permanentes, 51-85 temporales. */
  numeroPieza: number;
  estadoGeneral: EstadoPiezaDental;
  superficies: HallazgoSuperficieDto[];
  observacion?: string;
}

export interface OdontogramaDataDto {
  piezas: PiezaDentalDto[];
  indicePlacaCalculado?: number;
  observaciones?: string;
  fechaActualizacion?: string;
}
