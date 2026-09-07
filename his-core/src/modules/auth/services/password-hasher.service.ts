import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordHasherService {
  private readonly logger = new Logger(PasswordHasherService.name);

  private readonly DUMMY_HASH =
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQxMjM0NTY3OA$9vXfB51jX01q6wYyR/sKTw08E2g3I9yN8yP0k6kM4s0';

  /**
   * Genera el hash seguro de una contraseña en texto plano
   */
  async hash(password: string): Promise<string> {
    const hashFn = (argon2 as any).hash;
    const result = await hashFn(password, {
      type: 2, // Argon2id
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    return String(result);
  }

  /**
   * Verificación timing-safe. Si hash es nulo o indefinido, evalúa contra DUMMY_HASH.
   */
  async verify(hash: string | null | undefined, plainText: string): Promise<boolean> {
    const targetHash = hash && hash.startsWith('$argon2') ? hash : this.DUMMY_HASH;

    try {
      const verifyFn = (argon2 as any).verify;
      const match = await verifyFn(targetHash, plainText);
      return Boolean(hash && match);
    } catch (error: any) {
      this.logger.error(`Error verificando hash criptográfico: ${error?.message || error}`);
      return false;
    }
  }

  /**
   * Determina si el hash almacenado requiere migración a parámetros más estrictos
   */
  needsRehash(hash: string): boolean {
    const needsRehashFn = (argon2 as any).needsRehash;
    if (typeof needsRehashFn !== 'function') return false;
    return Boolean(
      needsRehashFn(hash, {
        type: 2,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      }),
    );
  }
}