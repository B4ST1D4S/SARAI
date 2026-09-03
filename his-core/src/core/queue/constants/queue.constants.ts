export const QUEUES = {
  AUDIT_LOGS: 'audit-logs-queue',
  RIPS_GENERATION: 'rips-generation-queue',
  CLINICAL_PDF: 'clinical-pdf-queue',
} as const;

export const JOBS = {
  ARCHIVE_OLD_LOGS: 'archive-old-logs-job',
  GENERATE_CLINICAL_PDF: 'generate-clinical-pdf-job',
  GENERATE_RIPS_JSON: 'generate-rips-json-job',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export type JobName = (typeof JOBS)[keyof typeof JOBS];