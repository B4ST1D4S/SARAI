import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type OrigenResolucion =
  | 'PROFESIONAL_OVERRIDE'
  | 'SEDE_OVERRIDE'
  | 'INSTITUCIONAL_DEFAULT';

export enum OrigenResolucionEnum {
  PROFESIONAL_OVERRIDE = 'PROFESIONAL_OVERRIDE',
  SEDE_OVERRIDE = 'SEDE_OVERRIDE',
  INSTITUCIONAL_DEFAULT = 'INSTITUCIONAL_DEFAULT',
}

export class MetadataAtencionDto {
  @IsUUID('4')
  @IsNotEmpty()
  citaId: string;

  @IsUUID('4')
  @IsNotEmpty()
  pacienteId: string;

  @IsUUID('4')
  @IsNotEmpty()
  profesionalId: string;

  @IsUUID('4')
  @IsNotEmpty()
  sedeId: string;

  @IsUUID('4')
  @IsNotEmpty()
  tipoConsultaId: string;
}

export class PlantillaResolucionResponseDto {
  @IsUUID('4')
  @IsNotEmpty()
  plantillaId: string;

  @IsString()
  @IsNotEmpty()
  codigoPlantilla: string;

  @IsString()
  @IsNotEmpty()
  nombrePlantilla: string;

  @IsEnum(OrigenResolucionEnum)
  @IsNotEmpty()
  origenResolucion: OrigenResolucion;

  @IsObject()
  @IsNotEmpty()
  estructura: Record<string, any>;

  @ValidateNested()
  @Type(() => MetadataAtencionDto)
  metadataAtencion: MetadataAtencionDto;
}
