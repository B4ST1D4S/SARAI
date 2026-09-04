import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalRecordController } from '../src/modules/clinical-record/controllers/clinical-record.controller';
import { ClinicalRecordService } from '../src/modules/clinical-record/services/clinical-record.service';
import { ClinicalPdfService } from '../src/modules/clinical-record/services/clinical-pdf.service';
import { TenantContextService } from '../src/core/tenancy/services/tenant-context.service';
import {
  EspecialidadClinica,
  TipoDiagnostico,
  CreateFolioConsultaExternaDto,
} from '../src/modules/clinical-record/dto/create-folio-consulta-externa.dto';

describe('ClinicalRecordController', () => {
  let controller: ClinicalRecordController;
  let service: ClinicalRecordService;
  let pdfService: ClinicalPdfService;

  const mockService = {
    crearFolioConsultaExterna: jest.fn(),
  };

  const mockPdfService = {
    obtenerOEncolarPdfFolio: jest.fn(),
  };

  const mockTenantContextService = {
    getRequiredTenantId: jest.fn().mockReturnValue('t-tenant-controller-123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalRecordController],
      providers: [
        {
          provide: ClinicalRecordService,
          useValue: mockService,
        },
        {
          provide: ClinicalPdfService,
          useValue: mockPdfService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    controller = module.get<ClinicalRecordController>(ClinicalRecordController);
    service = module.get<ClinicalRecordService>(ClinicalRecordService);
    pdfService = module.get<ClinicalPdfService>(ClinicalPdfService);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  it('debe delegar la creación de folio al servicio y devolver folioId y numeroFolio con HTTP 201', async () => {
    const mockDto: CreateFolioConsultaExternaDto = {
      atencionId: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
      pacienteId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      profesionalId: '123e4567-e89b-12d3-a456-426614174000',
      fechaAtencion: '2026-09-02T09:00:00.000Z',
      especialidad: EspecialidadClinica.MEDICINA_GENERAL,
      anamnesis: {
        motivoConsulta: 'Control de rutina',
        enfermedadActual: 'Paciente asintomático acude para revisión anual.',
      },
      diagnosticos: [
        {
          codigoCIE10: 'Z00.0',
          descripcion: 'Examen médico general',
          tipo: TipoDiagnostico.CONFIRMADO_NUEVO,
          esPrincipal: true,
        },
      ],
      planTratamiento: 'Continuar hábitos saludables.',
    };

    mockService.crearFolioConsultaExterna.mockResolvedValue({
      folioId: 'folio-uuid-abc-123',
      numeroFolio: 1,
    });

    const result = await controller.crearFolioConsultaExterna(
      mockDto,
      '127.0.0.1',
    );

    expect(result).toEqual({
      folioId: 'folio-uuid-abc-123',
      numeroFolio: 1,
    });
    expect(service.crearFolioConsultaExterna).toHaveBeenCalledWith(mockDto);
  });

  it('debe consultar o encolar el PDF del folio en GET /api/v1/clinical-records/folios/:id/pdf', async () => {
    const folioId = 'f0000000-1111-2222-3333-444444444444';
    mockPdfService.obtenerOEncolarPdfFolio.mockResolvedValue({
      status: 'READY',
      url: 'https://spaces.download/folio.pdf',
      fileKey: 'tenants/t-tenant-controller-123/clinical-records/f0000000-1111-2222-3333-444444444444.pdf',
    });

    const result = await controller.obtenerPdfFolio(folioId);

    expect(result).toEqual({
      status: 'READY',
      url: 'https://spaces.download/folio.pdf',
      fileKey: 'tenants/t-tenant-controller-123/clinical-records/f0000000-1111-2222-3333-444444444444.pdf',
    });
    expect(pdfService.obtenerOEncolarPdfFolio).toHaveBeenCalledWith(
      't-tenant-controller-123',
      folioId,
    );
  });
});
