import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum SuperficieDental {
  MESIAL = 'MESIAL',
  DISTAL = 'DISTAL',
  OCLUSAL = 'OCLUSAL',
  INCISAL = 'INCISAL',
  VESTIBULAR = 'VESTIBULAR',
  LINGUAL = 'LINGUAL',
  PALATINO = 'PALATINO',
  GENERAL = 'GENERAL', // Aplica a toda la pieza (ej. ausente, corona total)
}

export enum EstadoPiezaDental {
  SANO = 'SANO',
  CARIES = 'CARIES',
  OBTURADO_RESINA = 'OBTURADO_RESINA',
  OBTURADO_AMALGAMA = 'OBTURADO_AMALGAMA',
  CORONA = 'CORONA',
  ENDODONCIA = 'ENDODONCIA',
  PROTESIS_FIJA = 'PROTESIS_FIJA',
  AUSENTE_PERDIDO = 'AUSENTE_PERDIDO',
  EXODONCIA_INDICADA = 'EXODONCIA_INDICADA',
  IMPLANTE = 'IMPLANTE',
  FRACTURA = 'FRACTURA',
  SELLANTE = 'SELLANTE',
}

export class HallazgoSuperficieDto {
  @IsEnum(SuperficieDental)
  superficie: SuperficieDental;

  @IsEnum(EstadoPiezaDental)
  estado: EstadoPiezaDental;

  @IsOptional()
  @IsString()
  detalle?: string;
}

export class PiezaDentalDto {
  @IsInt()
  @Min(11)
  @Max(85) // Notación FDI internacional: 11-48 permanentes, 51-85 temporales
  numeroPieza: number;

  @IsEnum(EstadoPiezaDental)
  estadoGeneral: EstadoPiezaDental;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HallazgoSuperficieDto)
  superficies: HallazgoSuperficieDto[];

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class OdontogramaDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PiezaDentalDto)
  piezas: PiezaDentalDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  indicePlacaCalculado?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  fechaActualizacion?: string;
}