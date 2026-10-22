/**
 * @deprecated Shim de compatibilidad: no importar en código nuevo.
 * Componentes, utilidades y tipos se importan del barrel canónico `./index`
 * (`PrescripcionAmbForm` para la prescripción ambulatoria). El registry ya no
 * pasa por aquí; el único consumidor que queda es `prescripcion.test.ts`, que
 * verifica la retrocompatibilidad. Eliminar junto con esos imports.
 */
export {
  PrescripcionAmbForm as PrescripcionForm,
  filaCompleta,
  cuerpoGuardado,
  type PrescripcionFila,
} from './PrescripcionAmbForm';
export { calcularCantidadDispensar } from './compartido';
