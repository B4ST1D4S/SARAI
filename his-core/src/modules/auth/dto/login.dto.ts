import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El usuario o correo electrónico es obligatorio' })
  @IsString({ message: 'El identificador debe ser una cadena de texto' })
  @MinLength(3, { message: 'El identificador debe contener mínimo 3 caracteres' })
  @MaxLength(150, { message: 'El identificador no debe superar 150 caracteres' })
  identifier!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe contener mínimo 6 caracteres' })
  password!: string;

  @IsNotEmpty({ message: 'El subdominio de la clínica es obligatorio' })
  @IsString({ message: 'El subdominio debe ser una cadena de texto' })
  subdomain!: string;
}