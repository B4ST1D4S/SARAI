import { ClinicalRecordModule } from './clinical-record/clinical-record.module';
import { AuditModule } from './audit/audit.module';
import { BillingRipsModule } from './billing-rips/billing-rips.module';

/**
 * Punto de entrada para los módulos de dominio y funcionalidades clínicas del HIS:
 * - ClinicalRecordModule (Historias clínicas, folios, odontograma, estética)
 * - AuditModule (Auditoría forense ISO 27001, archivado en frío BullMQ)
 * - BillingRipsModule (Facturación electrónica en salud, RIPS Resolución 2275 de 2023)
 * - PacientesModule
 * - CitasModule
 * - InventarioFarmaciaModule
 * - etc.
 */
export const CLINICAL_MODULES = [
  ClinicalRecordModule,
  AuditModule,
  BillingRipsModule,
];

export * from './clinical-record';
export * from './audit';
export * from './billing-rips';
