import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Logger, Module } from '@nestjs/common';
import { CoreConfigModule } from '../core/config/core-config.module';
import { MasterDatabaseModule } from '../core/database/master-database.module';
import { TenancyModule } from '../core/tenancy/tenancy.module';
import { MigrationRunnerService } from '../core/tenancy/services/migration-runner.service';

// Módulo exclusivo para CLI: sin Redis ni BullMQ
@Module({
  imports: [CoreConfigModule, MasterDatabaseModule, TenancyModule],
})
class MigrationCliModule {}

async function bootstrap() {
  const logger = new Logger('MigrateTenantsCLI');
  logger.log('🚀 Iniciando runner de migraciones de base de datos para tenants...');

  const startTime = Date.now();
  let app;

  try {
    // Levanta solo la base de datos y tenancy, ignorando colas
    app = await NestFactory.createApplicationContext(MigrationCliModule, {
      logger: ['error', 'warn', 'log'],
    });

    const migrationRunner = app.get(MigrationRunnerService);
    const concurrency = process.env.MIGRATION_CONCURRENCY
      ? parseInt(process.env.MIGRATION_CONCURRENCY, 10)
      : 5;

    const report = await migrationRunner.ejecutarMigracionesMasivas(concurrency);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n===============================================================');
    console.log(`📊 RESUMEN DE MIGRACIÓN MASIVA DE TENANTS (${duration}s)`);
    console.log('===============================================================');
    console.log(`• Total Tenants Evaluados: ${report.totalTenants}`);
    console.log(`• Tenants Actualizados OK: ${report.totalExitosos}`);
    console.log(`• Tenants con Error:       ${report.totalErrores}`);
    console.log(`• Migraciones Evaluadas:   ${report.migracionesCargadas}`);
    console.log('---------------------------------------------------------------');

    if (report.resultados && report.resultados.length > 0) {
      console.log('\n📋 Detalle por Institución:');
      console.table(
        report.resultados.map((r: any) => ({
          Institución: r.tenantName,
          Subdominio: r.subdomain,
          Aplicadas: r.aplicadas,
          Estado: r.status,
          Error: r.error ? r.error.substring(0, 40) + '...' : 'Ninguno',
        })),
      );
    }

    // En migrate-tenants.ts, dentro de bootstrap():
    if (report.totalErrores > 0) {
      logger.error('❌ Proceso de migración finalizado con errores.');
      process.exit(1);
    } else {
      logger.log('✅ Todas las bases de datos de tenants se encuentran al día.');
      process.exit(0);
    }
  } catch (error: any) {
    logger.error(
      `💥 Error fatal al ejecutar script de migraciones: ${error.message}`,
      error.stack,
    );
    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

bootstrap();