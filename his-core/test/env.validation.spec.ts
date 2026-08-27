import { validateEnv, envSchema } from '../src/core/config/env.validation';

describe('Environment Validation (Zod)', () => {
  it('debe validar y aplicar valores por defecto ante configuración válida', () => {
    const rawEnv = {
      MASTER_DB_HOST: 'localhost',
      MASTER_DB_USER: 'postgres',
      MASTER_DB_PASSWORD: 'secretpassword',
      JWT_SECRET: 'super_secret_jwt_key_16chars_min',
    };

    const validated = validateEnv(rawEnv);

    expect(validated.NODE_ENV).toBe('development');
    expect(validated.PORT).toBe(3000);
    expect(validated.MASTER_DB_PORT).toBe(5432);
    expect(validated.MASTER_DB_NAME).toBe('his_master');
    expect(validated.MASTER_DB_SSL).toBe(false);
    expect(validated.MASTER_DB_POOL_MAX).toBe(20);
  });

  it('debe lanzar excepción si falta una variable obligatoria como MASTER_DB_HOST', () => {
    const rawEnv = {
      MASTER_DB_USER: 'postgres',
      MASTER_DB_PASSWORD: 'secretpassword',
      JWT_SECRET: 'super_secret_jwt_key_16chars_min',
    };

    expect(() => validateEnv(rawEnv)).toThrow(
      /MASTER_DB_HOST is required/,
    );
  });

  it('debe parsear y coercionarse correctamente booleanos y números', () => {
    const rawEnv = {
      PORT: '4000',
      MASTER_DB_HOST: 'db.his.cloud',
      MASTER_DB_PORT: '5433',
      MASTER_DB_USER: 'admin',
      MASTER_DB_PASSWORD: 'dbpassword123',
      MASTER_DB_SSL: 'true',
      JWT_SECRET: 'super_secret_jwt_key_16chars_min',
    };

    const validated = validateEnv(rawEnv);

    expect(validated.PORT).toBe(4000);
    expect(validated.MASTER_DB_PORT).toBe(5433);
    expect(validated.MASTER_DB_SSL).toBe(true);
  });
});
