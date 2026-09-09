import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AgendaOrganizacionalService } from '../src/modules/agenda-organizacional/agenda-organizacional.service';
import { TenancyConnectionService } from '../src/core/tenancy/services/tenancy-connection.service';

describe('AgendaOrganizacionalService', () => {
  let service: AgendaOrganizacionalService;
  let tenancyConnectionService: jest.Mocked<TenancyConnectionService>;
  let mockPool: { query: jest.Mock };

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    const mockTenancyConnectionService = {
      getTenantPool: jest.fn().mockReturnValue(mockPool),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaOrganizacionalService,
        {
          provide: TenancyConnectionService,
          useValue: mockTenancyConnectionService,
        },
      ],
    }).compile();

    service = module.get<AgendaOrganizacionalService>(
      AgendaOrganizacionalService,
    );
    tenancyConnectionService = module.get(TenancyConnectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sedes', () => {
    it('debe crear una sede exitosamente', async () => {
      // 1. Check duplicate -> empty
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // 2. Insert -> returning row
      const mockRow = {
        id: 'sede-uuid-1',
        codigo: 'SEDE-01',
        nombre: 'Sede Principal',
        codigo_reps: '110010000001',
        direccion: 'Calle 100 # 15-20',
        telefono: '6015551234',
        ciudad: 'Bogotá',
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockPool.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await service.crearSede({
        codigo: 'SEDE-01',
        nombre: 'Sede Principal',
        codigoReps: '110010000001',
        direccion: 'Calle 100 # 15-20',
        telefono: '6015551234',
        ciudad: 'Bogotá',
      });

      expect(result.id).toBe('sede-uuid-1');
      expect(result.codigo).toBe('SEDE-01');
      expect(result.nombre).toBe('Sede Principal');
    });

    it('debe lanzar ConflictException si el código de sede ya existe', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sede-uuid-1' }] });

      await expect(
        service.crearSede({
          codigo: 'SEDE-01',
          nombre: 'Sede Duplicada',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe listar todas las sedes', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'sede-1',
            codigo: 'SEDE-01',
            nombre: 'Sede Norte',
            activo: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await service.listarSedes();
      expect(result.length).toBe(1);
      expect(result[0].nombre).toBe('Sede Norte');
    });

    it('debe obtener una sede por ID', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'sede-1',
            codigo: 'SEDE-01',
            nombre: 'Sede Norte',
            activo: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await service.obtenerSedePorId('sede-1');
      expect(result.id).toBe('sede-1');
    });

    it('debe lanzar NotFoundException si la sede no existe', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.obtenerSedePorId('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Departamentos / Centros de Costo', () => {
    it('debe crear un departamento exitosamente', async () => {
      // 1. Sede check -> found
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sede-1' }] });
      // 2. Duplicity check -> empty
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // 3. Insert
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'depto-1',
            sede_id: 'sede-1',
            codigo: 'CC-301',
            nombre: 'Consulta Externa',
            tipo: 'ASISTENCIAL',
            piso_bloque: 'Piso 2',
            activo: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await service.crearDepartamento({
        sedeId: 'sede-1',
        codigo: 'CC-301',
        nombre: 'Consulta Externa',
      });

      expect(result.id).toBe('depto-1');
      expect(result.nombre).toBe('Consulta Externa');
    });

    it('debe lanzar NotFoundException si la sede no existe al crear depto', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.crearDepartamento({
          sedeId: 'sede-inexistente',
          codigo: 'CC-301',
          nombre: 'Consulta Externa',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el código ya existe en la sede', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sede-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'depto-1' }] });

      await expect(
        service.crearDepartamento({
          sedeId: 'sede-1',
          codigo: 'CC-301',
          nombre: 'Consulta Externa',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Consultorios / Recursos Físicos', () => {
    it('debe crear un consultorio exitosamente', async () => {
      // 1. Depto check -> found
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'depto-1' }] });
      // 2. Duplicity check -> empty
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // 3. Insert
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cons-1',
            departamento_id: 'depto-1',
            codigo: 'CONS-101',
            nombre: 'Consultorio 1',
            tipo: 'CONSULTORIO',
            activo: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await service.crearConsultorio({
        departamentoId: 'depto-1',
        codigo: 'CONS-101',
        nombre: 'Consultorio 1',
      });

      expect(result.id).toBe('cons-1');
      expect(result.codigo).toBe('CONS-101');
    });

    it('debe lanzar NotFoundException si el departamento no existe', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.crearConsultorio({
          departamentoId: 'depto-inexistente',
          codigo: 'CONS-101',
          nombre: 'Consultorio 1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Turnos Operativos (Apertura de Agenda)', () => {
    const validTurnoDto = {
      sedeId: 'sede-1',
      departamentoId: 'depto-1',
      consultorioId: 'cons-1',
      profesionalId: 'prof-1',
      especialidadId: 'esp-1',
      fecha: '2026-09-10',
      horaInicio: '08:00',
      horaFin: '12:00',
      intervaloMinutos: 20,
      sobrecuposMax: 2,
    };

    it('debe crear un turno sin conflictos exitosamente', async () => {
      // Integridad referencial
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sede-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'depto-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'cons-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'prof-1' }] });

      // Overlap consultorio check -> empty
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Overlap profesional check -> empty
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Insert
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'turno-uuid-1',
            sede_id: 'sede-1',
            departamento_id: 'depto-1',
            consultorio_id: 'cons-1',
            profesional_id: 'prof-1',
            especialidad_id: 'esp-1',
            fecha: '2026-09-10',
            hora_inicio: '08:00:00',
            hora_fin: '12:00:00',
            intervalo_minutos: 20,
            sobrecupos_max: 2,
            modalidad: 'PRESENCIAL',
            estado: 'HABILITADO',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await service.crearTurno(validTurnoDto);
      expect(result.id).toBe('turno-uuid-1');
      expect(result.horaInicio).toBe('08:00:00');
      expect(result.horaFin).toBe('12:00:00');
    });

    it('debe lanzar BadRequestException si horaInicio >= horaFin', async () => {
      await expect(
        service.crearTurno({
          ...validTurnoDto,
          horaInicio: '14:00',
          horaFin: '10:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si existe solapamiento en el consultorio', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sede-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'depto-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'cons-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'prof-1' }] });

      // Overlap consultorio check -> conflicto encontrado
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'turno-previo', hora_inicio: '09:00:00', hora_fin: '11:00:00' }],
      });

      await expect(service.crearTurno(validTurnoDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException si el profesional ya tiene otro turno en ese horario', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sede-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'depto-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'cons-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'prof-1' }] });

      // Overlap consultorio check -> libre
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Overlap profesional check -> ocupado
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'turno-prof', hora_inicio: '08:00:00', hora_fin: '10:00:00' }],
      });

      await expect(service.crearTurno(validTurnoDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('Consulta de Disponibilidad y Slots', () => {
    it('debe generar slots y marcar disponibilidad correctamente según citas', async () => {
      // 1. Turnos query
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            turno_id: 'turno-1',
            sede_id: 'sede-1',
            sede_nombre: 'Sede Principal',
            departamento_id: 'depto-1',
            departamento_nombre: 'Consulta Externa',
            consultorio_id: 'cons-1',
            consultorio_nombre: 'Consultorio 101',
            consultorio_tipo: 'CONSULTORIO',
            profesional_id: 'prof-1',
            primer_nombre: 'Carlos',
            primer_apellido: 'Pérez',
            especialidad_id: 'esp-1',
            fecha: '2026-09-10',
            hora_inicio: '08:00:00',
            hora_fin: '09:00:00',
            intervalo_minutos: 20,
            sobrecupos_max: 1,
            modalidad: 'PRESENCIAL',
            estado: 'HABILITADO',
          },
        ],
      });

      // 2. Citas query: 1 cita regular de 08:20 a 08:40
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            cita_id: 'cita-100',
            turno_id: 'turno-1',
            consultorio_id: 'cons-1',
            profesional_id: 'prof-1',
            fecha_hora_inicio: '2026-09-10T08:20:00.000Z',
            fecha_hora_fin: '2026-09-10T08:40:00.000Z',
            duracion_minutos: 20,
            estado: 'AGENDADA',
            es_sobrecupo: false,
          },
        ],
      });

      const result = await service.obtenerSlotsDisponibles({
        sedeId: 'sede-1',
        fechaInicio: '2026-09-10',
        fechaFin: '2026-09-10',
      });

      expect(result.length).toBe(1);
      const turnoRes = result[0];
      expect(turnoRes.totalSlots).toBe(3); // 08:00-08:20, 08:20-08:40, 08:40-09:00
      expect(turnoRes.slotsLibres).toBe(2);
      expect(turnoRes.slotsOcupados).toBe(1);

      // Slot 1: 08:00 - 08:20 -> Disponible
      expect(turnoRes.slots[0].horaInicio).toBe('08:00');
      expect(turnoRes.slots[0].horaFin).toBe('08:20');
      expect(turnoRes.slots[0].disponible).toBe(true);

      // Slot 2: 08:20 - 08:40 -> Ocupado por cita-100
      expect(turnoRes.slots[1].horaInicio).toBe('08:20');
      expect(turnoRes.slots[1].horaFin).toBe('08:40');
      expect(turnoRes.slots[1].disponible).toBe(false);
      expect(turnoRes.slots[1].citaOcupanteId).toBe('cita-100');

      // Slot 3: 08:40 - 09:00 -> Disponible
      expect(turnoRes.slots[2].horaInicio).toBe('08:40');
      expect(turnoRes.slots[2].horaFin).toBe('09:00');
      expect(turnoRes.slots[2].disponible).toBe(true);
    });

    it('debe lanzar BadRequestException si fechaInicio > fechaFin', async () => {
      await expect(
        service.obtenerSlotsDisponibles({
          fechaInicio: '2026-09-20',
          fechaFin: '2026-09-10',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
