import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  apellido: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @IsNotEmpty()
  rol: string;

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
