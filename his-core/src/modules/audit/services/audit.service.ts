import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { QUEUES, JOBS } from '../../../core/queue/constants/queue.constants';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectQueue(QUEUES.AUDIT_LOGS)
    private readonly auditQueue: Queue,
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Registra un nuevo evento de auditoría en la tabla sys_logs_recientes
   * de la base de datos del tenant correspondiente.
   *
   * @param tenantId Identificador UUID del tenant
   * @param logDto Datos del evento de auditoría
   */
  async registrarLog(
    tenantId: string,
    logDto: CreateAuditLogDto,
  ): Promise<{ logId: string }> {
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
      const insertQuery = `
        INSERT INTO sys_logs_recientes (
          usuario_id_his,
          tipo_evento,
          modulo,
          recurso_afectado,
          recurso_id,
          log_data,
          creado_en
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id;
      `;

      const result = await this.tenancyConnectionService.query<{ id: string }>(
        insertQuery,
        [
          logDto.usuarioIdHis ?? null,
          logDto.tipoEvento,
          logDto.modulo,
          logDto.recursoAfectado ?? null,
          logDto.recursoId ?? null,
          JSON.stringify(logDto.logData ?? {}),
        ],
      );

      const logId = result.rows[0].id;
      this.logger.debug(
        `Evento de auditoría [${logDto.tipoEvento}] registrado en tenant [${tenantId}] con ID: ${logId}`,
      );

      return { logId };
    });
  }

  /**
   * Agrega un trabajo a la cola de BullMQ para archivar y purgar
   * los logs antiguos (>30 días) hacia DigitalOcean Spaces.
   *
   * @param tenantId Identificador UUID del tenant
   */
  async encolarArchivadoLogs(
    tenantId: string,
  ): Promise<Job<{ tenantId: string }>> {
    this.logger.log(
      `Encolando trabajo de archivado de logs para tenant [${tenantId}] en cola '${QUEUES.AUDIT_LOGS}'`,
    );

    const job = await this.auditQueue.add(
      JOBS.ARCHIVE_OLD_LOGS,
      { tenantId },
      {
        jobId: `archive-logs-${tenantId}-${Date.now()}`,
      },
    );

    return job;
  }
}
