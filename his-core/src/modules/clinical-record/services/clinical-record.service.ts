import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { ClinicalRecordValidatorService } from './clinical-record-validator.service';
import {
  CreateFolioConsultaExternaDto,
  EspecialidadClinica,
} from '../dto/create-folio-consulta-externa.dto';

export interface FolioCreationResult {
  folioId: string;
  numeroFolio: number;
}

@Injectable()
export class ClinicalRecordService {
  private readonly logger = new Logger(ClinicalRecordService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly clinicalRecordValidatorService: ClinicalRecordValidatorService,
  ) {}

  /**
   * Valida y persiste transaccionalmente un folio clínico de Consulta Externa
   * en la base de datos PostgreSQL aislada del tenant en contexto.
   */
  async crearFolioConsultaExterna(
    rawPayload: unknown,
  ): Promise<FolioCreationResult> {
    // 1. Validación estricta y tipado con DTOs y reglas clínicas
    const validatedDto: CreateFolioConsultaExternaDto =
      await this.clinicalRecordValidatorService.validateFolioConsultaExterna(
        rawPayload,
      );

    // 2. Ejecución transaccional atómica en la base de datos del tenant
    return this.tenancyConnectionService.transaction(async (client) => {
      try {
        // a) Bloqueo pesimista sobre el paciente para serializar la creación de folios
        await client.query('SELECT id FROM pacientes WHERE id = $1 FOR UPDATE', [
          validatedDto.pacienteId,
        ]);

        const folioNumberRes = await client.query<{ next_folio: string | number }>(
          `SELECT COALESCE(MAX(numero_folio), 0) + 1 AS next_folio 
          FROM hc_folios 
          WHERE paciente_id = $1`,
          [validatedDto.pacienteId],
        );

        const numeroFolio = parseInt(
          String(folioNumberRes.rows[0]?.next_folio ?? '1'),
          10,
        );

        // b) Generar hash SHA-256 preliminar de integridad y no repudio del contenido clínico
        const contentForHash = JSON.stringify({
          atencionId: validatedDto.atencionId,
          pacienteId: validatedDto.pacienteId,
          profesionalId: validatedDto.profesionalId,
          fechaAtencion: validatedDto.fechaAtencion,
          especialidad: validatedDto.especialidad,
          numeroFolio,
          anamnesis: validatedDto.anamnesis,
          signosVitales: validatedDto.signosVitales,
          diagnosticos: validatedDto.diagnosticos,
          planTratamiento: validatedDto.planTratamiento,
          datosOdontologia: validatedDto.datosOdontologia,
          datosEstetica: validatedDto.datosEstetica,
        });

        const firmaDigitalHash = crypto
          .createHash('sha256')
          .update(contentForHash)
          .digest('hex');

        // c) Insertar cabecera del folio en hc_folios
        const insertFolioQuery = `
          INSERT INTO hc_folios (
            atencion_id,
            paciente_id,
            profesional_id,
            especialidad_profesional,
            registro_medico_rethus,
            numero_folio,
            tipo_registro,
            estado,
            firma_digital_hash,
            ip_registro
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, numero_folio
        `;

        const folioResult = await client.query<{
          id: string;
          numero_folio: number | string;
        }>(insertFolioQuery, [
          validatedDto.atencionId,
          validatedDto.pacienteId,
          validatedDto.profesionalId,
          validatedDto.especialidad,
          validatedDto.registroMedicoRethus ?? null,
          numeroFolio,
          validatedDto.tipoRegistro ?? 'CONSULTA_EXTERNA',
          'BORRADOR',
          firmaDigitalHash,
          validatedDto.ipRegistro ?? '127.0.0.1',
        ]);

        const folioId = folioResult.rows[0].id;

        // d) Insertar Anamnesis y Revisión por Sistemas en hc_anamnesis
        const insertAnamnesisQuery = `
          INSERT INTO hc_anamnesis (
            folio_id,
            motivo_consulta,
            enfermedad_actual,
            revision_sistemas
          ) VALUES ($1, $2, $3, $4)
        `;

        await client.query(insertAnamnesisQuery, [
          folioId,
          validatedDto.anamnesis.motivoConsulta,
          validatedDto.anamnesis.enfermedadActual,
          JSON.stringify(validatedDto.anamnesis.revisionSistemas ?? {}),
        ]);

        // e) Insertar Signos Vitales en hc_signos_vitales si están presentes
        if (validatedDto.signosVitales) {
          const insertSignosVitalesQuery = `
            INSERT INTO hc_signos_vitales (
              folio_id,
              tension_arterial_sistolica,
              tension_arterial_diastolica,
              frecuencia_cardiaca,
              frecuencia_respiratoria,
              temperatura_corporal,
              peso_kg,
              talla_cm,
              indice_masa_corporal,
              saturacion_oxigeno
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;

          await client.query(insertSignosVitalesQuery, [
            folioId,
            validatedDto.signosVitales.presionArterialSistolica ?? null,
            validatedDto.signosVitales.presionArterialDiastolica ?? null,
            validatedDto.signosVitales.frecuenciaCardiaca ?? null,
            validatedDto.signosVitales.frecuenciaRespiratoria ?? null,
            validatedDto.signosVitales.temperatura ?? null,
            validatedDto.signosVitales.pesoKg ?? null,
            validatedDto.signosVitales.tallaCm ?? null,
            validatedDto.signosVitales.indiceMasaCorporal ?? null,
            validatedDto.signosVitales.saturacionOxigeno ?? null,
          ]);
        }

        // f) Iterar e insertar diagnósticos clínicos en hc_diagnosticos
        const insertDiagnosticoQuery = `
          INSERT INTO hc_diagnosticos (
            folio_id,
            atencion_id,
            codigo_cie,
            nombre_diagnostico,
            momento,
            jerarquia,
            clase
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        for (const diag of validatedDto.diagnosticos) {
          await client.query(insertDiagnosticoQuery, [
            folioId,
            validatedDto.atencionId,
            diag.codigoCIE10,
            diag.descripcion,
            'EVOLUCION',
            diag.esPrincipal ? 'PRINCIPAL' : 'RELACIONADO_1',
            diag.tipo,
          ]);
        }

        // g) Persistir estructura especializada de Odontograma si corresponde
        if (
          validatedDto.especialidad === EspecialidadClinica.ODONTOLOGIA &&
          validatedDto.datosOdontologia
        ) {
          const insertOdontoQuery = `
            INSERT INTO hc_seccion_odontologia (
              folio_id,
              odontograma_data
            ) VALUES ($1, $2)
          `;

          await client.query(insertOdontoQuery, [
            folioId,
            JSON.stringify(validatedDto.datosOdontologia),
          ]);
        }

        // h) Persistir estructura especializada de Medicina Estética si corresponde
        if (
          validatedDto.especialidad === EspecialidadClinica.MEDICINA_ESTETICA &&
          validatedDto.datosEstetica
        ) {
          const insertEsteticaQuery = `
            INSERT INTO hc_seccion_estetica (
              folio_id,
              mapa_corporal_3d,
              insumos_aplicados,
              fotos_adjuntos
            ) VALUES ($1, $2, $3, $4)
          `;

          await client.query(insertEsteticaQuery, [
            folioId,
            JSON.stringify(validatedDto.datosEstetica.puntosTratados ?? []),
            JSON.stringify(validatedDto.datosEstetica.insumos ?? []),
            JSON.stringify(validatedDto.datosEstetica.fotos ?? {}),
          ]);
        }

        // i) Upsert / Inserción de antecedentes clínicos en hc_antecedentes_paciente
        // i) Inserción normalizada en hc_antecedentes_paciente acorde a FHIR / DDL
        if (validatedDto.anamnesis.antecedentes) {
          const ant = validatedDto.anamnesis.antecedentes;
          const mapaCategorias: Array<{ categoria: string; valor?: string }> = [
            { categoria: 'PATOLOGICO_CRONICO', valor: ant.patologicos },
            { categoria: 'QUIRURGICO', valor: ant.quirurgicos },
            { categoria: 'ALERGICO', valor: ant.alergicos },
            { categoria: 'FARMACOLOGICO', valor: ant.farmacologicos },
            { categoria: 'FAMILIAR', valor: ant.familiares },
            { categoria: 'TOXICO_ALERGICO', valor: ant.toxicos },
            { categoria: 'GINECO_OBSTETRICO', valor: ant.ginecoObstetricos },
          ];

          const insertAntecedenteQuery = `
            INSERT INTO hc_antecedentes_paciente (
              paciente_id,
              folio_creacion_id,
              categoria,
              descripcion_antecedente,
              estado
            ) VALUES ($1, $2, $3, $4, 'ACTIVO')
          `;

          for (const item of mapaCategorias) {
            if (item.valor && item.valor.trim().length > 0) {
              await client.query(insertAntecedenteQuery, [
                validatedDto.pacienteId,
                folioId,
                item.categoria,
                item.valor.trim(),
              ]);
            }
          }
        }

        this.logger.log(
          `Folio clínico #${numeroFolio} creado exitosamente con ID [${folioId}] para paciente [${validatedDto.pacienteId}]`,
        );

        return {
          folioId,
          numeroFolio,
        };
      } catch (error: any) {
        this.logger.error(
          `Error al persistir folio clínico para paciente [${validatedDto.pacienteId}]: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Error al persistir el folio de consulta externa: ${error.message}`,
        );
      }
    });
  }
}
