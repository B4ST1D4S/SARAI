import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from './audit.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';

@Injectable()
export class AuditSchedulerService {
  private readonly logger = new Logger(AuditSchedulerService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Programa el archivado y purga diario de registros de auditoría hacia almacenamiento frío
   * (DigitalOcean Spaces S3 con cifrado AES-256) según los controles ISO/IEC 27001 (A.8.10 y A.8.15).
   *
   * Se ejecuta automáticamente todos los días a las 02:00 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async programarArchivadoDiario(): Promise<void> {
    this.logger.log(
      'Iniciando tarea programada de archivado diario de auditoría (ISO 27001)...',
    );

    try {
      const tenantsActivos = await this.tenantService.obtenerTenantsActivos();
      this.logger.log(
        `Se encontraron ${tenantsActivos.length} tenants activos para encolar archivado de logs.`,
      );

      for (const clinica of tenantsActivos) {
        try {
          await this.auditService.encolarArchivadoLogs(clinica.id);
          this.logger.debug(
            `Archivado encolado exitosamente para tenant: ${clinica.name} (${clinica.id})`,
          );
        } catch (err: any) {
          this.logger.error(
            `Error al encolar archivado de auditoría para tenant [${clinica.id}]: ${err.message}`,
            err.stack,
          );
        }
      }

      this.logger.log(
        'Tarea programada de archivado diario de auditoría finalizada.',
      );
    } catch (error: any) {
      this.logger.error(
        `Error crítico durante la ejecución de la tarea programada de auditoría: ${error.message}`,
        error.stack,
      );
    }
  }
}
