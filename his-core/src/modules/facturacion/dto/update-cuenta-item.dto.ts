import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCuentaItemDto {
  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  precioUnitario?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  tipoRips?: string;
}
