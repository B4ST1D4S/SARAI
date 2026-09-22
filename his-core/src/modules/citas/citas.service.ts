import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';

// Colombia no tiene horario de verano: el offset es siempre fijo.
const TIMEZONE_OFFSET_BOGOTA = '-05:00';

export interface CitaResponse {
  id: string;
  turnoId: string | null;
  sedeId: string;
  consultorioId: string;
  profesionalId: string;
  especialidadId: string;
  tipoConsultaId: string;
  pacienteId: string;
  fechaHora: string;
  duracionMinutos: number;
  estado: string;
  motivo: string | null;
  paciente?: { id: string; nombreCompleto: string; tipoDocumento?: string; numeroDocumento?: string };
  medico?: { nombre: string; apellido: string };
  tipoCita?: string | null;
}

@Injectable()
export class CitasService {
  private readonly logger = new Logger(CitasService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  async crear(dto: CreateCitaDto, creadoPor?: string): Promise<CitaResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();

    const turnoRes = await pool.query(
      `SELECT * FROM agenda_turnos_profesional WHERE id = $1`,
      [dto.turnoId],
    );
    if (turnoRes.rows.length === 0) {
      throw new NotFoundException(`Turno con ID '${dto.turnoId}' no encontrado`);
    }
    const turno = turnoRes.rows[0];
    if (turno.estado !== 'HABILITADO') {
      throw new BadRequestException('El turno seleccionado ya no está habilitado');
    }

    // La tabla tipos_consulta no define una duración propia; se usa el intervalo del turno.
    const duracionMinutos = turno.intervalo_minutos || 15;

    const pacienteRes = await pool.query('SELECT id FROM pacientes WHERE id = $1', [dto.pacienteId]);
    if (pacienteRes.rows.length === 0) {
      throw new NotFoundException(`Paciente con ID '${dto.pacienteId}' no encontrado`);
    }

    const tipoConsultaExiste = await pool.query('SELECT id FROM tipos_consulta WHERE id = $1', [dto.tipoConsultaId]);
    if (tipoConsultaExiste.rows.length === 0) {
      throw new NotFoundException(`Tipo de consulta con ID '${dto.tipoConsultaId}' no encontrado`);
    }

    const horaInicioNorm = this.normalizeTimeString(dto.horaInicio);
    const horaInicioMin = this.timeStringToMinutes(horaInicioNorm);
    const turnoInicioMin = this.timeStringToMinutes(turno.hora_inicio);
    const turnoFinMin = this.timeStringToMinutes(turno.hora_fin);

    if (horaInicioMin < turnoInicioMin || horaInicioMin + duracionMinutos > turnoFinMin) {
      throw new BadRequestException('El horario solicitado está fuera del rango del turno');
    }

    const horaFinNorm = this.minutesToTimeString(horaInicioMin + duracionMinutos);
    const fecha = this.extractDateOnly(turno.fecha);
    // Offset fijo de Colombia (sin horario de verano): sin él, Postgres interpreta
    // el string naive con el timezone de la sesión (UTC), corriendo la cita 5h antes.
    const fechaHoraInicio = `${fecha}T${horaInicioNorm}${TIMEZONE_OFFSET_BOGOTA}`;
    const fechaHoraFin = `${fecha}T${horaFinNorm}${TIMEZONE_OFFSET_BOGOTA}`;

    // Verificar solapamiento con citas activas del mismo profesional/consultorio
    const overlap = await pool.query(
      `SELECT id FROM citas
       WHERE profesional_id = $1
         AND estado NOT IN ('CANCELADA')
         AND fecha_hora_inicio < $3::timestamptz
         AND fecha_hora_fin > $2::timestamptz`,
      [turno.profesional_id, fechaHoraInicio, fechaHoraFin],
    );
    if (overlap.rows.length > 0) {
      throw new ConflictException('Ese horario ya fue reservado por otra cita');
    }

    const result = await pool.query(
      `INSERT INTO citas (
        turno_id, sede_id, consultorio_id, profesional_id, especialidad_id,
        tipo_consulta_id, paciente_id, fecha_hora_inicio, fecha_hora_fin,
        duracion_minutos, estado, motivo_consulta, es_sobrecupo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDIENTE',$11,false)
      RETURNING *;`,
      [
        turno.id,
        turno.sede_id,
        turno.consultorio_id,
        turno.profesional_id,
        turno.especialidad_id,
        dto.tipoConsultaId,
        dto.pacienteId,
        fechaHoraInicio,
        fechaHoraFin,
        duracionMinutos,
        dto.motivoConsulta ?? null,
      ],
    );

    this.logger.log(`Cita creada [${result.rows[0].id}] para paciente [${dto.pacienteId}]`);
    return this.mapRowBasico(result.rows[0]);
  }

  async listarAgenda(
    fechaInicio: string,
    fechaFin: string,
    profesionalId: string,
  ): Promise<CitaResponse[]> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `SELECT c.*,
        p.nombre_completo AS paciente_nombre, p.tipo_documento AS paciente_tipo_doc, p.numero_documento AS paciente_num_doc,
        u.primer_nombre AS medico_primer_nombre, u.primer_apellido AS medico_primer_apellido,
        tc.nombre AS tipo_consulta_nombre
       FROM citas c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN usuarios u ON u.id = c.profesional_id
       LEFT JOIN tipos_consulta tc ON tc.id = c.tipo_consulta_id
       WHERE c.profesional_id = $1
         AND c.fecha_hora_inicio >= $2::timestamptz
         AND c.fecha_hora_inicio <= $3::timestamptz
       ORDER BY c.fecha_hora_inicio ASC;`,
      [profesionalId, fechaInicio, fechaFin],
    );
    return result.rows.map((row) => this.mapRowConRelaciones(row));
  }

  async obtenerPorId(id: string): Promise<CitaResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `SELECT c.*,
        p.nombre_completo AS paciente_nombre, p.tipo_documento AS paciente_tipo_doc, p.numero_documento AS paciente_num_doc,
        u.primer_nombre AS medico_primer_nombre, u.primer_apellido AS medico_primer_apellido,
        tc.nombre AS tipo_consulta_nombre
       FROM citas c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN usuarios u ON u.id = c.profesional_id
       LEFT JOIN tipos_consulta tc ON tc.id = c.tipo_consulta_id
       WHERE c.id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Cita con ID '${id}' no encontrada`);
    }
    return this.mapRowConRelaciones(result.rows[0]);
  }

  async actualizarEstado(id: string, dto: UpdateEstadoCitaDto, usuarioId?: string): Promise<CitaResponse> {
    await this.obtenerPorId(id);
    const pool = this.tenancyConnectionService.getTenantPool();

    if (dto.estado === 'CANCELADA') {
      const result = await pool.query(
        `UPDATE citas SET estado = 'CANCELADA', motivo_cancelacion = $2,
          usuario_cancelo_id = $3, fecha_cancelacion = now(), updated_at = now()
         WHERE id = $1 RETURNING *;`,
        [id, dto.motivoCancelacion ?? null, usuarioId ?? null],
      );
      return this.mapRowBasico(result.rows[0]);
    }

    const result = await pool.query(
      `UPDATE citas SET estado = $2, updated_at = now() WHERE id = $1 RETURNING *;`,
      [id, dto.estado],
    );
    return this.mapRowBasico(result.rows[0]);
  }

  async cancelar(id: string, motivo?: string, usuarioId?: string): Promise<{ mensaje: string }> {
    await this.actualizarEstado(id, { estado: 'CANCELADA', motivoCancelacion: motivo }, usuarioId);
    return { mensaje: 'Cita cancelada exitosamente' };
  }

  async completar(id: string): Promise<CitaResponse> {
    return this.actualizarEstado(id, { estado: 'COMPLETADA' });
  }

  async registrarAdmision(id: string): Promise<CitaResponse> {
    const cita = await this.obtenerPorId(id);
    if (!['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) {
      throw new BadRequestException(
        `No se puede registrar admisión de una cita en estado '${cita.estado}'`,
      );
    }
    return this.actualizarEstado(id, { estado: 'EN_SALA' });
  }

  private mapRowBasico(row: any): CitaResponse {
    return {
      id: row.id,
      turnoId: row.turno_id,
      sedeId: row.sede_id,
      consultorioId: row.consultorio_id,
      profesionalId: row.profesional_id,
      especialidadId: row.especialidad_id,
      tipoConsultaId: row.tipo_consulta_id,
      pacienteId: row.paciente_id,
      fechaHora: row.fecha_hora_inicio,
      duracionMinutos: Number(row.duracion_minutos),
      estado: row.estado,
      motivo: row.motivo_consulta ?? null,
    };
  }

  private mapRowConRelaciones(row: any): CitaResponse {
    return {
      ...this.mapRowBasico(row),
      paciente: {
        id: row.paciente_id,
        nombreCompleto: row.paciente_nombre || 'Paciente',
        tipoDocumento: row.paciente_tipo_doc ?? undefined,
        numeroDocumento: row.paciente_num_doc ?? undefined,
      },
      medico: {
        nombre: row.medico_primer_nombre || '',
        apellido: row.medico_primer_apellido || '',
      },
      tipoCita: row.tipo_consulta_nombre ?? null,
    };
  }

  private extractDateOnly(dateVal: any): string {
    if (!dateVal) return '';
    if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
    const str = String(dateVal).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str.substring(0, 10);
  }

  private normalizeTimeString(timeStr: string): string {
    const str = String(timeStr || '00:00:00').trim();
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
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
  }
}
