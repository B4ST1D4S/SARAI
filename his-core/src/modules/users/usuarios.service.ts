import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { PasswordHasherService } from '../auth/services/password-hasher.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

export interface UsuarioPreferenciasResponse {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  preferencias: Record<string, any>;
}

export interface UsuarioResponse {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  rol: string;
  especialidad?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  registroMedico?: string;
  firmaBase64?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt?: Date;
  perfilId?: string;
}

// Roles asistenciales que pueden tener un registro asociado en profesionales_salud
const ROLES_PROFESIONALES = [
  'MEDICO',
  'AUXILIAR',
  'MEDICO_GENERAL',
  'MEDICO_ESPECIALISTA',
  'ENFERMERO',
];

// El enum de BD conserva roles heredados (MEDICO_GENERAL, SUPER_ADMIN_CLINICA, etc.)
// que el frontend actual no conoce: se traducen a las 4 categorías que sí maneja.
function mapRolSalida(rolDb: string): string {
  switch (rolDb) {
    case 'MEDICO_GENERAL':
    case 'MEDICO_ESPECIALISTA':
      return 'MEDICO';
    case 'SUPER_ADMIN_CLINICA':
      return 'SUPER_ADMIN';
    case 'ENFERMERO':
      return 'AUXILIAR';
    case 'ADMINISTRATIVO':
      return 'RECEPCIONISTA';
    default:
      return rolDb;
  }
}

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async crear(dto: CreateUsuarioDto): Promise<UsuarioResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const email = dto.email?.trim() || `${dto.username}@sin-correo.local`;
    const tipoDocumento = dto.tipoDocumento || 'CC';
    const numeroDocumento =
      dto.numeroDocumento?.trim() || `SYS-${Date.now().toString(36).toUpperCase()}`;

    let row: any;
    try {
      const result = await pool.query(
        `INSERT INTO usuarios (
           username, email, password_hash, tipo_documento, numero_documento,
           primer_nombre, primer_apellido, rol, telefono, firma_base64, perfil_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *;`,
        [
          dto.username.trim(),
          email,
          passwordHash,
          tipoDocumento,
          numeroDocumento,
          dto.nombre.trim(),
          dto.apellido.trim(),
          dto.rol,
          dto.telefono ?? null,
          dto.firmaBase64 ?? null,
          dto.perfilId ?? null,
        ],
      );
      row = result.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(
          'Ya existe un usuario con ese nombre de usuario, correo o documento',
        );
      }
      throw err;
    }

    let profesional: { registro_medico?: string; especialidad_principal?: string; registro_profesional?: string } = {};
    if (
      ROLES_PROFESIONALES.includes(dto.rol) &&
      (dto.especialidad || dto.registroMedico || dto.registroProfesional)
    ) {
      const profResult = await pool.query(
        `INSERT INTO profesionales_salud (usuario_id, registro_medico, especialidad_principal, registro_profesional)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (usuario_id) DO UPDATE SET
           registro_medico = EXCLUDED.registro_medico,
           especialidad_principal = EXCLUDED.especialidad_principal,
           registro_profesional = EXCLUDED.registro_profesional
         RETURNING registro_medico, especialidad_principal, registro_profesional;`,
        [row.id, dto.registroMedico ?? null, dto.especialidad ?? null, dto.registroProfesional ?? null],
      );
      profesional = profResult.rows[0];
    }

    this.logger.log(`Usuario creado exitosamente [${row.id}] - ${row.username}`);
    return this.mapRow({ ...row, ...profesional });
  }

  async listar(): Promise<UsuarioResponse[]> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(`
      SELECT u.*, p.registro_medico, p.especialidad_principal, p.registro_profesional
      FROM usuarios u
      LEFT JOIN profesionales_salud p ON p.usuario_id = u.id
      ORDER BY u.created_at DESC;
    `);
    return result.rows.map((row) => this.mapRow(row));
  }

  async obtenerPorId(id: string): Promise<UsuarioResponse> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `SELECT u.*, p.registro_medico, p.especialidad_principal, p.registro_profesional
       FROM usuarios u
       LEFT JOIN profesionales_salud p ON p.usuario_id = u.id
       WHERE u.id = $1;`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    return this.mapRow(result.rows[0]);
  }

  async actualizar(id: string, dto: UpdateUsuarioDto): Promise<UsuarioResponse> {
    await this.obtenerPorId(id);
    const pool = this.tenancyConnectionService.getTenantPool();

    const campos: Record<string, any> = {
      primer_nombre: dto.nombre,
      primer_apellido: dto.apellido,
      email: dto.email,
      telefono: dto.telefono,
      rol: dto.rol,
      tipo_documento: dto.tipoDocumento,
      numero_documento: dto.numeroDocumento,
      firma_base64: dto.firmaBase64,
      perfil_id: dto.perfilId,
    };

    if (dto.password) {
      campos.password_hash = await this.passwordHasher.hash(dto.password);
    }

    const entries = Object.entries(campos).filter(([, v]) => v !== undefined);

    if (entries.length > 0) {
      const setClause = entries.map(([col], idx) => `${col} = $${idx + 2}`).join(', ');
      const values = entries.map(([, v]) => v);

      try {
        await pool.query(
          `UPDATE usuarios SET ${setClause}, updated_at = now() WHERE id = $1;`,
          [id, ...values],
        );
      } catch (err: any) {
        if (err.code === '23505') {
          throw new ConflictException('Ya existe un usuario con ese correo o documento');
        }
        throw err;
      }
    }

    const rolEfectivo = dto.rol ?? (await this.obtenerPorId(id)).rol;
    if (
      ROLES_PROFESIONALES.includes(rolEfectivo) &&
      (dto.especialidad !== undefined || dto.registroMedico !== undefined || dto.registroProfesional !== undefined)
    ) {
      await pool.query(
        `INSERT INTO profesionales_salud (usuario_id, registro_medico, especialidad_principal, registro_profesional)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (usuario_id) DO UPDATE SET
           registro_medico = COALESCE(EXCLUDED.registro_medico, profesionales_salud.registro_medico),
           especialidad_principal = COALESCE(EXCLUDED.especialidad_principal, profesionales_salud.especialidad_principal),
           registro_profesional = COALESCE(EXCLUDED.registro_profesional, profesionales_salud.registro_profesional);`,
        [id, dto.registroMedico ?? null, dto.especialidad ?? null, dto.registroProfesional ?? null],
      );
    }

    return this.obtenerPorId(id);
  }

  async toggleEstado(id: string): Promise<{ activo: boolean }> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `UPDATE usuarios SET activo = NOT activo, updated_at = now() WHERE id = $1 RETURNING activo;`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    return { activo: result.rows[0].activo };
  }

  /**
   * Actualiza las preferencias de interfaz (modo de navegación, tema) del usuario autenticado.
   * Endpoint: PATCH /api/v1/usuarios/perfil/preferencias
   */
  async actualizarPreferencias(
    usuarioId: string,
    preferencias: UpdatePreferenciasDto,
  ): Promise<UsuarioPreferenciasResponse> {
    const tenantPool = this.tenancyConnectionService.getTenantPool();

    const query = `
      UPDATE usuarios
      SET preferencias = COALESCE(preferencias, '{}'::jsonb) || $1::jsonb,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, primer_nombre, primer_apellido, email, rol, preferencias;
    `;

    const result = await tenantPool.query(query, [
      JSON.stringify(preferencias),
      usuarioId,
    ]);

    if (!result.rows || result.rows.length === 0) {
      this.logger.warn(`Usuario no encontrado al actualizar preferencias: ${usuarioId}`);
      throw new NotFoundException(`Usuario con ID '${usuarioId}' no encontrado`);
    }

    const row = result.rows[0];

    this.logger.log(
      `Preferencias actualizadas con éxito para usuario [${usuarioId}]: ${JSON.stringify(preferencias)}`,
    );

    return {
      id: row.id,
      nombre: `${row.primer_nombre} ${row.primer_apellido}`.trim(),
      email: row.email,
      rol: row.rol,
      preferencias: row.preferencias,
    };
  }

  private mapRow(row: any): UsuarioResponse {
    const emailEsPlaceholder = typeof row.email === 'string' && row.email.endsWith('@sin-correo.local');
    const documentoEsPlaceholder = typeof row.numero_documento === 'string' && row.numero_documento.startsWith('SYS-');

    return {
      id: row.id,
      username: row.username,
      nombre: row.primer_nombre,
      apellido: row.primer_apellido,
      email: emailEsPlaceholder ? undefined : row.email,
      telefono: row.telefono ?? undefined,
      rol: mapRolSalida(row.rol),
      especialidad: row.especialidad_principal ?? undefined,
      tipoDocumento: row.tipo_documento ?? undefined,
      numeroDocumento: documentoEsPlaceholder ? undefined : row.numero_documento,
      registroProfesional: row.registro_profesional ?? undefined,
      registroMedico: row.registro_medico ?? undefined,
      firmaBase64: row.firma_base64 ?? undefined,
      activo: row.activo,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined,
      perfilId: row.perfil_id ?? undefined,
    };
  }
}
