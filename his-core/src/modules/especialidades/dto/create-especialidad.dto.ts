import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEspecialidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo?: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MaxLength(150)
  nombre: string;

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
}
