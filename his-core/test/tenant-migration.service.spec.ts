import { TenantMigrationService } from '../src/core/tenancy/services/tenant-migration.service';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('TenantMigrationService', () => {
  let service: TenantMigrationService;
  let mockTenancyConnectionService: any;
  let tenantContextService: any;

  const mockTenant: Tenant = {
    id: 't-test-clinic-001',
    name: 'Clinica El Rosario',
    subdomain: 'elrosario',
    code: 'REPS-9988',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_elrosario',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_rosario',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleSqlFiles = [
    {
      version: '001_adm_pacientes',
      sql: 'CREATE TABLE adm_pacientes (id UUID PRIMARY KEY);',
    },
    {
      version: '002_hc_folios',
      sql: 'CREATE TABLE hc_folios (id UUID PRIMARY KEY);',
    },
  ];

  beforeEach(() => {
    mockTenancyConnectionService = {
      query: jest.fn(),
      transaction: jest.fn().mockImplementation(async (callback) => {
        const client = {
          query: jest.fn().mockResolvedValue({ rows: [] }),
        };
        return callback(client);
      }),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    service = new TenantMigrationService(
      mockTenancyConnectionService,
      tenantContextService,
    );
  });

  it('debe crear sys_schema_migrations y aplicar las migraciones pendientes', async () => {
    // 1. CREATE TABLE sys_schema_migrations
    // 2. SELECT version -> solo tiene '000_init'
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
      .mockResolvedValueOnce({ rows: [{ version: '000_init' }] }); // SELECT

    const result = await service.migrarTenant(mockTenant, sampleSqlFiles);

    expect(result.tenantId).toBe('t-test-clinic-001');
    expect(result.aplicadas).toBe(2);
    expect(result.versionesAplicadas).toEqual([
      '001_adm_pacientes',
      '002_hc_folios',
    ]);
    expect(result.error).toBeNull();

    expect(mockTenancyConnectionService.transaction).toHaveBeenCalledTimes(2);
  });

  it('debe reportar 0 aplicadas si el tenant ya se encuentra al día', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
      .mockResolvedValueOnce({
        rows: [
          { version: '001_adm_pacientes' },
          { version: '002_hc_folios' },
        ],
      }); // SELECT

    const result = await service.migrarTenant(mockTenant, sampleSqlFiles);

    expect(result.aplicadas).toBe(0);
    expect(result.versionesAplicadas).toEqual([]);
    expect(result.error).toBeNull();
    expect(mockTenancyConnectionService.transaction).not.toHaveBeenCalled();
  });

  it('debe capturar el error y retornar status con mensaje de fallo si una migración falla', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
      .mockResolvedValueOnce({ rows: [] }); // SELECT

    mockTenancyConnectionService.transaction.mockRejectedValueOnce(
      new Error('syntax error at or near "INVALID_SQL"'),
    );

    const result = await service.migrarTenant(mockTenant, sampleSqlFiles);

    expect(result.aplicadas).toBe(0);
    expect(result.error).toContain('syntax error at or near "INVALID_SQL"');
  });
});
