import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearMaquinaDto {
  @IsString()
  codigo: string;

  @IsString()
  marca: string;

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
