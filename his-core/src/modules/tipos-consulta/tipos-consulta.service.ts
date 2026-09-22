import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { CreateTipoConsultaDto, UpdateTipoConsultaDto } from './dto';

export interface TipoConsultaResponse {
  id: string;
  especialidadId: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereCaja: boolean;
  permiteAgendamiento: boolean;
  abreHistoriaClinica: boolean;
  estado: boolean;
}

@Injectable()
export class TiposConsultaService {
  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  async crear(dto: CreateTipoConsultaDto): Promise<TipoConsultaResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();

    const especialidad = await pool.query('SELECT id FROM especialidades WHERE id = $1', [dto.especialidadId]);
    if (especialidad.rows.length === 0) {
      throw new NotFoundException(`Especialidad con ID '${dto.especialidadId}' no encontrada`);
    }

    const existing = await pool.query('SELECT id FROM tipos_consulta WHERE codigo = $1', [dto.codigo.trim()]);
    if (existing.rows.length > 0) {
      throw new ConflictException(`Ya existe un tipo de consulta con el código '${dto.codigo}'`);
    }

    const result = await pool.query(
      `INSERT INTO tipos_consulta (
        especialidad_id, codigo, nombre, descripcion,
        requiere_caja, permite_agendamiento, abre_historia_clinica, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *;`,
      [
        dto.especialidadId,
        dto.codigo.trim(),
        dto.nombre.trim(),
        dto.descripcion ?? null,
        dto.requiereCaja ?? false,
        dto.permiteAgendamiento ?? true,
        dto.abreHistoriaClinica ?? true,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listar(especialidadId?: string): Promise<TipoConsultaResponse[]> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = especialidadId
      ? await pool.query(
          'SELECT * FROM tipos_consulta WHERE especialidad_id = $1 ORDER BY nombre ASC;',
          [especialidadId],
        )
      : await pool.query('SELECT * FROM tipos_consulta ORDER BY nombre ASC;');
    return result.rows.map((row) => this.mapRow(row));
  }

  async obtenerPorId(id: string): Promise<TipoConsultaResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query('SELECT * FROM tipos_consulta WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundException(`Tipo de consulta con ID '${id}' no encontrado`);
    }
    return this.mapRow(result.rows[0]);
  }

  async actualizar(id: string, dto: UpdateTipoConsultaDto): Promise<TipoConsultaResponse> {
    await this.obtenerPorId(id);
    const pool = this.tenancyConnectionService.getTenantPool();

    const campos: Record<string, any> = {
      especialidad_id: dto.especialidadId,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      requiere_caja: dto.requiereCaja,
      permite_agendamiento: dto.permiteAgendamiento,
      abre_historia_clinica: dto.abreHistoriaClinica,
      activo: dto.estado,
    };
    const entries = Object.entries(campos).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return this.obtenerPorId(id);

    const setClause = entries.map(([col], idx) => `${col} = $${idx + 2}`).join(', ');
    const values = entries.map(([, v]) => v);

    const result = await pool.query(
      `UPDATE tipos_consulta SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *;`,
      [id, ...values],
    );
    return this.mapRow(result.rows[0]);
  }

  async desactivar(id: string): Promise<{ mensaje: string }> {
    await this.obtenerPorId(id);
    const pool = this.tenancyConnectionService.getTenantPool();
    await pool.query('UPDATE tipos_consulta SET activo = false, updated_at = now() WHERE id = $1;', [id]);
    return { mensaje: 'Tipo de consulta desactivado exitosamente' };
  }

  private mapRow(row: any): TipoConsultaResponse {
    return {
      id: row.id,
      especialidadId: row.especialidad_id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? null,
      requiereCaja: Boolean(row.requiere_caja),
      permiteAgendamiento: Boolean(row.permite_agendamiento),
      abreHistoriaClinica: Boolean(row.abre_historia_clinica),
      estado: Boolean(row.activo),
    };
  }
}
