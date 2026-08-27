import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Tenant } from '../entities/tenant.entity';

export interface TenantDbConfig {
  host?: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
}

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  code: string;
  tenant: Tenant;
  dbConfig: TenantDbConfig;
}

@Injectable()
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  /**
   * Ejecuta una función síncrona o asíncrona dentro del contexto del tenant proporcionado.
   */
  run<R>(context: TenantContext, callback: () => R): R {
    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Obtiene el contexto completo del tenant para la petición en curso.
   */
  getContext(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Obtiene la entidad Tenant completa de la petición actual.
   */
  getTenant(): Tenant | undefined {
    return this.asyncLocalStorage.getStore()?.tenant;
  }

  /**
   * Obtiene el identificador UUID del tenant actual.
   */
  getTenantId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.tenantId;
  }

  /**
   * Obtiene el subdominio del tenant actual.
   */
  getSubdomain(): string | undefined {
    return this.asyncLocalStorage.getStore()?.subdomain;
  }

  /**
   * Obtiene la configuración de conexión a la base de datos aislada del tenant.
   */
  getTenantDbConfig(): TenantDbConfig | undefined {
    return this.asyncLocalStorage.getStore()?.dbConfig;
  }

  /**
   * Obtiene el ID del tenant garantizando su existencia o lanzando un error descriptivo.
   */
  getRequiredTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error(
        'No se encontró un TenantContext activo en el hilo de ejecución actual.',
      );
    }
    return tenantId;
  }

  /**
   * Obtiene la entidad Tenant garantizando su existencia o lanzando un error descriptivo.
   */
  getRequiredTenant(): Tenant {
    const tenant = this.getTenant();
    if (!tenant) {
      throw new Error(
        'No se encontró un Tenant activo en el hilo de ejecución actual.',
      );
    }
    return tenant;
  }
}
