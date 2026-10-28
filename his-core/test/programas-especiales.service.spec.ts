import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenancyConnectionService } from '../src/core/tenancy/services/tenancy-connection.service';
import { ProgramasEspecialesService } from '../src/modules/programas-especiales/programas-especiales.service';

describe('ProgramasEspecialesService', () => {
  let service: ProgramasEspecialesService;
  let mockPool: { query: jest.Mock };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramasEspecialesService,
        {
          provide: TenancyConnectionService,
          useValue: { getTenantPool: jest.fn().mockReturnValue(mockPool) },
        },
      ],
    }).compile();
    service = module.get(ProgramasEspecialesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza un estado no booleano al actualizar un programa', async () => {
    await expect(
      service.actualizarEstadoPrograma('VIH', 'true'),
    ).rejects.toThrow(BadRequestException);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('impide desactivar el programa renal', async () => {
    await expect(
      service.actualizarEstadoPrograma('RENAL', false),
    ).rejects.toThrow(BadRequestException);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('persiste el estado del programa y devuelve el catálogo actualizado', async () => {
    const expected = {
      codigo: 'VIH',
      nombre: 'Programa VIH',
      activo: false,
    };
    mockPool.query.mockResolvedValueOnce({ rows: [expected] });

    await expect(service.actualizarEstadoPrograma('VIH', false)).resolves.toEqual(expected);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE pe_programas'),
      ['VIH', false],
    );
  });

  it('guarda los datos clínicos sin permitir que el cliente imponga metadatos', async () => {
    const stored = {
      id: 'record-id',
      inscripcion_id: 'inscription-id',
      paciente_id: 'patient-id',
      datos: { tipo: 'FAV_RADIOCEFÁLICA', estado: 'ACTIVO' },
      created_at: new Date('2026-01-01T10:00:00Z'),
      updated_at: new Date('2026-01-01T10:00:00Z'),
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ paciente_id: 'patient-id' }] })
      .mockResolvedValueOnce({ rows: [stored] });

    const result = await service.crearRegistro('ACCESO', 'inscription-id', {
      id: 'forged-id',
      pacienteId: 'other-patient',
      tipo: 'FAV_RADIOCEFÁLICA',
      estado: 'ACTIVO',
    });

    expect(result).toMatchObject({
      id: 'record-id',
      inscripcionId: 'inscription-id',
      pacienteId: 'patient-id',
      tipo: 'FAV_RADIOCEFÁLICA',
      estado: 'ACTIVO',
    });
    expect(mockPool.query.mock.calls[1][1]).toEqual([
      'inscription-id',
      'patient-id',
      'ACCESO',
      JSON.stringify({ tipo: 'FAV_RADIOCEFÁLICA', estado: 'ACTIVO' }),
    ]);
  });
});
