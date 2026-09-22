import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const ESTADOS_CITA = [
  'PENDIENTE',
  'CONFIRMADA',
  'EN_SALA',
  'COMPLETADA',
  'CANCELADA',
] as const;

export class UpdateEstadoCitaDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsIn(ESTADOS_CITA, { message: `estado debe ser uno de: ${ESTADOS_CITA.join(', ')}` })
  estado: (typeof ESTADOS_CITA)[number];

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;
}
