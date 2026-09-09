import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class JornadaAgendaDto {
  @IsNotEmpty({ message: 'La hora de inicio de la jornada es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  horaInicio: string;

  @IsNotEmpty({ message: 'La hora de fin de la jornada es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  horaFin: string;
}

export class CreateAgendaMasivaDto {
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
  @IsUUID('all', { message: 'El ID del tipo de consulta debe ser un UUID válido' })
  tipoConsultaId?: string;

  @IsNotEmpty({ message: 'La fecha inicial es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaDesde debe tener formato YYYY-MM-DD',
  })
  fechaDesde: string;

  @IsNotEmpty({ message: 'La fecha final es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaHasta debe tener formato YYYY-MM-DD',
  })
  fechaHasta: string;

  @IsArray({ message: 'diasSemana debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe indicar al menos un día de la semana' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Cada día de la semana debe ser un entero' })
  @Min(1, { each: true, message: 'Los días de semana deben estar entre 1 y 7' })
  @Max(7, { each: true, message: 'Los días de semana deben estar entre 1 y 7' })
  diasSemana: number[];

  @IsOptional()
  @IsBoolean({ message: 'excluirFestivos debe ser booleano' })
  excluirFestivos?: boolean = false;

  @IsOptional()
  @IsArray({ message: 'fechasExcluidas debe ser un arreglo' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    each: true,
    message: 'Cada fecha excluida debe tener formato YYYY-MM-DD',
  })
  fechasExcluidas?: string[] = [];

  @IsArray({ message: 'jornadas debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe indicar al menos una jornada' })
  @ValidateNested({ each: true })
  @Type(() => JornadaAgendaDto)
  jornadas: JornadaAgendaDto[];

  @Type(() => Number)
  @IsInt({ message: 'El intervalo debe ser un número entero' })
  @Min(5, { message: 'El intervalo mínimo es de 5 minutos' })
  intervaloMinutos: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'sobrecuposMax debe ser un entero' })
  @Min(0, { message: 'sobrecuposMax no puede ser negativo' })
  sobrecuposMax?: number = 0;

  @IsOptional()
  @IsString({ message: 'La modalidad debe ser una cadena de texto' })
  @IsIn(['PRESENCIAL', 'TELEMEDICINA', 'HIBRIDA'], {
    message: 'La modalidad debe ser PRESENCIAL, TELEMEDICINA o HIBRIDA',
  })
  modalidad?: 'PRESENCIAL' | 'TELEMEDICINA' | 'HIBRIDA' = 'PRESENCIAL';
}
