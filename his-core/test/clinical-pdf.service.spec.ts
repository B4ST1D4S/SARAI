import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ClinicalPdfService } from '../src/modules/clinical-record/services/clinical-pdf.service';
import { JOBS } from '../src/core/queue/constants/queue.constants';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('ClinicalPdfService (WORM Pattern & BullMQ)', () => {
  let service: ClinicalPdfService;
  let mockQueue: any;
  let mockTenancyConnectionService: any;
  let mockSpacesStorageService: any;
  let mockTenantService: any;
  let tenantContextService: any;

  const mockTenant: Tenant = {
    id: 't-tenant-pdf-001',
    name: 'Clinica Las Americas',
    subdomain: 'lasamericas',
    code: 'REPS-9988',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_lasamericas',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_americas',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-pdf-1', name: JOBS.GENERATE_CLINICAL_PDF }),
    };

    mockTenancyConnectionService = {
      query: jest.fn(),
    };

    mockSpacesStorageService = {
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://spaces.download/folio-123.pdf'),
    };

    mockTenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    service = new ClinicalPdfService(
      mockQueue,
      mockTenancyConnectionService,
      mockSpacesStorageService,
      mockTenantService,
      tenantContextService,
    );
  });

  it('debe lanzar BadRequestException si faltan parámetros requeridos', async () => {
    await expect(service.obtenerOEncolarPdfFolio('', 'folio-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.obtenerOEncolarPdfFolio('t1', '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe lanzar NotFoundException si el folio no existe en la base de datos', async () => {
    mockTenancyConnectionService.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      service.obtenerOEncolarPdfFolio('t-tenant-pdf-001', 'folio-inexistente'),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe retornar READY con URL prefirmada si el PDF ya fue GENERADO (Read-Many)', async () => {
    mockTenancyConnectionService.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'folio-123',
          pdf_estado: 'GENERADO',
          pdf_file_key: 'tenants/t-tenant-pdf-001/clinical-records/folio-123.pdf',
        },
      ],
    });

    const result = await service.obtenerOEncolarPdfFolio(
      't-tenant-pdf-001',
      'folio-123',
    );

    expect(result).toEqual({
      status: 'READY',
      url: 'https://spaces.download/folio-123.pdf',
      fileKey: 'tenants/t-tenant-pdf-001/clinical-records/folio-123.pdf',
    });
    expect(mockSpacesStorageService.getPresignedDownloadUrl).toHaveBeenCalledWith(
      'tenants/t-tenant-pdf-001/clinical-records/folio-123.pdf',
    );
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('debe retornar PROCESSING si el PDF se encuentra en estado EN_PROCESO', async () => {
    mockTenancyConnectionService.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'folio-123',
          pdf_estado: 'EN_PROCESO',
          pdf_file_key: null,
        },
      ],
    });

    const result = await service.obtenerOEncolarPdfFolio(
      't-tenant-pdf-001',
      'folio-123',
    );

    expect(result).toEqual({
      status: 'PROCESSING',
      message: 'El documento se está generando, intente en unos segundos.',
    });
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('debe actualizar a EN_PROCESO y encolar el trabajo en BullMQ si el PDF está NO_GENERADO o FALLIDO', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'folio-123',
            pdf_estado: 'NO_GENERADO',
            pdf_file_key: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE

    const result = await service.obtenerOEncolarPdfFolio(
      't-tenant-pdf-001',
      'folio-123',
    );

    expect(result).toEqual({
      status: 'QUEUED',
      message: 'Generación iniciada.',
    });

    expect(mockTenancyConnectionService.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE hc_folios SET pdf_estado = 'EN_PROCESO'"),
      ['folio-123'],
    );

    expect(mockQueue.add).toHaveBeenCalledWith(
      JOBS.GENERATE_CLINICAL_PDF,
      { tenantId: 't-tenant-pdf-001', folioId: 'folio-123' },
      expect.objectContaining({
        jobId: 'clinical-pdf-t-tenant-pdf-001-folio-123',
      }),
    );
  });
});
