import { AuditArchiverWorker } from '../src/modules/audit/processors/audit-archiver.worker';
import { JOBS } from '../src/core/queue/constants/queue.constants';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('AuditArchiverWorker', () => {
  let worker: AuditArchiverWorker;
  let mockTenancyConnectionService: any;
  let mockTenantService: any;
  let tenantContextService: any;
  let mockSpacesStorageService: any;
  let mockClient: any;

  const mockTenant: Tenant = {
    id: 't-worker-tenant-777',
    name: 'Clinica Central',
    subdomain: 'central',
    code: 'REPS-1234',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_central',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_central',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleLogs = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      creado_en: '2026-07-01T12:00:00.000Z',
      usuario_id_his: 'u1-uuid',
      tipo_evento: 'LOGIN',
      modulo: 'SEGURIDAD',
      recurso_afectado: 'auth',
      recurso_id: null,
      log_data: { ip: '192.168.1.1' },
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      creado_en: '2026-07-02T15:30:00.000Z',
      usuario_id_his: 'u2-uuid',
      tipo_evento: 'CREAR_FOLIO',
      modulo: 'HISTORIA_CLINICA',
      recurso_afectado: 'hc_folios',
      recurso_id: 'folio-123',
      log_data: { numeroFolio: 10 },
    },
  ];

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockTenancyConnectionService = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockClient);
      }),
    };

    mockTenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    mockSpacesStorageService = {
      uploadAuditLogBuffer: jest.fn().mockResolvedValue(
        'tenants/t-worker-tenant-777/audit-logs/2026/07/mock-uuid-audit.json.gz',
      ),
    };

    worker = new AuditArchiverWorker(
      mockTenancyConnectionService,
      mockTenantService,
      tenantContextService,
      mockSpacesStorageService,
    );
  });

  it('debe ignorar jobs que no correspondan a ARCHIVE_OLD_LOGS', async () => {
    const job: any = {
      name: 'unrecognized-job',
      data: { tenantId: 't-worker-tenant-777' },
      id: 'job-ignore-1',
    };

    const result = await worker.process(job);

    expect(result).toEqual({
      tenantId: 't-worker-tenant-777',
      registrosArchivados: 0,
      fileKey: null,
    });
    expect(mockTenantService.findById).not.toHaveBeenCalled();
  });

  it('debe retornar 0 registros archivados si no hay logs antiguos (>30 días)', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const job: any = {
      name: JOBS.ARCHIVE_OLD_LOGS,
      data: { tenantId: 't-worker-tenant-777' },
      id: 'job-empty-1',
    };

    const result = await worker.process(job);

    expect(result).toEqual({
      tenantId: 't-worker-tenant-777',
      registrosArchivados: 0,
      fileKey: null,
    });

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, creado_en'),
    );
    expect(mockSpacesStorageService.uploadAuditLogBuffer).not.toHaveBeenCalled();
  });

  it('debe extraer logs antiguos, comprimirlos en gzip, subirlos a Spaces y purgarlos de la base de datos', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: sampleLogs }) // SELECT
      .mockResolvedValueOnce({ rows: [] }); // DELETE

    const job: any = {
      name: JOBS.ARCHIVE_OLD_LOGS,
      data: { tenantId: 't-worker-tenant-777' },
      id: 'job-process-1',
    };

    const result = await worker.process(job);

    expect(result).toEqual({
      tenantId: 't-worker-tenant-777',
      registrosArchivados: 2,
      fileKey: 'tenants/t-worker-tenant-777/audit-logs/2026/07/mock-uuid-audit.json.gz',
    });

    // 1. Verificación de consulta con FOR UPDATE SKIP LOCKED
    expect(mockClient.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FOR UPDATE SKIP LOCKED'),
    );

    // 2. Verificación de llamada a Spaces con datePrefix formateado y buffer gzip
    expect(mockSpacesStorageService.uploadAuditLogBuffer).toHaveBeenCalledWith(
      't-worker-tenant-777',
      '2026/07',
      expect.any(Buffer),
    );

    // 3. Verificación de borrado atómico de los IDs respaldados
    expect(mockClient.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM sys_logs_recientes'),
      [['a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002']],
    );
  });

  it('debe fallar y propagar error si la subida a Spaces falla para asegurar que no se borren registros sin respaldo', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: sampleLogs });
    mockSpacesStorageService.uploadAuditLogBuffer.mockRejectedValueOnce(
      new Error('Spaces connection timeout'),
    );

    const job: any = {
      name: JOBS.ARCHIVE_OLD_LOGS,
      data: { tenantId: 't-worker-tenant-777' },
      id: 'job-fail-1',
    };

    await expect(worker.process(job)).rejects.toThrow('Spaces connection timeout');

    // Comprobar que NUNCA se ejecutó el DELETE si la subida falló (integridad de datos)
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM sys_logs_recientes'),
      expect.anything(),
    );
  });
});
