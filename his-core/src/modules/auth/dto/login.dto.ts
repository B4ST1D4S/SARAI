import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El usuario o correo electrónico es obligatorio' })
  @IsString()
  identifier!: string; // Permite username (ej: cperez) o email (ej: cperez@clinicademo.com)

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  password!: string;

  // Si el frontend no usa subdominios DNS (ej: demo.sarai.app),
  // puede enviar el subdominio directo en el payload
  @IsNotEmpty({ message: 'El identificador de la clínica es obligatorio' })
  @IsString()
  subdomain!: string;
}