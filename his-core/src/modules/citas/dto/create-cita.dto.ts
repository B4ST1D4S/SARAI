import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateCitaDto {
  @IsNotEmpty({ message: 'El turno es obligatorio' })
  @IsUUID('4', { message: 'turnoId debe ser un UUID válido' })
  turnoId: string;

  @IsNotEmpty({ message: 'La hora de inicio del slot es obligatoria' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaInicio debe tener formato HH:mm' })
  horaInicio: string;

  @IsNotEmpty({ message: 'El paciente es obligatorio' })
  @IsUUID('4', { message: 'pacienteId debe ser un UUID válido' })
  pacienteId: string;

  @IsNotEmpty({ message: 'El tipo de consulta es obligatorio' })
  @IsUUID('4', { message: 'tipoConsultaId debe ser un UUID válido' })
  tipoConsultaId: string;

  @IsOptional()
  @IsString()
  motivoConsulta?: string;
}
