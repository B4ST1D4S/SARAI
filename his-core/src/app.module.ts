import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { CoreConfigModule } from './core/config/core-config.module';
import { MasterDatabaseModule } from './core/database/master-database.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { StorageModule } from './core/storage/storage.module';
import { QueueModule } from './core/queue/queue.module';
import { TenantResolverMiddleware } from './core/tenancy/middleware/tenant-resolver.middleware';
import { AppController } from './app.controller';
import { CLINICAL_MODULES } from './modules';

@Module({
  imports: [
    CoreConfigModule,
    MasterDatabaseModule,
    TenancyModule,
    StorageModule,
    QueueModule,
    ...CLINICAL_MODULES,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantResolverMiddleware)
      .exclude(
        // Rutas públicas de health check
        { path: 'health', method: RequestMethod.ALL },
        { path: 'api/v1/health', method: RequestMethod.ALL },

        // Rutas públicas de autenticación y gestión a nivel maestro (Superadmin)
        { path: 'auth/master/(.*)', method: RequestMethod.ALL },
        { path: 'api/v1/auth/master/(.*)', method: RequestMethod.ALL },
        { path: 'admin/tenants/onboarding', method: RequestMethod.POST },
        { path: 'api/v1/admin/tenants/onboarding', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
