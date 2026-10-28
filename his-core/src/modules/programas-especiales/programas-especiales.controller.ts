import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProgramasEspecialesService } from './programas-especiales.service';
import {
  ActualizarInscripcionDto,
  ActualizarMaquinaDto,
  CrearInscripcionDto,
  CrearMaquinaDto,
  EstadoProgramaDto,
} from './dto';

type JsonBody = Record<string, unknown>;

@Controller('programas-especiales/renal')
@UseGuards(JwtAuthGuard)
export class ProgramasEspecialesController {
  constructor(private readonly service: ProgramasEspecialesService) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboardRenal();
  }

  @Get('programas')
  getProgramas() {
    return this.service.listarProgramas();
  }

  @Patch('programas/:codigo')
  actualizarPrograma(
    @Param('codigo') codigo: string,
    @Body() body: EstadoProgramaDto,
  ) {
    return this.service.actualizarEstadoPrograma(codigo, body.activo);
  }

  @Get('maquinas')
  getMaquinas(@Query('sedeId') sedeId?: string) {
    return this.service.listarMaquinas(sedeId);
  }

  @Post('maquinas')
  @HttpCode(HttpStatus.CREATED)
  crearMaquina(@Body() body: CrearMaquinaDto) {
    return this.service.crearMaquina(body);
  }

  @Patch('maquinas/:id')
  actualizarMaquina(@Param('id') id: string, @Body() body: ActualizarMaquinaDto) {
    return this.service.actualizarMaquina(id, body);
  }

  @Get('inscripciones')
  getInscripciones(
    @Query('estado') estado?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.listarInscripciones({ estado, search, skip, take });
  }

  @Get('inscripciones/:id')
  getInscripcion(@Param('id') id: string) {
    return this.service.obtenerInscripcion(id);
  }

  @Post('inscripciones')
  @HttpCode(HttpStatus.CREATED)
  inscribirPaciente(@Body() body: CrearInscripcionDto) {
    return this.service.inscribirPaciente(body);
  }

  @Patch('inscripciones/:id')
  actualizarInscripcion(@Param('id') id: string, @Body() body: ActualizarInscripcionDto) {
    return this.service.actualizarInscripcion(id, body);
  }

  @Get('inscripciones/:inscripcionId/historia')
  getHistoria(@Param('inscripcionId') inscripcionId: string) {
    return this.service.obtenerHistoriaRenal(inscripcionId);
  }

  @Patch('inscripciones/:inscripcionId/historia')
  actualizarHistoria(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.actualizarHistoriaRenal(inscripcionId, body);
  }

  @Get('inscripciones/:inscripcionId/accesos')
  getAccesos(@Param('inscripcionId') inscripcionId: string) {
    return this.service.listarRegistros('ACCESO', inscripcionId);
  }

  @Post('inscripciones/:inscripcionId/accesos')
  @HttpCode(HttpStatus.CREATED)
  crearAcceso(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.crearRegistro('ACCESO', inscripcionId, body);
  }

  @Patch('accesos/:id')
  actualizarAcceso(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarRegistro('ACCESO', id, body);
  }

  @Get('inscripciones/:inscripcionId/sesiones')
  getSesiones(
    @Param('inscripcionId') inscripcionId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.listarSesiones(inscripcionId, { skip, take, desde, hasta });
  }

  @Get('sesiones/:id')
  getSesion(@Param('id') id: string) {
    return this.service.obtenerRegistro('SESION', id);
  }

  @Post('inscripciones/:inscripcionId/sesiones')
  @HttpCode(HttpStatus.CREATED)
  crearSesion(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.crearRegistro('SESION', inscripcionId, body);
  }

  @Patch('sesiones/:id')
  actualizarSesion(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarRegistro('SESION', id, body);
  }

  @Get('inscripciones/:inscripcionId/laboratorios')
  getLaboratorios(
    @Param('inscripcionId') inscripcionId: string,
    @Query('tipo') tipo?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.listarLaboratorios(inscripcionId, { tipo, skip, take });
  }

  @Post('inscripciones/:inscripcionId/laboratorios')
  @HttpCode(HttpStatus.CREATED)
  crearLaboratorio(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.crearRegistro('LABORATORIO', inscripcionId, body);
  }

  @Patch('laboratorios/:id')
  actualizarLaboratorio(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarRegistro('LABORATORIO', id, body);
  }

  @Get('inscripciones/:inscripcionId/eventos')
  getEventos(@Param('inscripcionId') inscripcionId: string) {
    return this.service.listarRegistros('EVENTO', inscripcionId);
  }

  @Post('inscripciones/:inscripcionId/eventos')
  @HttpCode(HttpStatus.CREATED)
  crearEvento(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.crearRegistro('EVENTO', inscripcionId, body);
  }

  @Get('inscripciones/:inscripcionId/evoluciones')
  getEvoluciones(
    @Param('inscripcionId') inscripcionId: string,
    @Query('disciplina') disciplina?: string,
  ) {
    return this.service.listarRegistros('EVOLUCION', inscripcionId, { disciplina });
  }

  @Post('inscripciones/:inscripcionId/evoluciones')
  @HttpCode(HttpStatus.CREATED)
  crearEvolucion(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.crearRegistro('EVOLUCION', inscripcionId, body);
  }

  @Get('inscripciones/:inscripcionId/tamizajes')
  getTamizajes(@Param('inscripcionId') inscripcionId: string) {
    return this.service.listarRegistros('TAMIZAJE', inscripcionId);
  }

  @Patch('tamizajes/:id')
  actualizarTamizaje(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarRegistro('TAMIZAJE', id, body);
  }

  @Get('turnos')
  getTurnos(
    @Query('esquema') esquema?: string,
    @Query('jornada') jornada?: string,
  ) {
    return this.service.listarTurnos({ esquema, jornada });
  }

  @Post('turnos')
  @HttpCode(HttpStatus.CREATED)
  asignarTurno(@Body() body: JsonBody) {
    return this.service.asignarTurno(body);
  }

  @Delete('turnos/:inscripcionId')
  inactivarTurno(@Param('inscripcionId') inscripcionId: string) {
    return this.service.inactivarTurno(inscripcionId);
  }

  @Get('contadores-dia')
  getContadoresDia() {
    return this.service.getContadoresDia();
  }

  @Get('inscripciones/:inscripcionId/turno')
  getTurnoInscripcion(@Param('inscripcionId') inscripcionId: string) {
    return this.service.obtenerTurno(inscripcionId);
  }

  @Get('inscripciones/:inscripcionId/serologia')
  getSerologia(@Param('inscripcionId') inscripcionId: string) {
    return this.service.listarSerologia(inscripcionId);
  }

  @Post('inscripciones/:inscripcionId/serologia')
  @HttpCode(HttpStatus.CREATED)
  guardarSerologia(
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: JsonBody,
  ) {
    return this.service.guardarSerologia(inscripcionId, body);
  }

  @Get('parametrizacion')
  getParametrizacion() {
    return this.service.getParametrizacion();
  }

  @Put('parametrizacion')
  saveParametrizacion(@Body() body: JsonBody) {
    return this.service.saveParametrizacion(body);
  }

  @Post('parametrizacion/sillones')
  @HttpCode(HttpStatus.CREATED)
  crearSillon(@Body() body: JsonBody) {
    return this.service.crearElementoConfiguracion('sillones', body);
  }

  @Patch('parametrizacion/sillones/:id')
  actualizarSillon(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarElementoConfiguracion('sillones', id, body);
  }

  @Delete('parametrizacion/sillones/:id')
  eliminarSillon(@Param('id') id: string) {
    return this.service.eliminarElementoConfiguracion('sillones', id);
  }

  @Post('parametrizacion/esquemas')
  @HttpCode(HttpStatus.CREATED)
  crearEsquema(@Body() body: JsonBody) {
    return this.service.crearElementoConfiguracion('esquemas', body);
  }

  @Patch('parametrizacion/esquemas/:id')
  actualizarEsquema(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarElementoConfiguracion('esquemas', id, body);
  }

  @Delete('parametrizacion/esquemas/:id')
  eliminarEsquema(@Param('id') id: string) {
    return this.service.eliminarElementoConfiguracion('esquemas', id);
  }

  @Post('parametrizacion/jornadas')
  @HttpCode(HttpStatus.CREATED)
  crearJornada(@Body() body: JsonBody) {
    return this.service.crearElementoConfiguracion('jornadas', body);
  }

  @Patch('parametrizacion/jornadas/:id')
  actualizarJornada(@Param('id') id: string, @Body() body: JsonBody) {
    return this.service.actualizarElementoConfiguracion('jornadas', id, body);
  }

  @Delete('parametrizacion/jornadas/:id')
  eliminarJornada(@Param('id') id: string) {
    return this.service.eliminarElementoConfiguracion('jornadas', id);
  }
}
