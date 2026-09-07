import {
  Controller,
  Patch,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsuariosService, UsuarioPreferenciasResponse } from './usuarios.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Actualiza las preferencias de interfaz (modo de navegación, tema) del usuario autenticado.
   * Endpoint: PATCH /api/v1/usuarios/perfil/preferencias
   */
  @Patch('perfil/preferencias')
  @HttpCode(HttpStatus.OK)
  async actualizarPreferencias(
    @Req() req: Request,
    @Body() updatePreferenciasDto: UpdatePreferenciasDto,
  ): Promise<UsuarioPreferenciasResponse> {
    const user = req.user as any;
    const usuarioId = user?.sub || user?.id || user?.usuarioId;

    if (!usuarioId) {
      throw new UnauthorizedException('Identificador de usuario no encontrado en el token de autenticación');
    }

    return this.usuariosService.actualizarPreferencias(
      usuarioId,
      updatePreferenciasDto,
    );
  }
}
