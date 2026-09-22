import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsuariosService, UsuarioPreferenciasResponse, UsuarioResponse } from './usuarios.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
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

  @Get()
  async listar(): Promise<UsuarioResponse[]> {
    return this.usuariosService.listar();
  }

  @Post()
  async crear(@Body() dto: CreateUsuarioDto): Promise<UsuarioResponse> {
    return this.usuariosService.crear(dto);
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string): Promise<UsuarioResponse> {
    return this.usuariosService.obtenerPorId(id);
  }

  @Put(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
  ): Promise<UsuarioResponse> {
    return this.usuariosService.actualizar(id, dto);
  }

  @Patch(':id/toggle-status')
  async toggleEstado(@Param('id') id: string): Promise<{ activo: boolean }> {
    return this.usuariosService.toggleEstado(id);
  }
}
