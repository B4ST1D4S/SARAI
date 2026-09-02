import { AuditService } from '../src/modules/audit/services/audit.service';
import { QUEUES, JOBS } from '../src/core/queue/constants/queue.constants';
import { CreateAuditLogDto } from '../src/modules/audit/dto/create-audit-log.dto';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockQueue: any;
  let mockTenancyConnectionService: any;
  let mockTenantService: any;
  let tenantContextService: any;

  const mockTenant: Tenant = {
    id: 't-audit-tenant-123',
    name: 'Hospital San Rafael',
    subdomain: 'sanrafael',
    code: 'REPS-8877',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_sanrafael',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_sanrafael',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123', name: JOBS.ARCHIVE_OLD_LOGS }),
    };

    mockTenancyConnectionService = {
      query: jest.fn().mockResolvedValue({ rows: [{ id: 'log-uuid-999' }] }),
    };

    mockTenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    service = new AuditService(
      mockQueue,
      mockTenancyConnectionService,
      mockTenantService,
      tenantContextService,
    );
  });

  describe('registrarLog', () => {
    it('debe registrar un evento de auditoría en sys_logs_recientes del tenant correspondiente', async () => {
      const tenantId = 't-audit-tenant-123';
      const logDto: CreateAuditLogDto = {
        usuarioIdHis: '11111111-2222-3333-4444-555555555555',
        tipoEvento: 'CREAR_FOLIO',
        modulo: 'HISTORIA_CLINICA',
        recursoAfectado: 'hc_folios',
        recursoId: 'folio-abc-123',
        logData: { ip: '10.0.0.1', accion: 'Creación de folio consulta externa' },
      };

      const result = await service.registrarLog(tenantId, logDto);

      expect(result).toEqual({ logId: 'log-uuid-999' });
      expect(mockTenantService.findById).toHaveBeenCalledWith(tenantId);
      expect(tenantContextService.run).toHaveBeenCalledTimes(1);

      expect(mockTenancyConnectionService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sys_logs_recientes'),
        [
          logDto.usuarioIdHis,
          logDto.tipoEvento,
          logDto.modulo,
          logDto.recursoAfectado,
          logDto.recursoId,
          JSON.stringify(logDto.logData),
        ],
      );
    });
  });

  describe('encolarArchivadoLogs', () => {
    it('debe encolar un trabajo en BullMQ con el nombre JOBS.ARCHIVE_OLD_LOGS', async () => {
      const tenantId = 't-audit-tenant-123';

      const job = await service.encolarArchivadoLogs(tenantId);

      expect(mockQueue.add).toHaveBeenCalledWith(
        JOBS.ARCHIVE_OLD_LOGS,
        { tenantId },
        expect.objectContaining({
          jobId: expect.stringContaining(`archive-logs-${tenantId}`),
        }),
      );
      expect(job.id).toBe('job-123');
    });
  });
});
