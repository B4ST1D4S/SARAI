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
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CitasService, CitaResponse } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';

@Controller('citas')
@UseGuards(JwtAuthGuard)
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CreateCitaDto, @Req() req: Request): Promise<{ success: true; cita: CitaResponse }> {
    const user = req.user as any;
    const cita = await this.citasService.crear(dto, user?.sub);
    return { success: true, cita };
  }

  @Get('medico/agenda')
  async agendaMedico(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('profesionalId') profesionalIdQuery: string | undefined,
    @Req() req: Request,
  ): Promise<{ citas: CitaResponse[] }> {
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestException('fechaInicio y fechaFin son obligatorios');
    }
    const user = req.user as any;
    const profesionalId = profesionalIdQuery || user?.sub;
    const citas = await this.citasService.listarAgenda(fechaInicio, fechaFin, profesionalId);
    return { citas };
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<CitaResponse> {
    return this.citasService.obtenerPorId(id);
  }

  @Put(':id')
  async actualizarEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoCitaDto,
    @Req() req: Request,
  ): Promise<CitaResponse> {
    const user = req.user as any;
    return this.citasService.actualizarEstado(id, dto, user?.sub);
  }

  @Delete(':id')
  async cancelar(@Param('id') id: string, @Req() req: Request): Promise<{ mensaje: string }> {
    const user = req.user as any;
    return this.citasService.cancelar(id, undefined, user?.sub);
  }

  @Post(':id/completar')
  async completar(@Param('id') id: string): Promise<CitaResponse> {
    return this.citasService.completar(id);
  }

  @Post(':id/admision')
  async admision(@Param('id') id: string): Promise<CitaResponse> {
    return this.citasService.registrarAdmision(id);
  }
}
