import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateTipoConsultaDto {
  @IsOptional()
  @IsUUID('4')
  especialidadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  requiereCaja?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteAgendamiento?: boolean;

  @IsOptional()
  @IsBoolean()
  abreHistoriaClinica?: boolean;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
