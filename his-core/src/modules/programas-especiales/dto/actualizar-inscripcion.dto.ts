import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

const ESTADOS_INSCRIPCION = ['ACTIVO', 'RETIRADO', 'TRASLADADO', 'FALLECIDO', 'ALTA'];

export class ActualizarInscripcionDto {
  @IsOptional()
  @IsIn(ESTADOS_INSCRIPCION)
  estado?: string;

  @IsOptional()
  @IsDateString()
  fechaEgreso?: string;

  @IsOptional()
  @IsString()
  motivoEgreso?: string;

  @IsOptional()
  @IsString()
  entidadRemitente?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
