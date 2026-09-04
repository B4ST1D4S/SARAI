import { MigrationRunnerService } from '../src/core/tenancy/services/migration-runner.service';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('MigrationRunnerService (Mass Tenant Migrations)', () => {
  let runner: MigrationRunnerService;
  let mockTenantService: any;
  let mockTenantMigrationService: any;

  const mockTenants: Tenant[] = [
    {
      id: 't-1',
      name: 'Clínica Uno',
      subdomain: 'uno',
      code: 'REPS-01',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.HOSPITAL_ENTERPRISE,
      dbName: 'his_tenant_uno',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'usr_uno',
      clinicalSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 't-2',
      name: 'Clínica Dos',
      subdomain: 'dos',
      code: 'REPS-02',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.PROFESSIONAL,
      dbName: 'his_tenant_dos',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'usr_dos',
      clinicalSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockTenantService = {
      obtenerTenantsActivos: jest.fn().mockResolvedValue(mockTenants),
    };

    mockTenantMigrationService = {
      migrarTenant: jest.fn(),
    };

    runner = new MigrationRunnerService(
      mockTenantService,
      mockTenantMigrationService,
    );
  });

  it('debe cargar los archivos SQL de migraciones', () => {
    const files = runner.cargarArchivosMigracion();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files[0].version).toBe('001_adm_pacientes');
    expect(files[0].sql).toContain('CREATE TABLE IF NOT EXISTS adm_pacientes');
  });

  it('debe ejecutar migraciones masivas exitosamente para todos los tenants activos', async () => {
    mockTenantMigrationService.migrarTenant
      .mockResolvedValueOnce({
        tenantId: 't-1',
        tenantName: 'Clínica Uno',
        subdomain: 'uno',
        aplicadas: 1,
        versionesAplicadas: ['001_adm_pacientes'],
        error: null,
      })
      .mockResolvedValueOnce({
        tenantId: 't-2',
        tenantName: 'Clínica Dos',
        subdomain: 'dos',
        aplicadas: 0,
        versionesAplicadas: [],
        error: null,
      });

    const report = await runner.ejecutarMigracionesMasivas(2);

    expect(report.totalTenants).toBe(2);
    expect(report.totalExitosos).toBe(2);
    expect(report.totalErrores).toBe(0);
    expect(report.tenantsConError).toHaveLength(0);
    expect(report.resultados).toHaveLength(2);
    expect(mockTenantMigrationService.migrarTenant).toHaveBeenCalledTimes(2);
  });

  it('debe consolidar el reporte identificando tenants con error', async () => {
    mockTenantMigrationService.migrarTenant
      .mockResolvedValueOnce({
        tenantId: 't-1',
        tenantName: 'Clínica Uno',
        subdomain: 'uno',
        aplicadas: 1,
        versionesAplicadas: ['001_adm_pacientes'],
        error: null,
      })
      .mockResolvedValueOnce({
        tenantId: 't-2',
        tenantName: 'Clínica Dos',
        subdomain: 'dos',
        aplicadas: 0,
        versionesAplicadas: [],
        error: 'Connection terminated unexpectedly',
      });

    const report = await runner.ejecutarMigracionesMasivas(2);

    expect(report.totalTenants).toBe(2);
    expect(report.totalExitosos).toBe(1);
    expect(report.totalErrores).toBe(1);
    expect(report.tenantsConError).toEqual([
      {
        tenantId: 't-2',
        tenantName: 'Clínica Dos',
        error: 'Connection terminated unexpectedly',
      },
    ]);
  });

  it('debe manejar el caso donde no hay tenants activos', async () => {
    mockTenantService.obtenerTenantsActivos.mockResolvedValueOnce([]);

    const report = await runner.ejecutarMigracionesMasivas(5);

    expect(report.totalTenants).toBe(0);
    expect(report.totalExitosos).toBe(0);
    expect(report.totalErrores).toBe(0);
    expect(report.resultados).toHaveLength(0);
  });
});
