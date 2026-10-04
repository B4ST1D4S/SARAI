import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

// Campos de la Resolución 2275/2023 (RIPS), diligenciados por ítem para poder
// pre-validar la cuenta antes de facturar. Cuáles son exigibles depende del
// componente (tipoRips: AC/AP/AH/AU/AT) — ver FacturacionService.validarRips().
export class CreateCuentaItemDto {
  @IsOptional()
  @IsUUID()
  cargoId?: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  precioUnitario?: number;

  @IsOptional()
  @IsString()
  tipoRips?: string;

  @IsOptional() @IsString() codDiagnosticoPrincipal?: string;
  @IsOptional() @IsString() tipoDiagnosticoPrincipal?: string;
  @IsOptional() @IsString() finalidadTecnologiaSalud?: string;
  @IsOptional() @IsString() causaMotivoAtencion?: string;
  @IsOptional() @IsString() viaIngresoServicioSalud?: string;
  @IsOptional() @IsString() modalidadGrupoServicioTecSal?: string;
  @IsOptional() @IsString() numAutorizacion?: string;
  @IsOptional() @IsString() codPrestador?: string;
  @IsOptional() @IsString() conceptoRecaudo?: string;
  @IsOptional() @IsNumber() valorPagoModerador?: number;

  @IsOptional() @IsString() ambitoRealizacionProcedimiento?: string;
  @IsOptional() @IsString() viaAccesoQuirurgico?: string;
  @IsOptional() @IsString() numMipres?: string;

  @IsOptional() @IsDateString() fechaAtencion?: string;
  @IsOptional() @IsDateString() fechaIngreso?: string;
  @IsOptional() @IsDateString() fechaSalida?: string;
  @IsOptional() @IsString() estadoSalida?: string;
  @IsOptional() @IsString() destinoUsuarioEgreso?: string;
  @IsOptional() @IsString() codDiagnosticoIngreso?: string;
  @IsOptional() @IsString() codDiagnosticoSalida?: string;
  @IsOptional() @IsString() codDiagnosticoMuerte?: string;

  @IsOptional() @IsString() tipoOtroServicio?: string;
}
