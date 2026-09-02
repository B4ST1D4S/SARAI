import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { TenantService } from '../services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../services/tenant-context.service';
import { Tenant } from '../entities/tenant.entity';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // 1. Extraer identificador de header (útil para apps móviles, Swagger, integraciones API)
    const headerTenantId = this.extractHeaderTenant(req);

    // 2. Extraer identificador desde el token JWT (Authorization: Bearer <token>)
    const jwtTenant = this.extractJwtTenant(req);

    // 3. Extraer identificador desde el subdominio de la petición
    const subdomainTenant = this.extractSubdomain(req);

    const tenantIdentifier = headerTenantId || jwtTenant || subdomainTenant;

    if (!tenantIdentifier) {
      this.logger.warn(
        `Petición rechazada en [${req.method} ${req.originalUrl}]: No se proporcionó subdominio, token JWT ni header 'x-tenant-id'`,
      );
      throw new UnauthorizedException(
        'Identificador de clínica/tenant no proporcionado en la petición. Debe incluir un subdominio válido (ej: clinica1.hisapp.local), un token JWT con claim de tenant o el header "x-tenant-id".',
      );
    }

    // 3. Consultar y validar en his_master si el tenant existe y está activo
    let tenant: Tenant;

    if (UUID_REGEX.test(tenantIdentifier)) {
      tenant = await this.tenantService.findById(tenantIdentifier);
    } else {
      tenant = await this.tenantService.findBySubdomain(tenantIdentifier);
    }

    // 4. Construir el contexto del tenant
    const context: TenantContext = {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      code: tenant.code,
      tenant,
      dbConfig: {
        host: tenant.dbHost,
        port: tenant.dbPort,
        database: tenant.dbName,
        username: tenant.dbUser,
        password: tenant.dbPassword,
      },
    };

    // 5. Inyectar en headers de respuesta para trazabilidad
    res.setHeader('X-Resolved-Tenant-Id', tenant.id);
    res.setHeader('X-Resolved-Tenant-Subdomain', tenant.subdomain);

    // 6. Ejecutar todo el pipeline downstream dentro del AsyncLocalStorage
    this.tenantContextService.run(context, () => {
      next();
    });
  }

  /**
   * Extrae el tenant desde headers estándar
   */
  private extractHeaderTenant(req: Request): string | null {
    const headerValue =
      req.headers['x-tenant-id'] ||
      req.headers['x-tenant-subdomain'] ||
      req.headers['x-tenant-slug'];

    if (Array.isArray(headerValue)) {
      return headerValue[0]?.trim() || null;
    }

    if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
      return headerValue.trim();
    }

    return null;
  }

  /**
   * Extrae el tenant decodificando de forma segura el payload de un token JWT
   * presente en el header Authorization (Bearer <token>).
   */
  private extractJwtTenant(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    const token = parts[1];
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    try {
      const payloadBase64 = tokenParts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);

      const tenantClaim =
        payload.tenantId ||
        payload.tenant_id ||
        payload.subdomain ||
        payload.tenant?.id ||
        payload.tenant?.subdomain;

      if (typeof tenantClaim === 'string' && tenantClaim.trim().length > 0) {
        return tenantClaim.trim();
      }
    } catch {
      // Si el payload no es base64url/JSON válido, se continúa con la cadena de resolución
      return null;
    }

    return null;
  }

  /**
   * Extrae el subdominio a partir del header Host o X-Forwarded-Host
   */
  private extractSubdomain(req: Request): string | null {
    const rawHost =
      (req.headers['x-forwarded-host'] as string) || req.headers.host || '';

    if (!rawHost) return null;

    // Remover puerto si está presente (ej: "clinica1.hisapp.local:3000" -> "clinica1.hisapp.local")
    const hostWithoutPort = rawHost.split(':')[0].trim().toLowerCase();

    // Si es IP pura o 'localhost' directo, no hay subdominio
    if (
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort) ||
      hostWithoutPort === 'localhost'
    ) {
      return null;
    }

    const baseDomain = this.configService
      .get<string>('app.baseDomain', 'hisapp.local')
      .toLowerCase();

    // Caso 1: host termina con el baseDomain (ej: clinica1.hisapp.local)
    if (
      hostWithoutPort.endsWith(baseDomain) &&
      hostWithoutPort !== baseDomain
    ) {
      const prefix = hostWithoutPort
        .slice(0, hostWithoutPort.length - baseDomain.length)
        .replace(/\.$/, '');

      if (prefix && prefix !== 'www' && prefix !== 'api' && prefix !== 'app') {
        return prefix;
      }
    }

    // Caso 2: resolución genérica por partes divididas por puntos (ej: clinica1.app.com)
    const parts = hostWithoutPort.split('.');
    if (parts.length >= 3) {
      const candidate = parts[0];
      if (
        candidate &&
        candidate !== 'www' &&
        candidate !== 'api' &&
        candidate !== 'app'
      ) {
        return candidate;
      }
    }

    return null;
  }
}
