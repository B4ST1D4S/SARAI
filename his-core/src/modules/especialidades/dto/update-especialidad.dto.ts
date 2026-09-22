import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEspecialidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  aplicaCirugia?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaAnestesia?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaPediatria?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaInstrumentacion?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaMedicoFamiliar?: boolean;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
