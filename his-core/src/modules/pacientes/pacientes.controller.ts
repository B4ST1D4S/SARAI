import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PacientesService,
  PacienteResponse,
  PacientesPaginados,
} from './pacientes.service';
import { CreatePacienteDto, UpdatePacienteDto } from './dto';

@Controller('pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get('search')
  async buscar(@Query('q') q: string = ''): Promise<PacienteResponse[]> {
    if (!q.trim()) return [];
    return this.pacientesService.buscarPacientes(q);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body() dto: CreatePacienteDto,
    @Req() req: Request,
  ): Promise<PacienteResponse> {
    const user = req.user as any;
    const creadoPor = user?.sub || user?.id || undefined;
    return this.pacientesService.crearPaciente(dto, creadoPor);
  }

  @Get()
  async listar(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PacientesPaginados> {
    return this.pacientesService.listarPacientes(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<PacienteResponse> {
    return this.pacientesService.obtenerPacientePorId(id);
  }

  @Put(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdatePacienteDto,
  ): Promise<PacienteResponse> {
    return this.pacientesService.actualizarPaciente(id, dto);
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string): Promise<{ mensaje: string }> {
    return this.pacientesService.eliminarPaciente(id);
  }
}
