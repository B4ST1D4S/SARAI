import { IsDateString, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearInscripcionDto {
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsString()
  codigoPrograma?: string;

  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;

  @IsOptional()
  @IsString()
  entidadRemitente?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsObject()
  historiaRenal?: Record<string, unknown>;
}
