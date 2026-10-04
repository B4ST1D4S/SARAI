import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FacturarCuentaDto {
  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  omitirValidacionRips?: boolean;
}
