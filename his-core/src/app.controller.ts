import { Controller, Get } from '@nestjs/common';
import { TenantContextService } from './core/tenancy/services/tenant-context.service';
import { CurrentTenant, TenantId } from './core/tenancy/decorators/current-tenant.decorator';
import { Tenant } from './core/tenancy/entities/tenant.entity';

@Controller()
export class AppController {
  constructor(private readonly tenantContextService: TenantContextService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'SARAI-HIS-Core',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('tenant/me')
  getCurrentTenant(@CurrentTenant() tenant: Tenant, @TenantId() tenantId: string) {
    const alsTenant = this.tenantContextService.getTenant();
    const dbConfig = this.tenantContextService.getTenantDbConfig();

    return {
      success: true,
      tenantId,
      subdomain: alsTenant?.subdomain,
      name: alsTenant?.name,
      plan: alsTenant?.plan,
      database: dbConfig?.database,
    };
  }
}
