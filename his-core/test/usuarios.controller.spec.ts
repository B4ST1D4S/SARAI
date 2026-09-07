import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UsuariosController } from '../src/modules/users/usuarios.controller';
import { UsuariosService } from '../src/modules/users/usuarios.service';
import { UpdatePreferenciasDto } from '../src/modules/users/dto/update-preferencias.dto';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  let service: UsuariosService;

  const mockUsuariosService = {
    actualizarPreferencias: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        {
          provide: UsuariosService,
          useValue: mockUsuariosService,
        },
      ],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
    service = module.get<UsuariosService>(UsuariosService);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('PATCH /api/v1/usuarios/perfil/preferencias', () => {
    it('debe extraer usuarioId de req.user.sub y delegar al servicio', async () => {
      const usuarioId = 'u0000000-1111-2222-3333-444444444444';
      const dto: UpdatePreferenciasDto = {
        navMode: 'hub',
        theme: 'dark',
      };

      const mockRequest = {
        user: {
          sub: usuarioId,
          email: 'admin@clinicademo.com',
          rol: 'SUPER_ADMIN_CLINICA',
        },
      } as unknown as Request;

      const mockResponse = {
        id: usuarioId,
        nombre: 'Administrador Demo',
        email: 'admin@clinicademo.com',
        rol: 'SUPER_ADMIN_CLINICA',
        preferencias: {
          navMode: 'hub',
          theme: 'dark',
        },
      };

      mockUsuariosService.actualizarPreferencias.mockResolvedValueOnce(mockResponse);

      const result = await controller.actualizarPreferencias(mockRequest, dto);

      expect(service.actualizarPreferencias).toHaveBeenCalledWith(usuarioId, dto);
      expect(result).toEqual(mockResponse);
    });

    it('debe soportar req.user.id como fallback si sub no está presente', async () => {
      const usuarioId = 'u0000000-2222-3333-4444-555555555555';
      const dto: UpdatePreferenciasDto = {
        navMode: 'sidebar',
      };

      const mockRequest = {
        user: {
          id: usuarioId,
        },
      } as unknown as Request;

      mockUsuariosService.actualizarPreferencias.mockResolvedValueOnce({
        id: usuarioId,
        nombre: 'Carlos Perez',
        email: 'cperez@clinicademo.com',
        rol: 'MEDICO_GENERAL',
        preferencias: { navMode: 'sidebar' },
      });

      const result = await controller.actualizarPreferencias(mockRequest, dto);

      expect(service.actualizarPreferencias).toHaveBeenCalledWith(usuarioId, dto);
      expect(result.id).toBe(usuarioId);
    });

    it('debe lanzar UnauthorizedException si req.user no tiene identificador de usuario', async () => {
      const dto: UpdatePreferenciasDto = {
        navMode: 'hub',
      };

      const mockRequest = {
        user: undefined,
      } as unknown as Request;

      await expect(
        controller.actualizarPreferencias(mockRequest, dto),
      ).rejects.toThrow(UnauthorizedException);

      expect(service.actualizarPreferencias).not.toHaveBeenCalled();
    });
  });
});
