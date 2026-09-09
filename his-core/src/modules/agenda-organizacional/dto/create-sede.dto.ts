import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSedeDto {
  @IsNotEmpty({ message: 'El código de la sede es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El código no puede exceder los 20 caracteres' })
  codigo: string;

  @IsNotEmpty({ message: 'El nombre de la sede es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder los 150 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El código REPS debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El código REPS no puede exceder los 20 caracteres' })
  codigoReps?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La dirección no puede exceder los 255 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono no puede exceder los 50 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede exceder los 100 caracteres' })
  ciudad?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  activo?: boolean = true;
}
