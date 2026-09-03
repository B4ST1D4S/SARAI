import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../core/queue/constants/queue.constants';
import { RipsService } from './services/rips.service';
import { RipsGeneratorWorker } from './processors/rips-generator.worker';
import { RipsController } from './controllers/rips.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.RIPS_GENERATION,
    }),
  ],
  controllers: [RipsController],
  providers: [RipsService, RipsGeneratorWorker],
  exports: [RipsService],
})
export class BillingRipsModule {}
