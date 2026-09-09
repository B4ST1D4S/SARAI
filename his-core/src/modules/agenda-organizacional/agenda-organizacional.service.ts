import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import {
  CreateAgendaMasivaDto,
  CreateSedeDto,
  CreateDepartamentoDto,
  CreateConsultorioDto,
  CreateTurnoDto,
  ConsultarSlotsDto,
} from './dto';

export interface SedeResponse {
  id: string;
  codigo: string;
  nombre: string;
  codigoReps?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartamentoResponse {
  id: string;
  sedeId: string;
  codigo: string;
  nombre: string;
  tipo: string;
  pisoBloque?: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultorioResponse {
  id: string;
  departamentoId: string;
  codigo: string;
  nombre: string;
  tipo: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TurnoOperativoResponse {
  id: string;
  sedeId: string;
  departamentoId: string;
  consultorioId: string;
  profesionalId: string;
  especialidadId: string;
  plantillaId?: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  sobrecuposMax: number;
  modalidad: string;
  estado: string;
  motivoBloqueo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlotDisponibilidad {
  slotId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  disponible: boolean;
  citaOcupanteId?: string | null;
  estadoCita?: string | null;
}

export interface TurnoDisponibilidadResponse {
  turnoId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  modalidad: string;
  sede: {
    id: string;
    nombre: string;
  };
  departamento: {
    id: string;
    nombre: string;
  };
  consultorio: {
    id: string;
    nombre: string;
    tipo: string;
  };
  profesional: {
    id: string;
    nombreCompleto: string;
  };
  especialidadId: string;
  sobrecuposMax: number;
  sobrecuposOcupados: number;
  sobrecuposDisponibles: number;
  totalSlots: number;
  slotsLibres: number;
  slotsOcupados: number;
  slots: SlotDisponibilidad[];
}

@Injectable()
export class AgendaOrganizacionalService {
  private readonly logger = new Logger(AgendaOrganizacionalService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  // ===========================================================================
  // 1. GESTIÓN DE SEDES
  // ===========================================================================

  async crearSede(dto: CreateSedeDto): Promise<SedeResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    // Validar duplicidad de código de sede
    const existingCheck = await tenantPool.query(
      'SELECT id FROM sedes WHERE codigo = $1',
      [dto.codigo.trim()],
    );

    if (existingCheck.rows.length > 0) {
      throw new ConflictException(
        `Ya existe una sede registrada con el código '${dto.codigo}'`,
      );
    }

    const insertQuery = `
      INSERT INTO sedes (
        codigo,
        nombre,
        codigo_reps,
        direccion,
        telefono,
        ciudad,
        activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const result = await tenantPool.query(insertQuery, [
      dto.codigo.trim(),
      dto.nombre.trim(),
      dto.codigoReps?.trim() ?? null,
      dto.direccion?.trim() ?? null,
      dto.telefono?.trim() ?? null,
      dto.ciudad?.trim() ?? null,
      dto.activo ?? true,
    ]);

    const row = result.rows[0];
    this.logger.log(`Sede creada exitosamente [${row.id}] - ${row.nombre}`);
    return this.mapSedeRow(row);
  }

  async listarSedes(soloActivos = false): Promise<SedeResponse[]> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const query = `
      SELECT * FROM sedes
      ${soloActivos ? 'WHERE activo = true' : ''}
      ORDER BY nombre ASC;
    `;
    const result = await tenantPool.query(query);
    return result.rows.map((row) => this.mapSedeRow(row));
  }

  async obtenerSedePorId(id: string): Promise<SedeResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const result = await tenantPool.query('SELECT * FROM sedes WHERE id = $1', [
      id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`Sede con ID '${id}' no encontrada`);
    }

    return this.mapSedeRow(result.rows[0]);
  }

  // ===========================================================================
  // 2. GESTIÓN DE CENTROS DE COSTO / DEPARTAMENTOS
  // ===========================================================================

  async crearDepartamento(
    dto: CreateDepartamentoDto,
  ): Promise<DepartamentoResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    // Validar que la sede exista
    const sedeCheck = await tenantPool.query(
      'SELECT id FROM sedes WHERE id = $1',
      [dto.sedeId],
    );
    if (sedeCheck.rows.length === 0) {
      throw new NotFoundException(
        `La sede con ID '${dto.sedeId}' no existe en el sistema`,
      );
    }

    // Validar unicidad (sede_id, codigo)
    const existingCheck = await tenantPool.query(
      'SELECT id FROM centros_costo_departamentos WHERE sede_id = $1 AND codigo = $2',
      [dto.sedeId, dto.codigo.trim()],
    );
    if (existingCheck.rows.length > 0) {
      throw new ConflictException(
        `Ya existe un departamento con el código '${dto.codigo}' en la sede indicada`,
      );
    }

    const insertQuery = `
      INSERT INTO centros_costo_departamentos (
        sede_id,
        codigo,
        nombre,
        tipo,
        piso_bloque,
        activo
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await tenantPool.query(insertQuery, [
      dto.sedeId,
      dto.codigo.trim(),
      dto.nombre.trim(),
      dto.tipo?.trim() || 'ASISTENCIAL',
      dto.pisoBloque?.trim() ?? null,
      dto.activo ?? true,
    ]);

    const row = result.rows[0];
    this.logger.log(
      `Departamento creado exitosamente [${row.id}] - ${row.nombre} en sede [${dto.sedeId}]`,
    );
    return this.mapDepartamentoRow(row);
  }

  async listarDepartamentosPorSede(
    sedeId: string,
    soloActivos = false,
  ): Promise<DepartamentoResponse[]> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const query = `
      SELECT * FROM centros_costo_departamentos
      WHERE sede_id = $1
      ${soloActivos ? 'AND activo = true' : ''}
      ORDER BY nombre ASC;
    `;
    const result = await tenantPool.query(query, [sedeId]);
    return result.rows.map((row) => this.mapDepartamentoRow(row));
  }

  async obtenerDepartamentoPorId(id: string): Promise<DepartamentoResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const result = await tenantPool.query(
      'SELECT * FROM centros_costo_departamentos WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(
        `Departamento con ID '${id}' no encontrado`,
      );
    }

    return this.mapDepartamentoRow(result.rows[0]);
  }

  // ===========================================================================
  // 3. GESTIÓN DE CONSULTORIOS / RECURSOS FÍSICOS
  // ===========================================================================

  async crearConsultorio(
    dto: CreateConsultorioDto,
  ): Promise<ConsultorioResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    // Validar que el departamento exista
    const deptoCheck = await tenantPool.query(
      'SELECT id FROM centros_costo_departamentos WHERE id = $1',
      [dto.departamentoId],
    );
    if (deptoCheck.rows.length === 0) {
      throw new NotFoundException(
        `El departamento con ID '${dto.departamentoId}' no existe en el sistema`,
      );
    }

    // Validar unicidad (departamento_id, codigo)
    const existingCheck = await tenantPool.query(
      'SELECT id FROM consultorios_recursos WHERE departamento_id = $1 AND codigo = $2',
      [dto.departamentoId, dto.codigo.trim()],
    );
    if (existingCheck.rows.length > 0) {
      throw new ConflictException(
        `Ya existe un consultorio/recurso con el código '${dto.codigo}' en el departamento indicado`,
      );
    }

    const insertQuery = `
      INSERT INTO consultorios_recursos (
        departamento_id,
        codigo,
        nombre,
        tipo,
        activo
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await tenantPool.query(insertQuery, [
      dto.departamentoId,
      dto.codigo.trim(),
      dto.nombre.trim(),
      dto.tipo?.trim() || 'CONSULTORIO',
      dto.activo ?? true,
    ]);

    const row = result.rows[0];
    this.logger.log(
      `Consultorio creado exitosamente [${row.id}] - ${row.nombre} en depto [${dto.departamentoId}]`,
    );
    return this.mapConsultorioRow(row);
  }

  async listarConsultoriosPorDepartamento(
    deptoId: string,
    soloActivos = false,
  ): Promise<ConsultorioResponse[]> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const query = `
      SELECT * FROM consultorios_recursos
      WHERE departamento_id = $1
      ${soloActivos ? 'AND activo = true' : ''}
      ORDER BY nombre ASC;
    `;
    const result = await tenantPool.query(query, [deptoId]);
    return result.rows.map((row) => this.mapConsultorioRow(row));
  }

  async obtenerConsultorioPorId(id: string): Promise<ConsultorioResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const result = await tenantPool.query(
      'SELECT * FROM consultorios_recursos WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(
        `Consultorio/recurso con ID '${id}' no encontrado`,
      );
    }

    return this.mapConsultorioRow(result.rows[0]);
  }

  // ===========================================================================
  // 4. APERTURA Y GESTIÓN OPERATIVA DE TURNOS
  // ===========================================================================

  async crearTurno(dto: CreateTurnoDto): Promise<TurnoOperativoResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    // Normalizar horas
    const horaInicioFormatted = this.normalizeTimeString(dto.horaInicio);
    const horaFinFormatted = this.normalizeTimeString(dto.horaFin);

    const minutosInicio = this.timeStringToMinutes(horaInicioFormatted);
    const minutosFin = this.timeStringToMinutes(horaFinFormatted);

    if (minutosInicio >= minutosFin) {
      throw new BadRequestException(
        'La hora de inicio debe ser estrictamente anterior a la hora de fin del turno',
      );
    }

    const intervalo = dto.intervaloMinutos ?? 15;
    if (minutosFin - minutosInicio < intervalo) {
      throw new BadRequestException(
        `La duración total del turno (${minutosFin - minutosInicio} min) no puede ser menor al intervalo de atención (${intervalo} min)`,
      );
    }

    // Validar integridad referencial
    const [sedeRes, deptoRes, consultorioRes, profesionalRes] =
      await Promise.all([
        tenantPool.query('SELECT id FROM sedes WHERE id = $1', [dto.sedeId]),
        tenantPool.query(
          'SELECT id FROM centros_costo_departamentos WHERE id = $1 AND sede_id = $2',
          [dto.departamentoId, dto.sedeId],
        ),
        tenantPool.query(
          'SELECT id FROM consultorios_recursos WHERE id = $1 AND departamento_id = $2',
          [dto.consultorioId, dto.departamentoId],
        ),
        tenantPool.query('SELECT id FROM usuarios WHERE id = $1', [
          dto.profesionalId,
        ]),
      ]);

    if (sedeRes.rows.length === 0) {
      throw new NotFoundException(`Sede con ID '${dto.sedeId}' no encontrada`);
    }
    if (deptoRes.rows.length === 0) {
      throw new NotFoundException(
        `Departamento con ID '${dto.departamentoId}' no pertenece a la sede especificada`,
      );
    }
    if (consultorioRes.rows.length === 0) {
      throw new NotFoundException(
        `Consultorio con ID '${dto.consultorioId}' no pertenece al departamento especificado`,
      );
    }
    if (profesionalRes.rows.length === 0) {
      throw new NotFoundException(
        `Profesional/Usuario con ID '${dto.profesionalId}' no encontrado`,
      );
    }

    // Validar solapamiento físico en el consultorio
    const overlapConsultorioQuery = `
      SELECT id, hora_inicio, hora_fin 
      FROM agenda_turnos_profesional
      WHERE consultorio_id = $1 
        AND fecha = $2 
        AND estado = 'HABILITADO'
        AND hora_inicio < $3::time 
        AND hora_fin > $4::time;
    `;
    const overlapConsultorioRes = await tenantPool.query(
      overlapConsultorioQuery,
      [dto.consultorioId, dto.fecha, horaFinFormatted, horaInicioFormatted],
    );

    if (overlapConsultorioRes.rows.length > 0) {
      const conflict = overlapConsultorioRes.rows[0];
      throw new ConflictException(
        `Conflicto de espacio físico: El consultorio ya cuenta con un turno habilitado (${conflict.hora_inicio} - ${conflict.hora_fin}) para la fecha ${dto.fecha}`,
      );
    }

    // Validar solapamiento del profesional
    const overlapProfesionalQuery = `
      SELECT id, hora_inicio, hora_fin 
      FROM agenda_turnos_profesional
      WHERE profesional_id = $1 
        AND fecha = $2 
        AND estado = 'HABILITADO'
        AND hora_inicio < $3::time 
        AND hora_fin > $4::time;
    `;
    const overlapProfesionalRes = await tenantPool.query(
      overlapProfesionalQuery,
      [dto.profesionalId, dto.fecha, horaFinFormatted, horaInicioFormatted],
    );

    if (overlapProfesionalRes.rows.length > 0) {
      const conflict = overlapProfesionalRes.rows[0];
      throw new ConflictException(
        `Conflicto de agenda profesional: El profesional ya tiene un turno habilitado (${conflict.hora_inicio} - ${conflict.hora_fin}) para la fecha ${dto.fecha}`,
      );
    }

    // Inserción en agenda_turnos_profesional
    const insertQuery = `
      INSERT INTO agenda_turnos_profesional (
        sede_id,
        departamento_id,
        consultorio_id,
        profesional_id,
        especialidad_id,
        plantilla_id,
        fecha,
        hora_inicio,
        hora_fin,
        intervalo_minutos,
        sobrecupos_max,
        modalidad,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'HABILITADO')
      RETURNING *;
    `;

    const result = await tenantPool.query(insertQuery, [
      dto.sedeId,
      dto.departamentoId,
      dto.consultorioId,
      dto.profesionalId,
      dto.especialidadId,
      dto.plantillaId ?? null,
      dto.fecha,
      horaInicioFormatted,
      horaFinFormatted,
      intervalo,
      dto.sobrecuposMax ?? 0,
      dto.modalidad?.trim() || 'PRESENCIAL',
    ]);

    const row = result.rows[0];
    this.logger.log(
      `Turno creado exitosamente [${row.id}] - Fecha: ${row.fecha} (${row.hora_inicio} a ${row.hora_fin}) para Profesional [${dto.profesionalId}]`,
    );

    return this.mapTurnoRow(row);
  }

  async generarAgendaMasiva(dto: CreateAgendaMasivaDto): Promise<{
    totalTurnosGenerados: number;
    totalGenerados: number;
    totalOmitidos: number;
    fechasProcesadas: number;
    conflictos: number;
  }> {
    const fechaDesde = this.parseIsoDate(dto.fechaDesde, 'fechaDesde');
    const fechaHasta = this.parseIsoDate(dto.fechaHasta, 'fechaHasta');

    if (fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde no puede ser posterior a fechaHasta',
      );
    }

    const diasSemana = new Set(dto.diasSemana);
    const fechasExcluidas = new Set(dto.fechasExcluidas ?? []);
    const jornadas = dto.jornadas.map((jornada) => {
      const horaInicio = this.normalizeTimeString(jornada.horaInicio);
      const horaFin = this.normalizeTimeString(jornada.horaFin);
      const minutosInicio = this.timeStringToMinutes(horaInicio);
      const minutosFin = this.timeStringToMinutes(horaFin);

      if (minutosInicio >= minutosFin) {
        throw new BadRequestException(
          `La jornada ${jornada.horaInicio}-${jornada.horaFin} tiene un rango horario inválido`,
        );
      }
      if (minutosFin - minutosInicio < dto.intervaloMinutos) {
        throw new BadRequestException(
          `La jornada ${jornada.horaInicio}-${jornada.horaFin} es menor que el intervalo de ${dto.intervaloMinutos} minutos`,
        );
      }

      return { horaInicio, horaFin };
    });

    const resultado = await this.tenancyConnectionService.transaction(
      async (client) => {
        const [sedeRes, departamentoRes, consultorioRes, profesionalRes, especialidadRes] =
          await Promise.all([
            client.query('SELECT id FROM sedes WHERE id = $1', [dto.sedeId]),
            client.query(
              'SELECT id FROM centros_costo_departamentos WHERE id = $1 AND sede_id = $2',
              [dto.departamentoId, dto.sedeId],
            ),
            client.query(
              'SELECT id FROM consultorios_recursos WHERE id = $1 AND departamento_id = $2',
              [dto.consultorioId, dto.departamentoId],
            ),
            client.query('SELECT id FROM usuarios WHERE id = $1', [
              dto.profesionalId,
            ]),
            client.query('SELECT id FROM especialidades WHERE id = $1', [
              dto.especialidadId,
            ]),
          ]);

        if (sedeRes.rowCount === 0) {
          throw new NotFoundException(`Sede con ID '${dto.sedeId}' no encontrada`);
        }
        if (departamentoRes.rowCount === 0) {
          throw new NotFoundException(
            `Departamento con ID '${dto.departamentoId}' no pertenece a la sede especificada`,
          );
        }
        if (consultorioRes.rowCount === 0) {
          throw new NotFoundException(
            `Consultorio con ID '${dto.consultorioId}' no pertenece al departamento especificado`,
          );
        }
        if (profesionalRes.rowCount === 0) {
          throw new NotFoundException(
            `Profesional/Usuario con ID '${dto.profesionalId}' no encontrado`,
          );
        }
        if (especialidadRes.rowCount === 0) {
          throw new NotFoundException(
            `Especialidad con ID '${dto.especialidadId}' no encontrada`,
          );
        }

        if (dto.tipoConsultaId) {
          const tipoConsultaRes = await client.query(
            'SELECT id FROM tipos_consulta WHERE id = $1',
            [dto.tipoConsultaId],
          );
          if (tipoConsultaRes.rowCount === 0) {
            throw new NotFoundException(
              `Tipo de consulta con ID '${dto.tipoConsultaId}' no encontrado`,
            );
          }
        }

        let totalGenerados = 0;
        let totalOmitidos = 0;
        let fechasProcesadas = 0;

        for (
          let fecha = fechaDesde;
          fecha <= fechaHasta;
          fecha = this.addDays(fecha, 1)
        ) {
          const fechaTexto = this.formatIsoDate(fecha);
          const diaSemana = fecha.getUTCDay() || 7;

          if (
            !diasSemana.has(diaSemana) ||
            fechasExcluidas.has(fechaTexto) ||
            (dto.excluirFestivos && this.isColombianHoliday(fecha))
          ) {
            continue;
          }

          fechasProcesadas++;
          for (const jornada of jornadas) {
            const conflicto = await client.query(
              `SELECT id
                 FROM agenda_turnos_profesional
                WHERE fecha = $1
                  AND estado = 'HABILITADO'
                  AND (consultorio_id = $2 OR profesional_id = $3)
                  AND hora_inicio < $4::time
                  AND hora_fin > $5::time
                LIMIT 1`,
              [
                fechaTexto,
                dto.consultorioId,
                dto.profesionalId,
                jornada.horaFin,
                jornada.horaInicio,
              ],
            );

            if (conflicto.rowCount > 0) {
              totalOmitidos++;
              continue;
            }

            await client.query(
              `INSERT INTO agenda_turnos_profesional (
                 sede_id, departamento_id, consultorio_id, profesional_id,
                 especialidad_id, fecha, hora_inicio, hora_fin,
                 intervalo_minutos, sobrecupos_max, modalidad, estado
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'HABILITADO')`,
              [
                dto.sedeId,
                dto.departamentoId,
                dto.consultorioId,
                dto.profesionalId,
                dto.especialidadId,
                fechaTexto,
                jornada.horaInicio,
                jornada.horaFin,
                dto.intervaloMinutos,
                dto.sobrecuposMax ?? 0,
                dto.modalidad ?? 'PRESENCIAL',
              ],
            );
            totalGenerados++;
          }
        }

        return { totalGenerados, totalOmitidos, fechasProcesadas };
      },
    );

    this.logger.log(
      `Agenda masiva generada: ${resultado.totalGenerados} turnos creados, ${resultado.totalOmitidos} omitidos`,
    );

    return {
      totalTurnosGenerados: resultado.totalGenerados,
      totalGenerados: resultado.totalGenerados,
      totalOmitidos: resultado.totalOmitidos,
      fechasProcesadas: resultado.fechasProcesadas,
      conflictos: resultado.totalOmitidos,
    };
  }

  // ===========================================================================
  // 5. CONSULTA DE SLOTS Y DISPONIBILIDAD DE AGENDAMIENTO
  // ===========================================================================

  async obtenerSlotsDisponibles(
    query: ConsultarSlotsDto,
  ): Promise<TurnoDisponibilidadResponse[]> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    const fechaInicioStr = this.extractDateOnly(query.fechaInicio);
    const fechaFinStr = this.extractDateOnly(query.fechaFin);

    if (fechaInicioStr > fechaFinStr) {
      throw new BadRequestException(
        'fechaInicio no puede ser posterior a fechaFin',
      );
    }

    // 1. Consultar turnos operativos habilitados en el rango
    let turnosSql = `
      SELECT 
        t.id AS turno_id,
        t.sede_id,
        s.nombre AS sede_nombre,
        t.departamento_id,
        d.nombre AS departamento_nombre,
        t.consultorio_id,
        c.nombre AS consultorio_nombre,
        c.tipo AS consultorio_tipo,
        t.profesional_id,
        u.primer_nombre,
        u.primer_apellido,
        t.especialidad_id,
        t.fecha,
        t.hora_inicio,
        t.hora_fin,
        t.intervalo_minutos,
        t.sobrecupos_max,
        t.modalidad,
        t.estado
      FROM agenda_turnos_profesional t
      JOIN sedes s ON s.id = t.sede_id
      JOIN centros_costo_departamentos d ON d.id = t.departamento_id
      JOIN consultorios_recursos c ON c.id = t.consultorio_id
      JOIN usuarios u ON u.id = t.profesional_id
      WHERE t.estado = 'HABILITADO'
        AND t.fecha >= $1
        AND t.fecha <= $2
    `;

    const params: any[] = [fechaInicioStr, fechaFinStr];
    let paramIdx = 3;

    if (query.sedeId) {
      turnosSql += ` AND t.sede_id = $${paramIdx++}`;
      params.push(query.sedeId);
    }
    if (query.profesionalId) {
      turnosSql += ` AND t.profesional_id = $${paramIdx++}`;
      params.push(query.profesionalId);
    }
    if (query.especialidadId) {
      turnosSql += ` AND t.especialidad_id = $${paramIdx++}`;
      params.push(query.especialidadId);
    }
    if (query.consultorioId) {
      turnosSql += ` AND t.consultorio_id = $${paramIdx++}`;
      params.push(query.consultorioId);
    }

    turnosSql += ' ORDER BY t.fecha ASC, t.hora_inicio ASC;';

    const turnosRes = await tenantPool.query(turnosSql, params);
    if (turnosRes.rows.length === 0) {
      return [];
    }

    // 2. Consultar citas activas (no canceladas) en el rango
    let citasSql = `
      SELECT 
        id AS cita_id,
        turno_id,
        consultorio_id,
        profesional_id,
        fecha_hora_inicio,
        fecha_hora_fin,
        duracion_minutos,
        estado,
        es_sobrecupo
      FROM citas
      WHERE estado NOT IN ('CANCELADA')
        AND fecha_hora_inicio >= ($1::date)
        AND fecha_hora_inicio < ($2::date + INTERVAL '1 day')
    `;

    const citasParams: any[] = [fechaInicioStr, fechaFinStr];
    let citasParamIdx = 3;

    if (query.profesionalId) {
      citasSql += ` AND profesional_id = $${citasParamIdx++}`;
      citasParams.push(query.profesionalId);
    }
    if (query.consultorioId) {
      citasSql += ` AND consultorio_id = $${citasParamIdx++}`;
      citasParams.push(query.consultorioId);
    }

    const citasRes = await tenantPool.query(citasSql, citasParams);
    const citas = citasRes.rows;

    // 3. Segmentar cada turno en slots y cruzar disponibilidad
    const responses: TurnoDisponibilidadResponse[] = [];

    for (const turno of turnosRes.rows) {
      const fechaTurno = this.extractDateOnly(turno.fecha);
      const startMin = this.timeStringToMinutes(turno.hora_inicio);
      const endMin = this.timeStringToMinutes(turno.hora_fin);
      const intervalo = turno.intervalo_minutos || 15;

      const slots: SlotDisponibilidad[] = [];
      let currentMin = startMin;
      let slotIndex = 1;

      // Filtrar citas correspondientes a este profesional/consultorio en la fecha del turno
      const citasDelTurno = citas.filter((c) => {
        const citaFecha = this.extractDateOnly(c.fecha_hora_inicio);
        const matchProf = c.profesional_id === turno.profesional_id;
        const matchCons = c.consultorio_id === turno.consultorio_id;
        const matchTurnoId = c.turno_id ? c.turno_id === turno.turno_id : false;
        return citaFecha === fechaTurno && (matchTurnoId || matchProf || matchCons);
      });

      const sobrecuposOcupados = citasDelTurno.filter((c) => c.es_sobrecupo).length;
      const sobrecuposMax = turno.sobrecupos_max || 0;
      const sobrecuposDisponibles = Math.max(0, sobrecuposMax - sobrecuposOcupados);

      while (currentMin + intervalo <= endMin) {
        const slotStartStr = this.minutesToTimeString(currentMin);
        const slotEndStr = this.minutesToTimeString(currentMin + intervalo);

        const slotStartMin = currentMin;
        const slotEndMin = currentMin + intervalo;

        // Comprobar si alguna cita regular (no sobrecupo) coincide con este slot
        const citaRegularOcupante = citasDelTurno.find((c) => {
          if (c.es_sobrecupo) return false;
          const cStartMin = this.extractMinutesFromDate(c.fecha_hora_inicio);
          const cEndMin = this.extractMinutesFromDate(c.fecha_hora_fin);
          // Solapamiento: [slotStart, slotEnd) se cruza con [cStart, cEnd)
          return slotStartMin < cEndMin && slotEndMin > cStartMin;
        });

        const disponible = !citaRegularOcupante;

        slots.push({
          slotId: `${turno.turno_id}-S${slotIndex++}`,
          fecha: fechaTurno,
          horaInicio: slotStartStr,
          horaFin: slotEndStr,
          duracionMinutos: intervalo,
          disponible,
          citaOcupanteId: citaRegularOcupante ? citaRegularOcupante.cita_id : null,
          estadoCita: citaRegularOcupante ? citaRegularOcupante.estado : null,
        });

        currentMin += intervalo;
      }

      const totalSlots = slots.length;
      const slotsLibres = slots.filter((s) => s.disponible).length;
      const slotsOcupados = totalSlots - slotsLibres;

      responses.push({
        turnoId: turno.turno_id,
        fecha: fechaTurno,
        horaInicio: this.normalizeTimeString(turno.hora_inicio),
        horaFin: this.normalizeTimeString(turno.hora_fin),
        intervaloMinutos: intervalo,
        modalidad: turno.modalidad,
        sede: {
          id: turno.sede_id,
          nombre: turno.sede_nombre,
        },
        departamento: {
          id: turno.departamento_id,
          nombre: turno.departamento_nombre,
        },
        consultorio: {
          id: turno.consultorio_id,
          nombre: turno.consultorio_nombre,
          tipo: turno.consultorio_tipo,
        },
        profesional: {
          id: turno.profesional_id,
          nombreCompleto: `${turno.primer_nombre} ${turno.primer_apellido}`.trim(),
        },
        especialidadId: turno.especialidad_id,
        sobrecuposMax,
        sobrecuposOcupados,
        sobrecuposDisponibles,
        totalSlots,
        slotsLibres,
        slotsOcupados,
        slots,
      });
    }

    return responses;
  }

  // ===========================================================================
  // MAPPERS Y UTILIDADES DE TIEMPO / FORMATO
  // ===========================================================================

  private parseIsoDate(value: string, fieldName: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      this.formatIsoDate(date) !== value
    ) {
      throw new BadRequestException(
        `${fieldName} debe ser una fecha válida en formato YYYY-MM-DD`,
      );
    }
    return date;
  }

  private formatIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private isColombianHoliday(date: Date): boolean {
    const year = date.getUTCFullYear();
    const key = this.formatIsoDate(date);
    const fixed = new Set([
      `${year}-01-01`,
      `${year}-05-01`,
      `${year}-07-20`,
      `${year}-08-07`,
      `${year}-12-08`,
      `${year}-12-25`,
    ]);
    if (fixed.has(key)) return true;

    const easter = this.calculateEaster(year);
    const movable = [
      this.addDays(easter, -3),
      this.addDays(easter, -2),
      this.nextMonday(this.addDays(easter, 43)),
      this.nextMonday(this.addDays(easter, 64)),
      this.nextMonday(this.addDays(easter, 71)),
    ];

    // Colombia trasladó al lunes varios festivos de fecha fija (Ley 51 de 1983).
    const emiliani = [
      [1, 6], [3, 19], [6, 29], [8, 15], [10, 12], [11, 1], [11, 11],
    ];
    for (const [month, day] of emiliani) {
      movable.push(this.nextMonday(new Date(Date.UTC(year, month - 1, day))));
    }

    return movable.some((holiday) => this.formatIsoDate(holiday) === key);
  }

  private calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
  }

  private nextMonday(date: Date): Date {
    const day = date.getUTCDay();
    return this.addDays(date, day === 0 ? 1 : (8 - day) % 7);
  }

  private mapSedeRow(row: any): SedeResponse {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      codigoReps: row.codigo_reps ?? null,
      direccion: row.direccion ?? null,
      telefono: row.telefono ?? null,
      ciudad: row.ciudad ?? null,
      activo: Boolean(row.activo),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDepartamentoRow(row: any): DepartamentoResponse {
    return {
      id: row.id,
      sedeId: row.sede_id,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      pisoBloque: row.piso_bloque ?? null,
      activo: Boolean(row.activo),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapConsultorioRow(row: any): ConsultorioResponse {
    return {
      id: row.id,
      departamentoId: row.departamento_id,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      activo: Boolean(row.activo),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTurnoRow(row: any): TurnoOperativoResponse {
    return {
      id: row.id,
      sedeId: row.sede_id,
      departamentoId: row.departamento_id,
      consultorioId: row.consultorio_id,
      profesionalId: row.profesional_id,
      especialidadId: row.especialidad_id,
      plantillaId: row.plantilla_id ?? null,
      fecha: this.extractDateOnly(row.fecha),
      horaInicio: this.normalizeTimeString(row.hora_inicio),
      horaFin: this.normalizeTimeString(row.hora_fin),
      intervaloMinutos: Number(row.intervalo_minutos),
      sobrecuposMax: Number(row.sobrecupos_max ?? 0),
      modalidad: row.modalidad,
      estado: row.estado,
      motivoBloqueo: row.motivo_bloqueo ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private extractDateOnly(dateVal: any): string {
    if (!dateVal) return '';
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    const str = String(dateVal).trim();
    if (str.includes('T')) {
      return str.split('T')[0];
    }
    if (str.includes(' ')) {
      return str.split(' ')[0];
    }
    return str.substring(0, 10);
  }

  private normalizeTimeString(timeStr: string | any): string {
    if (!timeStr) return '00:00:00';
    const str = String(timeStr).trim();
    const parts = str.split(':');
    const hh = parts[0]?.padStart(2, '0') || '00';
    const mm = parts[1]?.padStart(2, '0') || '00';
    const ss = parts[2]?.substring(0, 2).padStart(2, '0') || '00';
    return `${hh}:${mm}:${ss}`;
  }

  private timeStringToMinutes(timeStr: string): number {
    const norm = this.normalizeTimeString(timeStr);
    const [hh, mm] = norm.split(':').map(Number);
    return hh * 60 + mm;
  }

  private minutesToTimeString(minutes: number): string {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  private extractMinutesFromDate(dateVal: any): number {
    if (!dateVal) return 0;
    if (dateVal instanceof Date) {
      const iso = dateVal.toISOString();
      const timePart = iso.split('T')[1]?.substring(0, 8) || '00:00:00';
      return this.timeStringToMinutes(timePart);
    }
    const str = String(dateVal).trim();
    if (str.includes('T')) {
      const timePart = str.split('T')[1].substring(0, 8);
      return this.timeStringToMinutes(timePart);
    }
    if (str.includes(' ')) {
      const timePart = str.split(' ')[1].substring(0, 8);
      return this.timeStringToMinutes(timePart);
    }
    return this.timeStringToMinutes(str);
  }
}
