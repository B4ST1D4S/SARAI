import {
  TenantContextService,
  TenantContext,
} from '../src/core/tenancy/services/tenant-context.service';
import {
  Tenant,
  TenantStatus,
  TenantPlan,
} from '../src/core/tenancy/entities/tenant.entity';

describe('TenantContextService (AsyncLocalStorage)', () => {
  let contextService: TenantContextService;

  const mockTenant: Tenant = {
    id: 'b2c7de88-1111-2222-3333-444455556666',
    name: 'Hospital San Vicente',
    subdomain: 'sanvicente',
    code: 'REPS-05002',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_sanvicente',
    dbHost: 'db.sanvicente.internal',
    dbPort: 5432,
    dbUser: 'usr_sanvicente',
    clinicalSettings: {
      enableHospitalization: true,
      enableEmergencyRoom: true,
    },
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
    contextService = new TenantContextService();
  });

  it('debe retornar undefined si no hay un contexto activo', () => {
    expect(contextService.getContext()).toBeUndefined();
    expect(contextService.getTenant()).toBeUndefined();
    expect(contextService.getTenantId()).toBeUndefined();
    expect(contextService.getSubdomain()).toBeUndefined();
    expect(contextService.getTenantDbConfig()).toBeUndefined();
  });

  it('debe propagar y recuperar el contexto dentro de run()', () => {
    contextService.run(mockContext, () => {
      expect(contextService.getContext()).toEqual(mockContext);
      expect(contextService.getTenant()).toEqual(mockTenant);
      expect(contextService.getTenantId()).toBe(mockTenant.id);
      expect(contextService.getSubdomain()).toBe('sanvicente');
      expect(contextService.getTenantDbConfig()?.database).toBe(
        'his_tenant_sanvicente',
      );
      expect(contextService.getRequiredTenantId()).toBe(mockTenant.id);
      expect(contextService.getRequiredTenant()).toEqual(mockTenant);
    });

    // Fuera del run() debe volver a ser undefined
    expect(contextService.getContext()).toBeUndefined();
  });

  it('debe mantener aislamiento entre diferentes ejecuciones asíncronas concurrentes', async () => {
    const tenantA: TenantContext = {
      ...mockContext,
      tenantId: 'tenant-a-id',
      subdomain: 'clinica-a',
    };

    const tenantB: TenantContext = {
      ...mockContext,
      tenantId: 'tenant-b-id',
      subdomain: 'clinica-b',
    };

    const taskA = () =>
      new Promise<void>((resolve) => {
        contextService.run(tenantA, async () => {
          await new Promise((r) => setTimeout(r, 20));
          expect(contextService.getTenantId()).toBe('tenant-a-id');
          expect(contextService.getSubdomain()).toBe('clinica-a');
          resolve();
        });
      });

    const taskB = () =>
      new Promise<void>((resolve) => {
        contextService.run(tenantB, async () => {
          await new Promise((r) => setTimeout(r, 10));
          expect(contextService.getTenantId()).toBe('tenant-b-id');
          expect(contextService.getSubdomain()).toBe('clinica-b');
          resolve();
        });
      });

    await Promise.all([taskA(), taskB()]);
  });

  it('debe lanzar excepción con getRequiredTenantId si no hay contexto', () => {
    expect(() => contextService.getRequiredTenantId()).toThrow(
      /No se encontró un TenantContext activo/,
    );
  });
});
