import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import { QUEUES, JOBS } from '../../../core/queue/constants/queue.constants';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { SpacesStorageService } from '../../../core/storage/services/spaces-storage.service';

const gzipAsync = promisify(zlib.gzip);

export interface ArchiveLogsJobData {
  tenantId: string;
}

export interface ArchiveLogsResult {
  tenantId: string;
  registrosArchivados: number;
  fileKey: string | null;
}

export interface SysLogRecienteRow {
  id: string;
  creado_en: string | Date;
  usuario_id_his: string | null;
  tipo_evento: string;
  modulo: string;
  recurso_afectado: string | null;
  recurso_id: string | null;
  log_data: any;
}

@Processor(QUEUES.AUDIT_LOGS)
export class AuditArchiverWorker extends WorkerHost {
  private readonly logger = new Logger(AuditArchiverWorker.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
    private readonly spacesStorageService: SpacesStorageService,
  ) {
    super();
  }

  /**
   * Procesa los trabajos de la cola de logs de auditoría.
   */
  async process(job: Job<ArchiveLogsJobData>): Promise<ArchiveLogsResult> {
    if (job.name !== JOBS.ARCHIVE_OLD_LOGS) {
      this.logger.warn(
        `Job con nombre no reconocido [${job.name}] ignorado por AuditArchiverWorker.`,
      );
      return {
        tenantId: job.data?.tenantId,
        registrosArchivados: 0,
        fileKey: null,
      };
    }

    const { tenantId } = job.data;
    this.logger.log(
      `Iniciando job de archivado de logs para tenant [${tenantId}] (Job ID: ${job.id})`,
    );

    return this.archivarLogsAntiguos(tenantId);
  }

  /**
   * Ejecuta el flujo transaccional de extracción, compresión gzip, subida a Spaces
   * y purga de logs antiguos (>30 días) para el tenant especificado.
   */
  public async archivarLogsAntiguos(
    tenantId: string,
  ): Promise<ArchiveLogsResult> {
    // 1. Obtener la entidad Tenant para configurar el contexto de base de datos
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

    // 2. Ejecutar la operación dentro del TenantContext aislado
    return this.tenantContextService.run(tenantContext, async () => {
      return this.tenancyConnectionService.transaction(async (client) => {
        // a) Consultar registros antiguos con bloqueo optimista/concurrente FOR UPDATE SKIP LOCKED
        const selectQuery = `
          SELECT id, creado_en, usuario_id_his, tipo_evento, modulo, recurso_afectado, recurso_id, log_data
          FROM sys_logs_recientes
          WHERE creado_en < NOW() - INTERVAL '30 days'
          ORDER BY creado_en ASC
          LIMIT 5000
          FOR UPDATE SKIP LOCKED;
        `;

        const queryResult = await client.query<SysLogRecienteRow>(selectQuery);
        const rows = queryResult.rows;

        if (!rows || rows.length === 0) {
          this.logger.log(
            `No se encontraron logs antiguos (>30 días) para archivar en tenant [${tenantId}].`,
          );
          return {
            tenantId,
            registrosArchivados: 0,
            fileKey: null,
          };
        }

        this.logger.log(
          `Extrayendo y archivando ${rows.length} registros de auditoría para tenant [${tenantId}].`,
        );

        // b) 1. Inyectar 'clinica_id': tenantId a cada registro para trazabilidad e ISO 27001
        const enrichedLogs = rows.map((row) => ({
          ...row,
          clinica_id: tenantId,
        }));

        // b) 2. Serializar array a JSON y comprimir a Buffer gzip
        const jsonString = JSON.stringify(enrichedLogs);
        const gzipBuffer = await gzipAsync(Buffer.from(jsonString, 'utf-8'));

        // b) 3. Generar datePrefix con formato YYYY/MM según la fecha del lote
        const batchDate = rows[0]?.creado_en
          ? new Date(rows[0].creado_en)
          : new Date();
        const year = batchDate.getFullYear();
        const month = String(batchDate.getMonth() + 1).padStart(2, '0');
        const datePrefix = `${year}/${month}`;

        // b) 4. Subir buffer comprimido a DigitalOcean Spaces (AES-256 en reposo)
        const fileKey = await this.spacesStorageService.uploadAuditLogBuffer(
          tenantId,
          datePrefix,
          gzipBuffer,
        );

        // b) 5. Purgar los registros respaldados de la base de datos
        const logIds = rows.map((r) => r.id);
        const deleteQuery = `
          DELETE FROM sys_logs_recientes
          WHERE id = ANY($1::uuid[]);
        `;

        await client.query(deleteQuery, [logIds]);

        this.logger.log(
          `Lote de ${rows.length} logs purgado exitosamente de la base de datos y preservado en Spaces: [${fileKey}]`,
        );

        // b) 6. Retornar resumen del archivado
        return {
          tenantId,
          registrosArchivados: rows.length,
          fileKey,
        };
      });
    });
  }
}
