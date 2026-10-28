import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ActualizarMaquinaDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  serie?: string;

  @IsOptional()
  @IsString()
  sillon?: string;

  @IsOptional()
  @IsIn(['ACTIVO', 'MANTENIMIENTO', 'BAJA'])
  estado?: string;

  @IsOptional()
  @IsUUID()
  sedeId?: string;
}
