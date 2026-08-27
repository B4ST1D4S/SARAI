import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';
import { masterDbConfig } from '../config/configuration';
import { Tenant } from '../tenancy/entities/tenant.entity';

export const MASTER_CONNECTION_NAME = 'master_connection';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: MASTER_CONNECTION_NAME,
      inject: [masterDbConfig.KEY],
      useFactory: (config: ConfigType<typeof masterDbConfig>) => ({
        type: 'postgres',
        host: config.host,
        port: config.port,
        username: config.user,
        password: config.password,
        database: config.database,
        entities: [Tenant],
        synchronize: process.env.NODE_ENV === 'development',
        logging:
          process.env.NODE_ENV === 'development'
            ? ['error', 'warn']
            : ['error'],
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        extra: {
          max: config.poolMax,
          min: config.poolMin,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class MasterDatabaseModule {}
