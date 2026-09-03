import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../src/core/security/crypto.service';

describe('CryptoService (AES-256-GCM)', () => {
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('super_secure_jwt_secret_key_2026'),
          },
        },
      ],
    }).compile();

    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('debe encriptar y desencriptar un texto plano correctamente', () => {
    const originalPassword = 'Password123!_HospitalDB';
    const encrypted = cryptoService.encrypt(originalPassword);

    expect(encrypted).not.toBe(originalPassword);
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = cryptoService.decrypt(encrypted);
    expect(decrypted).toBe(originalPassword);
  });

  it('debe manejar texto plano sin encriptar sin fallar (compatibilidad)', () => {
    const plain = 'unencrypted_password';
    const result = cryptoService.decrypt(plain);
    expect(result).toBe(plain);
  });

  it('debe lanzar error si el contenido encriptado es manipulado', () => {
    const originalPassword = 'SecretDBPassword';
    const encrypted = cryptoService.encrypt(originalPassword);
    const tampered = encrypted.slice(0, -4) + 'abcd';

    expect(() => cryptoService.decrypt(tampered)).toThrow();
  });
});
