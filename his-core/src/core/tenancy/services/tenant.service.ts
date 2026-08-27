import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { MASTER_CONNECTION_NAME } from '../../database/master-database.module';
import { CreateTenantDto } from '../dto/create-tenant.dto';

interface CacheEntry {
  tenant: Tenant;
  expiresAt: number;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  // Caché en memoria con TTL para evitar saturar his_master en cada petición HTTP
  private readonly tenantCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  constructor(
    @InjectRepository(Tenant, MASTER_CONNECTION_NAME)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Obtiene un tenant por su subdominio (ej: "sanjose" de "sanjose.hisapp.local")
   */
  async findBySubdomain(subdomain: string): Promise<Tenant> {
    if (!subdomain) {
      throw new NotFoundException('Subdominio de tenant no proporcionado');
    }

    const cleanSubdomain = subdomain.trim().toLowerCase();
    const cacheKey = `subdomain:${cleanSubdomain}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const tenant = await this.tenantRepository.findOne({
      where: { subdomain: cleanSubdomain },
    });

    if (!tenant) {
      throw new NotFoundException(
        `No existe ninguna institución registrada con el subdominio '${cleanSubdomain}'`,
      );
    }

    this.validateTenantAccess(tenant);
    this.setCache(cacheKey, tenant);
    this.setCache(`id:${tenant.id}`, tenant);
    return tenant;
  }

  /**
   * Obtiene un tenant por su identificador UUID
   */
  async findById(tenantId: string): Promise<Tenant> {
    if (!tenantId) {
      throw new NotFoundException('ID de tenant no proporcionado');
    }

    const cacheKey = `id:${tenantId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Institución con ID '${tenantId}' no encontrada en el sistema`,
      );
    }

    this.validateTenantAccess(tenant);
    this.setCache(cacheKey, tenant);
    this.setCache(`subdomain:${tenant.subdomain}`, tenant);
    return tenant;
  }

  /**
   * Obtiene un tenant por su código institucional (NIT / REPS)
   */
  async findByCode(code: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { code: code.trim() },
    });
  }

  /**
   * Crea un nuevo Tenant en la base de datos maestra his_master
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    const cleanSubdomain = dto.subdomain.trim().toLowerCase();

    const existingSubdomain = await this.tenantRepository.findOne({
      where: { subdomain: cleanSubdomain },
    });

    if (existingSubdomain) {
      throw new ConflictException(
        `El subdominio '${cleanSubdomain}' ya se encuentra en uso`,
      );
    }

    const existingCode = await this.tenantRepository.findOne({
      where: { code: dto.code.trim() },
    });

    if (existingCode) {
      throw new ConflictException(
        `El código institucional '${dto.code}' ya se encuentra registrado`,
      );
    }

    const tenant = this.tenantRepository.create({
      ...dto,
      subdomain: cleanSubdomain,
      status: dto.status ?? TenantStatus.ACTIVE,
      clinicalSettings: dto.clinicalSettings ?? {},
    });

    const savedTenant = await this.tenantRepository.save(tenant);
    this.logger.log(
      `Nuevo Tenant creado exitosamente: ${savedTenant.name} (${savedTenant.subdomain})`,
    );

    return savedTenant;
  }

  /**
   * Actualiza el estado de un tenant e invalida su caché
   */
  async updateStatus(
    tenantId: string,
    status: TenantStatus,
  ): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    tenant.status = status;
    const updated = await this.tenantRepository.save(tenant);

    this.invalidateCache(updated.id, updated.subdomain);
    return updated;
  }

  /**
   * Valida que el tenant tenga permiso para operar en el sistema
   */
  private validateTenantAccess(tenant: Tenant): void {
    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenException(
        `El acceso para la institución '${tenant.name}' se encuentra suspendido. Por favor contacte al soporte administrativo.`,
      );
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException(
        `La institución '${tenant.name}' no está en estado activo (${tenant.status}).`,
      );
    }
  }

  private getFromCache(key: string): Tenant | null {
    const entry = this.tenantCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.tenantCache.delete(key);
      return null;
    }
    return entry.tenant;
  }

  private setCache(key: string, tenant: Tenant): void {
    this.tenantCache.set(key, {
      tenant,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  public invalidateCache(tenantId?: string, subdomain?: string): void {
    if (tenantId) this.tenantCache.delete(`id:${tenantId}`);
    if (subdomain)
      this.tenantCache.delete(`subdomain:${subdomain.trim().toLowerCase()}`);
  }

  public clearAllCache(): void {
    this.tenantCache.clear();
  }
}
