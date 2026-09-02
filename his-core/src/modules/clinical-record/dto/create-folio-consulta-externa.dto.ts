import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString, IsUUID, Max, Min, ValidateNested, } from 'class-validator'; import { OdontogramaDataDto } from './odontograma-data.dto'; import { EsteticaDataDto } from './estetica-data.dto'; import { RevisionSistemasDto } from './revision-sistemas.dto'; export enum EspecialidadClinica { MEDICINA_GENERAL = 'MEDICINA_GENERAL', ODONTOLOGIA = 'ODONTOLOGIA', MEDICINA_ESTETICA = 'MEDICINA_ESTETICA', DERMATOLOGIA = 'DERMATOLOGIA', PEDIATRIA = 'PEDIATRIA', GINECOLOGIA = 'GINECOLOGIA', OTRO = 'OTRO', } export enum TipoDiagnostico { PRESUNTIVO = 'PRESUNTIVO', CONFIRMADO_NUEVO = 'CONFIRMADO_NUEVO', CONFIRMADO_REPETIDO = 'CONFIRMADO_REPETIDO', } export class AntecedentesClinicosDto { @IsOptional() @IsString() patologicos?: string; @IsOptional() @IsString() quirurgicos?: string; @IsOptional() @IsString() alergicos?: string;
  @IsOptional()
  @IsString()
  farmacologicos?: string;

  @IsOptional()
  @IsString()
  familiares?: string;

  @IsOptional()
  @IsString()
  toxicos?: string;

  @IsOptional()
  @IsString()
  ginecoObstetricos?: string;

  @IsOptional()
  @IsString()
  otros?: string;
}

export class SignosVitalesDto {
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  frecuenciaCardiaca?: number; // latidos por minuto (lpm)

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(80)
  frecuenciaRespiratoria?: number; // respiraciones por minuto (rpm)

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(300)
  presionArterialSistolica?: number; // mmHg

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(200)
  presionArterialDiastolica?: number; // mmHg

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperatura?: number; // °C

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  saturacionOxigeno?: number; // %

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  pesoKg?: number; // kg

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(260)
  tallaCm?: number; // cm

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  indiceMasaCorporal?: number; // IMC = kg / m^2

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  glucometria?: number; // mg/dL

  @IsOptional()
  @IsString()
  estadoConciencia?: string; // Alerta, Somnoliento, Estuporoso, Comatoso

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class DiagnosticoItemDto {
  @IsString()
  @IsNotEmpty()
  codigoCIE10: string; // ej: "K02.1", "L70.0", "I10"

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsEnum(TipoDiagnostico)
  tipo: TipoDiagnostico;

  @IsBoolean()
  esPrincipal: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class AnamnesisDto {
  @IsString()
  @IsNotEmpty()
  motivoConsulta: string;

  @IsString()
  @IsNotEmpty()
  enfermedadActual: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AntecedentesClinicosDto)
  antecedentes?: AntecedentesClinicosDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RevisionSistemasDto)
  revisionSistemas?: RevisionSistemasDto;
}

export class CreateFolioConsultaExternaDto {
  // Identificación / Metadatos de Folio y Atención
  @IsUUID()
  atencionId: string;

  @IsUUID()
  pacienteId: string;

  @IsUUID()
  profesionalId: string;

  @IsDateString()
  fechaAtencion: string;

  @IsEnum(EspecialidadClinica)
  especialidad: EspecialidadClinica;

  @IsOptional()
  @IsString()
  numeroFolio?: string;

  @IsOptional()
  @IsString()
  tipoAtencion?: string; // "PRIMERA_VEZ", "CONTROL", "SEGUIMIENTO"

  @IsOptional()
  @IsString()
  tipoRegistro?: string; // "CONSULTA_EXTERNA", "URGENCIAS", "HOSPITALIZACION"

  @IsOptional()
  @IsString()
  registroMedicoRethus?: string;

  @IsOptional()
  @IsString()
  ipRegistro?: string;

  // Anamnesis clínica
  @ValidateNested()
  @Type(() => AnamnesisDto)
  anamnesis: AnamnesisDto;

  // Signos Vitales y Examen Físico
  @IsOptional()
  @ValidateNested()
  @Type(() => SignosVitalesDto)
  signosVitales?: SignosVitalesDto;

  @IsOptional()
  @IsString()
  examenFisicoGeneral?: string;

  // Diagnósticos (requiere al menos un diagnóstico)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DiagnosticoItemDto)
  diagnosticos: DiagnosticoItemDto[];

  // Conducta / Plan de manejo
  @IsString()
  @IsNotEmpty()
  planTratamiento: string;

  @IsOptional()
  @IsString()
  recomendaciones?: string;

  // Estructuras especializadas JSONB
  @IsOptional()
  @ValidateNested()
  @Type(() => OdontogramaDataDto)
  datosOdontologia?: OdontogramaDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EsteticaDataDto)
  datosEstetica?: EsteticaDataDto;
}
