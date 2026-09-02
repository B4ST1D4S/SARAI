import { InternalServerErrorException } from '@nestjs/common';
import { TenancyConnectionService } from '../src/core/tenancy/services/tenancy-connection.service';
import {
  TenantContextService,
  TenantContext,
} from '../src/core/tenancy/services/tenant-context.service';
import {
  Tenant,
  TenantStatus,
  TenantPlan,
} from '../src/core/tenancy/entities/tenant.entity';

describe('TenancyConnectionService', () => {
  let service: TenancyConnectionService;
  let tenantContextService: TenantContextService;

  const mockTenant: Tenant = {
    id: 't-1111-2222-3333-4444',
    name: 'Clinica Dental Norte',
    subdomain: 'dentalnorte',
    code: 'REPS-99001',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.PROFESSIONAL,
    dbName: 'his_tenant_dentalnorte',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_dental',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContext: TenantContext = {
    tenantId: mockTenant.id,
    subdomain: mockTenant.subdomain,
    code: mockTenant.code,
    tenant: mockTenant,
    dbConfig: {
      host: mockTenant.dbHost,
      port: mockTenant.dbPort,
      database: mockTenant.dbName,
      username: mockTenant.dbUser,
    },
  };

  beforeEach(() => {
    tenantContextService = new TenantContextService();
    service = new TenancyConnectionService(tenantContextService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('debe lanzar excepción si no hay TenantContext activo al solicitar pool', () => {
    expect(() => service.getTenantPool()).toThrow(
      InternalServerErrorException,
    );
  });

  it('debe crear y cachear el pool de conexiones para el tenant en contexto', () => {
    tenantContextService.run(mockContext, () => {
      const pool1 = service.getTenantPool();
      const pool2 = service.getTenantPool();

      expect(pool1).toBeDefined();
      expect(pool2).toBe(pool1); // Misma instancia en caché
    });
  });

  it('debe ejecutar una transacción exitosa con BEGIN, COMMIT y release', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    const mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(service, 'getTenantPool').mockReturnValue(mockPool as any);

    const result = await service.transaction(async (client) => {
      await client.query('SELECT 1');
      return { success: true };
    });

    expect(result).toEqual({ success: true });
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'SELECT 1');
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('debe ejecutar ROLLBACK y liberar cliente si la transacción falla', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    const mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(service, 'getTenantPool').mockReturnValue(mockPool as any);

    await expect(
      service.transaction(async (client) => {
        await client.query('INSERT INTO fail');
        throw new Error('Database integrity constraint violated');
      }),
    ).rejects.toThrow('Database integrity constraint violated');

    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'INSERT INTO fail');
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
