import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { PasswordHasherService } from './password-hasher.service';
import { TokenVaultService } from './token-vault.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export interface AuthSuccessResult {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    username: string;
    email: string;
    nombre: string;
    rol: string;
    esAsistencial: boolean;
    especialidad: string | null;
    preferencias?: Record<string, any> | null;
  };
  institucion: {
    id: string;
    subdominio: string;
    nombre: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  constructor(
    private readonly tenantService: TenantService,
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly tenantContextService: TenantContextService,
    private readonly jwtService: JwtService,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly tokenVaultService: TokenVaultService,
  ) {}

  /**
   * Construye el TenantContext a partir del subdominio consultado en his_master
   */
  private async buildTenantContext(subdomainInput: string): Promise<TenantContext> {
    const subdomain = String(subdomainInput || '').toLowerCase().trim();
    const tenant: any = await this.tenantService.findBySubdomain(subdomain);

    const isActive = tenant?.active !== undefined ? tenant.active : (tenant?.status === 'ACTIVE' || tenant?.activo);

    if (!tenant || !isActive) {
      throw new NotFoundException(
        `La institución '${subdomain}' no existe o se encuentra inactiva`,
      );
    }

    const host = tenant.dbHost || tenant.db_host || tenant.host;
    const port = Number(tenant.dbPort || tenant.db_port || tenant.port || 5432);
    const database = tenant.dbName || tenant.db_name || tenant.database || 'postgres';
    const username = tenant.dbUser || tenant.db_user || tenant.user || tenant.username;
    // AQUÍ: agregamos tenant.dbPassword explícitamente y aseguramos string
    const password = String(tenant.dbPassword || tenant.db_password || tenant.password || '');

    return {
      tenantId: tenant.id,
      subdomain: tenant.subdomain || subdomain,
      code: tenant.code || tenant.subdomain || subdomain,
      tenant,
      dbConfig: {
        host,
        port,
        database,
        username,
        password,
      },
    };
  }

  /**
   * Flujo principal de login con mitigación de fuerza bruta y timing-safe compare
   */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthSuccessResult> {
    const tenantContext = await this.buildTenantContext(loginDto.subdomain);

    return this.tenantContextService.run(tenantContext, async () => {
      const identifier = String(loginDto.identifier || '').trim();
      const password = String(loginDto.password || '');
      const tenant = tenantContext.tenant;
      const tenantSubdomain = tenantContext.subdomain;

      const tenantPool = this.tenancyConnectionService.getTenantPool();

      // 1. Buscar usuario y perfil asistencial
      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.password_hash,
          u.primer_nombre,
          u.primer_apellido,
          u.rol,
          u.activo,
          u.preferencias,
          u.intentos_fallidos,
          u.bloqueado_hasta,
          p.id AS profesional_id,
          p.registro_medico,
          p.especialidad_principal
        FROM usuarios u
        LEFT JOIN profesionales_salud p ON p.usuario_id = u.id
        WHERE (LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1))
        LIMIT 1;
      `;

      const result = await tenantPool.query(query, [identifier]);
      const user = result.rows[0];

      // 2. Verificar bloqueo por fuerza bruta
      if (user && user.bloqueado_hasta) {
        const now = new Date();
        const lockoutEnd = new Date(user.bloqueado_hasta);
        if (now < lockoutEnd) {
          const remainingMinutes = Math.ceil(
            (lockoutEnd.getTime() - now.getTime()) / (60 * 1000),
          );
          this.logger.warn(
            `Intento de acceso a cuenta bloqueada [${user.username}] en tenant [${tenantSubdomain}]`,
          );
          throw new ForbiddenException(
            `La cuenta está temporalmente bloqueada por múltiples intentos fallidos. Intente de nuevo en ${remainingMinutes} minutos.`,
          );
        }
      }

      // 3. Verificación de contraseña (timing-safe)
      let isPasswordValid = false;
      if (user && user.password_hash) {
        if (user.password_hash.startsWith('$argon2')) {
          isPasswordValid = await this.passwordHasherService.verify(
            user.password_hash,
            password,
          );
        } else {
          isPasswordValid = await bcrypt.compare(password, user.password_hash);
        }
      } else {
        await this.passwordHasherService.verify(null, password);
      }

      // 4. Manejo de fallos con incremento de intentos y bloqueo a los 5 fallos
      if (!user || !isPasswordValid) {
        if (user) {
          const nextAttempts = (user.intentos_fallidos || 0) + 1;
          if (nextAttempts >= this.MAX_FAILED_ATTEMPTS) {
            await tenantPool.query(
              `
              UPDATE usuarios 
              SET intentos_fallidos = $1, 
                  bloqueado_hasta = NOW() + ($2 || ' minutes')::INTERVAL 
              WHERE id = $3;
              `,
              [nextAttempts, `${this.LOCKOUT_MINUTES}`, user.id],
            );
            this.logger.warn(
              `Cuenta [${user.username}] bloqueada por ${this.LOCKOUT_MINUTES} minutos tras ${nextAttempts} fallos.`,
            );
          } else {
            await tenantPool.query(
              `UPDATE usuarios SET intentos_fallidos = $1 WHERE id = $2;`,
              [nextAttempts, user.id],
            );
          }
        }
        throw new UnauthorizedException('Credenciales de acceso inválidas');
      }

      // 5. Validar estado de la cuenta
      if (!user.activo) {
        throw new ForbiddenException('La cuenta de usuario se encuentra inactiva');
      }

      // 6. Éxito: Resetear intentos fallidos
      await tenantPool.query(
        `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1;`,
        [user.id],
      );

      // 7. Generar y persistir Refresh Token (RTR)
      const refreshTokenData = this.tokenVaultService.generateRefreshToken();
      await this.tokenVaultService.persistRefreshToken(
        tenantPool,
        user.id,
        refreshTokenData,
        ipAddress,
        userAgent,
      );

      // 8. Generar Access Token
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        nombreCompleto: `${user.primer_nombre} ${user.primer_apellido}`,
        rol: user.rol,
        tenantId: tenantContext.tenantId,
        tenantSubdomain,
        profesionalId: user.profesional_id || null,
        registroMedico: user.registro_medico || null,
        especialidad: user.especialidad_principal || null,
        esAsistencial: !!user.profesional_id,
        jti: refreshTokenData.jti,
      };

      const accessToken = this.jwtService.sign(payload);

      this.logger.log(
        `Usuario [${user.username}] autenticado exitosamente en tenant [${tenantSubdomain}]`,
      );

      return {
        accessToken,
        refreshToken: refreshTokenData.rawToken,
        usuario: {
          id: user.id,
          username: user.username,
          email: user.email,
          nombre: `${user.primer_nombre} ${user.primer_apellido}`,
          rol: user.rol,
          esAsistencial: !!user.profesional_id,
          especialidad: user.especialidad_principal || null,
          preferencias: user.preferencias ?? { navMode: 'hub', theme: 'dark' },
        },
        institucion: {
          id: tenantContext.tenantId,
          subdominio: tenantSubdomain,
          nombre: (tenant as any)?.name || (tenant as any)?.nombre || tenantSubdomain,
        },
      };
    });
  }

  /**
   * Rotación de tokens (Refresh Token Rotation)
   */
  async refreshTokens(
    dto: RefreshTokenDto,
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tenantContext = await this.buildTenantContext(dto.subdomain);

    return this.tenantContextService.run(tenantContext, async () => {
      const tenantPool = this.tenancyConnectionService.getTenantPool();

      const { userId, newToken } = await this.tokenVaultService.rotateRefreshToken(
        tenantPool,
        rawRefreshToken,
        ipAddress,
        userAgent,
      );

      const userQuery = `
        SELECT 
          u.id, u.username, u.email, u.primer_nombre, u.primer_apellido, u.rol, u.activo, u.preferencias,
          p.id AS profesional_id, p.registro_medico, p.especialidad_principal
        FROM usuarios u
        LEFT JOIN profesionales_salud p ON p.usuario_id = u.id
        WHERE u.id = $1 LIMIT 1;
      `;
      const userRes = await tenantPool.query(userQuery, [userId]);
      const user = userRes.rows[0];

      if (!user || !user.activo) {
        throw new UnauthorizedException('Usuario inactivo o no encontrado');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        nombreCompleto: `${user.primer_nombre} ${user.primer_apellido}`,
        rol: user.rol,
        tenantId: tenantContext.tenantId,
        tenantSubdomain: tenantContext.subdomain,
        profesionalId: user.profesional_id || null,
        registroMedico: user.registro_medico || null,
        especialidad: user.especialidad_principal || null,
        esAsistencial: !!user.profesional_id,
        jti: newToken.jti,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: newToken.rawToken,
      };
    });
  }

  /**
   * Cierre de sesión (Revocación de Refresh Token)
   */
  async logout(subdomain: string, rawRefreshToken: string): Promise<void> {
    const tenantContext = await this.buildTenantContext(subdomain);

    return this.tenantContextService.run(tenantContext, async () => {
      const tenantPool = this.tenancyConnectionService.getTenantPool();
      await this.tokenVaultService.revokeToken(tenantPool, rawRefreshToken);
    });
  }
}