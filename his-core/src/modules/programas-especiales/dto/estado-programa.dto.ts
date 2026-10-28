import { IsBoolean } from 'class-validator';

export class EstadoProgramaDto {
  @IsBoolean()
  activo: boolean;
}
