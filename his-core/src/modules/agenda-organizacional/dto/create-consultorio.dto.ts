import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateConsultorioDto {
  @IsNotEmpty({ message: 'El ID del departamento es obligatorio' })
  @IsUUID('all', { message: 'El ID del departamento debe ser un UUID válido' })
  departamentoId: string;

  @IsNotEmpty({ message: 'El código del consultorio/recurso es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MaxLength(30, { message: 'El código no puede exceder los 30 caracteres' })
  codigo: string;

  @IsNotEmpty({ message: 'El nombre del consultorio/recurso es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El tipo no puede exceder los 50 caracteres' })
  tipo?: string = 'CONSULTORIO';

  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  activo?: boolean = true;
}
