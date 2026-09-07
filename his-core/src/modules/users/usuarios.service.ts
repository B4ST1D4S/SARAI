import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';

export interface UsuarioPreferenciasResponse {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  preferencias: Record<string, any>;
}

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly tenancyConnectionService: TenancyConnectionService,
  ) {}

  /**
   * Actualiza de forma atómica y combinada (JSONB merge) las preferencias de interfaz
   * del usuario en la base de datos del tenant activo.
   *
   * @param usuarioId Identificador único del usuario (UUID)
   * @param preferencias Objeto con las preferencias a actualizar
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
}
