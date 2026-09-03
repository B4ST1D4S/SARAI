import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret =
      this.configService.get<string>('security.jwtSecret') ||
      this.configService.get<string>('JWT_SECRET') ||
      'sarai_his_default_secret_encryption_key_2026';

    // Generar clave fija de 32 bytes (256 bits) a partir del secret
    this.key = createHash('sha256').update(secret).digest();
  }

  /**
   * Encripta un texto plano usando AES-256-GCM
   * Formato de salida: "enc:ivHex:authTagHex:encryptedHex"
   */
  encrypt(plainText: string): string {
    if (!plainText) return plainText;

    const iv = randomBytes(12); // 96-bit IV para GCM
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Desencripta un texto cifrado con AES-256-GCM.
   * Si el texto no tiene el prefijo "enc:", se asume texto plano seguro (útil para desarrollo/migraciones).
   */
  decrypt(cipherText: string): string {
    if (!cipherText) return cipherText;

    if (!cipherText.startsWith('enc:')) {
      return cipherText;
    }

    try {
      const parts = cipherText.split(':');
      if (parts.length !== 4) {
        throw new Error('Formato de cifrado inválido');
      }

      const [, ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Error al desencriptar credencial de base de datos: ${(error as Error).message}`,
      );
    }
  }
}
