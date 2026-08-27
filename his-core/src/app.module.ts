import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { CoreConfigModule } from './core/config/core-config.module';
import { MasterDatabaseModule } from './core/database/master-database.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { TenantResolverMiddleware } from './core/tenancy/middleware/tenant-resolver.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    CoreConfigModule,
    MasterDatabaseModule,
    TenancyModule,
    // Módulos funcionales de negocio bajo src/modules/ se registran aquí
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
