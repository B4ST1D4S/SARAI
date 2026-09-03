import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RipsService } from '../src/modules/billing-rips/services/rips.service';
import { JOBS } from '../src/core/queue/constants/queue.constants';
import { GenerateRipsDto, TipoNotaRips } from '../src/modules/billing-rips/dto/generate-rips.dto';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('RipsService (Resolución 2275 de 2023)', () => {
  let service: RipsService;
  let mockQueue: any;
  let mockTenancyConnectionService: any;
  let mockSpacesStorageService: any;
  let mockTenantService: any;
  let tenantContextService: any;

  const mockTenant: Tenant = {
    id: 't-rips-tenant-001',
    name: 'Clinica Metropolitana IPS',
    subdomain: 'metropolitana',
    code: '110010000001',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_metropolitana',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_metro',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-rips-1', name: JOBS.GENERATE_RIPS_JSON }),
    };

    mockTenancyConnectionService = {
      query: jest.fn(),
    };

    mockSpacesStorageService = {
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://spaces.download/rips-lote-123.json'),
    };

    mockTenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    service = new RipsService(
      mockQueue,
      mockTenancyConnectionService,
      mockSpacesStorageService,
      mockTenantService,
      tenantContextService,
    );
  });

  describe('encolarGeneracionRips', () => {
    it('debe registrar el lote en BD con estado EN_COLA y agregar el job a BullMQ', async () => {
      mockTenancyConnectionService.query.mockResolvedValueOnce({
        rows: [{ id: 'lote-uuid-001' }],
      });

      const dto: GenerateRipsDto = {
        numFactura: 'FEV-2026-001',
        fechaInicio: '2026-09-01',
        fechaFin: '2026-09-30',
        tipoNota: TipoNotaRips.NA,
      };

      const result = await service.encolarGeneracionRips(
        't-rips-tenant-001',
        dto,
      );

      expect(result).toEqual({
        loteId: 'lote-uuid-001',
        estado: 'EN_COLA',
        message: 'Generación de RIPS encolada con éxito.',
      });

      expect(mockTenancyConnectionService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rips_lotes'),
        ['FEV-2026-001', '2026-09-01', '2026-09-30', 'NA', null],
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        JOBS.GENERATE_RIPS_JSON,
        { tenantId: 't-rips-tenant-001', loteId: 'lote-uuid-001' },
        expect.objectContaining({
          jobId: 'rips-t-rips-tenant-001-lote-uuid-001',
        }),
      );
    });

    it('debe lanzar BadRequestException si tenantId no es provisto', async () => {
      const dto: GenerateRipsDto = {
        fechaInicio: '2026-09-01',
        fechaFin: '2026-09-30',
      };
      await expect(service.encolarGeneracionRips('', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('consultarEstadoLote', () => {
    it('debe lanzar NotFoundException si el lote de RIPS no existe', async () => {
      mockTenancyConnectionService.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.consultarEstadoLote('t-rips-tenant-001', 'lote-inexistente'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe retornar el detalle del lote y la URL prefirmada si el estado es VALIDADO', async () => {
      mockTenancyConnectionService.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'lote-uuid-001',
            num_factura: 'FEV-100',
            fecha_inicio: '2026-09-01',
            fecha_fin: '2026-09-30',
            tipo_nota: 'NA',
            num_nota: null,
            estado: 'VALIDADO',
            total_usuarios: 5,
            total_consultas: 10,
            total_procedimientos: 2,
            total_medicamentos: 4,
            json_file_key: 'tenants/t-rips-tenant-001/rips/lote-uuid-001.json',
            hash_sha256: 'sha256-hash-sample-12345',
            errores_validacion: null,
            creado_en: new Date(),
            validado_en: new Date(),
          },
        ],
      });

      const result = await service.consultarEstadoLote(
        't-rips-tenant-001',
        'lote-uuid-001',
      );

      expect(result.estado).toBe('VALIDADO');
      expect(result.totalConsultas).toBe(10);
      expect(result.downloadUrl).toBe('https://spaces.download/rips-lote-123.json');
      expect(mockSpacesStorageService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'tenants/t-rips-tenant-001/rips/lote-uuid-001.json',
      );
    });

    it('debe parsear y retornar los errores si el lote fue RECHAZADO', async () => {
      const erroresMock = [
        {
          tipo: 'VALIDACION_CIE10',
          campo: 'codDiagnosticoPrincipal',
          registroId: 'folio-123',
          mensaje: 'Falta diagnóstico CIE-10 principal.',
        },
      ];

      mockTenancyConnectionService.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'lote-uuid-002',
            num_factura: null,
            fecha_inicio: '2026-09-01',
            fecha_fin: '2026-09-30',
            tipo_nota: 'NA',
            num_nota: null,
            estado: 'RECHAZADO',
            total_usuarios: 0,
            total_consultas: 0,
            total_procedimientos: 0,
            total_medicamentos: 0,
            json_file_key: null,
            hash_sha256: null,
            errores_validacion: JSON.stringify(erroresMock),
            creado_en: new Date(),
            validado_en: null,
          },
        ],
      });

      const result = await service.consultarEstadoLote(
        't-rips-tenant-001',
        'lote-uuid-002',
      );

      expect(result.estado).toBe('RECHAZADO');
      expect(result.erroresValidacion).toEqual(erroresMock);
      expect(result.downloadUrl).toBeUndefined();
    });
  });
});
