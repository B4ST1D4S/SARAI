import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as crypto from 'node:crypto';
import { QUEUES, JOBS } from '../../../core/queue/constants/queue.constants';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { SpacesStorageService } from '../../../core/storage/services/spaces-storage.service';

export interface GenerateRipsJobData {
  tenantId: string;
  loteId: string;
}

export interface ValidationErrorItem {
  tipo: string;
  campo: string;
  registroId: string;
  mensaje: string;
}

export interface GenerateRipsResult {
  tenantId: string;
  loteId: string;
  estado: 'VALIDADO' | 'RECHAZADO' | 'FALLIDO';
  fileKey?: string;
  hashSha256?: string;
  totalUsuarios?: number;
  totalConsultas?: number;
  totalProcedimientos?: number;
  totalMedicamentos?: number;
  errores?: ValidationErrorItem[];
}

@Processor(QUEUES.RIPS_GENERATION)
export class RipsGeneratorWorker extends WorkerHost {
  private readonly logger = new Logger(RipsGeneratorWorker.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly spacesStorageService: SpacesStorageService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super();
  }

  /**
   * Procesa el trabajo de validación y generación de paquetes RIPS (Resolución 2275 de 2023).
   */
  async process(job: Job<GenerateRipsJobData>): Promise<GenerateRipsResult> {
    if (job.name !== JOBS.GENERATE_RIPS_JSON) {
      this.logger.warn(
        `Job con nombre no reconocido [${job.name}] ignorado por RipsGeneratorWorker.`,
      );
      return {
        tenantId: job.data?.tenantId,
        loteId: job.data?.loteId,
        estado: 'FALLIDO',
      };
    }

    const { tenantId, loteId } = job.data;
    this.logger.log(
      `Iniciando generación y validación de RIPS para lote [${loteId}] en tenant [${tenantId}] (Job ID: ${job.id})`,
    );

    const tenant = await this.tenantService.findById(tenantId);
    const tenantContext: TenantContext = {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      code: tenant.code,
      tenant,
      dbConfig: {
        host: tenant.dbHost,
        port: tenant.dbPort,
        database: tenant.dbName,
        username: tenant.dbUser,
      },
    };

    return this.tenantContextService.run(tenantContext, async () => {
      try {
        // a) Actualizar estado a PROCESANDO
        await this.tenancyConnectionService.query(
          `UPDATE rips_lotes SET estado = 'PROCESANDO' WHERE id = $1;`,
          [loteId],
        );

        // b) Consultar metadatos del lote
        const loteQuery = `
          SELECT id, num_factura, fecha_inicio, fecha_fin, tipo_nota, num_nota
          FROM rips_lotes
          WHERE id = $1;
        `;
        const loteResult = await this.tenancyConnectionService.query(loteQuery, [
          loteId,
        ]);

        if (!loteResult.rows || loteResult.rows.length === 0) {
          throw new Error(
            `No se encontró el registro de lote con ID [${loteId}].`,
          );
        }

        const lote = loteResult.rows[0];
        const fechaInicio = lote.fecha_inicio;
        const fechaFin = lote.fecha_fin;

        // c) Consultar consultas, procedimientos y medicamentos cruzados con catálogos
        const [consultasRes, procedimientosRes, medicamentosRes] =
          await Promise.all([
            this.consultarConsultas(fechaInicio, fechaFin),
            this.consultarProcedimientos(fechaInicio, fechaFin),
            this.consultarMedicamentos(fechaInicio, fechaFin),
          ]);

        const consultas = consultasRes || [];
        const procedimientos = procedimientosRes || [];
        const medicamentos = medicamentosRes || [];

        // d) Validar consistencia técnica bajo Resolución 2275 de 2023
        const errores: ValidationErrorItem[] = [];

        // 1. Validar consultas
        for (const c of consultas) {
          if (!c.cod_diagnostico_principal) {
            errores.push({
              tipo: 'VALIDACION_CIE10',
              campo: 'codDiagnosticoPrincipal',
              registroId: c.folio_id,
              mensaje: `La consulta/folio #${c.numero_folio || c.folio_id} no tiene asignado un diagnóstico principal CIE-10 obligatorio.`,
            });
          }
          if (!c.tipo_documento || !c.numero_documento) {
            errores.push({
              tipo: 'VALIDACION_DEMOGRAFICA',
              campo: 'identificacionUsuario',
              registroId: c.paciente_id || c.folio_id,
              mensaje: `El paciente asociado al folio #${c.numero_folio || c.folio_id} no cuenta con tipo o número de documento válido.`,
            });
          }
        }

        // 2. Validar procedimientos
        for (const p of procedimientos) {
          if (!p.cod_diagnostico_principal) {
            errores.push({
              tipo: 'VALIDACION_CIE10',
              campo: 'codDiagnosticoPrincipal',
              registroId: p.id,
              mensaje: `El procedimiento CUPS [${p.cod_procedimiento_cups}] no tiene asignado un diagnóstico principal CIE-10.`,
            });
          }
          if (!p.cod_procedimiento_cups) {
            errores.push({
              tipo: 'VALIDACION_CUPS',
              campo: 'codProcedimiento',
              registroId: p.id,
              mensaje: `El procedimiento con ID [${p.id}] no tiene código CUPS configurado.`,
            });
          }
        }

        // 3. Validar medicamentos (cruce con UPR y CUM)
        for (const m of medicamentos) {
          if (!m.codigo_upr) {
            errores.push({
              tipo: 'VALIDACION_UPR',
              campo: 'unidadMedidaDispensacion',
              registroId: m.id,
              mensaje: `El medicamento formulado [${m.nombre_generico_dci || m.id}] no tiene código UPR de dispensación válido según catálogo MinSalud (ref_upr_dispensacion).`,
            });
          }
          if (!m.codigo_cum && !m.nombre_generico_dci) {
            errores.push({
              tipo: 'VALIDACION_CUM',
              campo: 'codTecnologiaSalud',
              registroId: m.id,
              mensaje: `El medicamento con ID [${m.id}] no tiene asignado código CUM ni DCI en el inventario.`,
            });
          }
        }

        // e) Si se detectan errores de validación, marcar como RECHAZADO
        if (errores.length > 0) {
          this.logger.warn(
            `Lote de RIPS #${loteId} rechazado: ${errores.length} inconsistencias técnicas detectadas.`,
          );

          await this.tenancyConnectionService.query(
            `UPDATE rips_lotes 
             SET estado = 'RECHAZADO', 
                 errores_validacion = $1 
             WHERE id = $2;`,
            [JSON.stringify(errores), loteId],
          );

          return {
            tenantId,
            loteId,
            estado: 'RECHAZADO',
            errores,
          };
        }

        // f) Si pasa la validación, construir la estructura JSON según Res. 2275/2023
        const ripsJson = this.construirEstructuraRips2275({
          tenant,
          lote,
          consultas,
          procedimientos,
          medicamentos,
        });

        const jsonString = JSON.stringify(ripsJson, null, 2);
        const hashSha256 = crypto
          .createHash('sha256')
          .update(jsonString, 'utf-8')
          .digest('hex');
        const buffer = Buffer.from(jsonString, 'utf-8');

        // Subir archivo a Spaces
        const fileKey = await this.spacesStorageService.uploadRipsJsonBuffer(
          tenantId,
          loteId,
          buffer,
        );

        const totalUsuarios = ripsJson.usuarios?.length || 0;
        const totalConsultas = consultas.length;
        const totalProcedimientos = procedimientos.length;
        const totalMedicamentos = medicamentos.length;

        // Actualizar lote en estado VALIDADO
        await this.tenancyConnectionService.query(
          `UPDATE rips_lotes
           SET estado = 'VALIDADO',
               total_usuarios = $1,
               total_consultas = $2,
               total_procedimientos = $3,
               total_medicamentos = $4,
               json_file_key = $5,
               hash_sha256 = $6,
               errores_validacion = NULL,
               validado_en = NOW()
           WHERE id = $7;`,
          [
            totalUsuarios,
            totalConsultas,
            totalProcedimientos,
            totalMedicamentos,
            fileKey,
            hashSha256,
            loteId,
          ],
        );

        this.logger.log(
          `Lote de RIPS #${loteId} validado y generado exitosamente [${fileKey}] (Hash SHA-256: ${hashSha256})`,
        );

        return {
          tenantId,
          loteId,
          estado: 'VALIDADO',
          fileKey,
          hashSha256,
          totalUsuarios,
          totalConsultas,
          totalProcedimientos,
          totalMedicamentos,
        };
      } catch (error: any) {
        this.logger.error(
          `Error no controlado durante la generación de RIPS para lote [${loteId}] en tenant [${tenantId}]: ${error.message}`,
          error.stack,
        );

        try {
          await this.tenancyConnectionService.query(
            `UPDATE rips_lotes SET estado = 'FALLIDO' WHERE id = $1;`,
            [loteId],
          );
        } catch (updateErr: any) {
          this.logger.error(
            `No se pudo registrar estado FALLIDO para lote [${loteId}]: ${updateErr.message}`,
          );
        }

        throw error;
      }
    });
  }

  /**
   * Consulta consultas clínicas ejecutadas en el rango de fechas.
   */
  private async consultarConsultas(
    fechaInicio: string,
    fechaFin: string,
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          f.id AS folio_id,
          f.numero_folio,
          f.paciente_id,
          f.profesional_id,
          f.fecha_atencion,
          f.especialidad_profesional,
          p.tipo_documento,
          p.numero_documento,
          p.tipo_usuario,
          p.fecha_nacimiento,
          p.genero AS cod_sexo,
          p.cod_pais_residencia,
          p.cod_municipio_residencia,
          p.cod_zona_residencia,
          p.incapacidad,
          d.codigo_cie10 AS cod_diagnostico_principal,
          d.tipo_diagnostico,
          d.descripcion AS diagnostico_descripcion
        FROM hc_folios f
        LEFT JOIN adm_pacientes p ON p.id = f.paciente_id
        LEFT JOIN hc_diagnosticos d ON d.folio_id = f.id AND d.es_principal = true
        WHERE f.fecha_atencion >= $1 AND f.fecha_atencion <= ($2::date + INTERVAL '1 day')
        ORDER BY f.fecha_atencion ASC;
      `;
      const result = await this.tenancyConnectionService.query(query, [
        fechaInicio,
        fechaFin,
      ]);
      return result.rows || [];
    } catch {
      return [];
    }
  }

  /**
   * Consulta procedimientos médicos/odontológicos realizados.
   */
  private async consultarProcedimientos(
    fechaInicio: string,
    fechaFin: string,
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          pr.id,
          pr.folio_id,
          pr.paciente_id,
          pr.cod_procedimiento_cups,
          pr.via_ingreso_servicio_salud,
          pr.modalidad_grupo_servicio,
          pr.finalidad_tecnologia_salud,
          pr.cod_diagnostico_principal,
          pr.fecha_procedimiento,
          p.tipo_documento,
          p.numero_documento
        FROM hc_procedimientos pr
        LEFT JOIN adm_pacientes p ON p.id = pr.paciente_id
        WHERE pr.fecha_procedimiento >= $1 AND pr.fecha_procedimiento <= ($2::date + INTERVAL '1 day')
        ORDER BY pr.fecha_procedimiento ASC;
      `;
      const result = await this.tenancyConnectionService.query(query, [
        fechaInicio,
        fechaFin,
      ]);
      return result.rows || [];
    } catch {
      return [];
    }
  }

  /**
   * Consulta prescripciones de medicamentos cruzadas con UPR, Vías e Inventario.
   */
  private async consultarMedicamentos(
    fechaInicio: string,
    fechaFin: string,
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          med.id,
          med.folio_id,
          med.paciente_id,
          med.cod_diagnostico_principal,
          inv.codigo_cum,
          inv.nombre_generico_dci,
          inv.forma_farmaceutica,
          inv.concentracion,
          upr.codigo_upr,
          upr.descripcion_unidad AS unidad_dispensacion,
          via.codigo_via_administracion,
          via.nombre_via AS via_administracion,
          med.cantidad_formulada,
          med.dias_tratamiento,
          med.fecha_prescripcion,
          p.tipo_documento,
          p.numero_documento
        FROM hc_prescripciones_medicamentos med
        LEFT JOIN inv_medicamentos_detalle inv ON inv.id = med.medicamento_detalle_id
        LEFT JOIN ref_upr_dispensacion upr ON upr.id = med.upr_dispensacion_id
        LEFT JOIN ref_vias_administracion via ON via.id = med.via_administracion_id
        LEFT JOIN adm_pacientes p ON p.id = med.paciente_id
        WHERE med.fecha_prescripcion >= $1 AND med.fecha_prescripcion <= ($2::date + INTERVAL '1 day')
        ORDER BY med.fecha_prescripcion ASC;
      `;
      const result = await this.tenancyConnectionService.query(query, [
        fechaInicio,
        fechaFin,
      ]);
      return result.rows || [];
    } catch {
      return [];
    }
  }

  /**
   * Construye el documento JSON estandarizado conforme a la Resolución 2275 de 2023.
   */
  private construirEstructuraRips2275(data: {
    tenant: any;
    lote: any;
    consultas: any[];
    procedimientos: any[];
    medicamentos: any[];
  }): any {
    const { tenant, lote, consultas, procedimientos, medicamentos } = data;

    // Agrupar servicios por usuario/paciente
    const usuariosMap = new Map<string, any>();

    const getOrCreateUsuario = (item: any) => {
      const key = `${item.tipo_documento || 'CC'}-${item.numero_documento || item.paciente_id || '99999999'}`;
      if (!usuariosMap.has(key)) {
        usuariosMap.set(key, {
          tipoDocumentoIdentificacion: item.tipo_documento || 'CC',
          numDocumentoIdentificacion:
            item.numero_documento || item.paciente_id || '99999999',
          tipoUsuario: item.tipo_usuario || '01',
          fechaNacimiento: item.fecha_nacimiento
            ? new Date(item.fecha_nacimiento).toISOString().split('T')[0]
            : '1990-01-01',
          codSexo: item.cod_sexo || 'M',
          codPaisResidencia: item.cod_pais_residencia || '170',
          codMunicipioResidencia: item.cod_municipio_residencia || '11001',
          codZonaTerritorialResidencia: item.cod_zona_residencia || '01',
          incapacidad: item.incapacidad ? 'SI' : 'NO',
          servicios: {
            consultas: [],
            procedimientos: [],
            medicamentos: [],
          },
        });
      }
      return usuariosMap.get(key);
    };

    // Mapear consultas
    consultas.forEach((c, idx) => {
      const user = getOrCreateUsuario(c);
      user.servicios.consultas.push({
        codPrestador: tenant.code || '110010000001',
        fechaInicioAtencion: c.fecha_atencion
          ? new Date(c.fecha_atencion).toISOString().replace('Z', '')
          : new Date().toISOString().replace('Z', ''),
        numAutorizacion: null,
        codConsulta: '890201', // Consulta médica general
        modalidadGrupoServicioTecSal: '01', // Intramural
        grupoServicios: '01', // Consulta externa
        codServicio: 360, // Medicina general
        finalidadTecnologiaSalud: '44', // Diagnóstico
        causaMotivoAtencion: '38', // Enfermedad general
        codDiagnosticoPrincipal: c.cod_diagnostico_principal,
        codDiagnosticoRelacionado1: null,
        codDiagnosticoRelacionado2: null,
        codDiagnosticoRelacionado3: null,
        tipoDiagnosticoPrincipal: '01', // Impresión diagnóstica / Confirmado
        tipoDocumentoIdentificacion: c.tipo_documento || 'CC',
        numDocumentoIdentificacion: c.numero_documento || '99999999',
        vrServicio: 0,
        conceptoRecaudo: '05', // Ninguno / Paciente institucional
        valorPagoModerador: 0,
        numFEVPagoModerador: null,
        consecutivo: idx + 1,
      });
    });

    // Mapear procedimientos
    procedimientos.forEach((p, idx) => {
      const user = getOrCreateUsuario(p);
      user.servicios.procedimientos.push({
        codPrestador: tenant.code || '110010000001',
        fechaInicioAtencion: p.fecha_procedimiento
          ? new Date(p.fecha_procedimiento).toISOString().replace('Z', '')
          : new Date().toISOString().replace('Z', ''),
        idMIPRES: null,
        numAutorizacion: null,
        codProcedimiento: p.cod_procedimiento_cups,
        viaIngresoServicioSalud: p.via_ingreso_servicio_salud || '01',
        modalidadGrupoServicioTecSal: p.modalidad_grupo_servicio || '01',
        grupoServicios: '01',
        codServicio: 360,
        finalidadTecnologiaSalud: p.finalidad_tecnologia_salud || '01',
        tipoDocumentoIdentificacion: p.tipo_documento || 'CC',
        numDocumentoIdentificacion: p.numero_documento || '99999999',
        codDiagnosticoPrincipal: p.cod_diagnostico_principal,
        codDiagnosticoRelacionado: null,
        codComplicacion: null,
        vrServicio: 0,
        conceptoRecaudo: '05',
        valorPagoModerador: 0,
        numFEVPagoModerador: null,
        consecutivo: idx + 1,
      });
    });

    // Mapear medicamentos
    medicamentos.forEach((m, idx) => {
      const user = getOrCreateUsuario(m);
      user.servicios.medicamentos.push({
        codPrestador: tenant.code || '110010000001',
        numAutorizacion: null,
        idMIPRES: null,
        fechaDispensacionAdmon: m.fecha_prescripcion
          ? new Date(m.fecha_prescripcion).toISOString().replace('Z', '')
          : new Date().toISOString().replace('Z', ''),
        codDiagnosticoPrincipal: m.cod_diagnostico_principal || 'Z000',
        codDiagnosticoRelacionado: null,
        tipoMedicamento: '01', // POS / PBS
        codTecnologiaSalud: m.codigo_cum || m.nombre_generico_dci,
        nomTecnologiaSalud: m.nombre_generico_dci || 'Medicamento Dispensado',
        formaFarmaceutica: m.forma_farmaceutica || 'Tableta',
        concentracionMedicamento: m.concentracion || '500mg',
        unidadMedida: m.codigo_upr || '001',
        unidadMinimaDispensacion: m.unidad_dispensacion || 'Unidad',
        cantidadMedicamento: m.cantidad_formulada || 1,
        diasTratamiento: m.dias_tratamiento || 30,
        tipoDocumentoIdentificacion: m.tipo_documento || 'CC',
        numDocumentoIdentificacion: m.numero_documento || '99999999',
        vrUnitMedicamento: 0,
        vrServicio: 0,
        conceptoRecaudo: '05',
        valorPagoModerador: 0,
        numFEVPagoModerador: null,
        consecutivo: idx + 1,
      });
    });

    return {
      numDocumentoIdObligado: tenant.code || '900000000',
      numFactura: lote.num_factura || null,
      tipoNota: lote.tipo_nota === 'NA' ? null : lote.tipo_nota,
      numNota: lote.num_nota || null,
      usuarios: Array.from(usuariosMap.values()),
    };
  }
}
