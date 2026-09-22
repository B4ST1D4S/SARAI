import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePacienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombreCompleto?: string;

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

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  genero?: string;

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

  @IsOptional()
  @IsString()
  ocupacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  entidadSalud?: string;
}
