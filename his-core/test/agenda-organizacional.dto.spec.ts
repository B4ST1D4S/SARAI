import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateSedeDto,
  CreateDepartamentoDto,
  CreateConsultorioDto,
  CreateTurnoDto,
  ConsultarSlotsDto,
} from '../src/modules/agenda-organizacional/dto';

describe('AgendaOrganizacional DTOs', () => {
  describe('CreateSedeDto', () => {
    it('debe ser válido con campos requeridos correctos', async () => {
      const dto = plainToInstance(CreateSedeDto, {
        codigo: 'SEDE-01',
        nombre: 'Sede Principal Norte',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar si codigo o nombre están vacíos', async () => {
      const dto = plainToInstance(CreateSedeDto, {
        codigo: '',
        nombre: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it('debe aceptar campos opcionales como codigoReps, direccion, telefono, ciudad', async () => {
      const dto = plainToInstance(CreateSedeDto, {
        codigo: 'SEDE-02',
        nombre: 'Sede Sur',
        codigoReps: '110010000001',
        direccion: 'Calle 100 # 15-20',
        telefono: '6015551234',
        ciudad: 'Bogotá D.C.',
        activo: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('CreateDepartamentoDto', () => {
    it('debe ser válido con datos correctos', async () => {
      const dto = plainToInstance(CreateDepartamentoDto, {
        sedeId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        codigo: 'CC-301',
        nombre: 'Consulta Externa Adultos',
        tipo: 'ASISTENCIAL',
        pisoBloque: 'Piso 2',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar si sedeId no es un UUID válido', async () => {
      const dto = plainToInstance(CreateDepartamentoDto, {
        sedeId: 'invalido-uuid',
        codigo: 'CC-301',
        nombre: 'Consulta Externa',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'sedeId')).toBe(true);
    });
  });

  describe('CreateConsultorioDto', () => {
    it('debe ser válido con datos correctos', async () => {
      const dto = plainToInstance(CreateConsultorioDto, {
        departamentoId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        codigo: 'CONS-101',
        nombre: 'Consultorio Medicina General 1',
        tipo: 'CONSULTORIO',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar si departamentoId no es un UUID', async () => {
      const dto = plainToInstance(CreateConsultorioDto, {
        departamentoId: '123',
        codigo: 'CONS-101',
        nombre: 'Consultorio',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'departamentoId')).toBe(true);
    });
  });

  describe('CreateTurnoDto', () => {
    it('debe ser válido con datos completos', async () => {
      const dto = plainToInstance(CreateTurnoDto, {
        sedeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        departamentoId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        consultorioId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        profesionalId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        especialidadId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        fecha: '2026-09-10',
        horaInicio: '08:00',
        horaFin: '12:00',
        intervaloMinutos: 20,
        sobrecuposMax: 2,
        modalidad: 'PRESENCIAL',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar si fecha no tiene formato YYYY-MM-DD', async () => {
      const dto = plainToInstance(CreateTurnoDto, {
        sedeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        departamentoId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        consultorioId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        profesionalId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        especialidadId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        fecha: '10/09/2026',
        horaInicio: '08:00',
        horaFin: '12:00',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'fecha')).toBe(true);
    });

    it('debe fallar si intervaloMinutos es menor a 5', async () => {
      const dto = plainToInstance(CreateTurnoDto, {
        sedeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        departamentoId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        consultorioId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        profesionalId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        especialidadId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        fecha: '2026-09-10',
        horaInicio: '08:00',
        horaFin: '12:00',
        intervaloMinutos: 3,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'intervaloMinutos')).toBe(true);
    });
  });

  describe('ConsultarSlotsDto', () => {
    it('debe ser válido con fechas correctas', async () => {
      const dto = plainToInstance(ConsultarSlotsDto, {
        sedeId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        fechaInicio: '2026-09-10',
        fechaFin: '2026-09-15',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar si fechaInicio está ausente', async () => {
      const dto = plainToInstance(ConsultarSlotsDto, {
        fechaFin: '2026-09-15',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'fechaInicio')).toBe(true);
    });
  });
});
