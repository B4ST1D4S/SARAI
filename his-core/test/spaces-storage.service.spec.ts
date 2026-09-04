import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpacesStorageService } from '../src/core/storage/services/spaces-storage.service';
import * as presigner from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Mock getSignedUrl from @aws-sdk/s3-request-presigner
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('SpacesStorageService (DigitalOcean Spaces & ISO 27001)', () => {
  let service: SpacesStorageService;
  let configService: ConfigService;

  const mockConfigValues: Record<string, any> = {
    SPACES_ENDPOINT: 'https://nyc3.digitaloceanspaces.com',
    SPACES_REGION: 'nyc3',
    SPACES_BUCKET: 'sarai-medical-vault',
    SPACES_KEY: 'SPACES_TEST_KEY_123',
    SPACES_SECRET: 'SPACES_TEST_SECRET_456',
    SPACES_PRESIGNED_EXPIRES_IN: 600,
  };

  beforeEach(() => {
    configService = new ConfigService(mockConfigValues);
    service = new SpacesStorageService(configService);
    jest.clearAllMocks();
  });

  describe('Inicialización y Configuración', () => {
    it('debe inicializar correctamente el bucket y clientes con los valores de configuración', () => {
      expect(service.getBucketName()).toBe('sarai-medical-vault');
      expect(service.getS3Client()).toBeDefined();
    });

    it('debe autocompletar el protocolo https si el endpoint no lo incluye', () => {
      const customConfig = new ConfigService({
        SPACES_ENDPOINT: 'ams3.digitaloceanspaces.com',
        SPACES_BUCKET: 'ams3-bucket',
      });
      const customService = new SpacesStorageService(customConfig);
      expect(customService.getBucketName()).toBe('ams3-bucket');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('debe generar una URL prefirmada de subida con cifrado AES-256 y estructura aislada por tenant', async () => {
      const mockSignedUrl = 'https://sarai-medical-vault.nyc3.digitaloceanspaces.com/upload-signed-url';
      (presigner.getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      const tenantId = 't-tenant-001';
      const folder = 'clinical';
      const filename = 'foto_dermatologia.webp';
      const mimeType = 'image/webp';

      const result = await service.getPresignedUploadUrl(
        tenantId,
        folder,
        filename,
        mimeType,
      );

      expect(result.uploadUrl).toBe(mockSignedUrl);
      expect(result.expiresIn).toBe(600);
      expect(result.fileKey).toMatch(
        /^tenants\/t-tenant-001\/clinical\/[0-9a-fA-F-]{36}-foto_dermatologia\.webp$/,
      );

      // Verificar que getSignedUrl fue invocado con PutObjectCommand conteniendo AES256
      expect(presigner.getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(PutObjectCommand),
        { expiresIn: 600 },
      );

      const commandArg = (presigner.getSignedUrl as jest.Mock).mock.calls[0][1] as PutObjectCommand;
      expect(commandArg.input.Bucket).toBe('sarai-medical-vault');
      expect(commandArg.input.ContentType).toBe('image/webp');
      expect(commandArg.input.ServerSideEncryption).toBe('AES256');
    });

    it('debe sanitizar nombres de archivo con caracteres no seguros o rutas relativas', async () => {
      (presigner.getSignedUrl as jest.Mock).mockResolvedValue('https://signed.url');

      const result = await service.getPresignedUploadUrl(
        't1',
        'clinical',
        '../../malicious!file#name.png',
        'image/png',
      );

      expect(result.fileKey).not.toContain('..');
      expect(result.fileKey).toMatch(/^tenants\/t1\/clinical\/[0-9a-fA-F-]{36}-malicious_file_name\.png$/);
    });

    it('debe limitar el tiempo de expiración a un máximo de 900 segundos bajo ISO 27001', async () => {
      const longExpirationConfig = new ConfigService({
        ...mockConfigValues,
        SPACES_PRESIGNED_EXPIRES_IN: 3600, // 1 hora (excede norma de 900s)
      });
      const strictService = new SpacesStorageService(longExpirationConfig);

      (presigner.getSignedUrl as jest.Mock).mockResolvedValue('https://signed.url');

      const result = await strictService.getPresignedUploadUrl(
        't1',
        'clinical',
        'file.pdf',
        'application/pdf',
      );

      expect(result.expiresIn).toBe(900);
    });

    it('debe lanzar BadRequestException si faltan parámetros requeridos', async () => {
      await expect(
        service.getPresignedUploadUrl('', 'clinical', 'file.png', 'image/png'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getPresignedUploadUrl('t1', 'clinical', '', 'image/png'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getPresignedUploadUrl('t1', 'clinical', 'file.png', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException si la firma de S3 falla', async () => {
      (presigner.getSignedUrl as jest.Mock).mockRejectedValue(new Error('S3 signing failure'));

      await expect(
        service.getPresignedUploadUrl('t1', 'clinical', 'file.png', 'image/png'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('debe generar una URL prefirmada de descarga con GetObjectCommand', async () => {
      const mockDownloadUrl = 'https://sarai-medical-vault.nyc3.digitaloceanspaces.com/download-url';
      (presigner.getSignedUrl as jest.Mock).mockResolvedValue(mockDownloadUrl);

      const fileKey = 'tenants/t1/clinical/foto.webp';
      const url = await service.getPresignedDownloadUrl(fileKey);

      expect(url).toBe(mockDownloadUrl);
      expect(presigner.getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(GetObjectCommand),
        { expiresIn: 600 },
      );

      const commandArg = (presigner.getSignedUrl as jest.Mock).mock.calls[0][1] as GetObjectCommand;
      expect(commandArg.input.Bucket).toBe('sarai-medical-vault');
      expect(commandArg.input.Key).toBe(fileKey);
    });

    it('debe respetar tiempo de expiración personalizado sin exceder 900 segundos', async () => {
      (presigner.getSignedUrl as jest.Mock).mockResolvedValue('https://download.url');

      await service.getPresignedDownloadUrl('tenants/t1/file.pdf', 300);
      expect(presigner.getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 300 },
      );

      await service.getPresignedDownloadUrl('tenants/t1/file.pdf', 5000);
      expect(presigner.getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 900 },
      );
    });

    it('debe lanzar BadRequestException si fileKey está vacía', async () => {
      await expect(service.getPresignedDownloadUrl('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteObject', () => {
    it('debe invocar DeleteObjectCommand en el cliente S3', async () => {
      const s3Client = service.getS3Client();
      const sendSpy = jest.spyOn(s3Client, 'send' as any).mockResolvedValue({} as any);

      const fileKey = 'tenants/t1/clinical/obsolete.png';
      await service.deleteObject(fileKey);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const command = sendSpy.mock.calls[0][0] as DeleteObjectCommand;
      expect(command.input.Bucket).toBe('sarai-medical-vault');
      expect(command.input.Key).toBe(fileKey);
    });

    it('debe lanzar BadRequestException si fileKey está vacía', async () => {
      await expect(service.deleteObject('')).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException si la eliminación en S3 falla', async () => {
      const s3Client = service.getS3Client();
      jest.spyOn(s3Client, 'send' as any).mockRejectedValue(new Error('S3 Access Denied'));

      await expect(service.deleteObject('tenants/t1/file.png')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('uploadAuditLogBuffer', () => {
    it('debe subir un buffer de logs comprimido con ContentType application/gzip y cifrado AES-256', async () => {
      const s3Client = service.getS3Client();
      const sendSpy = jest.spyOn(s3Client, 'send' as any).mockResolvedValue({} as any);

      const tenantId = 't-clinica-san-vicente';
      const datePrefix = '2026/09/02';
      const logBuffer = Buffer.from('GZIP_COMPRESSED_AUDIT_LOG_PAYLOAD');

      const fileKey = await service.uploadAuditLogBuffer(
        tenantId,
        datePrefix,
        logBuffer,
      );

      expect(fileKey).toMatch(
        /^tenants\/t-clinica-san-vicente\/audit-logs\/2026\/09\/02\/[0-9a-fA-F-]{36}-audit\.json\.gz$/,
      );

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const command = sendSpy.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Bucket).toBe('sarai-medical-vault');
      expect(command.input.Key).toBe(fileKey);
      expect(command.input.Body).toBe(logBuffer);
      expect(command.input.ContentType).toBe('application/gzip');
      expect(command.input.ServerSideEncryption).toBe('AES256');
    });

    it('debe sanitizar datePrefix para evitar barras dobles al inicio o fin', async () => {
      const s3Client = service.getS3Client();
      jest.spyOn(s3Client, 'send' as any).mockResolvedValue({} as any);

      const fileKey = await service.uploadAuditLogBuffer(
        't1',
        '//2026-09-02//',
        Buffer.from('data'),
      );

      expect(fileKey).toMatch(/^tenants\/t1\/audit-logs\/2026-09-02\/[0-9a-fA-F-]{36}-audit\.json\.gz$/);
    });

    it('debe lanzar BadRequestException si falta algún parámetro obligatorio', async () => {
      await expect(
        service.uploadAuditLogBuffer('', '2026/09/02', Buffer.from('data')),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadAuditLogBuffer('t1', '', Buffer.from('data')),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadAuditLogBuffer('t1', '2026/09/02', null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException si la subida del buffer falla', async () => {
      const s3Client = service.getS3Client();
      jest.spyOn(s3Client, 'send' as any).mockRejectedValue(new Error('Network timeout'));

      await expect(
        service.uploadAuditLogBuffer('t1', '2026/09/02', Buffer.from('test')),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('uploadClinicalPdfBuffer', () => {
    it('debe subir el buffer PDF a la clave tenants/{tenantId}/clinical-records/{folioId}.pdf con cifrado AES-256', async () => {
      const s3Client = service.getS3Client();
      const sendSpy = jest.spyOn(s3Client, 'send' as any).mockResolvedValue({} as any);

      const tenantId = 't-tenant-hospital';
      const folioId = 'f0000000-1111-2222-3333-444444444444';
      const pdfBuffer = Buffer.from('%PDF-1.4 mock content');

      const fileKey = await service.uploadClinicalPdfBuffer(
        tenantId,
        folioId,
        pdfBuffer,
      );

      expect(fileKey).toBe(`tenants/${tenantId}/clinical-records/${folioId}.pdf`);
      expect(sendSpy).toHaveBeenCalledTimes(1);

      const command = sendSpy.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Bucket).toBe('sarai-medical-vault');
      expect(command.input.Key).toBe(fileKey);
      expect(command.input.Body).toBe(pdfBuffer);
      expect(command.input.ContentType).toBe('application/pdf');
      expect(command.input.ServerSideEncryption).toBe('AES256');
    });

    it('debe lanzar BadRequestException si falta algún parámetro', async () => {
      await expect(
        service.uploadClinicalPdfBuffer('', 'folio-1', Buffer.from('pdf')),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadClinicalPdfBuffer('t1', '', Buffer.from('pdf')),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadClinicalPdfBuffer('t1', 'folio-1', null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException si la subida a Spaces falla', async () => {
      const s3Client = service.getS3Client();
      jest.spyOn(s3Client, 'send' as any).mockRejectedValue(new Error('S3 upload error'));

      await expect(
        service.uploadClinicalPdfBuffer('t1', 'folio-1', Buffer.from('pdf')),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
