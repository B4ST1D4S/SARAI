import { Router } from 'express';
import {
  getAllProcedimientos,
  getProcedimientoByCUPS,
  createProcedimiento,
  updateProcedimiento,
  deleteProcedimiento,
  getPlantillasPorCUPS,
  getPlantillaById,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
  getChecklistPorCUPS,
  createChecklist,
  updateChecklist,
  getConsentimientoPorCUPS,
  createConsentimiento,
  updateConsentimiento,
} from '../controllers/cupsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// ============================================
// PROCEDIMIENTOS CUPS
// ============================================

// Obtener todos los procedimientos
router.get('/procedimientos', getAllProcedimientos);

// Obtener procedimiento por CUPS
router.get('/procedimientos/:cups', getProcedimientoByCUPS);

// Crear procedimiento (solo ADMIN)
router.post('/procedimientos', authenticateToken, authorizeRole('SUPER_ADMIN'), createProcedimiento);

// Actualizar procedimiento (solo ADMIN)
router.put('/procedimientos/:cups', authenticateToken, authorizeRole('SUPER_ADMIN'), updateProcedimiento);

// Eliminar procedimiento (solo ADMIN)
router.delete('/procedimientos/:cups', authenticateToken, authorizeRole('SUPER_ADMIN'), deleteProcedimiento);

// ============================================
// PLANTILLAS POR CUPS
// ============================================

// Obtener plantillas por CUPS (parámetro query: ?cups=XXX&tipo=historia-clinica)
router.get('/plantillas', getPlantillasPorCUPS);

// Obtener plantilla por ID
router.get('/plantillas/:id', getPlantillaById);

// Crear plantilla (solo ADMIN)
router.post('/plantillas', authenticateToken, authorizeRole('SUPER_ADMIN'), createPlantilla);

// Actualizar plantilla (solo ADMIN)
router.put('/plantillas/:id', authenticateToken, authorizeRole('SUPER_ADMIN'), updatePlantilla);

// Eliminar plantilla (solo ADMIN)
router.delete('/plantillas/:id', authenticateToken, authorizeRole('SUPER_ADMIN'), deletePlantilla);

// ============================================
// CHECKLISTS
// ============================================

// Obtener checklists por CUPS (parámetro query: ?cups=XXX&fase=pre-operatorio)
router.get('/checklists', getChecklistPorCUPS);

// Crear checklist (solo ADMIN)
router.post('/checklists', authenticateToken, authorizeRole('SUPER_ADMIN'), createChecklist);

// Actualizar checklist (solo ADMIN)
router.put('/checklists/:id', authenticateToken, authorizeRole('SUPER_ADMIN'), updateChecklist);

// ============================================
// CONSENTIMIENTOS
// ============================================

// Obtener consentimiento por CUPS
router.get('/consentimientos/:cups', getConsentimientoPorCUPS);

// Crear consentimiento (solo ADMIN)
router.post('/consentimientos', authenticateToken, authorizeRole('SUPER_ADMIN'), createConsentimiento);

// Actualizar consentimiento (solo ADMIN)
router.put('/consentimientos/:cups', authenticateToken, authorizeRole('SUPER_ADMIN'), updateConsentimiento);

export default router;
