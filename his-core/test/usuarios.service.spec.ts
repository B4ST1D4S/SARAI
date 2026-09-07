import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsuariosService } from '../src/modules/users/usuarios.service';
import { TenancyConnectionService } from '../src/core/tenancy/services/tenancy-connection.service';
import { UpdatePreferenciasDto } from '../src/modules/users/dto/update-preferencias.dto';

describe('UsuariosService', () => {
  let service: UsuariosService;

  const mockQuery = jest.fn();
  const mockTenantPool = {
    query: mockQuery,
  };

  const mockTenancyConnectionService = {
    getTenantPool: jest.fn().mockReturnValue(mockTenantPool),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: TenancyConnectionService,
          useValue: mockTenancyConnectionService,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('actualizarPreferencias', () => {
    it('debe actualizar y retornar las preferencias del usuario correctamente', async () => {
      const usuarioId = 'u0000000-1111-2222-3333-444444444444';
      const dto: UpdatePreferenciasDto = {
        navMode: 'sidebar',
        theme: 'light',
      };

      const mockDbRow = {
        id: usuarioId,
        primer_nombre: 'Carlos',
        primer_apellido: 'Perez',
        email: 'cperez@clinicademo.com',
        rol: 'MEDICO_GENERAL',
        preferencias: {
          navMode: 'sidebar',
          theme: 'light',
        },
      };

      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [mockDbRow],
      });

      const result = await service.actualizarPreferencias(usuarioId, dto);

      expect(mockTenancyConnectionService.getTenantPool).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [queryText, queryParams] = mockQuery.mock.calls[0];
      expect(queryText).toContain('UPDATE usuarios');
      expect(queryText).toContain('COALESCE(preferencias, \'{}\'::jsonb) || $1::jsonb');
      expect(queryText).toContain('updated_at = NOW()');
      expect(queryText).toContain('WHERE id = $2');
      expect(queryParams).toEqual([JSON.stringify(dto), usuarioId]);

      expect(result).toEqual({
        id: usuarioId,
        nombre: 'Carlos Perez',
        email: 'cperez@clinicademo.com',
        rol: 'MEDICO_GENERAL',
        preferencias: {
          navMode: 'sidebar',
          theme: 'light',
        },
      });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      const usuarioId = 'u9999999-9999-9999-9999-999999999999';
      const dto: UpdatePreferenciasDto = {
        navMode: 'hub',
      };

      mockQuery.mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      await expect(
        service.actualizarPreferencias(usuarioId, dto),
      ).rejects.toThrow(NotFoundException);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [JSON.stringify(dto), usuarioId],
      );
    });
  });
});
