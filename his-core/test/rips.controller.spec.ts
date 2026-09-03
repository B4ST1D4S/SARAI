import { Test, TestingModule } from '@nestjs/testing';
import { RipsController } from '../src/modules/billing-rips/controllers/rips.controller';
import { RipsService } from '../src/modules/billing-rips/services/rips.service';
import { TenantContextService } from '../src/core/tenancy/services/tenant-context.service';
import { GenerateRipsDto, TipoNotaRips } from '../src/modules/billing-rips/dto/generate-rips.dto';

describe('RipsController', () => {
  let controller: RipsController;
  let service: RipsService;

  const mockRipsService = {
    encolarGeneracionRips: jest.fn(),
    consultarEstadoLote: jest.fn(),
  };

  const mockTenantContextService = {
    getRequiredTenantId: jest.fn().mockReturnValue('t-tenant-rips-controller-999'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RipsController],
      providers: [
        {
          provide: RipsService,
          useValue: mockRipsService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    controller = module.get<RipsController>(RipsController);
    service = module.get<RipsService>(RipsService);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  it('debe encolar la generación de RIPS en POST /api/v1/rips/generar', async () => {
    const dto: GenerateRipsDto = {
      numFactura: 'FEV-1234',
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-30',
      tipoNota: TipoNotaRips.NA,
    };

    mockRipsService.encolarGeneracionRips.mockResolvedValue({
      loteId: 'lote-uuid-123',
      estado: 'EN_COLA',
      message: 'Generación de RIPS encolada con éxito.',
    });

    const result = await controller.encolarGeneracionRips(dto);

    expect(result).toEqual({
      loteId: 'lote-uuid-123',
      estado: 'EN_COLA',
      message: 'Generación de RIPS encolada con éxito.',
    });
    expect(service.encolarGeneracionRips).toHaveBeenCalledWith(
      't-tenant-rips-controller-999',
      dto,
    );
  });

  it('debe consultar el estado del lote en GET /api/v1/rips/lotes/:id/estado', async () => {
    const loteId = 'c0000000-1111-2222-3333-444444444444';
    mockRipsService.consultarEstadoLote.mockResolvedValue({
      id: loteId,
      estado: 'VALIDADO',
      downloadUrl: 'https://spaces.download/rips.json',
      totalConsultas: 15,
    });

    const result = await controller.consultarEstadoLote(loteId);

    expect(result).toEqual({
      id: loteId,
      estado: 'VALIDADO',
      downloadUrl: 'https://spaces.download/rips.json',
      totalConsultas: 15,
    });
    expect(service.consultarEstadoLote).toHaveBeenCalledWith(
      't-tenant-rips-controller-999',
      loteId,
    );
  });
});
