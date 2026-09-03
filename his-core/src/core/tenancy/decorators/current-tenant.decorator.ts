import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextService } from '../services/tenant-context.service';

const contextService = new TenantContextService();

/**
 * Decorador para obtener la entidad Tenant o una propiedad de ella desde el contexto ALS / Request.
 * Ejemplo:
 *   @Get()
 *   getPerfil(@CurrentTenant() tenant: Tenant) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const tenant = req?.tenant ?? contextService.getTenant();

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
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req?.tenantId ?? req?.tenant?.id ?? contextService.getTenantId();
  },
);

