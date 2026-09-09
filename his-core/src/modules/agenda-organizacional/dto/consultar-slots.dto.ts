import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class ConsultarSlotsDto {
  @IsOptional()
  @IsUUID('all', { message: 'sedeId debe ser un UUID válido' })
  sedeId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'profesionalId debe ser un UUID válido' })
  profesionalId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'especialidadId debe ser un UUID válido' })
  especialidadId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'consultorioId debe ser un UUID válido' })
  consultorioId?: string;

  @IsNotEmpty({ message: 'fechaInicio es obligatoria para la consulta de slots' })
  @Matches(/^\d{4}-\d{2}-\d{2}(T.*)?$/, {
    message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD o formato ISO)',
  })
  fechaInicio: string;

  @IsNotEmpty({ message: 'fechaFin es obligatoria para la consulta de slots' })
  @Matches(/^\d{4}-\d{2}-\d{2}(T.*)?$/, {
    message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD o formato ISO)',
  })
  fechaFin: string;
}
