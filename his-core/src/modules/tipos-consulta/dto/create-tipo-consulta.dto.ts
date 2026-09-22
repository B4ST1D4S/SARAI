import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTipoConsultaDto {
  @IsNotEmpty({ message: 'La especialidad es obligatoria' })
  @IsUUID('4', { message: 'especialidadId debe ser un UUID válido' })
  especialidadId: string;

  @IsNotEmpty({ message: 'El código es obligatorio' })
  @IsString()
  @MaxLength(20)
  codigo: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MaxLength(150)
  nombre: string;

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
}
