import { ClinicalRecordModule } from './clinical-record/clinical-record.module';

/**
 * Punto de entrada para los módulos de dominio y funcionalidades clínicas del HIS:
 * - ClinicalRecordModule (Historias clínicas, folios, odontograma, estética)
 * - PacientesModule
 * - CitasModule
 * - FacturacionModule
 * - InventarioFarmaciaModule
 * - etc.
 */
export const CLINICAL_MODULES = [ClinicalRecordModule];

export * from './clinical-record';
