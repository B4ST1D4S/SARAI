import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../core/queue/constants/queue.constants';
import { AuditService } from './services/audit.service';
import { AuditArchiverWorker } from './processors/audit-archiver.worker';
import { AuditSchedulerService } from './services/audit-scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.AUDIT_LOGS,
    }),
  ],
  providers: [AuditService, AuditArchiverWorker, AuditSchedulerService],
  exports: [AuditService, AuditSchedulerService],
})
export class AuditModule {}
