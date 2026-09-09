import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDepartamentoDto {
  @IsNotEmpty({ message: 'El ID de la sede es obligatorio' })
  @IsUUID('all', { message: 'El ID de la sede debe ser un UUID válido' })
  sedeId: string;

  @IsNotEmpty({ message: 'El código del departamento/centro de costo es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MaxLength(30, { message: 'El código no puede exceder los 30 caracteres' })
  codigo: string;

  @IsNotEmpty({ message: 'El nombre del departamento/centro de costo es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder los 150 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El tipo no puede exceder los 50 caracteres' })
  tipo?: string = 'ASISTENCIAL';

  @IsOptional()
  @IsString({ message: 'El piso/bloque debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El piso/bloque no puede exceder los 50 caracteres' })
  pisoBloque?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  activo?: boolean = true;
}
