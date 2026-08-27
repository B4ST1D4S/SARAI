import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Decorador para obtener la entidad Tenant o una propiedad de ella desde el contexto ALS.
 * Ejemplo:
 *   @Get()
 *   getPerfil(@CurrentTenant() tenant: Tenant) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Aunque se puede extraer de ALS directamente:
    const alsService = new TenantContextService();
    const tenant = alsService.getTenant();

    if (!tenant) return undefined;
    return data ? (tenant as any)[data] : tenant;
  },
);

/**
 * Decorador para obtener el tenantId actual.
 * Ejemplo:
 *   @Get()
 *   getCitas(@TenantId() tenantId: string) { ... }
 */
export const TenantId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext) => {
    const alsService = new TenantContextService();
    return alsService.getTenantId();
  },
);
