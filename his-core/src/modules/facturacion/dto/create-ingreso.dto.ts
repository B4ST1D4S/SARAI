import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateIngresoDto {
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsUUID()
  medicoId?: string;

  @IsOptional()
  @IsString()
  tipoIngreso?: string;

  @IsOptional()
  @IsString()
  entidad?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
