import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AgendaOrganizacionalService,
  ConsultorioResponse,
  DepartamentoResponse,
  ProfesionalResponse,
  SedeResponse,
  TurnoDisponibilidadResponse,
  TurnoListItem,
  TurnoOperativoResponse,
} from './agenda-organizacional.service';
import {
  CreateAgendaMasivaDto,
  CreateConsultorioDto,
  CreateDepartamentoDto,
  CreateSedeDto,
  CreateTurnoDto,
  ConsultarSlotsDto,
} from './dto';

@Controller('agenda-organizacional')
@UseGuards(JwtAuthGuard)
export class AgendaOrganizacionalController {
  constructor(
    private readonly agendaOrganizacionalService: AgendaOrganizacionalService,
  ) {}

  // ===========================================================================
  // SEDES
  // ===========================================================================

  @Post('sedes')
  @HttpCode(HttpStatus.CREATED)
  async crearSede(@Body() dto: CreateSedeDto): Promise<SedeResponse> {
    return this.agendaOrganizacionalService.crearSede(dto);
  }

  @Get('sedes')
  async listarSedes(
    @Query('soloActivos') soloActivos?: string,
  ): Promise<SedeResponse[]> {
    const isActivosOnly = soloActivos === 'true' || soloActivos === '1';
    return this.agendaOrganizacionalService.listarSedes(isActivosOnly);
  }

  @Get('sedes/:sedeId')
  async obtenerSede(
    @Param('sedeId') sedeId: string,
  ): Promise<SedeResponse> {
    return this.agendaOrganizacionalService.obtenerSedePorId(sedeId);
  }

  // ===========================================================================
  // DEPARTAMENTOS / CENTROS DE COSTOS
  // ===========================================================================

  @Post('departamentos')
  @HttpCode(HttpStatus.CREATED)
  async crearDepartamento(
    @Body() dto: CreateDepartamentoDto,
  ): Promise<DepartamentoResponse> {
    return this.agendaOrganizacionalService.crearDepartamento(dto);
  }

  @Get('sedes/:sedeId/departamentos')
  async listarDepartamentosPorSede(
    @Param('sedeId') sedeId: string,
    @Query('soloActivos') soloActivos?: string,
  ): Promise<DepartamentoResponse[]> {
    const isActivosOnly = soloActivos === 'true' || soloActivos === '1';
    return this.agendaOrganizacionalService.listarDepartamentosPorSede(
      sedeId,
      isActivosOnly,
    );
  }

  @Get('departamentos/:deptoId')
  async obtenerDepartamento(
    @Param('deptoId') deptoId: string,
  ): Promise<DepartamentoResponse> {
    return this.agendaOrganizacionalService.obtenerDepartamentoPorId(deptoId);
  }

  // ===========================================================================
  // CONSULTORIOS / RECURSOS FÍSICOS
  // ===========================================================================

  @Post('consultorios')
  @HttpCode(HttpStatus.CREATED)
  async crearConsultorio(
    @Body() dto: CreateConsultorioDto,
  ): Promise<ConsultorioResponse> {
    return this.agendaOrganizacionalService.crearConsultorio(dto);
  }

  @Get('departamentos/:deptoId/consultorios')
  async listarConsultoriosPorDepartamento(
    @Param('deptoId') deptoId: string,
    @Query('soloActivos') soloActivos?: string,
  ): Promise<ConsultorioResponse[]> {
    const isActivosOnly = soloActivos === 'true' || soloActivos === '1';
    return this.agendaOrganizacionalService.listarConsultoriosPorDepartamento(
      deptoId,
      isActivosOnly,
    );
  }

  @Get('consultorios/:consultorioId')
  async obtenerConsultorio(
    @Param('consultorioId') consultorioId: string,
  ): Promise<ConsultorioResponse> {
    return this.agendaOrganizacionalService.obtenerConsultorioPorId(
      consultorioId,
    );
  }

  // ===========================================================================
  // APERTURA DE TURNOS OPERATIVOS
  // ===========================================================================

  @Post('turnos')
  @HttpCode(HttpStatus.CREATED)
  async crearTurno(
    @Body() dto: CreateTurnoDto,
  ): Promise<TurnoOperativoResponse> {
    return this.agendaOrganizacionalService.crearTurno(dto);
  }

  @Post('turnos/masivos')
  async generarAgendaMasiva(@Body() dto: CreateAgendaMasivaDto) {
    return this.agendaOrganizacionalService.generarAgendaMasiva(dto);
  }

  @Get('turnos')
  async listarTurnos(
    @Query('sedeId') sedeId?: string,
    @Query('consultorioId') consultorioId?: string,
    @Query('profesionalId') profesionalId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<TurnoListItem[]> {
    return this.agendaOrganizacionalService.listarTurnos({
      sedeId, consultorioId, profesionalId, fechaInicio, fechaFin,
    });
  }

  @Put('turnos/:turnoId/cancelar')
  async cancelarTurno(
    @Param('turnoId') turnoId: string,
    @Body('motivo') motivo?: string,
  ): Promise<{ mensaje: string }> {
    return this.agendaOrganizacionalService.cancelarTurno(turnoId, motivo);
  }

  // ===========================================================================
  // PROFESIONALES (para asignación de turnos)
  // ===========================================================================

  @Get('profesionales')
  async listarProfesionales(): Promise<ProfesionalResponse[]> {
    return this.agendaOrganizacionalService.listarProfesionales();
  }

  // ===========================================================================
  // CONSULTA DE DISPONIBILIDAD Y SLOTS
  // ===========================================================================

  @Get('turnos/slots')
  async consultarSlots(
    @Query() query: ConsultarSlotsDto,
  ): Promise<TurnoDisponibilidadResponse[]> {
    return this.agendaOrganizacionalService.obtenerSlotsDisponibles(query);
  }
}
