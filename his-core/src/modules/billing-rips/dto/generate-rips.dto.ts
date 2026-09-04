import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum TipoNotaRips {
  NA = 'NA', // No aplica / Factura estándar
  NC = 'NC', // Nota Crédito
  ND = 'ND', // Nota Débito
}

export class GenerateRipsDto {
  @IsOptional()
  @IsString()
  numFactura?: string; // Número o prefijo de factura electrónica en salud (FEV)

  @IsNotEmpty({ message: 'fechaInicio es obligatoria para la generación de RIPS.' })
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD o ISO).' })
  fechaInicio: string;

  @IsNotEmpty({ message: 'fechaFin es obligatoria para la generación de RIPS.' })
  @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD o ISO).' })
  fechaFin: string;

  @IsOptional()
  @IsEnum(TipoNotaRips, {
    message: 'tipoNota debe ser NA, NC o ND según Resolución 2275 de 2023.',
  })
  tipoNota?: TipoNotaRips = TipoNotaRips.NA;

  @IsOptional()
  @IsString()
  numNota?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,12}$/, {
    message: 'codigoPrestador debe tener entre 10 y 12 dígitos correspondientes al código REPS.',
  })
  codigoPrestador?: string;
}
