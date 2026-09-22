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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TiposConsultaService, TipoConsultaResponse } from './tipos-consulta.service';
import { CreateTipoConsultaDto, UpdateTipoConsultaDto } from './dto';

@Controller('tipos-consulta')
@UseGuards(JwtAuthGuard)
export class TiposConsultaController {
  constructor(private readonly tiposConsultaService: TiposConsultaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CreateTipoConsultaDto): Promise<TipoConsultaResponse> {
    return this.tiposConsultaService.crear(dto);
  }

  @Get()
  async listar(
    @Query('especialidadId') especialidadId?: string,
  ): Promise<TipoConsultaResponse[]> {
    return this.tiposConsultaService.listar(especialidadId);
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<TipoConsultaResponse> {
    return this.tiposConsultaService.obtenerPorId(id);
  }

  @Put(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateTipoConsultaDto,
  ): Promise<TipoConsultaResponse> {
    return this.tiposConsultaService.actualizar(id, dto);
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string): Promise<{ mensaje: string }> {
    return this.tiposConsultaService.desactivar(id);
  }
}
