import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, masterDbConfig, securityConfig } from './configuration';
import { validateEnv } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, masterDbConfig, securityConfig],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class CoreConfigModule {}
