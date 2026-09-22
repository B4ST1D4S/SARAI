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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  EspecialidadesService,
  EspecialidadResponse,
} from './especialidades.service';
import { CreateEspecialidadDto, UpdateEspecialidadDto } from './dto';

@Controller('especialidades')
@UseGuards(JwtAuthGuard)
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CreateEspecialidadDto): Promise<EspecialidadResponse> {
    return this.especialidadesService.crear(dto);
  }

  @Get()
  async listar(): Promise<EspecialidadResponse[]> {
    return this.especialidadesService.listar();
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<EspecialidadResponse> {
    return this.especialidadesService.obtenerPorId(id);
  }

  @Put(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateEspecialidadDto,
  ): Promise<EspecialidadResponse> {
    return this.especialidadesService.actualizar(id, dto);
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string): Promise<{ mensaje: string }> {
    return this.especialidadesService.desactivar(id);
  }
}
