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
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CitasService, CitaResponse } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';
import { FacturacionService } from '../facturacion/facturacion.service';

@Controller('citas')
@UseGuards(JwtAuthGuard)
export class CitasController {
  private readonly logger = new Logger(CitasController.name);

  constructor(
    private readonly citasService: CitasService,
    private readonly facturacionService: FacturacionService,
  ) {}

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
    const cita = await this.citasService.completar(id);
    await this.crearIngresoFacturacionSinBloquear(id);
    return cita;
  }

  @Post(':id/admision')
  async admision(@Param('id') id: string): Promise<CitaResponse> {
    const cita = await this.citasService.registrarAdmision(id);
    await this.crearIngresoFacturacionSinBloquear(id);
    return cita;
  }

  /**
   * Desde que el paciente llega (admisión) ya se puede empezar a cargar
   * cuenta (consulta, insumos, etc.), así que el ingreso+cuenta de
   * facturación debe existir desde ahí, no solo al cerrar la atención.
   * Idempotente (FacturacionService.crearIngresoYCuentaDesdeCita) y no debe
   * bloquear la admisión/atención si falla.
   */
  private async crearIngresoFacturacionSinBloquear(citaId: string): Promise<void> {
    try {
      await this.facturacionService.crearIngresoYCuentaDesdeCita(citaId);
    } catch (err: any) {
      this.logger.warn(`No se pudo crear el ingreso de facturación para la cita [${citaId}]: ${err?.message}`);
    }
  }
}
