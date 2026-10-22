/**
 * Módulo de Prescripción Médica (Ambulatoria e Intrahospitalaria).
 * Barrel canónico: componentes, utilidades y tipos se importan desde aquí.
 */

export { PrescripcionAmbForm } from './PrescripcionAmbForm';
export { PrescripcionHospForm } from './PrescripcionHospForm';
/**
 * @deprecated Alias de PrescripcionAmbForm, sin pasar por el shim
 * `PrescripcionForm.tsx`. Solo lo usa `prescripcion.test.ts`; el registry ya
 * usa PrescripcionAmbForm.
 */
export { PrescripcionAmbForm as PrescripcionForm } from './PrescripcionAmbForm';
export * from './types';

// Utilidades y cálculos clínicos (los dos ámbitos prescriben por molde genérico)
export { calcularCantidadDispensar, volumenTratamiento, tomasTratamiento } from './compartido';
export type { MoldePrescribible, ModoCalculoCantidad, AlertaCdss, SeveridadCdss } from './compartido';
export { filaCompleta, cuerpoGuardado, FILA_VACIA } from './PrescripcionAmbForm';
export type { PrescripcionFila, PrescripcionAmbFormProps } from './PrescripcionAmbForm';
export { esViaParenteral } from './PrescripcionHospForm';
