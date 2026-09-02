import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './services/tenant.service';
import { TenantContextService } from './services/tenant-context.service';
import { TenancyConnectionService } from './services/tenancy-connection.service';
import { TenantResolverMiddleware } from './middleware/tenant-resolver.middleware';
import { MASTER_CONNECTION_NAME } from '../database/master-database.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant], MASTER_CONNECTION_NAME),
  ],
  providers: [
    TenantService,
    TenantContextService,
    TenancyConnectionService,
    TenantResolverMiddleware,
  ],
  exports: [
    TenantService,
    TenantContextService,
    TenancyConnectionService,
    TenantResolverMiddleware,
    TypeOrmModule,
  ],
})
export class TenancyModule {}
