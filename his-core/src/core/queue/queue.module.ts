import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host:
            configService.get<string>('REDIS_HOST') ||
            configService.get<string>('redis.host') ||
            'localhost',
          port: Number(
            configService.get<number>('REDIS_PORT') ||
              configService.get<number>('redis.port') ||
              6379,
          ),
          password:
            configService.get<string>('REDIS_PASSWORD') ||
            configService.get<string>('redis.password') ||
            undefined,
          db: Number(
            configService.get<number>('REDIS_DB') ||
              configService.get<number>('redis.db') ||
              0,
          ),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: false,
          removeOnFail: false, // Retención de fallidos para auditoría ISO 27001
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}