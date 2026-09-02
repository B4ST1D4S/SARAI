import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class Coordenada3DDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  z: number;
}

export class PuntoMapaCorporalDto {
  @IsString()
  @IsNotEmpty()
  zonaAnatomica: string; // ej: "Glabela", "Surco nasogeniano derecho", "Pómulo izquierdo"

  @ValidateNested()
  @Type(() => Coordenada3DDto)
  coordenadas: Coordenada3DDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  nivelDolor?: number; // Escala EVA (0-10) en punto específico

  @IsOptional()
  @IsString()
  observacionClinica?: string;
}

export class InsumoAplicadoDto {
  @IsString()
  @IsNotEmpty()
  nombreComercial: string; // ej: "Botox Allergan", "Juvederm Voluma", "Restylane"

  @IsString()
  @IsNotEmpty()
  numeroLote: string; // Trazabilidad sanitaria / farmacovigilancia legal obligatoria

  @IsDateString()
  fechaVencimiento: string;

  @IsNumber()
  @Min(0.01)
  cantidadAplicada: number; // ej: 50.0 (Unidades) o 1.5 (ml)

  @IsString()
  @IsNotEmpty()
  unidadMedida: string; // "UI", "ml", "viales", "ampollas"

  @IsString()
  @IsNotEmpty()
  zonaAplicacion: string; // ej: "Tercio superior", "Labio superior"
}

export class FotosAdjuntosDto {
  @IsArray()
  @IsString({ each: true })
  antes: string[]; // Rutas/Llaves relativas S3 (ej: "tenants/t1/patients/p1/foto_a1.webp")

  @IsArray()
  @IsString({ each: true })
  despues: string[];
}

export class EsteticaDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PuntoMapaCorporalDto)
  puntosTratados: PuntoMapaCorporalDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsumoAplicadoDto)
  insumos: InsumoAplicadoDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FotosAdjuntosDto)
  fotos?: FotosAdjuntosDto;

  @IsOptional()
  @IsString()
  procedimientoRealizado?: string; // ej: "Toxina Botulínica Tipo A", "Ácido Hialurónico"

  @IsOptional()
  @IsString()
  recomendacionesPostProcedimiento?: string;
}

// Alias para compatibilidad de nomenclatura en esquemas JSONB
export class RegistroEsteticaJsonDto extends EsteticaDataDto {}