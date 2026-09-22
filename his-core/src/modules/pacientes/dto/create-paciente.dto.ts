import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePacienteDto {
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  @MaxLength(10)
  tipoDocumento: string;

  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @IsString({ message: 'El número de documento debe ser una cadena de texto' })
  @MaxLength(30)
  numeroDocumento: string;

  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @MaxLength(255)
  nombreCompleto: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primerNombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoNombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primerApellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoApellido?: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fechaNacimiento: string;

  @IsNotEmpty({ message: 'El género es obligatorio' })
  @IsString()
  @MaxLength(30)
  genero: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  etnia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nivelEducacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  discapacidad?: string;

  @IsOptional()
  @IsArray({ message: 'Los teléfonos deben enviarse como una lista' })
  @IsString({ each: true, message: 'Cada teléfono debe ser una cadena de texto' })
  telefonos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoFijo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  barrio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // Aceptado por compatibilidad con el formulario del frontend; el esquema
  // actual de "pacientes" no tiene columna propia para esto todavía.
  @IsOptional()
  @IsString()
  ocupacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  entidadSalud?: string;
}
