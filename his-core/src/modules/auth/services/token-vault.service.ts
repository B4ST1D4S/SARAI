import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Pool } from 'pg';

export interface GeneratedRefreshToken {
  rawToken: string;
  tokenHash: string;
  jti: string;
  expiresAt: Date;
}

@Injectable()
export class TokenVaultService {
  private readonly logger = new Logger(TokenVaultService.name);
  private readonly REFRESH_TOKEN_TTL_DAYS = 7;

  /**
   * Genera un par de Refresh Token criptográfico y su hash SHA-256
   */
  generateRefreshToken(): GeneratedRefreshToken {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const jti = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_TTL_DAYS);

    return { rawToken, tokenHash, jti, expiresAt };
  }

  /**
   * Calcula el hash SHA-256 de un token
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Persiste un nuevo Refresh Token en la base de datos del tenant
   */
  async persistRefreshToken(
    tenantPool: Pool,
    userId: string,
    tokenData: GeneratedRefreshToken,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const query = `
      INSERT INTO auth_refresh_tokens (
        usuario_id, token_hash, jti, ip_origen, user_agent, fecha_expiracion, revocado
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE);
    `;

    await tenantPool.query(query, [
      userId,
      tokenData.tokenHash,
      tokenData.jti,
      ipAddress || null,
      userAgent || null,
      tokenData.expiresAt,
    ]);
  }

  /**
   * Valida y rota el token presentado.
   * Si el token ya fue revocado, activa la alarma de robo de sesión (Token Reuse Detection)
   * e invalida todas las sesiones activas del usuario.
   */
  async rotateRefreshToken(
    tenantPool: Pool,
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ userId: string; newToken: GeneratedRefreshToken }> {
    const tokenHash = this.hashToken(rawToken);

    const query = `
      SELECT id, usuario_id, revocado, fecha_expiracion
      FROM auth_refresh_tokens
      WHERE token_hash = $1
      LIMIT 1;
    `;

    const result = await tenantPool.query(query, [tokenHash]);
    const storedToken = result.rows[0];

    if (!storedToken) {
      throw new UnauthorizedException('Token de actualización no válido');
    }

    // Detección de reuso de token (ISO 27001 A.8.5 / NIST SP 800-63B)
    if (storedToken.revocado) {
      this.logger.warn(
        `ALERTA DE SEGURIDAD: Intento de reuso de Refresh Token para el usuario [${storedToken.usuario_id}]. Revocando todas sus sesiones activas.`,
      );
      await this.revokeAllUserTokens(tenantPool, storedToken.usuario_id);
      throw new UnauthorizedException('Violación de seguridad en la sesión. Inicie sesión nuevamente.');
    }

    // Validar expiración
    if (new Date() > new Date(storedToken.fecha_expiracion)) {
      throw new UnauthorizedException('La sesión ha expirado. Inicie sesión nuevamente.');
    }

    // 1. Revocar el token actual
    await tenantPool.query(
      `UPDATE auth_refresh_tokens SET revocado = TRUE WHERE id = $1;`,
      [storedToken.id],
    );

    // 2. Generar y persistir el nuevo token (RTR)
    const newToken = this.generateRefreshToken();
    await this.persistRefreshToken(
      tenantPool,
      storedToken.usuario_id,
      newToken,
      ipAddress,
      userAgent,
    );

    return {
      userId: storedToken.usuario_id,
      newToken,
    };
  }

  /**
   * Revoca un token específico (Logout)
   */
  async revokeToken(tenantPool: Pool, rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await tenantPool.query(
      `UPDATE auth_refresh_tokens SET revocado = TRUE WHERE token_hash = $1;`,
      [tokenHash],
    );
  }

  /**
   * Revoca todas las sesiones de un usuario
   */
  async revokeAllUserTokens(tenantPool: Pool, userId: string): Promise<void> {
    await tenantPool.query(
      `UPDATE auth_refresh_tokens SET revocado = TRUE WHERE usuario_id = $1 AND revocado = FALSE;`,
      [userId],
    );
  }
}