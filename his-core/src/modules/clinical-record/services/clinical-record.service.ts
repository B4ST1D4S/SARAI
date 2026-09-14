import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { ClinicalRecordValidatorService } from './clinical-record-validator.service';
import {
  CreateFolioConsultaExternaDto,
  EspecialidadClinica,
} from '../dto/create-folio-consulta-externa.dto';
import {
  PlantillaResolucionResponseDto,
  OrigenResolucion,
} from '../dto/plantilla-resolucion-response.dto';

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

  /**
   * Resuelve dinámicamente la plantilla de Historia Clínica para una cita
   * consultando la base de datos del tenant activo y aplicando resolución en cascada:
   * 1. Prioridad profesional (profesional_id)
   * 2. Prioridad sede (sede_id)
   * 3. Fallback institucional (NULL, NULL)
   * 4. Fallback por defecto 'PLANT-CONS-PRIMERA-VEZ'
   */
  async obtenerPlantillaParaCita(
    citaId: string,
  ): Promise<PlantillaResolucionResponseDto> {
    // 1. Consultar cita en la base de datos del tenant
    const citaQuery = `
      SELECT 
        id,
        paciente_id,
        profesional_id,
        sede_id,
        tipo_consulta_id
      FROM citas
      WHERE id = $1
    `;

    const citaResult = await this.tenancyConnectionService.query<{
      id: string;
      paciente_id: string;
      profesional_id: string;
      sede_id: string;
      tipo_consulta_id: string;
    }>(citaQuery, [citaId]);

    if (!citaResult.rows || citaResult.rows.length === 0) {
      throw new NotFoundException(
        `Cita con ID [${citaId}] no encontrada en el sistema.`,
      );
    }

    const cita = citaResult.rows[0];

    // 2. Determinar finalidad clínica de la consulta (desde tipos_consulta_cups o fallback)
    const cupsQuery = `
      SELECT finalidad 
      FROM tipos_consulta_cups 
      WHERE tipo_consulta_id = $1 AND activo = true 
      ORDER BY es_principal DESC, created_at ASC 
      LIMIT 1
    `;

    const cupsResult = await this.tenancyConnectionService.query<{
      finalidad: string;
    }>(cupsQuery, [cita.tipo_consulta_id]);

    const finalidad =
      cupsResult.rows && cupsResult.rows.length > 0 && cupsResult.rows[0].finalidad
        ? cupsResult.rows[0].finalidad
        : 'PRIMERA_VEZ';

    // 3. Resolución en cascada de configuración de plantilla
    const cascadeQuery = `
      SELECT 
        p.id AS plantilla_id,
        p.codigo AS codigo_plantilla,
        p.nombre AS nombre_plantilla,
        p.estructura AS estructura,
        CASE
          WHEN c.profesional_id IS NOT NULL THEN 'PROFESIONAL_OVERRIDE'
          WHEN c.sede_id IS NOT NULL THEN 'SEDE_OVERRIDE'
          ELSE 'INSTITUCIONAL_DEFAULT'
        END AS origen_resolucion,
        CASE
          WHEN c.profesional_id IS NOT NULL THEN 1
          WHEN c.sede_id IS NOT NULL THEN 2
          ELSE 3
        END AS prioridad
      FROM hc_configuracion_plantillas c
      JOIN hc_plantillas_catalogo p ON p.id = c.plantilla_id
      WHERE c.tipo_consulta_id = $1
        AND (c.finalidad = $2 OR c.finalidad IS NULL)
        AND (
          (c.profesional_id = $3 AND (c.sede_id = $4 OR c.sede_id IS NULL))
          OR (c.sede_id = $4 AND c.profesional_id IS NULL)
          OR (c.profesional_id IS NULL AND c.sede_id IS NULL)
        )
        AND p.activo = true
      ORDER BY prioridad ASC, (c.finalidad IS NOT NULL) DESC
      LIMIT 1
    `;

    const cascadeResult = await this.tenancyConnectionService.query<{
      plantilla_id: string;
      codigo_plantilla: string;
      nombre_plantilla: string;
      estructura: any;
      origen_resolucion: string;
      prioridad: number;
    }>(cascadeQuery, [
      cita.tipo_consulta_id,
      finalidad,
      cita.profesional_id,
      cita.sede_id,
    ]);

    let plantillaId: string;
    let codigoPlantilla: string;
    let nombrePlantilla: string;
    let estructura: Record<string, any>;
    let origenResolucion: OrigenResolucion;

    if (cascadeResult.rows && cascadeResult.rows.length > 0) {
      const match = cascadeResult.rows[0];
      plantillaId = match.plantilla_id;
      codigoPlantilla = match.codigo_plantilla;
      nombrePlantilla = match.nombre_plantilla;
      estructura =
        typeof match.estructura === 'string'
          ? JSON.parse(match.estructura)
          : match.estructura;
      origenResolucion = match.origen_resolucion as OrigenResolucion;
    } else {
      // 4. Fallback a plantilla base del catálogo: 'PLANT-CONS-PRIMERA-VEZ'
      const fallbackQuery = `
        SELECT 
          id AS plantilla_id,
          codigo AS codigo_plantilla,
          nombre AS nombre_plantilla,
          estructura
        FROM hc_plantillas_catalogo
        WHERE codigo = $1 AND activo = true
        LIMIT 1
      `;

      let fallbackResult = await this.tenancyConnectionService.query<{
        plantilla_id: string;
        codigo_plantilla: string;
        nombre_plantilla: string;
        estructura: any;
      }>(fallbackQuery, ['PLANT-CONS-PRIMERA-VEZ']);

      if (!fallbackResult.rows || fallbackResult.rows.length === 0) {
        // Fallback secundario si el código exacto no existe: cualquier plantilla institucional activa
        const anyActiveQuery = `
          SELECT 
            id AS plantilla_id,
            codigo AS codigo_plantilla,
            nombre AS nombre_plantilla,
            estructura
          FROM hc_plantillas_catalogo
          WHERE activo = true
          ORDER BY es_institucional DESC, created_at ASC
          LIMIT 1
        `;
        fallbackResult = await this.tenancyConnectionService.query(anyActiveQuery);
      }

      if (!fallbackResult.rows || fallbackResult.rows.length === 0) {
        throw new NotFoundException(
          'No se encontró ninguna plantilla clínica activa en el catálogo.',
        );
      }

      const defaultMatch = fallbackResult.rows[0];
      plantillaId = defaultMatch.plantilla_id;
      codigoPlantilla = defaultMatch.codigo_plantilla;
      nombrePlantilla = defaultMatch.nombre_plantilla;
      estructura =
        typeof defaultMatch.estructura === 'string'
          ? JSON.parse(defaultMatch.estructura)
          : defaultMatch.estructura;
      origenResolucion = 'INSTITUCIONAL_DEFAULT';
    }

    return {
      plantillaId,
      codigoPlantilla,
      nombrePlantilla,
      origenResolucion,
      estructura,
      metadataAtencion: {
        citaId: cita.id,
        pacienteId: cita.paciente_id,
        profesionalId: cita.profesional_id,
        sedeId: cita.sede_id,
        tipoConsultaId: cita.tipo_consulta_id,
      },
    };
  }
}
