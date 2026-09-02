import { Module } from '@nestjs/common';
import { ClinicalRecordValidatorService } from './services/clinical-record-validator.service';
import { ClinicalRecordService } from './services/clinical-record.service';
import { ClinicalRecordController } from './controllers/clinical-record.controller';

@Module({
  imports: [],
  controllers: [ClinicalRecordController],
  providers: [ClinicalRecordValidatorService, ClinicalRecordService],
  exports: [ClinicalRecordValidatorService, ClinicalRecordService],
})
export class ClinicalRecordModule {}
