import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID()
  usuarioIdHis?: string;

  @IsString()
  @IsNotEmpty()
  tipoEvento: string; // ej: 'LOGIN', 'CREAR_FOLIO', 'CONSULTA_DATOS_SENSIBLES', 'ELIMINACION_REGISTRO'

  @IsString()
  @IsNotEmpty()
  modulo: string; // ej: 'HISTORIA_CLINICA', 'SEGURIDAD', 'ODONTOLOGIA', 'ESTETICA'

  @IsOptional()
  @IsString()
  recursoAfectado?: string; // ej: 'hc_folios', 'pacientes', 'hc_signos_vitales'

  @IsOptional()
  @IsString()
  recursoId?: string;

  @IsOptional()
  logData?: Record<string, any>; // Metadatos de auditoría forense en JSONB

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
