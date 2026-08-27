import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import {
  // Hallazgos
  getHallazgos, createHallazgo, updateHallazgo, deleteHallazgo, setSugerencias,
  // Estados
  getEstados, createEstado, updateEstado, deleteEstado,
  // Prioridades
  getPrioridades, createPrioridad, updatePrioridad, deletePrioridad,
  // Riesgos
  getRiesgos, createRiesgo, updateRiesgo, deleteRiesgo,
} from '../controllers/odontoParametrizacionController.js';
import {
  getCatalogos, buscarCargos,
  getOdontogramasByPaciente, getOdontogramaById, crearOdontograma, updateOdontograma,
  guardarPiezas,
  generarPlan, addPlanItem, updatePlanItem, deletePlanItem, cambiarEstadoTratamiento,
  addEvolucion, getTimeline, getResumen,
} from '../controllers/odontogramaController.js';

const router = Router();

router.use(authenticateToken);

const onlyAdmin = authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR');
const onlyClinico = authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR');

// ── Catálogos (lectura para todo el personal autenticado) ──
router.get('/catalogos', getCatalogos);
router.get('/cargos', buscarCargos);
router.get('/resumen', getResumen);

// ── PARAMETRIZACIÓN ──
router.get('/parametrizacion/hallazgos', getHallazgos);
router.post('/parametrizacion/hallazgos', onlyAdmin, createHallazgo);
router.put('/parametrizacion/hallazgos/:id', onlyAdmin, updateHallazgo);
router.delete('/parametrizacion/hallazgos/:id', onlyAdmin, deleteHallazgo);
router.put('/parametrizacion/hallazgos/:id/sugerencias', onlyAdmin, setSugerencias);

router.get('/parametrizacion/estados', getEstados);
router.post('/parametrizacion/estados', onlyAdmin, createEstado);
router.put('/parametrizacion/estados/:id', onlyAdmin, updateEstado);
router.delete('/parametrizacion/estados/:id', onlyAdmin, deleteEstado);

router.get('/parametrizacion/prioridades', getPrioridades);
router.post('/parametrizacion/prioridades', onlyAdmin, createPrioridad);
router.put('/parametrizacion/prioridades/:id', onlyAdmin, updatePrioridad);
router.delete('/parametrizacion/prioridades/:id', onlyAdmin, deletePrioridad);

router.get('/parametrizacion/riesgos', getRiesgos);
router.post('/parametrizacion/riesgos', onlyAdmin, createRiesgo);
router.put('/parametrizacion/riesgos/:id', onlyAdmin, updateRiesgo);
router.delete('/parametrizacion/riesgos/:id', onlyAdmin, deleteRiesgo);

// ── ODONTOGRAMAS ──
router.get('/paciente/:pacienteId', getOdontogramasByPaciente);
router.post('/', onlyClinico, crearOdontograma);
router.get('/:id', getOdontogramaById);
router.put('/:id', onlyClinico, updateOdontograma);

// Hallazgos por pieza
router.put('/:id/piezas', onlyClinico, guardarPiezas);

// Plan de tratamiento
router.post('/:id/plan/generar', onlyClinico, generarPlan);
router.post('/:id/plan', onlyClinico, addPlanItem);
router.put('/:id/plan/:itemId', onlyClinico, updatePlanItem);
router.delete('/:id/plan/:itemId', onlyClinico, deletePlanItem);
router.post('/:id/plan/:itemId/estado', onlyClinico, cambiarEstadoTratamiento);

// Evolución / timeline
router.get('/:id/timeline', getTimeline);
router.post('/:id/evolucion', onlyClinico, addEvolucion);

export default router;
