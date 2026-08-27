import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provisioning'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default('SARAI-HIS-Core'),
  BASE_DOMAIN: z.string().default('hisapp.local'),

  // Conexión a la base de datos maestra (his_master)
  MASTER_DB_HOST: z
    .string({ required_error: 'MASTER_DB_HOST is required' })
    .min(1, 'MASTER_DB_HOST cannot be empty'),
  MASTER_DB_PORT: z.coerce.number().default(5432),
  MASTER_DB_USER: z
    .string({ required_error: 'MASTER_DB_USER is required' })
    .min(1, 'MASTER_DB_USER cannot be empty'),
  MASTER_DB_PASSWORD: z
    .string({ required_error: 'MASTER_DB_PASSWORD is required' })
    .min(1, 'MASTER_DB_PASSWORD cannot be empty'),
  MASTER_DB_NAME: z.string().default('his_master'),
  MASTER_DB_SSL: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(false)
    .transform((val) => (typeof val === 'boolean' ? val : val === 'true')),
  MASTER_DB_POOL_MAX: z.coerce.number().default(20),
  MASTER_DB_POOL_MIN: z.coerce.number().default(5),

  // Seguridad
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');
    throw new Error(
      `❌ Error de validación en variables de entorno:\n${errorDetails}`,
    );
  }

  return parsed.data;
}
