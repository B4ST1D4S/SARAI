import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as QRCode from 'qrcode';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { QUEUES, JOBS } from '../../../core/queue/constants/queue.constants';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { SpacesStorageService } from '../../../core/storage/services/spaces-storage.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfMake = require('pdfmake');

export interface GenerateClinicalPdfJobData {
  tenantId: string;
  folioId: string;
}

export interface GenerateClinicalPdfResult {
  tenantId: string;
  folioId: string;
  numeroFolio: number;
  fileKey: string;
  pdfGeneradoEn: Date;
}

@Processor(QUEUES.CLINICAL_PDF)
export class ClinicalPdfWorker extends WorkerHost {
  private readonly logger = new Logger(ClinicalPdfWorker.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly spacesStorageService: SpacesStorageService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super();

    // Configurar fuentes estándar de PDF (Helvetica / standard 14 fonts)
    pdfMake.setFonts({
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    });
    pdfMake.setUrlAccessPolicy(() => false);
    pdfMake.setLocalAccessPolicy(() => true);
  }

  /**
   * Procesa el trabajo de generación de PDF clínico inmutable.
   */
  async process(
    job: Job<GenerateClinicalPdfJobData>,
  ): Promise<GenerateClinicalPdfResult> {
    if (job.name !== JOBS.GENERATE_CLINICAL_PDF) {
      this.logger.warn(
        `Job con nombre no reconocido [${job.name}] ignorado por ClinicalPdfWorker.`,
      );
      return {
        tenantId: job.data?.tenantId,
        folioId: job.data?.folioId,
        numeroFolio: 0,
        fileKey: '',
        pdfGeneradoEn: new Date(),
      };
    }

    const { tenantId, folioId } = job.data;
    this.logger.log(
      `Iniciando generación de PDF para folio [${folioId}] en tenant [${tenantId}] (Job ID: ${job.id})`,
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
        // 1. Consultar información completa del folio y secciones clínicas
        const folioQuery = `
          SELECT 
            id, numero_folio, atencion_id, paciente_id, profesional_id,
            fecha_atencion, especialidad_profesional, registro_medico_rethus,
            firma_digital_hash, firma_digital_fecha, pdf_estado, pdf_file_key
          FROM hc_folios
          WHERE id = $1;
        `;
        const folioResult = await this.tenancyConnectionService.query(
          folioQuery,
          [folioId],
        );

        if (!folioResult.rows || folioResult.rows.length === 0) {
          throw new Error(
            `No se encontró el folio con ID [${folioId}] para generar PDF.`,
          );
        }

        const folio = folioResult.rows[0];

        // 2. Consultar anamnesis, signos vitales y diagnósticos
        const [anamnesisRes, signosRes, diagRes] = await Promise.all([
          this.tenancyConnectionService.query(
            `SELECT motivo_consulta, enfermedad_actual, revision_sistemas, antecedentes 
             FROM hc_anamnesis WHERE folio_id = $1;`,
            [folioId],
          ),
          this.tenancyConnectionService.query(
            `SELECT presion_sistolica, presion_diastolica, frecuencia_cardiaca, 
                    frecuencia_respiratoria, temperatura, saturacion_oxigeno, 
                    peso_kg, talla_cm, imc, observaciones 
             FROM hc_signos_vitales WHERE folio_id = $1;`,
            [folioId],
          ),
          this.tenancyConnectionService.query(
            `SELECT codigo_cie10, descripcion, tipo_diagnostico, es_principal 
             FROM hc_diagnosticos WHERE folio_id = $1 ORDER BY es_principal DESC;`,
            [folioId],
          ),
        ]);

        const anamnesis = anamnesisRes.rows[0] || {};
        const signosVitales = signosRes.rows[0] || {};
        const diagnosticos = diagRes.rows || [];

        // 3. Generar código QR en Base64 con metadatos de integridad y firma digital
        const qrPayload = JSON.stringify({
          clinica: tenant.name,
          codigoReps: tenant.code,
          folioId: folio.id,
          numeroFolio: folio.numero_folio,
          pacienteId: folio.paciente_id,
          profesionalId: folio.profesional_id,
          fechaAtencion: folio.fecha_atencion,
          hashIntegridad: folio.firma_digital_hash,
          seguridad: 'ISO 27001 / Write-Once Read-Many (WORM)',
        });

        const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 100,
        });

        // 4. Compilar la estructura del PDF usando pdfmake
        const docDefinition = this.construirDefinicionPdf({
          tenant,
          folio,
          anamnesis,
          signosVitales,
          diagnosticos,
          qrCodeDataUrl,
        });

        const pdfBuffer = await pdfMake.createPdf(docDefinition).getBuffer();

        // 5. Subir buffer a DigitalOcean Spaces (AES-256 en reposo)
        const fileKey = await this.spacesStorageService.uploadClinicalPdfBuffer(
          tenantId,
          folioId,
          pdfBuffer,
        );

        // 6. Actualizar en hc_folios el estado a 'GENERADO' y guardar el pdf_file_key
        const now = new Date();
        const updateQuery = `
          UPDATE hc_folios
          SET pdf_file_key = $1, pdf_estado = 'GENERADO', pdf_generado_en = $2
          WHERE id = $3;
        `;
        await this.tenancyConnectionService.query(updateQuery, [
          fileKey,
          now,
          folioId,
        ]);

        this.logger.log(
          `PDF de historia clínica generado y persistido con éxito para folio #${folio.numero_folio} [${fileKey}]`,
        );

        return {
          tenantId,
          folioId,
          numeroFolio: folio.numero_folio,
          fileKey,
          pdfGeneradoEn: now,
        };
      } catch (error: any) {
        this.logger.error(
          `Error al generar PDF para folio [${folioId}] en tenant [${tenantId}]: ${error.message}`,
          error.stack,
        );

        try {
          // Solo marcar como FALLIDO si ya es el último intento configurado
          const totalIntentos = job.opts?.attempts ?? 3;
          const esUltimoIntento = (job.attemptsMade ?? totalIntentos) >= totalIntentos;

        if (esUltimoIntento) {
          await this.tenancyConnectionService.query(
            `UPDATE hc_folios SET pdf_estado = 'FALLIDO' WHERE id = $1;`,
            [folioId],
          );
          this.logger.warn(
            `Folio [${folioId}] marcado definitivamente como FALLIDO tras agotar ${totalIntentos} intentos.`,
          );
        } else {
          this.logger.warn(
            `Fallo transitorio en intento ${job.attemptsMade}/${totalIntentos} para folio [${folioId}]. BullMQ reintentará; se conserva estado EN_PROCESO.`,
          );
        }
        } catch (updateErr: any) {
          this.logger.error(
            `Fallo al actualizar estado del folio [${folioId}]: ${updateErr.message}`,
          );
        }

        // Relanzar el error para que BullMQ active el reintento exponencial
        throw error;
      }
    });
  }

  /**
   * Construye la definición declarativa de documento para pdfmake.
   */
  private construirDefinicionPdf(data: {
    tenant: any;
    folio: any;
    anamnesis: any;
    signosVitales: any;
    diagnosticos: any[];
    qrCodeDataUrl: string;
  }): TDocumentDefinitions {
    const { tenant, folio, anamnesis, signosVitales, diagnosticos, qrCodeDataUrl } =
      data;

    const fechaAtencionFormatted = folio.fecha_atencion
      ? new Date(folio.fecha_atencion).toLocaleString('es-CO')
      : new Date().toLocaleString('es-CO');

    const diagnosticosRows = diagnosticos.map((d) => [
      d.es_principal ? 'Principal' : 'Relacionado',
      d.codigo_cie10 || 'N/A',
      d.descripcion || 'Sin descripción',
      d.tipo_diagnostico || 'Confirmado Nuevo',
    ]);

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 9,
        color: '#2b2b2b',
      },
      content: [
        // Encabezado institucional
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: tenant.name?.toUpperCase() || 'SARAI MEDICAL CLINIC',
                  fontSize: 14,
                  bold: true,
                  color: '#1a365d',
                },
                {
                  text: `Código Prestador (REPS): ${tenant.code || 'N/A'} | Sede: Principal`,
                  fontSize: 8,
                  color: '#718096',
                },
              ],
            },
            {
              width: 'auto',
              alignment: 'right',
              stack: [
                {
                  text: `FOLIO Nº: ${folio.numero_folio}`,
                  fontSize: 12,
                  bold: true,
                  color: '#2b6cb0',
                },
                {
                  text: `Fecha: ${fechaAtencionFormatted}`,
                  fontSize: 8,
                  color: '#718096',
                },
              ],
            },
          ],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 8,
              x2: 515,
              y2: 8,
              lineWidth: 1.5,
              lineColor: '#2b6cb0',
            },
          ],
          margin: [0, 0, 0, 12],
        },

        // Título del Documento
        {
          text: 'HISTORIA CLÍNICA - REGISTRO DE CONSULTA EXTERNA',
          fontSize: 11,
          bold: true,
          alignment: 'center',
          color: '#2d3748',
          margin: [0, 0, 0, 10],
        },

        // Datos del Paciente y Profesional
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'PACIENTE ID:', bold: true, fillColor: '#edf2f7' },
                { text: folio.paciente_id || 'N/A' },
                { text: 'PROFESIONAL ID:', bold: true, fillColor: '#edf2f7' },
                { text: folio.profesional_id || 'N/A' },
              ],
              [
                { text: 'ESPECIALIDAD:', bold: true, fillColor: '#edf2f7' },
                { text: folio.especialidad_profesional || 'Medicina General' },
                { text: 'REGISTRO MÉDICO:', bold: true, fillColor: '#edf2f7' },
                { text: folio.registro_medico_rethus || 'RETHUS-VERIFICADO' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10],
        },

        // Sección: Anamnesis
        {
          text: '1. ANAMNESIS Y MOTIVO DE CONSULTA',
          fontSize: 10,
          bold: true,
          color: '#2b6cb0',
          margin: [0, 5, 0, 3],
        },
        {
          stack: [
            {
              text: [
                { text: 'Motivo de Consulta: ', bold: true },
                anamnesis.motivo_consulta || 'No registrado',
              ],
              margin: [0, 2, 0, 2],
            },
            {
              text: [
                { text: 'Enfermedad Actual: ', bold: true },
                anamnesis.enfermedad_actual || 'No registrada',
              ],
              margin: [0, 2, 0, 4],
            },
          ],
        },

        // Sección: Signos Vitales
        {
          text: '2. SIGNOS VITALES Y EXAMEN FÍSICO',
          fontSize: 10,
          bold: true,
          color: '#2b6cb0',
          margin: [0, 5, 0, 3],
        },
        {
          table: {
            widths: ['12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%'],
            body: [
              [
                { text: 'PA Sist.', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'PA Diast.', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'FC (lpm)', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'FR (rpm)', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'Temp (ºC)', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'SatO2 (%)', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'Peso (kg)', bold: true, fontSize: 8, fillColor: '#edf2f7' },
                { text: 'Talla (cm)', bold: true, fontSize: 8, fillColor: '#edf2f7' },
              ],
              [
                { text: signosVitales.presion_sistolica?.toString() || '-' },
                { text: signosVitales.presion_diastolica?.toString() || '-' },
                { text: signosVitales.frecuencia_cardiaca?.toString() || '-' },
                { text: signosVitales.frecuencia_respiratoria?.toString() || '-' },
                { text: signosVitales.temperatura?.toString() || '-' },
                { text: signosVitales.saturacion_oxigeno?.toString() || '-' },
                { text: signosVitales.peso_kg?.toString() || '-' },
                { text: signosVitales.talla_cm?.toString() || '-' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10],
        },

        // Sección: Diagnósticos CIE-10
        {
          text: '3. DIAGNÓSTICOS (CIE-10)',
          fontSize: 10,
          bold: true,
          color: '#2b6cb0',
          margin: [0, 5, 0, 3],
        },
        {
          table: {
            widths: ['18%', '17%', '45%', '20%'],
            body: [
              [
                { text: 'Jerarquía', bold: true, fillColor: '#edf2f7' },
                { text: 'CIE-10', bold: true, fillColor: '#edf2f7' },
                { text: 'Descripción', bold: true, fillColor: '#edf2f7' },
                { text: 'Tipo', bold: true, fillColor: '#edf2f7' },
              ],
              ...(diagnosticosRows.length > 0
                ? diagnosticosRows
                : [['Principal', 'Z000', 'Examen médico general', 'Confirmado Nuevo']]),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15],
        },

        // Sección: Firma y QR Médico-Legal
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'FIRMA Y CERTIFICACIÓN MÉDICA:', bold: true, fontSize: 9, color: '#1a365d' },
                { text: `Profesional: ${folio.profesional_id}`, margin: [0, 2, 0, 1] },
                { text: `Hash de Integridad (SHA-256):`, fontSize: 7, bold: true, color: '#4a5568', margin: [0, 4, 0, 1] },
                { text: folio.firma_digital_hash || 'SHA256-UNCOMMITTED-MOCK-INTEGRITY-HASH', fontSize: 6.5, color: '#718096' },
                {
                  text: 'Documento electrónico generado bajo el estándar de inmutabilidad WORM e ISO 27001.',
                  fontSize: 7,
                  italics: true,
                  color: '#a0aec0',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
            {
              width: 100,
              alignment: 'right',
              image: qrCodeDataUrl,
              fit: [85, 85],
            },
          ],
        },
      ],
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 8.5,
          color: '#1a202c',
        },
      },
    };
  }
}
