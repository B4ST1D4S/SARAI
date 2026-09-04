import { Injectable, Logger } from '@nestjs/common';
import { TenancyConnectionService } from './tenancy-connection.service';
import {
  TenantContextService,
  TenantContext,
} from './tenant-context.service';
import { Tenant } from '../entities/tenant.entity';

export interface SqlMigrationFile {
  version: string;
  sql: string;
}

export interface TenantMigrationResult {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  aplicadas: number;
  versionesAplicadas: string[];
  error: string | null;
}

export const SYS_SCHEMA_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sys_schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  ejecutado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

@Injectable()
export class TenantMigrationService {
  private readonly logger = new Logger(TenantMigrationService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Ejecuta de forma transaccional e idempotente las migraciones pendientes
   * sobre la base de datos dedicada de un tenant específico.
   *
   * @param tenant Entidad del tenant a migrar
   * @param sqlFiles Lista ordenada de archivos de migración (versión y contenido SQL)
   */
  async migrarTenant(
    tenant: Tenant,
    sqlFiles: SqlMigrationFile[],
  ): Promise<TenantMigrationResult> {
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
        this.logger.debug(
          `Iniciando verificación de esquema para tenant [${tenant.id}] (${tenant.subdomain})`,
        );

        // 1. Asegurar la existencia de la tabla de control sys_schema_migrations
        await this.tenancyConnectionService.query(
          SYS_SCHEMA_MIGRATIONS_TABLE_SQL,
        );

        // 2. Consultar las versiones ya ejecutadas
        const executedRes = await this.tenancyConnectionService.query<{
          version: string;
        }>('SELECT version FROM sys_schema_migrations ORDER BY id ASC;');

        const executedVersions = new Set(
          (executedRes.rows || []).map((r) => r.version),
        );

        // 3. Filtrar los archivos pendientes
        const pendingFiles = sqlFiles.filter(
          (f) => !executedVersions.has(f.version),
        );

        // 4. Si no hay pendientes, el tenant está al día
        if (pendingFiles.length === 0) {
          this.logger.log(`Tenant [${tenant.id}] al día.`);
          return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            subdomain: tenant.subdomain,
            aplicadas: 0,
            versionesAplicadas: [],
            error: null,
          };
        }

        this.logger.log(
          `Tenant [${tenant.id}] (${tenant.subdomain}): ${pendingFiles.length} migraciones pendientes por aplicar.`,
        );

        const versionesAplicadas: string[] = [];

        // 5. Ejecutar cada migración dentro de una transacción atómica
        for (const file of pendingFiles) {
          this.logger.log(
            `Aplicando migración [${file.version}] en tenant [${tenant.id}]...`,
          );

          await this.tenancyConnectionService.transaction(async (client) => {
            // Ejecutar el script DDL / DML
            await client.query(file.sql);

            // Registrar la versión aplicada en la tabla de control
            await client.query(
              'INSERT INTO sys_schema_migrations (version) VALUES ($1);',
              [file.version],
            );
          });

          versionesAplicadas.push(file.version);
          this.logger.log(
            `Migración [${file.version}] aplicada con éxito en tenant [${tenant.id}].`,
          );
        }

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          subdomain: tenant.subdomain,
          aplicadas: versionesAplicadas.length,
          versionesAplicadas,
          error: null,
        };
      } catch (err: any) {
        this.logger.error(
          `Fallo al migrar tenant [${tenant.id}] (${tenant.subdomain}): ${err.message}`,
          err.stack,
        );

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          subdomain: tenant.subdomain,
          aplicadas: 0,
          versionesAplicadas: [],
          error: err.message || 'Error desconocido durante la migración',
        };
      }
    });
  }
}
