import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { MigrationRunnerService } from '../core/tenancy/services/migration-runner.service';

async function bootstrap() {
  const logger = new Logger('MigrateTenantsCLI');
  logger.log('🚀 Iniciando runner de migraciones de base de datos para tenants...');

  const startTime = Date.now();
  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule, {
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

    if (report.resultados.length > 0) {
      console.log('\n📋 Detalle por Institución:');
      console.table(
        report.resultados.map((r) => ({
          Institución: r.tenantName,
          Subdominio: r.subdomain,
          Aplicadas: r.aplicadas,
          Estado: r.status,
          Error: r.error ? r.error.substring(0, 40) + '...' : 'Ninguno',
        })),
      );
    }

    if (report.totalErrores > 0) {
      console.log('\n❌ Detalle de Errores:');
      report.tenantsConError.forEach((e) => {
        console.error(`  - [${e.tenantName}] (${e.tenantId}): ${e.error}`);
      });

      await app.close();
      logger.error('❌ Proceso de migración finalizado con errores.');
      process.exit(1);
    } else {
      await app.close();
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
