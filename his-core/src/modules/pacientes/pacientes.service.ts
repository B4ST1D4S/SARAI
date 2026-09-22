import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { CreatePacienteDto, UpdatePacienteDto } from './dto';

export interface PacienteResponse {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  fechaNacimiento: string;
  genero: string;
  estadoCivil?: string | null;
  grupoEtnico?: string | null;
  nivelEducacion?: string | null;
  discapacidad?: string | null;
  telefonos: string[];
  telefonoFijo?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  direccion?: string | null;
  barrio?: string | null;
  ciudad?: string | null;
  entidadSalud?: string | null;
  observaciones?: string | null;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PacientesPaginados {
  pacientes: PacienteResponse[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PacientesService {
  private readonly logger = new Logger(PacientesService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  async crearPaciente(
    dto: CreatePacienteDto,
    creadoPor?: string,
  ): Promise<PacienteResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    const existing = await tenantPool.query(
      'SELECT id FROM pacientes WHERE tipo_documento = $1 AND numero_documento = $2',
      [dto.tipoDocumento, dto.numeroDocumento],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException(
        `Ya existe un paciente registrado con documento ${dto.tipoDocumento} ${dto.numeroDocumento}`,
      );
    }

    const insertQuery = `
      INSERT INTO pacientes (
        tipo_documento, numero_documento, nombre_completo,
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        fecha_nacimiento, genero, estado_civil, grupo_etnico, nivel_educacion,
        discapacidad, telefonos, telefono_fijo, whatsapp, email,
        direccion, barrio, ciudad, entidad_salud, observaciones, estado, creado_por
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'ACTIVO', $23
      )
      RETURNING *;
    `;

    const result = await tenantPool.query(insertQuery, [
      dto.tipoDocumento.trim(),
      dto.numeroDocumento.trim(),
      dto.nombreCompleto.trim(),
      dto.primerNombre?.trim() ?? null,
      dto.segundoNombre?.trim() ?? null,
      dto.primerApellido?.trim() ?? null,
      dto.segundoApellido?.trim() ?? null,
      dto.fechaNacimiento,
      dto.genero,
      dto.estadoCivil ?? null,
      dto.etnia ?? null,
      dto.nivelEducacion ?? null,
      dto.discapacidad ?? null,
      dto.telefonos ?? [],
      dto.telefonoFijo ?? null,
      dto.whatsapp ?? null,
      dto.email ?? null,
      dto.direccion ?? null,
      dto.barrio ?? null,
      dto.ciudad ?? null,
      dto.entidadSalud ?? null,
      dto.observaciones ?? null,
      creadoPor ?? null,
    ]);

    const row = result.rows[0];
    this.logger.log(`Paciente creado exitosamente [${row.id}] - ${row.nombre_completo}`);
    return this.mapRow(row);
  }

  async listarPacientes(
    page = 1,
    limit = 10,
  ): Promise<PacientesPaginados> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const [dataRes, countRes] = await Promise.all([
      tenantPool.query(
        `SELECT * FROM pacientes WHERE estado != 'INACTIVO'
         ORDER BY created_at DESC LIMIT $1 OFFSET $2;`,
        [safeLimit, offset],
      ),
      tenantPool.query(
        `SELECT count(*)::int AS total FROM pacientes WHERE estado != 'INACTIVO';`,
      ),
    ]);

    return {
      pacientes: dataRes.rows.map((row) => this.mapRow(row)),
      total: countRes.rows[0]?.total ?? 0,
      page: safePage,
      limit: safeLimit,
    };
  }

  async buscarPacientes(query: string): Promise<PacienteResponse[]> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const like = `%${query.trim()}%`;

    const result = await tenantPool.query(
      `SELECT * FROM pacientes
       WHERE estado != 'INACTIVO'
         AND (nombre_completo ILIKE $1 OR numero_documento ILIKE $1 OR email ILIKE $1)
       ORDER BY nombre_completo ASC
       LIMIT 50;`,
      [like],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async obtenerPacientePorId(id: string): Promise<PacienteResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();
    const result = await tenantPool.query('SELECT * FROM pacientes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`Paciente con ID '${id}' no encontrado`);
    }

    return this.mapRow(result.rows[0]);
  }

  async actualizarPaciente(
    id: string,
    dto: UpdatePacienteDto,
  ): Promise<PacienteResponse> {
    await this.obtenerPacientePorId(id);
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    const campos: Record<string, any> = {
      tipo_documento: dto.tipoDocumento,
      numero_documento: dto.numeroDocumento,
      nombre_completo: dto.nombreCompleto,
      primer_nombre: dto.primerNombre,
      segundo_nombre: dto.segundoNombre,
      primer_apellido: dto.primerApellido,
      segundo_apellido: dto.segundoApellido,
      fecha_nacimiento: dto.fechaNacimiento,
      genero: dto.genero,
      estado_civil: dto.estadoCivil,
      grupo_etnico: dto.etnia,
      nivel_educacion: dto.nivelEducacion,
      discapacidad: dto.discapacidad,
      telefonos: dto.telefonos,
      telefono_fijo: dto.telefonoFijo,
      whatsapp: dto.whatsapp,
      email: dto.email,
      direccion: dto.direccion,
      barrio: dto.barrio,
      ciudad: dto.ciudad,
      entidad_salud: dto.entidadSalud,
      observaciones: dto.observaciones,
    };

    const entries = Object.entries(campos).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return this.obtenerPacientePorId(id);
    }

    const setClause = entries
      .map(([col], idx) => `${col} = $${idx + 2}`)
      .join(', ');
    const values = entries.map(([, v]) => v);

    const result = await tenantPool.query(
      `UPDATE pacientes SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *;`,
      [id, ...values],
    );

    return this.mapRow(result.rows[0]);
  }

  async eliminarPaciente(id: string): Promise<{ mensaje: string }> {
    await this.obtenerPacientePorId(id);
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    await tenantPool.query(
      `UPDATE pacientes SET estado = 'INACTIVO', updated_at = now() WHERE id = $1;`,
      [id],
    );

    this.logger.log(`Paciente [${id}] desactivado (baja lógica)`);
    return { mensaje: 'Paciente eliminado exitosamente' };
  }

  private mapRow(row: any): PacienteResponse {
    return {
      id: row.id,
      tipoDocumento: row.tipo_documento,
      numeroDocumento: row.numero_documento,
      nombreCompleto: row.nombre_completo,
      primerNombre: row.primer_nombre ?? null,
      segundoNombre: row.segundo_nombre ?? null,
      primerApellido: row.primer_apellido ?? null,
      segundoApellido: row.segundo_apellido ?? null,
      fechaNacimiento: row.fecha_nacimiento,
      genero: row.genero,
      estadoCivil: row.estado_civil ?? null,
      grupoEtnico: row.grupo_etnico ?? null,
      nivelEducacion: row.nivel_educacion ?? null,
      discapacidad: row.discapacidad ?? null,
      telefonos: row.telefonos ?? [],
      telefonoFijo: row.telefono_fijo ?? null,
      whatsapp: row.whatsapp ?? null,
      email: row.email ?? null,
      direccion: row.direccion ?? null,
      barrio: row.barrio ?? null,
      ciudad: row.ciudad ?? null,
      entidadSalud: row.entidad_salud ?? null,
      observaciones: row.observaciones ?? null,
      estado: row.estado,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
