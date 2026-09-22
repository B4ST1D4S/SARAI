import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { CreateEspecialidadDto, UpdateEspecialidadDto } from './dto';

export interface EspecialidadResponse {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  aplicaCirugia: boolean;
  aplicaAnestesia: boolean;
  aplicaPediatria: boolean;
  aplicaInstrumentacion: boolean;
  aplicaMedicoFamiliar: boolean;
  estado: boolean;
}

@Injectable()
export class EspecialidadesService {
  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  async crear(dto: CreateEspecialidadDto): Promise<EspecialidadResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const codigo = await this.resolverCodigo(dto.codigo, dto.nombre);

    const existing = await pool.query(
      'SELECT id FROM especialidades WHERE codigo = $1',
      [codigo],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException(
        `Ya existe una especialidad con el código '${codigo}'`,
      );
    }

    const result = await pool.query(
      `INSERT INTO especialidades (
        codigo, nombre, descripcion, aplica_cirugia, aplica_anestesia,
        aplica_pediatria, aplica_instrumentacion, aplica_medico_familiar, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *;`,
      [
        codigo,
        dto.nombre.trim(),
        dto.descripcion ?? null,
        dto.aplicaCirugia ?? false,
        dto.aplicaAnestesia ?? false,
        dto.aplicaPediatria ?? false,
        dto.aplicaInstrumentacion ?? false,
        dto.aplicaMedicoFamiliar ?? false,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listar(): Promise<EspecialidadResponse[]> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query('SELECT * FROM especialidades ORDER BY nombre ASC;');
    return result.rows.map((row) => this.mapRow(row));
  }

  async obtenerPorId(id: string): Promise<EspecialidadResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query('SELECT * FROM especialidades WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundException(`Especialidad con ID '${id}' no encontrada`);
    }
    return this.mapRow(result.rows[0]);
  }

  async actualizar(id: string, dto: UpdateEspecialidadDto): Promise<EspecialidadResponse> {
    await this.obtenerPorId(id);
    const pool = this.tenancyConnectionService.getTenantPool();

    const campos: Record<string, any> = {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      aplica_cirugia: dto.aplicaCirugia,
      aplica_anestesia: dto.aplicaAnestesia,
      aplica_pediatria: dto.aplicaPediatria,
      aplica_instrumentacion: dto.aplicaInstrumentacion,
      aplica_medico_familiar: dto.aplicaMedicoFamiliar,
      activo: dto.estado,
    };
    const entries = Object.entries(campos).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return this.obtenerPorId(id);

    const setClause = entries.map(([col], idx) => `${col} = $${idx + 2}`).join(', ');
    const values = entries.map(([, v]) => v);

    const result = await pool.query(
      `UPDATE especialidades SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *;`,
      [id, ...values],
    );
    return this.mapRow(result.rows[0]);
  }

  async desactivar(id: string): Promise<{ mensaje: string }> {
    await this.obtenerPorId(id);
    const pool = this.tenancyConnectionService.getTenantPool();
    await pool.query('UPDATE especialidades SET activo = false, updated_at = now() WHERE id = $1;', [id]);
    return { mensaje: 'Especialidad desactivada exitosamente' };
  }

  private async resolverCodigo(codigo: string | undefined, nombre: string): Promise<string> {
    if (codigo && codigo.trim()) return codigo.trim().toUpperCase();

    const pool = this.tenancyConnectionService.getTenantPool();
    const base = nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 15) || 'ESP';

    let candidato = base;
    let sufijo = 1;
    while (
      (await pool.query('SELECT id FROM especialidades WHERE codigo = $1', [candidato]))
        .rows.length > 0
    ) {
      sufijo += 1;
      candidato = `${base}_${sufijo}`;
    }
    return candidato;
  }

  private mapRow(row: any): EspecialidadResponse {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? null,
      aplicaCirugia: Boolean(row.aplica_cirugia),
      aplicaAnestesia: Boolean(row.aplica_anestesia),
      aplicaPediatria: Boolean(row.aplica_pediatria),
      aplicaInstrumentacion: Boolean(row.aplica_instrumentacion),
      aplicaMedicoFamiliar: Boolean(row.aplica_medico_familiar),
      estado: Boolean(row.activo),
    };
  }
}
