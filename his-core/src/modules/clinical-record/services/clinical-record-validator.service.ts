import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import {
  CreateFolioConsultaExternaDto,
  EspecialidadClinica,
} from '../dto/create-folio-consulta-externa.dto';
import { OdontogramaDataDto } from '../dto/odontograma-data.dto';
import { EsteticaDataDto } from '../dto/estetica-data.dto';
import { RevisionSistemasDto } from '../dto/revision-sistemas.dto';

export interface FormattedValidationError {
  property: string;
  path: string;
  constraints: Record<string, string>;
  value?: any;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: FormattedValidationError[];
}

@Injectable()
export class ClinicalRecordValidatorService {
  private readonly logger = new Logger(ClinicalRecordValidatorService.name);

  private readonly defaultValidatorOptions: ValidatorOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: true },
  };

  /**
   * Valida programáticamente un payload genérico contra CreateFolioConsultaExternaDto,
   * asegurando la consistencia de metadatos, anamnesis, signos vitales, diagnósticos
   * y las estructuras JSONB de la especialidad correspondiente antes de persistir en PostgreSQL.
   */
  async validateFolioConsultaExterna(
    rawPayload: unknown,
    options?: ValidatorOptions,
  ): Promise<CreateFolioConsultaExternaDto> {
    const instance = await this.validateGeneric(
      CreateFolioConsultaExternaDto,
      rawPayload,
      options,
    );

    // Reglas de negocio y consistencia clínica cruzada
    this.assertClinicalCrossRules(instance);

    return instance;
  }

  /**
   * Valida de manera segura un payload de folio sin lanzar excepción directa,
   * retornando un objeto ValidationResult con la data tipada o los errores formateados.
   */
  async safeValidateFolioConsultaExterna(
    rawPayload: unknown,
    options?: ValidatorOptions,
  ): Promise<ValidationResult<CreateFolioConsultaExternaDto>> {
    try {
      const data = await this.validateFolioConsultaExterna(rawPayload, options);
      return { isValid: true, data };
    } catch (error) {
      if (error instanceof BadRequestException) {
        const response = error.getResponse() as any;
        return {
          isValid: false,
          errors: response.validationErrors || [
            {
              property: 'root',
              path: 'root',
              constraints: { businessRule: error.message },
            },
          ],
        };
      }
      throw error;
    }
  }

  /**
   * Valida programáticamente una estructura JSONB de Odontograma dental.
   */
  async validateOdontograma(
    rawPayload: unknown,
    options?: ValidatorOptions,
  ): Promise<OdontogramaDataDto> {
    return this.validateGeneric(OdontogramaDataDto, rawPayload, options);
  }

  /**
   * Valida programáticamente una estructura JSONB de Medicina Estética / Dermatología.
   */
  async validateEstetica(
    rawPayload: unknown,
    options?: ValidatorOptions,
  ): Promise<EsteticaDataDto> {
    return this.validateGeneric(EsteticaDataDto, rawPayload, options);
  }

  /**
   * Valida programáticamente una estructura JSONB de Revisión por Sistemas.
   */
  async validateRevisionSistemas(
    rawPayload: unknown,
    options?: ValidatorOptions,
  ): Promise<RevisionSistemasDto> {
    return this.validateGeneric(RevisionSistemasDto, rawPayload, options);
  }

  /**
   * Método genérico para transformar y validar cualquier DTO con soporte recursivo
   * y desglose detallado de errores en rutas anidadas.
   */
  async validateGeneric<T extends object>(
    cls: ClassConstructor<T>,
    rawPayload: unknown,
    options?: ValidatorOptions,
  ): Promise<T> {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'El payload a validar debe ser un objeto JSON válido.',
        validationErrors: [
          {
            property: 'payload',
            path: 'root',
            constraints: { isObject: 'El payload no puede ser nulo ni primitivo' },
          },
        ],
      });
    }

    // Transformar plain object a instancia de la clase objetivo
    const instance = plainToInstance(cls, rawPayload, {
      enableImplicitConversion: true,
    });

    // Validar usando class-validator
    const validationOptions: ValidatorOptions = {
      ...this.defaultValidatorOptions,
      ...options,
    };

    const errors: ValidationError[] = await validate(instance, validationOptions);

    if (errors.length > 0) {
      const formattedErrors = this.formatValidationErrors(errors);
      this.logger.warn(
        `Validación fallida para [${cls.name}]: ${formattedErrors.length} errores detectados.`,
      );
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Errores de validación en la estructura ${cls.name}`,
        validationErrors: formattedErrors,
      });
    }

    return instance;
  }

  /**
   * Transforma recursivamente el árbol de ValidationError de class-validator
   * en una lista plana de errores con su ruta de propiedad exacta (ej: 'datosOdontologia.piezas[0].superficies[1].estado').
   */
  public formatValidationErrors(
    errors: ValidationError[],
    parentPath = '',
  ): FormattedValidationError[] {
    const formatted: FormattedValidationError[] = [];

    for (const error of errors) {
      const currentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints && Object.keys(error.constraints).length > 0) {
        formatted.push({
          property: error.property,
          path: currentPath,
          constraints: error.constraints,
          value: error.value,
        });
      }

      if (error.children && error.children.length > 0) {
        formatted.push(
          ...this.formatValidationErrors(error.children, currentPath),
        );
      }
    }

    return formatted;
  }

  /**
   * Valida consistencia cruzada y reglas clínicas de negocio:
   * 1. Correspondencia obligatoria entre la especialidad del folio y su respectiva estructura JSONB.
   * 2. Existencia de un diagnóstico principal único.
   * 3. Coherencia fisiológica de signos vitales (Sistólica > Diastólica).
   */
  private assertClinicalCrossRules(folio: CreateFolioConsultaExternaDto): void {
    const additionalErrors: FormattedValidationError[] = [];

    // 1. Validación de especialidad correspondiente
    if (folio.especialidad === EspecialidadClinica.ODONTOLOGIA) {
      if (!folio.datosOdontologia || !folio.datosOdontologia.piezas) {
        additionalErrors.push({
          property: 'datosOdontologia',
          path: 'datosOdontologia',
          constraints: {
            requiredForSpecialty:
              'Para especialidad ODONTOLOGIA, el objeto datosOdontologia es obligatorio.',
          },
        });
      }
    } else if (folio.especialidad === EspecialidadClinica.MEDICINA_ESTETICA) {
      if (!folio.datosEstetica || !folio.datosEstetica.puntosTratados) {
        additionalErrors.push({
          property: 'datosEstetica',
          path: 'datosEstetica',
          constraints: {
            requiredForSpecialty:
              'Para especialidad MEDICINA_ESTETICA, el objeto datosEstetica es obligatorio.',
          },
        });
      }
    }

    // 2. Validación de diagnóstico principal único
    if (folio.diagnosticos && folio.diagnosticos.length > 0) {
      const mainDiagnoses = folio.diagnosticos.filter((d) => d.esPrincipal);
      if (mainDiagnoses.length === 0) {
        additionalErrors.push({
          property: 'diagnosticos',
          path: 'diagnosticos',
          constraints: {
            mainDiagnosisRequired:
              'Debe marcar exactamente un diagnóstico como principal (esPrincipal = true).',
          },
        });
      } else if (mainDiagnoses.length > 1) {
        additionalErrors.push({
          property: 'diagnosticos',
          path: 'diagnosticos',
          constraints: {
            singleMainDiagnosis:
              'No puede haber más de un diagnóstico principal en el mismo folio.',
          },
        });
      }
    }

    // 3. Coherencia fisiológica de presión arterial
    if (
      folio.signosVitales?.presionArterialSistolica !== undefined &&
      folio.signosVitales?.presionArterialDiastolica !== undefined
    ) {
      if (
        folio.signosVitales.presionArterialSistolica <=
        folio.signosVitales.presionArterialDiastolica
      ) {
        additionalErrors.push({
          property: 'presionArterialSistolica',
          path: 'signosVitales.presionArterialSistolica',
          constraints: {
            bloodPressureInconsistency:
              'La presión arterial sistólica debe ser mayor que la presión diastólica.',
          },
        });
      }
    }

    if (additionalErrors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Inconsistencia en reglas clínicas de negocio del folio',
        validationErrors: additionalErrors,
      });
    }
  }
}
