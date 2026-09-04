import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AuditService } from './modules/audit/services/audit.service';
import { TenantContextService } from './core/tenancy/services/tenant-context.service';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';

async function bootstrap() {
  const logger = new Logger('HIS-Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const appName = configService.get<string>('app.name', 'SARAI-HIS-Core');
  const env = configService.get<string>('app.nodeEnv', 'development');

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Registro del Interceptor Global de Auditoría ISO/IEC 27001 (A.8.15 Logging)
  const auditService = app.get(AuditService);
  const tenantContextService = app.get(TenantContextService);
  app.useGlobalInterceptors(
    new AuditInterceptor(auditService, tenantContextService),
  );

  // CORS para frontend de salud y clínicas
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(port);
  logger.log(`🚀 [${appName}] running in [${env}] mode on port ${port}`);
  logger.log(`🏥 Health check ready at: http://localhost:${port}/api/v1/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal error starting HIS application:', err);
  process.exit(1);
});
