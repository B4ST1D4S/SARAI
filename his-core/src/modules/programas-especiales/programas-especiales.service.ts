import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';

type JsonObject = Record<string, unknown>;
type RegistroTipo =
  | 'HISTORIA_RENAL'
  | 'ACCESO'
  | 'SESION'
  | 'LABORATORIO'
  | 'EVENTO'
  | 'EVOLUCION'
  | 'TAMIZAJE'
  | 'TURNO'
  | 'SEROLOGIA';
type ColeccionConfiguracion = 'sillones' | 'esquemas' | 'jornadas';

const MARCADORES_SEROLOGICOS = [
  'HBsAg',
  'AntiHBc',
  'AntiHBs',
  'AntiHVC',
  'HIV',
  'VDRL',
  'HBeAg',
  'AntiHBe',
];

function assertObject(value: unknown, label = 'El cuerpo'): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${label} debe ser un objeto JSON`);
  }
  return value as JsonObject;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} es obligatorio`);
  }
  return value.trim();
}

function requiredUuid(value: unknown, field: string): string {
  const parsed = requiredString(value, field);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed)) {
    throw new BadRequestException(`${field} debe ser un UUID válido`);
  }
  return parsed;
}

function optionalUuid(value: unknown, field: string): string | null {
  return value == null || value === '' ? null : requiredUuid(value, field);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sanitizeRecord(input: JsonObject): JsonObject {
  const { id, inscripcionId, pacienteId, createdAt, updatedAt, ...data } = input;
  return data;
}

function numberParam(value: string | undefined, defaultValue: number, max: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestException('Los parámetros de paginación deben ser enteros no negativos');
  }
  return Math.min(parsed, max);
}

function recordResponse(row: QueryResultRow): JsonObject {
  const data = (row.datos && typeof row.datos === 'object' ? row.datos : {}) as JsonObject;
  return {
    ...data,
    id: row.id,
    inscripcionId: row.inscripcion_id,
    pacienteId: row.paciente_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class ProgramasEspecialesService {
  constructor(private readonly tenancyConnectionService: TenancyConnectionService) {}

  private pool(): Pool {
    return this.tenancyConnectionService.getTenantPool();
  }

  private async getInscripcionPaciente(
    client: Pool | PoolClient,
    inscripcionId: string,
  ): Promise<string> {
    const result = await client.query(
      `SELECT paciente_id FROM pe_inscripciones WHERE id = $1`,
      [inscripcionId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Inscripción '${inscripcionId}' no encontrada`);
    }
    return result.rows[0].paciente_id;
  }

  async listarProgramas() {
    const result = await this.pool().query(
      `SELECT codigo, nombre, descripcion, categoria, icono, color, activo
       FROM pe_programas
       ORDER BY nombre`,
    );
    return result.rows;
  }

  async actualizarEstadoPrograma(codigo: string, activo: unknown) {
    if (typeof activo !== 'boolean') {
      throw new BadRequestException('activo debe ser un valor booleano');
    }
    if (codigo === 'RENAL' && !activo) {
      throw new BadRequestException('El Programa Renal no se puede desactivar');
    }
    const result = await this.pool().query(
      `UPDATE pe_programas
       SET activo = $2, updated_at = NOW()
       WHERE codigo = $1
       RETURNING codigo, nombre, descripcion, categoria, icono, color, activo`,
      [codigo, activo],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Programa '${codigo}' no encontrado`);
    }
    return result.rows[0];
  }

  async listarInscripciones(params: {
    estado?: string;
    search?: string;
    skip?: string;
    take?: string;
  }) {
    const pool = this.pool();
    const values: unknown[] = [];
    const conditions: string[] = [];
    if (params.estado) {
      values.push(params.estado);
      conditions.push(`i.estado = $${values.length}`);
    }
    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      conditions.push(
        `(p.nombre_completo ILIKE $${values.length} OR p.numero_documento ILIKE $${values.length})`,
      );
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM pe_inscripciones i
       JOIN pacientes p ON p.id = i.paciente_id
       ${where}`,
      values,
    );

    const skip = numberParam(params.skip, 0, 1000000);
    const take = numberParam(params.take, 50, 100);
    const rowsResult = await pool.query(
      `SELECT i.id,
              i.paciente_id AS "pacienteId",
              i.programa_id AS "programaId",
              i.codigo_programa AS "codigoPrograma",
              i.fecha_ingreso AS "fechaIngreso",
              i.fecha_egreso AS "fechaEgreso",
              i.motivo_egreso AS "motivoEgreso",
              i.estado,
              i.entidad_remitente AS "entidadRemitente",
              i.medico_ingreso_id AS "medicoIngresoId",
              i.observaciones,
              i.created_at AS "createdAt",
              i.updated_at AS "updatedAt",
              jsonb_build_object(
                'id', p.id,
                'nombreCompleto', p.nombre_completo,
                'numeroDocumento', p.numero_documento,
                'tipoDocumento', p.tipo_documento,
                'fechaNacimiento', p.fecha_nacimiento,
                'genero', p.genero,
                'telefonos', p.telefonos,
                'email', p.email
              ) AS paciente,
              hr.datos AS "historiaRenal"
       FROM pe_inscripciones i
       JOIN pacientes p ON p.id = i.paciente_id
       LEFT JOIN pe_registros_clinicos hr
         ON hr.inscripcion_id = i.id AND hr.tipo = 'HISTORIA_RENAL' AND hr.activo = TRUE
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, take, skip],
    );
    return { total: countResult.rows[0].total, inscripciones: rowsResult.rows };
  }

  async obtenerInscripcion(id: string) {
    const result = await this.pool().query(
      `SELECT i.id,
              i.paciente_id AS "pacienteId",
              i.programa_id AS "programaId",
              i.codigo_programa AS "codigoPrograma",
              i.fecha_ingreso AS "fechaIngreso",
              i.fecha_egreso AS "fechaEgreso",
              i.motivo_egreso AS "motivoEgreso",
              i.estado,
              i.entidad_remitente AS "entidadRemitente",
              i.medico_ingreso_id AS "medicoIngresoId",
              i.observaciones,
              i.created_at AS "createdAt",
              i.updated_at AS "updatedAt",
              jsonb_build_object(
                'id', p.id,
                'nombreCompleto', p.nombre_completo,
                'numeroDocumento', p.numero_documento,
                'tipoDocumento', p.tipo_documento,
                'fechaNacimiento', p.fecha_nacimiento,
                'genero', p.genero,
                'telefonos', p.telefonos,
                'email', p.email
              ) AS paciente,
              CASE WHEN hr.id IS NULL THEN NULL ELSE
                hr.datos || jsonb_build_object(
                  'id', hr.id,
                  'inscripcionId', hr.inscripcion_id,
                  'pacienteId', hr.paciente_id,
                  'createdAt', hr.created_at,
                  'updatedAt', hr.updated_at
                )
              END AS "historiaRenal",
              COALESCE(av.items, '[]'::jsonb) AS "accesosVasculares"
       FROM pe_inscripciones i
       JOIN pacientes p ON p.id = i.paciente_id
       LEFT JOIN pe_registros_clinicos hr
         ON hr.inscripcion_id = i.id AND hr.tipo = 'HISTORIA_RENAL' AND hr.activo = TRUE
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(
           r.datos || jsonb_build_object(
             'id', r.id,
             'inscripcionId', r.inscripcion_id,
             'pacienteId', r.paciente_id,
             'createdAt', r.created_at,
             'updatedAt', r.updated_at
           ) ORDER BY r.created_at DESC
         ) AS items
         FROM pe_registros_clinicos r
         WHERE r.inscripcion_id = i.id AND r.tipo = 'ACCESO' AND r.activo = TRUE
       ) av ON TRUE
       WHERE i.id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Inscripción '${id}' no encontrada`);
    }
    return result.rows[0];
  }

  async inscribirPaciente(input: unknown) {
    const body = assertObject(input);
    const pacienteId = requiredUuid(body.pacienteId, 'pacienteId');
    const codigoPrograma = optionalString(body.codigoPrograma) ?? 'RENAL';
    const historiaRenal = body.historiaRenal
      ? sanitizeRecord(assertObject(body.historiaRenal, 'historiaRenal'))
      : null;

    const id = await this.tenancyConnectionService.transaction(async (client) => {
      const paciente = await client.query(`SELECT id FROM pacientes WHERE id = $1`, [pacienteId]);
      if (paciente.rows.length === 0) {
        throw new NotFoundException(`Paciente '${pacienteId}' no encontrado`);
      }
      const programa = await client.query(
        `SELECT id FROM pe_programas WHERE codigo = $1 AND activo = TRUE`,
        [codigoPrograma],
      );
      if (programa.rows.length === 0) {
        throw new BadRequestException(`El programa '${codigoPrograma}' no existe o está inactivo`);
      }
      const existente = await client.query(
        `SELECT id FROM pe_inscripciones
         WHERE paciente_id = $1 AND programa_id = $2 AND estado = 'ACTIVO'`,
        [pacienteId, programa.rows[0].id],
      );
      if (existente.rows.length > 0) {
        throw new ConflictException('El paciente ya tiene una inscripción activa en este programa');
      }
      const result = await client.query(
        `INSERT INTO pe_inscripciones (
           paciente_id, programa_id, codigo_programa, fecha_ingreso,
           entidad_remitente, observaciones
         )
         VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6)
         RETURNING id`,
        [
          pacienteId,
          programa.rows[0].id,
          codigoPrograma,
          optionalString(body.fechaIngreso),
          optionalString(body.entidadRemitente),
          optionalString(body.observaciones),
        ],
      );
      const inscriptionId = result.rows[0].id as string;
      if (historiaRenal) {
        await client.query(
          `INSERT INTO pe_registros_clinicos (inscripcion_id, paciente_id, tipo, datos)
           VALUES ($1, $2, 'HISTORIA_RENAL', $3::jsonb)`,
          [inscriptionId, pacienteId, JSON.stringify(historiaRenal)],
        );
      }
      return inscriptionId;
    });

    return this.obtenerInscripcion(id);
  }

  async actualizarInscripcion(id: string, input: unknown) {
    const body = assertObject(input);
    const estado = optionalString(body.estado);
    const estadosValidos = ['ACTIVO', 'RETIRADO', 'TRASLADADO', 'FALLECIDO', 'ALTA'];
    if (estado && !estadosValidos.includes(estado)) {
      throw new BadRequestException('Estado de inscripción no válido');
    }
    const result = await this.pool().query(
      `UPDATE pe_inscripciones
       SET estado = COALESCE($2, estado),
           fecha_egreso = CASE WHEN $3::text IS NULL THEN fecha_egreso ELSE $3::date END,
           motivo_egreso = COALESCE($4, motivo_egreso),
           entidad_remitente = COALESCE($5, entidad_remitente),
           observaciones = COALESCE($6, observaciones),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        id,
        estado,
        optionalString(body.fechaEgreso),
        optionalString(body.motivoEgreso),
        optionalString(body.entidadRemitente),
        optionalString(body.observaciones),
      ],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Inscripción '${id}' no encontrada`);
    }
    return this.obtenerInscripcion(id);
  }

  async obtenerHistoriaRenal(inscripcionId: string) {
    const result = await this.pool().query(
      `SELECT r.* FROM pe_registros_clinicos r
       WHERE r.inscripcion_id = $1 AND r.tipo = 'HISTORIA_RENAL' AND r.activo = TRUE`,
      [inscripcionId],
    );
    return result.rows.length ? recordResponse(result.rows[0]) : null;
  }

  async actualizarHistoriaRenal(inscripcionId: string, input: JsonObject) {
    const data = sanitizeRecord(assertObject(input));
    const pacienteId = await this.getInscripcionPaciente(this.pool(), inscripcionId);
    const result = await this.pool().query(
      `INSERT INTO pe_registros_clinicos (inscripcion_id, paciente_id, tipo, datos)
       VALUES ($1, $2, 'HISTORIA_RENAL', $3::jsonb)
       ON CONFLICT (inscripcion_id) WHERE tipo = 'HISTORIA_RENAL'
       DO UPDATE SET datos = pe_registros_clinicos.datos || EXCLUDED.datos,
                     updated_at = NOW(), activo = TRUE
       RETURNING *`,
      [inscripcionId, pacienteId, JSON.stringify(data)],
    );
    return recordResponse(result.rows[0]);
  }

  async listarRegistros(
    tipo: RegistroTipo,
    inscripcionId: string,
    filters: { disciplina?: string } = {},
  ) {
    const { items } = await this.queryRegistros(tipo, inscripcionId, filters);
    return items;
  }

  async listarSesiones(
    inscripcionId: string,
    filters: { skip?: string; take?: string; desde?: string; hasta?: string },
  ) {
    const result = await this.queryRegistros('SESION', inscripcionId, filters);
    return { total: result.total, sesiones: result.items };
  }

  async listarLaboratorios(
    inscripcionId: string,
    filters: { tipo?: string; skip?: string; take?: string },
  ) {
    const result = await this.queryRegistros('LABORATORIO', inscripcionId, filters);
    return { total: result.total, laboratorios: result.items };
  }

  private async queryRegistros(
    tipo: RegistroTipo,
    inscripcionId: string,
    filters: {
      disciplina?: string;
      tipo?: string;
      skip?: string;
      take?: string;
      desde?: string;
      hasta?: string;
    } = {},
  ): Promise<{ total: number; items: JsonObject[] }> {
    const pool = this.pool();
    const conditions = ['inscripcion_id = $1', 'tipo = $2', 'activo = TRUE'];
    const values: unknown[] = [inscripcionId, tipo];
    if (filters.tipo) {
      values.push(filters.tipo);
      conditions.push(`datos->>'tipo' = $${values.length}`);
    }
    if (filters.disciplina) {
      values.push(filters.disciplina);
      conditions.push(`datos->>'disciplina' = $${values.length}`);
    }
    if (filters.desde) {
      values.push(filters.desde);
      conditions.push(`COALESCE(datos->>'fechaSesion', datos->>'fechaToma', '') >= $${values.length}`);
    }
    if (filters.hasta) {
      values.push(filters.hasta);
      conditions.push(`COALESCE(datos->>'fechaSesion', datos->>'fechaToma', '') <= $${values.length}`);
    }
    const where = conditions.join(' AND ');
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM pe_registros_clinicos WHERE ${where}`,
      values,
    );
    const skip = numberParam(filters.skip, 0, 1000000);
    const take = numberParam(filters.take, 100, 500);
    const rows = await pool.query(
      `SELECT * FROM pe_registros_clinicos
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, take, skip],
    );
    return { total: count.rows[0].total, items: rows.rows.map(recordResponse) };
  }

  async obtenerRegistro(tipo: RegistroTipo, id: string) {
    const result = await this.pool().query(
      `SELECT * FROM pe_registros_clinicos
       WHERE id = $1 AND tipo = $2 AND activo = TRUE`,
      [id, tipo],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Registro '${id}' no encontrado`);
    }
    return recordResponse(result.rows[0]);
  }

  async crearRegistro(tipo: RegistroTipo, inscripcionId: string, input: JsonObject) {
    const data = sanitizeRecord(assertObject(input));
    this.validarRegistro(tipo, data);
    const pacienteId = await this.getInscripcionPaciente(this.pool(), inscripcionId);
    const result = await this.pool().query(
      `INSERT INTO pe_registros_clinicos (inscripcion_id, paciente_id, tipo, datos)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING *`,
      [inscripcionId, pacienteId, tipo, JSON.stringify(data)],
    );
    return recordResponse(result.rows[0]);
  }

  private validarRegistro(tipo: RegistroTipo, data: JsonObject): void {
    const camposRequeridos: Partial<Record<RegistroTipo, string[]>> = {
      ACCESO: ['tipo', 'estado'],
      SESION: ['fechaSesion', 'estadoSesion'],
      LABORATORIO: ['fechaToma', 'tipo'],
      EVENTO: ['tipo', 'descripcion', 'fechaEvento'],
      EVOLUCION: ['disciplina', 'fechaEvolucion'],
      TAMIZAJE: ['tipo'],
      SEROLOGIA: ['marcador', 'resultado'],
    };
    for (const campo of camposRequeridos[tipo] ?? []) {
      requiredString(data[campo], campo);
    }

    if (
      tipo === 'SESION' &&
      !['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA', 'AUSENTE']
        .includes(String(data.estadoSesion))
    ) {
      throw new BadRequestException('Estado de sesión no válido');
    }
    if (
      tipo === 'SEROLOGIA' &&
      !['REACTIVO', 'NO_REACTIVO', 'PENDIENTE', 'INDETERMINADO']
        .includes(String(data.resultado))
    ) {
      throw new BadRequestException('Resultado serológico no válido');
    }
  }

  async actualizarRegistro(tipo: RegistroTipo, id: string, input: JsonObject) {
    const data = sanitizeRecord(assertObject(input));
    const result = await this.pool().query(
      `UPDATE pe_registros_clinicos
       SET datos = datos || $3::jsonb, updated_at = NOW()
       WHERE id = $1 AND tipo = $2 AND activo = TRUE
       RETURNING *`,
      [id, tipo, JSON.stringify(data)],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Registro '${id}' no encontrado`);
    }
    return recordResponse(result.rows[0]);
  }

  async listarMaquinas(sedeId?: string) {
    const result = await this.pool().query(
      `SELECT * FROM pe_maquinas
       WHERE ($1::text IS NULL OR sede_id::text = $1)
       ORDER BY codigo`,
      [sedeId || null],
    );
    return result.rows.map((row) => this.maquinaResponse(row));
  }

  async crearMaquina(input: unknown) {
    const body = assertObject(input);
    const codigo = requiredString(body.codigo, 'codigo');
    const marca = requiredString(body.marca, 'marca');
    const datos = sanitizeRecord(body);
    const result = await this.pool().query(
      `INSERT INTO pe_maquinas (codigo, marca, modelo, serie, sillon, estado, sede_id, datos)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'ACTIVO'), $7::uuid, $8::jsonb)
       RETURNING *`,
      [
        codigo,
        marca,
        optionalString(body.modelo),
        optionalString(body.serie),
        optionalString(body.sillon),
        optionalString(body.estado),
        optionalUuid(body.sedeId, 'sedeId'),
        JSON.stringify(datos),
      ],
    );
    return this.maquinaResponse(result.rows[0]);
  }

  async actualizarMaquina(id: string, input: unknown) {
    const body = sanitizeRecord(assertObject(input));
    const current = await this.pool().query(`SELECT * FROM pe_maquinas WHERE id = $1`, [id]);
    if (current.rows.length === 0) {
      throw new NotFoundException(`Máquina '${id}' no encontrada`);
    }
    const machine = current.rows[0];
    const merged = { ...(machine.datos as JsonObject), ...body };
    const result = await this.pool().query(
      `UPDATE pe_maquinas
       SET codigo = $2, marca = $3, modelo = $4, serie = $5, sillon = $6,
           estado = $7, sede_id = $8::uuid, datos = $9::jsonb, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        requiredString(merged.codigo, 'codigo'),
        requiredString(merged.marca, 'marca'),
        optionalString(merged.modelo),
        optionalString(merged.serie),
        optionalString(merged.sillon),
        optionalString(merged.estado) ?? 'ACTIVO',
        optionalUuid(merged.sedeId, 'sedeId'),
        JSON.stringify(merged),
      ],
    );
    return this.maquinaResponse(result.rows[0]);
  }

  private maquinaResponse(row: QueryResultRow): JsonObject {
    return {
      ...(row.datos as JsonObject),
      id: row.id,
      codigo: row.codigo,
      marca: row.marca,
      modelo: row.modelo,
      serie: row.serie,
      sillon: row.sillon,
      estado: row.estado,
      sedeId: row.sede_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getDashboardRenal() {
    const pool = this.pool();
    const [patients, sessionCounts, ktv, events, labs] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE i.estado = 'ACTIVO')::int AS "totalActivos",
           COUNT(*) FILTER (WHERE i.estado = 'ACTIVO' AND hr.datos->>'modalidadActual' = 'HEMODIALISIS')::int AS "totalHD",
           COUNT(*) FILTER (WHERE i.estado = 'ACTIVO' AND hr.datos->>'modalidadActual' = 'DIALISIS_PERITONEAL')::int AS "totalDP",
           COUNT(*) FILTER (WHERE i.estado = 'ACTIVO' AND hr.datos->>'modalidadActual' = 'PREDIALISIS')::int AS "totalPredialisis",
           COUNT(*) FILTER (WHERE i.estado = 'TRASLADADO')::int AS "totalTraslado",
           COUNT(*) FILTER (WHERE i.estado = 'FALLECIDO')::int AS "totalFallecidos"
         FROM pe_inscripciones i
         LEFT JOIN pe_registros_clinicos hr
           ON hr.inscripcion_id = i.id AND hr.tipo = 'HISTORIA_RENAL' AND hr.activo = TRUE
         WHERE i.codigo_programa = 'RENAL'`,
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE datos->>'estadoSesion' IN ('PROGRAMADA', 'EN_CURSO'))::int AS programados,
           COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'EN_CURSO')::int AS en_sala,
           COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'COMPLETADA')::int AS finalizados,
           COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'SUSPENDIDA')::int AS suspendidos,
           COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'AUSENTE')::int AS ausentes
         FROM pe_registros_clinicos
         WHERE tipo = 'SESION' AND activo = TRUE
           AND LEFT(COALESCE(datos->>'fechaSesion', ''), 10) = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')`,
      ),
      pool.query(
        `SELECT AVG(CASE
           WHEN datos->>'ktVSesion' ~ '^[0-9]+([.][0-9]+)?$'
           THEN (datos->>'ktVSesion')::numeric
         END) AS promedio
         FROM pe_registros_clinicos
         WHERE tipo = 'SESION' AND activo = TRUE
           AND created_at >= NOW() - INTERVAL '30 days'`,
      ),
      pool.query(
        `SELECT r.datos || jsonb_build_object('id', r.id, 'createdAt', r.created_at) AS item,
                p.nombre_completo AS "nombrePaciente"
         FROM pe_registros_clinicos r
         JOIN pacientes p ON p.id = r.paciente_id
         WHERE r.tipo = 'EVENTO' AND r.activo = TRUE
         ORDER BY r.created_at DESC LIMIT 5`,
      ),
      pool.query(
        `SELECT r.datos || jsonb_build_object('id', r.id, 'createdAt', r.created_at) AS item,
                p.nombre_completo AS "nombrePaciente"
         FROM pe_registros_clinicos r
         JOIN pacientes p ON p.id = r.paciente_id
         WHERE r.tipo = 'LABORATORIO' AND r.activo = TRUE
         ORDER BY r.created_at DESC LIMIT 5`,
      ),
    ]);

    return {
      pacientes: patients.rows[0],
      sesionesHoy: sessionCounts.rows[0].programados,
      contadoresDia: {
        programadosHoy: sessionCounts.rows[0].programados,
        enSala: sessionCounts.rows[0].en_sala,
        finalizados: sessionCounts.rows[0].finalizados,
        suspendidos: sessionCounts.rows[0].suspendidos,
        ausentes: sessionCounts.rows[0].ausentes,
      },
      adecuacion: {
        ktVPromedio30d: ktv.rows[0].promedio === null ? null : Number(ktv.rows[0].promedio),
        metaKtV: 1.2,
      },
      eventosRecientes: events.rows.map((row) => ({ ...row.item, nombrePaciente: row.nombrePaciente })),
      laboratoriosRecientes: labs.rows.map((row) => ({ ...row.item, nombrePaciente: row.nombrePaciente })),
    };
  }

  async listarTurnos(filters: { esquema?: string; jornada?: string }) {
    const values: unknown[] = [];
    const conditions = [`r.tipo = 'TURNO'`, 'r.activo = TRUE'];
    if (filters.esquema) {
      values.push(filters.esquema);
      conditions.push(`r.datos->>'esquema' = $${values.length}`);
    }
    if (filters.jornada) {
      values.push(filters.jornada);
      conditions.push(`r.datos->>'jornada' = $${values.length}`);
    }
    const result = await this.pool().query(
      `SELECT r.*,
              jsonb_build_object(
                'id', i.id, 'pacienteId', i.paciente_id, 'estado', i.estado,
                'historiaRenal', hr.datos,
                'paciente', jsonb_build_object(
                  'id', p.id, 'nombreCompleto', p.nombre_completo,
                  'numeroDocumento', p.numero_documento, 'tipoDocumento', p.tipo_documento,
                  'fechaNacimiento', p.fecha_nacimiento, 'genero', p.genero
                )
              ) AS inscripcion,
              CASE WHEN m.id IS NULL THEN NULL ELSE
                jsonb_build_object('id', m.id, 'codigo', m.codigo, 'marca', m.marca, 'sillon', m.sillon)
              END AS maquina
       FROM pe_registros_clinicos r
       JOIN pe_inscripciones i ON i.id = r.inscripcion_id
       JOIN pacientes p ON p.id = i.paciente_id
       LEFT JOIN pe_registros_clinicos hr
         ON hr.inscripcion_id = i.id AND hr.tipo = 'HISTORIA_RENAL' AND hr.activo = TRUE
       LEFT JOIN pe_maquinas m ON m.id::text = r.datos->>'maquinaId'
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.datos->>'jornada', p.nombre_completo`,
      values,
    );
    return result.rows.map((row) => ({
      ...recordResponse(row),
      inscripcion: row.inscripcion,
      maquina: row.maquina,
    }));
  }

  async obtenerTurno(inscripcionId: string) {
    const result = await this.pool().query(
      `SELECT * FROM pe_registros_clinicos
       WHERE inscripcion_id = $1 AND tipo = 'TURNO' AND activo = TRUE
       ORDER BY created_at DESC LIMIT 1`,
      [inscripcionId],
    );
    return result.rows.length ? recordResponse(result.rows[0]) : null;
  }

  async asignarTurno(input: JsonObject) {
    const body = assertObject(input);
    const inscripcionId = requiredString(body.inscripcionId, 'inscripcionId');
    requiredString(body.esquema, 'esquema');
    requiredString(body.jornada, 'jornada');
    const turno = await this.tenancyConnectionService.transaction(async (client) => {
      await this.getInscripcionPaciente(client, inscripcionId);
      await client.query(
        `UPDATE pe_registros_clinicos SET activo = FALSE, updated_at = NOW()
         WHERE inscripcion_id = $1 AND tipo = 'TURNO' AND activo = TRUE`,
        [inscripcionId],
      );
      const result = await client.query(
        `INSERT INTO pe_registros_clinicos (inscripcion_id, paciente_id, tipo, datos)
         SELECT $1, paciente_id, 'TURNO', $2::jsonb
         FROM pe_inscripciones WHERE id = $1
         RETURNING id`,
        [inscripcionId, JSON.stringify(sanitizeRecord(body))],
      );
      return result.rows[0].id as string;
    });
    const result = await this.pool().query(
      `SELECT * FROM pe_registros_clinicos WHERE id = $1`,
      [turno],
    );
    return recordResponse(result.rows[0]);
  }

  async inactivarTurno(inscripcionId: string) {
    await this.pool().query(
      `UPDATE pe_registros_clinicos SET activo = FALSE, updated_at = NOW()
       WHERE inscripcion_id = $1 AND tipo = 'TURNO' AND activo = TRUE`,
      [inscripcionId],
    );
    return { success: true };
  }

  async getContadoresDia() {
    const result = await this.pool().query(
      `SELECT
         COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'PROGRAMADA')::int AS "programadosHoy",
         COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'EN_CURSO')::int AS "enSala",
         COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'COMPLETADA')::int AS finalizados,
         COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'SUSPENDIDA')::int AS suspendidos,
         COUNT(*) FILTER (WHERE datos->>'estadoSesion' = 'AUSENTE')::int AS ausentes
       FROM pe_registros_clinicos
       WHERE tipo = 'SESION' AND activo = TRUE
         AND LEFT(COALESCE(datos->>'fechaSesion', ''), 10) = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')`,
    );
    return result.rows[0];
  }

  async listarSerologia(inscripcionId: string) {
    const registros = await this.listarRegistros('SEROLOGIA', inscripcionId);
    const mapa = Object.fromEntries(
      MARCADORES_SEROLOGICOS.map((marcador) => [
        marcador,
        registros.find((registro) => registro.marcador === marcador) ?? null,
      ]),
    );
    return { registros, mapa, marcadores: MARCADORES_SEROLOGICOS };
  }

  async guardarSerologia(inscripcionId: string, input: JsonObject) {
    const body = assertObject(input);
    const marcador = requiredString(body.marcador, 'marcador');
    if (!MARCADORES_SEROLOGICOS.includes(marcador)) {
      throw new BadRequestException('Marcador serológico no reconocido');
    }
    return this.crearRegistro('SEROLOGIA', inscripcionId, body);
  }

  async getParametrizacion() {
    const result = await this.pool().query(
      `SELECT datos FROM pe_configuracion WHERE clave = 'RENAL_HD'`,
    );
    return result.rows[0]?.datos ?? { sillones: [], esquemas: [], jornadas: [] };
  }

  async saveParametrizacion(input: JsonObject) {
    const body = assertObject(input);
    for (const key of ['sillones', 'esquemas', 'jornadas'] as const) {
      if (body[key] !== undefined && !Array.isArray(body[key])) {
        throw new BadRequestException(`${key} debe ser una lista`);
      }
    }
    const current = (await this.getParametrizacion()) as JsonObject;
    const next = {
      sillones: body.sillones ?? current.sillones ?? [],
      esquemas: body.esquemas ?? current.esquemas ?? [],
      jornadas: body.jornadas ?? current.jornadas ?? [],
    };
    const result = await this.pool().query(
      `INSERT INTO pe_configuracion (clave, datos, updated_at)
       VALUES ('RENAL_HD', $1::jsonb, NOW())
       ON CONFLICT (clave) DO UPDATE SET datos = EXCLUDED.datos, updated_at = NOW()
       RETURNING datos`,
      [JSON.stringify(next)],
    );
    return result.rows[0].datos;
  }

  async crearElementoConfiguracion(coleccion: ColeccionConfiguracion, input: JsonObject) {
    const body = sanitizeRecord(assertObject(input));
    const item = { ...body, id: randomUUID() };
    return this.mutacionConfiguracion(coleccion, (items) => [...items, item]);
  }

  async actualizarElementoConfiguracion(
    coleccion: ColeccionConfiguracion,
    id: string,
    input: JsonObject,
  ) {
    const body = sanitizeRecord(assertObject(input));
    return this.mutacionConfiguracion(coleccion, (items) => {
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException(`Elemento '${id}' no encontrado`);
      items[index] = { ...items[index], ...body, id };
      return items;
    });
  }

  async eliminarElementoConfiguracion(coleccion: ColeccionConfiguracion, id: string) {
    return this.mutacionConfiguracion(coleccion, (items) => {
      const filtered = items.filter((item) => item.id !== id);
      if (filtered.length === items.length) {
        throw new NotFoundException(`Elemento '${id}' no encontrado`);
      }
      return filtered;
    });
  }

  private async mutacionConfiguracion(
    coleccion: ColeccionConfiguracion,
    mutate: (items: JsonObject[]) => JsonObject[],
  ) {
    const current = (await this.getParametrizacion()) as JsonObject;
    const rawItems = current[coleccion];
    const items = Array.isArray(rawItems)
      ? rawItems.map((item) => assertObject(item, `Elemento de ${coleccion}`))
      : [];
    const updated = { ...current, [coleccion]: mutate(items) };
    return this.saveParametrizacion(updated);
  }
}
