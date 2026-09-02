import { ClinicalRecordModule } from './clinical-record/clinical-record.module';
import { AuditModule } from './audit/audit.module';

/**
 * Punto de entrada para los módulos de dominio y funcionalidades clínicas del HIS:
 * - ClinicalRecordModule (Historias clínicas, folios, odontograma, estética)
 * - AuditModule (Auditoría forense ISO 27001, archivado en frío BullMQ)
 * - PacientesModule
 * - CitasModule
 * - FacturacionModule
 * - InventarioFarmaciaModule
 * - etc.
 */
export const CLINICAL_MODULES = [ClinicalRecordModule, AuditModule];

export * from './clinical-record';
export * from './audit';
