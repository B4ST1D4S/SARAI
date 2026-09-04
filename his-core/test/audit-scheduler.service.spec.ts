import { AuditSchedulerService } from '../src/modules/audit/services/audit-scheduler.service';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('AuditSchedulerService (@Cron ISO 27001 Log Retention)', () => {
  let service: AuditSchedulerService;
  let mockAuditService: any;
  let mockTenantService: any;

  const mockTenantsActivos: Tenant[] = [
    {
      id: 't-clinica-1',
      name: 'Clínica San José',
      subdomain: 'sanjose',
      code: 'REPS-001',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.HOSPITAL_ENTERPRISE,
      dbName: 'his_tenant_sanjose',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'usr_sanjose',
      clinicalSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 't-clinica-2',
      name: 'Centro Médico Del Prado',
      subdomain: 'delprado',
      code: 'REPS-002',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.PROFESSIONAL,
      dbName: 'his_tenant_delprado',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'usr_delprado',
      clinicalSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockAuditService = {
      encolarArchivadoLogs: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    mockTenantService = {
      obtenerTenantsActivos: jest.fn().mockResolvedValue(mockTenantsActivos),
    };

    service = new AuditSchedulerService(mockAuditService, mockTenantService);
  });

  it('debe encolar el archivado diario para todas las clínicas activas', async () => {
    await service.programarArchivadoDiario();

    expect(mockTenantService.obtenerTenantsActivos).toHaveBeenCalled();
    expect(mockAuditService.encolarArchivadoLogs).toHaveBeenCalledTimes(2);
    expect(mockAuditService.encolarArchivadoLogs).toHaveBeenCalledWith('t-clinica-1');
    expect(mockAuditService.encolarArchivadoLogs).toHaveBeenCalledWith('t-clinica-2');
  });

  it('debe continuar procesando clínicas si una arroja error al encolar', async () => {
    mockAuditService.encolarArchivadoLogs
      .mockRejectedValueOnce(new Error('Queue connection timeout'))
      .mockResolvedValueOnce({ id: 'job-2' });

    await service.programarArchivadoDiario();

    expect(mockAuditService.encolarArchivadoLogs).toHaveBeenCalledTimes(2);
    expect(mockAuditService.encolarArchivadoLogs).toHaveBeenCalledWith('t-clinica-2');
  });
});
