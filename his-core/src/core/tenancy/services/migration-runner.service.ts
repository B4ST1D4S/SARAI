import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TenantService } from './tenant.service';
import {
  TenantMigrationService,
  SqlMigrationFile,
  TenantMigrationResult,
} from './tenant-migration.service';

export interface MassMigrationReport {
  totalTenants: number;
  totalExitosos: number;
  totalErrores: number;
  migracionesCargadas: number;
  resultados: Array<{
    tenantId: string;
    tenantName: string;
    subdomain: string;
    aplicadas: number;
    versionesAplicadas: string[];
    status: 'OK' | 'ERROR';
    error: string | null;
  }>;
  tenantsConError: Array<{
    tenantId: string;
    tenantName: string;
    error: string;
  }>;
}

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantMigrationService: TenantMigrationService,
  ) {}

  /**
   * Carga y ordena alfanuméricamente los archivos SQL de migración desde el directorio especificado.
   *
   * @param customDir Directorio personalizado opcional
   */
  public cargarArchivosMigracion(customDir?: string): SqlMigrationFile[] {
    const candidates = [
      customDir,
      path.resolve(process.cwd(), 'src/database/migrations/tenants'),
      path.resolve(process.cwd(), 'dist/database/migrations/tenants'),
      path.resolve(__dirname, '../../../database/migrations/tenants'),
    ].filter(Boolean) as string[];

    let migrationsDir = '';
    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        migrationsDir = dir;
        break;
      }
    }

    if (!migrationsDir) {
      this.logger.warn(
        `No se encontró el directorio de migraciones de tenants. Rutas evaluadas: ${candidates.join(', ')}`,
      );
      return [];
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const sqlFiles: SqlMigrationFile[] = files.map((filename) => {
      const fullPath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(fullPath, 'utf-8');
      const version = path.basename(filename, '.sql');
      return { version, sql };
    });

    this.logger.log(
      `Se cargaron ${sqlFiles.length} archivos de migración desde [${migrationsDir}]: ${sqlFiles.map((f) => f.version).join(', ')}`,
    );

    return sqlFiles;
  }

  /**
   * Ejecuta en paralelo controlado (pool de concurrencia) las migraciones pendientes
   * para todos los tenants activos de la base de datos maestra.
   *
   * @param concurrencia Número de tenants a procesar simultáneamente (default: 5)
   * @param customDir Directorio personalizado opcional de migraciones
   */
  async ejecutarMigracionesMasivas(
    concurrencia = 5,
    customDir?: string,
  ): Promise<MassMigrationReport> {
    this.logger.log(
      `=== Iniciando Runner de Migraciones Masivas por Tenant (Concurrencia: ${concurrencia}) ===`,
    );

    // 1. Cargar archivos SQL ordenados
    const sqlFiles = this.cargarArchivosMigracion(customDir);

    // 2. Obtener todos los tenants activos
    const tenantsActivos = await this.tenantService.obtenerTenantsActivos();
    this.logger.log(
      `Se encontraron ${tenantsActivos.length} tenants activos registrados en his_master.`,
    );

    if (tenantsActivos.length === 0) {
      this.logger.warn('No hay tenants activos para migrar.');
      return {
        totalTenants: 0,
        totalExitosos: 0,
        totalErrores: 0,
        migracionesCargadas: sqlFiles.length,
        resultados: [],
        tenantsConError: [],
      };
    }

    // 3. Configurar limitador de concurrencia (soporte para p-limit o pool nativo)
    let limiter: <T>(fn: () => Promise<T>) => Promise<T>;
    try {
      const pLimitModule = await import('p-limit');
      const pLimit = (pLimitModule.default || pLimitModule) as any;
      limiter = pLimit(concurrencia);
    } catch {
      // Fallback a ejecución con pool de concurrencia nativo
      limiter = this.crearLimiterNativo(concurrencia);
    }

    // 4. Mapear cada tenant a una promesa controlada por el limitador
    const tareas = tenantsActivos.map((tenant) =>
      limiter(async () => {
        return this.tenantMigrationService.migrarTenant(tenant, sqlFiles);
      }),
    );

    const resultadosIndividuales: TenantMigrationResult[] =
      await Promise.all(tareas);

    // 5. Consolidar métricas y reporte
    const report: MassMigrationReport = {
      totalTenants: tenantsActivos.length,
      totalExitosos: 0,
      totalErrores: 0,
      migracionesCargadas: sqlFiles.length,
      resultados: [],
      tenantsConError: [],
    };

    for (const res of resultadosIndividuales) {
      const isOk = !res.error;
      if (isOk) {
        report.totalExitosos++;
      } else {
        report.totalErrores++;
        report.tenantsConError.push({
          tenantId: res.tenantId,
          tenantName: res.tenantName,
          error: res.error!,
        });
      }

      report.resultados.push({
        tenantId: res.tenantId,
        tenantName: res.tenantName,
        subdomain: res.subdomain,
        aplicadas: res.aplicadas,
        versionesAplicadas: res.versionesAplicadas,
        status: isOk ? 'OK' : 'ERROR',
        error: res.error,
      });
    }

    this.logger.log(
      `=== Fin de Migraciones Masivas: ${report.totalExitosos}/${report.totalTenants} exitosos, ${report.totalErrores} fallidos ===`,
    );

    return report;
  }

  /**
   * Implementación de fallback para limitar concurrencia si p-limit no está disponible.
   */
  private crearLimiterNativo(concurrencia: number) {
    let activos = 0;
    const cola: (() => void)[] = [];

    const siguiente = () => {
      if (cola.length > 0 && activos < concurrencia) {
        activos++;
        const fn = cola.shift()!;
        fn();
      }
    };

    return <T>(task: () => Promise<T>): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const ejecutar = () => {
          task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
              activos--;
              siguiente();
            });
        };

        if (activos < concurrencia) {
          activos++;
          ejecutar();
        } else {
          cola.push(ejecutar);
        }
      });
    };
  }
}
