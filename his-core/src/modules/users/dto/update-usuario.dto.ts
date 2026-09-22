import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class UpdateUsuarioDto {
  // El username no se puede reasignar desde este formulario, pero el frontend
  // lo reenvía sin cambios en cada edición: se declara para que el
  // ValidationPipe (forbidNonWhitelisted) no lo rechace, y simplemente se ignora.
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  apellido?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  rol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  especialidad?: string;

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
  @MaxLength(50)
  registroProfesional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registroMedico?: string;

  @IsOptional()
  @IsString()
  firmaBase64?: string;

  @IsOptional()
  @IsUUID()
  perfilId?: string;
}
