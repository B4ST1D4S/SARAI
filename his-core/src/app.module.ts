import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreConfigModule } from './core/config/core-config.module';
import { MasterDatabaseModule } from './core/database/master-database.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { StorageModule } from './core/storage/storage.module';
import { QueueModule } from './core/queue/queue.module';
import { TenantResolverMiddleware } from './core/tenancy/middleware/tenant-resolver.middleware';
import { AppController } from './app.controller';
import { CLINICAL_MODULES } from './modules';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/users/usuarios.module';

@Module({
  imports: [
    CoreConfigModule,
    MasterDatabaseModule,
    TenancyModule,
    StorageModule,
    QueueModule,
    ScheduleModule.forRoot(),
    ...CLINICAL_MODULES,
    AuthModule,
    UsuariosModule,
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

        // Rutas públicas de autenticación (resuelven el tenant desde el body, no desde el middleware)
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST },
        { path: 'api/v1/auth/logout', method: RequestMethod.POST },
        { path: 'auth/me', method: RequestMethod.GET },
        { path: 'api/v1/auth/me', method: RequestMethod.GET },
        { path: 'admin/tenants/onboarding', method: RequestMethod.POST },
        { path: 'api/v1/admin/tenants/onboarding', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
