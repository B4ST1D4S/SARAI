import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, JOBS } from '../../../core/queue/constants/queue.constants';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { SpacesStorageService } from '../../../core/storage/services/spaces-storage.service';

export type ClinicalPdfStatus = 'READY' | 'PROCESSING' | 'QUEUED';

export interface ClinicalPdfStatusResponse {
  status: ClinicalPdfStatus;
  url?: string;
  fileKey?: string;
  message?: string;
}

export interface HcFolioPdfStatusRow {
  id: string;
  pdf_estado: 'NO_GENERADO' | 'EN_PROCESO' | 'GENERADO' | 'FALLIDO' | null;
  pdf_file_key: string | null;
}

@Injectable()
export class ClinicalPdfService {
  private readonly logger = new Logger(ClinicalPdfService.name);

  constructor(
    @InjectQueue(QUEUES.CLINICAL_PDF)
    private readonly pdfQueue: Queue,
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly spacesStorageService: SpacesStorageService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Consulta el estado del PDF de un folio clínico o encola su generación
   * bajo el patrón Write-Once, Read-Many (WORM).
   *
   * @param tenantId Identificador UUID del tenant
   * @param folioId Identificador UUID del folio clínico
   */
  async obtenerOEncolarPdfFolio(
    tenantId: string,
    folioId: string,
  ): Promise<ClinicalPdfStatusResponse> {
    if (!tenantId || !folioId) {
      throw new BadRequestException(
        'tenantId y folioId son requeridos para consultar o encolar el PDF clínico.',
      );
    }

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
      // 1. Consultar estado y fileKey en la base de datos del tenant
      const query = `
        UPDATE hc_folios 
        SET pdf_estado = 'EN_PROCESO' 
        WHERE id = $1 AND (pdf_estado IS NULL OR pdf_estado IN ('NO_GENERADO', 'FALLIDO'))
        RETURNING pdf_estado, pdf_file_key;
      `;

      const result =
        await this.tenancyConnectionService.query<HcFolioPdfStatusRow>(query, [
          folioId,
        ]);

      if (!result.rows || result.rows.length === 0) {
        throw new NotFoundException(
          `No se encontró el folio clínico con ID [${folioId}] en el tenant [${tenantId}].`,
        );
      }

      const folio = result.rows[0];

      // Caso A: El PDF ya fue generado previamente y es inmutable (Read-Many)
      if (folio.pdf_estado === 'GENERADO' && folio.pdf_file_key) {
        this.logger.debug(
          `PDF ya existente para folio [${folioId}]. Generando URL de descarga firmada.`,
        );

        const url = await this.spacesStorageService.getPresignedDownloadUrl(
          folio.pdf_file_key,
        );

        return {
          status: 'READY',
          url,
          fileKey: folio.pdf_file_key,
        };
      }

      // Caso B: El PDF está actualmente en proceso de generación
      if (folio.pdf_estado === 'EN_PROCESO') {
        this.logger.debug(
          `PDF para folio [${folioId}] se encuentra actualmente en estado EN_PROCESO.`,
        );

        return {
          status: 'PROCESSING',
          message:
            'El documento se está generando, intente en unos segundos.',
        };
      }

      // Caso C: El PDF aún no se ha generado o falló previamente
      this.logger.log(
        `Iniciando encolado de generación de PDF para folio [${folioId}] (Estado anterior: ${folio.pdf_estado ?? 'NO_GENERADO'})`,
      );

      // Actualizar estado a EN_PROCESO
      await this.tenancyConnectionService.query(
        `UPDATE hc_folios SET pdf_estado = 'EN_PROCESO' WHERE id = $1;`,
        [folioId],
      );

      // Agregar trabajo a la cola de BullMQ
      await this.pdfQueue.add(
        JOBS.GENERATE_CLINICAL_PDF,
        { tenantId, folioId },
        {
          jobId: `clinical-pdf-${tenantId}-${folioId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        status: 'QUEUED',
        message: 'Generación iniciada.',
      };
    });
  }
}
