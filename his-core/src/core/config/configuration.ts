import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  name: process.env.APP_NAME ?? 'SARAI-HIS-Core',
  baseDomain: process.env.BASE_DOMAIN ?? 'hisapp.local',
}));

export const masterDbConfig = registerAs('masterDb', () => ({
  host: process.env.MASTER_DB_HOST,
  port: parseInt(process.env.MASTER_DB_PORT ?? '5432', 10),
  user: process.env.MASTER_DB_USER,
  password: process.env.MASTER_DB_PASSWORD,
  database: process.env.MASTER_DB_NAME ?? 'his_master',
  ssl: process.env.MASTER_DB_SSL === 'true',
  poolMax: parseInt(process.env.MASTER_DB_POOL_MAX ?? '20', 10),
  poolMin: parseInt(process.env.MASTER_DB_POOL_MIN ?? '5', 10),
}));

export const securityConfig = registerAs('security', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
}));
