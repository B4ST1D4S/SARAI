import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalRecordController } from '../src/modules/clinical-record/controllers/clinical-record.controller';
import { ClinicalRecordService } from '../src/modules/clinical-record/services/clinical-record.service';
import {
  EspecialidadClinica,
  TipoDiagnostico,
  CreateFolioConsultaExternaDto,
} from '../src/modules/clinical-record/dto/create-folio-consulta-externa.dto';

describe('ClinicalRecordController', () => {
  let controller: ClinicalRecordController;
  let service: ClinicalRecordService;

  const mockService = {
    crearFolioConsultaExterna: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalRecordController],
      providers: [
        {
          provide: ClinicalRecordService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ClinicalRecordController>(ClinicalRecordController);
    service = module.get<ClinicalRecordService>(ClinicalRecordService);
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
});
