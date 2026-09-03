import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'node:crypto';

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

export type StorageFolder = 'clinical' | 'audit-logs';

@Injectable()
export class SpacesStorageService {
  private readonly logger = new Logger(SpacesStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly defaultExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    const rawEndpoint =
      this.configService.get<string>('SPACES_ENDPOINT') ||
      this.configService.get<string>('spaces.endpoint') ||
      'https://nyc3.digitaloceanspaces.com';

    const endpoint = rawEndpoint.startsWith('http')
      ? rawEndpoint
      : `https://${rawEndpoint}`;

    const region =
      this.configService.get<string>('SPACES_REGION') ||
      this.configService.get<string>('spaces.region') ||
      'nyc3';

    this.bucket =
      this.configService.get<string>('SPACES_BUCKET') ||
      this.configService.get<string>('spaces.bucket') ||
      'sarai-his-storage';

    const accessKeyId =
      this.configService.get<string>('SPACES_KEY') ||
      this.configService.get<string>('spaces.key') ||
      '';

    const secretAccessKey =
      this.configService.get<string>('SPACES_SECRET') ||
      this.configService.get<string>('spaces.secret') ||
      '';

    const configuredExpiresIn = Number(
      this.configService.get<number>('SPACES_PRESIGNED_EXPIRES_IN') ||
        this.configService.get<number>('spaces.presignedExpiresIn') ||
        900,
    );

    // Bajo controles de seguridad ISO 27001, la expiración máxima de URLs prefirmadas es de 900s (15 min)
    this.defaultExpiresIn = Math.min(configuredExpiresIn, 900);

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });

    this.logger.log(
      `SpacesStorageService inicializado con éxito [Endpoint: ${endpoint}, Bucket: ${this.bucket}, Region: ${region}]`,
    );
  }

  /**
   * Genera una URL prefirmada para subida segura de archivos (PutObject)
   * con cifrado del lado del servidor (AES-256) bajo aislamiento por tenant.
   *
   * @param tenantId Identificador UUID del tenant
   * @param folder Carpeta de destino ('clinical' | 'audit-logs')
   * @param filename Nombre original del archivo a subir
   * @param mimeType Tipo MIME del archivo (ej: 'image/webp', 'application/pdf')
   */
  async getPresignedUploadUrl(
    tenantId: string,
    folder: StorageFolder,
    filename: string,
    mimeType: string,
  ): Promise<PresignedUploadResult> {
    if (!tenantId || !filename || !mimeType) {
      throw new BadRequestException(
        'tenantId, filename y mimeType son requeridos para generar la URL prefirmada de subida.',
      );
    }

    // Sanitización para prevenir directory traversal o caracteres no seguros
    const sanitizedFilename = filename
      .replace(/^.*[\\/]/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const fileKey = `tenants/${tenantId}/${folder}/${crypto.randomUUID()}-${sanitizedFilename}`;
    const expiresIn = this.defaultExpiresIn;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256', // Control ISO 27001: Cifrado en reposo obligatorio
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.debug(
        `URL prefirmada de subida generada para [${fileKey}] (expira en ${expiresIn}s)`,
      );

      return {
        uploadUrl,
        fileKey,
        expiresIn,
      };
    } catch (error: any) {
      this.logger.error(
        `Error al generar URL prefirmada de subida para [${fileKey}]: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Fallo al generar la URL prefirmada de subida en DigitalOcean Spaces.',
      );
    }
  }

  /**
   * Genera una URL prefirmada temporal para descarga/visualización segura (GetObject)
   * de un archivo almacenado en Spaces.
   *
   * @param fileKey Clave relativa del objeto en Spaces (ej: 'tenants/t1/clinical/uuid-foto.webp')
   * @param customExpiresIn Tiempo de expiración personalizado (máximo 900 segundos)
   */
  async getPresignedDownloadUrl(
    fileKey: string,
    customExpiresIn?: number,
  ): Promise<string> {
    if (!fileKey) {
      throw new BadRequestException(
        'fileKey es obligatoria para generar la URL de descarga.',
      );
    }

    const expiresIn = Math.min(
      customExpiresIn ?? this.defaultExpiresIn,
      900,
    );

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.debug(
        `URL prefirmada de descarga generada para [${fileKey}] (expira en ${expiresIn}s)`,
      );

      return downloadUrl;
    } catch (error: any) {
      this.logger.error(
        `Error al generar URL prefirmada de descarga para [${fileKey}]: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Fallo al generar la URL prefirmada de descarga en DigitalOcean Spaces.',
      );
    }
  }

  /**
   * Elimina de forma controlada y auditada un objeto en Spaces.
   *
   * @param fileKey Clave del objeto a eliminar
   */
  async deleteObject(fileKey: string): Promise<void> {
    if (!fileKey) {
      throw new BadRequestException('fileKey es requerida para eliminar el objeto.');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      this.logger.log(`Objeto eliminado con éxito de Spaces: [${fileKey}]`);
    } catch (error: any) {
      this.logger.error(
        `Error al eliminar el objeto [${fileKey}] de Spaces: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Fallo al eliminar el objeto [${fileKey}] en almacenamiento Spaces.`,
      );
    }
  }

  /**
   * Sube directamente un buffer de logs de auditoría comprimido (.json.gz)
   * a la carpeta de retención fría del tenant correspondiente, garantizando
   * cifrado AES-256 en reposo según control de retención y no repudio ISO 27001.
   *
   * @param tenantId Identificador UUID del tenant
   * @param datePrefix Prefijo de fecha para particionamiento temporal (ej: '2026/09/02' o '2026-09-02')
   * @param buffer Buffer de los datos comprimidos en gzip
   */
  async uploadAuditLogBuffer(
    tenantId: string,
    datePrefix: string,
    buffer: Buffer,
  ): Promise<string> {
    if (!tenantId || !datePrefix || !buffer) {
      throw new BadRequestException(
        'tenantId, datePrefix y buffer son requeridos para subir logs de auditoría.',
      );
    }

    const sanitizedPrefix = datePrefix.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9/_-]/g, '_');
    const fileKey = `tenants/${tenantId}/audit-logs/${sanitizedPrefix}/${crypto.randomUUID()}-audit.json.gz`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: 'application/gzip',
        ServerSideEncryption: 'AES256', // Cifrado obligatorio en reposo
      });

      await this.s3Client.send(command);
      this.logger.log(
        `Lote de logs de auditoría (.json.gz) persistido exitosamente en almacenamiento frío: [${fileKey}]`,
      );

      return fileKey;
    } catch (error: any) {
      this.logger.error(
        `Error al subir buffer de auditoría para tenant [${tenantId}]: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Fallo al persistir lote de auditoría en almacenamiento Spaces.',
      );
    }
  }

  /**
   * Sube un documento PDF de historia clínica a la ruta protegida de Spaces
   * bajo el patrón WORM con cifrado del lado del servidor (AES-256).
   *
   * @param tenantId Identificador UUID del tenant
   * @param folioId Identificador UUID del folio
   * @param buffer Buffer con el contenido binario del PDF
   */
  async uploadClinicalPdfBuffer(
    tenantId: string,
    folioId: string,
    buffer: Buffer,
  ): Promise<string> {
    if (!tenantId || !folioId || !buffer) {
      throw new BadRequestException(
        'tenantId, folioId y buffer son requeridos para subir el PDF clínico.',
      );
    }

    const fileKey = `tenants/${tenantId}/clinical-records/${folioId}.pdf`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: 'application/pdf',
        ServerSideEncryption: 'AES256', // WORM / ISO 27001 Data-at-rest encryption
      });

      await this.s3Client.send(command);
      this.logger.log(
        `Documento PDF de historia clínica persistido en Spaces: [${fileKey}]`,
      );

      return fileKey;
    } catch (error: any) {
      this.logger.error(
        `Error al subir PDF clínico para folio [${folioId}] en tenant [${tenantId}]: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Fallo al persistir el PDF clínico en almacenamiento Spaces.',
      );
    }
  }

  /**
   * Sube el paquete JSON de RIPS (Resolución 2275 de 2023) a Spaces con cifrado AES-256.
   *
   * @param tenantId Identificador UUID del tenant
   * @param loteId Identificador UUID del lote de RIPS
   * @param buffer Buffer con el JSON generado
   */
  async uploadRipsJsonBuffer(
    tenantId: string,
    loteId: string,
    buffer: Buffer,
  ): Promise<string> {
    if (!tenantId || !loteId || !buffer) {
      throw new BadRequestException(
        'tenantId, loteId y buffer son requeridos para subir el archivo RIPS JSON.',
      );
    }

    const fileKey = `tenants/${tenantId}/rips/${loteId}.json`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256', // Cifrado obligatorio en reposo
      });

      await this.s3Client.send(command);
      this.logger.log(
        `Archivo RIPS JSON (Res. 2275/2023) persistido exitosamente en Spaces: [${fileKey}]`,
      );

      return fileKey;
    } catch (error: any) {
      this.logger.error(
        `Error al subir archivo RIPS JSON para lote [${loteId}] en tenant [${tenantId}]: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Fallo al persistir el archivo RIPS JSON en almacenamiento Spaces.',
      );
    }
  }

  /**
   * Getter del cliente S3 para extensiones avanzadas o pruebas
   */
  public getS3Client(): S3Client {
    return this.s3Client;
  }

  /**
   * Getter del nombre del bucket configurado
   */
  public getBucketName(): string {
    return this.bucket;
  }
}
