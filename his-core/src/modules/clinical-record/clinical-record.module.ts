import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../core/queue/constants/queue.constants';
import { ClinicalRecordValidatorService } from './services/clinical-record-validator.service';
import { ClinicalRecordService } from './services/clinical-record.service';
import { ClinicalPdfService } from './services/clinical-pdf.service';
import { ClinicalPdfWorker } from './processors/clinical-pdf.worker';
import { ClinicalRecordController } from './controllers/clinical-record.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.CLINICAL_PDF,
    }),
  ],
  controllers: [ClinicalRecordController],
  providers: [
    ClinicalRecordValidatorService,
    ClinicalRecordService,
    ClinicalPdfService,
    ClinicalPdfWorker,
  ],
  exports: [
    ClinicalRecordValidatorService,
    ClinicalRecordService,
    ClinicalPdfService,
  ],
})
export class ClinicalRecordModule {}
