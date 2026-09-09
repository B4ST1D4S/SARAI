import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTurnoDto {
  @IsNotEmpty({ message: 'El ID de la sede es obligatorio' })
  @IsUUID('all', { message: 'El ID de la sede debe ser un UUID válido' })
  sedeId: string;

  @IsNotEmpty({ message: 'El ID del departamento es obligatorio' })
  @IsUUID('all', { message: 'El ID del departamento debe ser un UUID válido' })
  departamentoId: string;

  @IsNotEmpty({ message: 'El ID del consultorio es obligatorio' })
  @IsUUID('all', { message: 'El ID del consultorio debe ser un UUID válido' })
  consultorioId: string;

  @IsNotEmpty({ message: 'El ID del profesional es obligatorio' })
  @IsUUID('all', { message: 'El ID del profesional debe ser un UUID válido' })
  profesionalId: string;

  @IsNotEmpty({ message: 'El ID de la especialidad es obligatorio' })
  @IsUUID('all', { message: 'El ID de la especialidad debe ser un UUID válido' })
  especialidadId: string;

  @IsOptional()
  @IsUUID('all', { message: 'El ID de la plantilla debe ser un UUID válido' })
  plantillaId?: string;

  @IsNotEmpty({ message: 'La fecha del turno es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD (ej: 2026-09-10)',
  })
  fecha: string;

  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de inicio debe tener formato HH:mm o HH:mm:ss (ej: 08:00)',
  })
  horaInicio: string;

  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de fin debe tener formato HH:mm o HH:mm:ss (ej: 12:00)',
  })
  horaFin: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El intervalo en minutos debe ser un número entero' })
  @Min(5, { message: 'El intervalo mínimo es de 5 minutos' })
  intervaloMinutos?: number = 15;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad de sobrecupos máximos debe ser un número entero' })
  @Min(0, { message: 'Los sobrecupos no pueden ser negativos' })
  sobrecuposMax?: number = 0;

  @IsOptional()
  @IsString({ message: 'La modalidad debe ser una cadena de texto' })
  modalidad?: string = 'PRESENCIAL';
}
