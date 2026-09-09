import { Test, TestingModule } from '@nestjs/testing';
import { AgendaOrganizacionalController } from '../src/modules/agenda-organizacional/agenda-organizacional.controller';
import { AgendaOrganizacionalService } from '../src/modules/agenda-organizacional/agenda-organizacional.service';

describe('AgendaOrganizacionalController', () => {
  let controller: AgendaOrganizacionalController;
  let service: jest.Mocked<AgendaOrganizacionalService>;

  const mockService = {
    crearSede: jest.fn(),
    listarSedes: jest.fn(),
    obtenerSedePorId: jest.fn(),
    crearDepartamento: jest.fn(),
    listarDepartamentosPorSede: jest.fn(),
    obtenerDepartamentoPorId: jest.fn(),
    crearConsultorio: jest.fn(),
    listarConsultoriosPorDepartamento: jest.fn(),
    obtenerConsultorioPorId: jest.fn(),
    crearTurno: jest.fn(),
    obtenerSlotsDisponibles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendaOrganizacionalController],
      providers: [
        {
          provide: AgendaOrganizacionalService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AgendaOrganizacionalController>(
      AgendaOrganizacionalController,
    );
    service = module.get(AgendaOrganizacionalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('Sedes endpoints', () => {
    it('POST /sedes debe invocar service.crearSede', async () => {
      const dto = { codigo: 'SEDE-01', nombre: 'Sede Central' };
      const expected = { id: 'uuid-1', ...dto, activo: true, createdAt: new Date(), updatedAt: new Date() };
      mockService.crearSede.mockResolvedValueOnce(expected);

      const result = await controller.crearSede(dto);
      expect(service.crearSede).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('GET /sedes debe invocar service.listarSedes', async () => {
      mockService.listarSedes.mockResolvedValueOnce([]);
      const result = await controller.listarSedes('true');
      expect(service.listarSedes).toHaveBeenCalledWith(true);
      expect(result).toEqual([]);
    });

    it('GET /sedes/:sedeId debe invocar service.obtenerSedePorId', async () => {
      const expected = { id: 'uuid-1', codigo: 'S1', nombre: 'S1', activo: true, createdAt: new Date(), updatedAt: new Date() };
      mockService.obtenerSedePorId.mockResolvedValueOnce(expected);

      const result = await controller.obtenerSede('uuid-1');
      expect(service.obtenerSedePorId).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(expected);
    });
  });

  describe('Departamentos endpoints', () => {
    it('POST /departamentos debe invocar service.crearDepartamento', async () => {
      const dto = { sedeId: 'sede-1', codigo: 'CC-01', nombre: 'Consulta Ext' };
      const expected = { id: 'd-1', ...dto, tipo: 'ASISTENCIAL', activo: true, createdAt: new Date(), updatedAt: new Date() };
      mockService.crearDepartamento.mockResolvedValueOnce(expected);

      const result = await controller.crearDepartamento(dto);
      expect(service.crearDepartamento).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('GET /sedes/:sedeId/departamentos debe invocar service.listarDepartamentosPorSede', async () => {
      mockService.listarDepartamentosPorSede.mockResolvedValueOnce([]);
      const result = await controller.listarDepartamentosPorSede('sede-1', 'false');
      expect(service.listarDepartamentosPorSede).toHaveBeenCalledWith('sede-1', false);
      expect(result).toEqual([]);
    });

    it('GET /departamentos/:deptoId debe invocar service.obtenerDepartamentoPorId', async () => {
      const expected = { id: 'd-1', sedeId: 's-1', codigo: 'CC', nombre: 'Dept', tipo: 'ASISTENCIAL', activo: true, createdAt: new Date(), updatedAt: new Date() };
      mockService.obtenerDepartamentoPorId.mockResolvedValueOnce(expected);

      const result = await controller.obtenerDepartamento('d-1');
      expect(service.obtenerDepartamentoPorId).toHaveBeenCalledWith('d-1');
      expect(result).toEqual(expected);
    });
  });

  describe('Consultorios endpoints', () => {
    it('POST /consultorios debe invocar service.crearConsultorio', async () => {
      const dto = { departamentoId: 'd-1', codigo: 'C-01', nombre: 'Cons 1' };
      const expected = { id: 'c-1', ...dto, tipo: 'CONSULTORIO', activo: true, createdAt: new Date(), updatedAt: new Date() };
      mockService.crearConsultorio.mockResolvedValueOnce(expected);

      const result = await controller.crearConsultorio(dto);
      expect(service.crearConsultorio).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('GET /departamentos/:deptoId/consultorios debe invocar service.listarConsultoriosPorDepartamento', async () => {
      mockService.listarConsultoriosPorDepartamento.mockResolvedValueOnce([]);
      const result = await controller.listarConsultoriosPorDepartamento('d-1');
      expect(service.listarConsultoriosPorDepartamento).toHaveBeenCalledWith('d-1', false);
      expect(result).toEqual([]);
    });

    it('GET /consultorios/:consultorioId debe invocar service.obtenerConsultorioPorId', async () => {
      const expected = { id: 'c-1', departamentoId: 'd-1', codigo: 'C1', nombre: 'Cons', tipo: 'CONSULTORIO', activo: true, createdAt: new Date(), updatedAt: new Date() };
      mockService.obtenerConsultorioPorId.mockResolvedValueOnce(expected);

      const result = await controller.obtenerConsultorio('c-1');
      expect(service.obtenerConsultorioPorId).toHaveBeenCalledWith('c-1');
      expect(result).toEqual(expected);
    });
  });

  describe('Turnos y Slots endpoints', () => {
    it('POST /turnos debe invocar service.crearTurno', async () => {
      const dto = {
        sedeId: 's-1',
        departamentoId: 'd-1',
        consultorioId: 'c-1',
        profesionalId: 'p-1',
        especialidadId: 'e-1',
        fecha: '2026-09-10',
        horaInicio: '08:00',
        horaFin: '12:00',
      };
      const expected = { id: 't-1', ...dto, intervaloMinutos: 15, sobrecuposMax: 0, modalidad: 'PRESENCIAL', estado: 'HABILITADO', createdAt: new Date(), updatedAt: new Date() };
      mockService.crearTurno.mockResolvedValueOnce(expected);

      const result = await controller.crearTurno(dto);
      expect(service.crearTurno).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('GET /turnos/slots debe invocar service.obtenerSlotsDisponibles', async () => {
      const query = { fechaInicio: '2026-09-10', fechaFin: '2026-09-10' };
      mockService.obtenerSlotsDisponibles.mockResolvedValueOnce([]);

      const result = await controller.consultarSlots(query);
      expect(service.obtenerSlotsDisponibles).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });
  });
});
