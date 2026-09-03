import { Controller, Get, Query } from '@nestjs/common';
import { TenantContextService } from './core/tenancy/services/tenant-context.service';
import { TenancyConnectionService } from './core/tenancy/services/tenancy-connection.service';
import { CurrentTenant, TenantId } from './core/tenancy/decorators/current-tenant.decorator';
import { Tenant } from './core/tenancy/entities/tenant.entity';

@Controller()
export class AppController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'SARAI-HIS-Core',
      timestamp: new Date().toISOString(),
      activeTenantPools: this.tenancyConnectionService.getActivePoolCount(),
    };
  }

  @Get('tenant/me')
  getCurrentTenant(
    @CurrentTenant() tenant: Tenant,
    @TenantId() tenantId: string,
  ) {
    const alsTenant = this.tenantContextService.getTenant();
    const dbConfig = this.tenantContextService.getTenantDbConfig();

    return {
      success: true,
      tenantId,
      subdomain: alsTenant?.subdomain,
      name: alsTenant?.name,
      nitIps: alsTenant?.nitIps,
      isActive: alsTenant?.isActive,
      planTier: alsTenant?.planTier,
      database: dbConfig?.database,
    };
  }

  @Get('tenant/ping-db')
  async pingTenantDatabase() {
    // Ejecutar consulta directa parametrizada contra la BD del tenant actual
    const result = await this.tenancyConnectionService.query(
      'SELECT NOW() as current_time, current_database() as database_name, version() as pg_version',
    );

    return {
      success: true,
      tenant: this.tenantContextService.getSubdomain(),
      data: result.rows[0],
    };
  }
}
