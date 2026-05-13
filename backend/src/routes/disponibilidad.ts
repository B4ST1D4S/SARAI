import { Router } from 'express';
import {
  getMedicoDisponibilidad,
  getMedicosList,
  getTiposConsultaMedico,
  postDisponibilidad,
  putDisponibilidad,
  deleteDisponibilidadCtrl,
  getSlots,
  getBloqueosMedico,
  postBloqueo,
  deleteBloqueoCtrl,
} from '../controllers/disponibilidadController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Slots libres para un médico en una fecha (todos los roles)
router.get('/slots', getSlots);

// Lista de todos los médicos activos (para Config Agenda)
router.get('/medicos-list', getMedicosList);

// Tipos de consulta compatibles con la especialidad de un médico
router.get('/tipos-consulta/:medicoId', getTiposConsultaMedico);

// Disponibilidad semanal del médico
router.get('/medico/:medicoId', getMedicoDisponibilidad);
router.post('/', authorizeRole('MEDICO', 'SUPER_ADMIN'), postDisponibilidad);
router.put('/:id', authorizeRole('MEDICO', 'SUPER_ADMIN'), putDisponibilidad);
router.delete('/:id', authorizeRole('MEDICO', 'SUPER_ADMIN'), deleteDisponibilidadCtrl);

// Bloqueos
router.get('/bloqueos/medico/:medicoId', getBloqueosMedico);
router.post('/bloqueos', authorizeRole('MEDICO', 'SUPER_ADMIN'), postBloqueo);
router.delete('/bloqueos/:id', authorizeRole('MEDICO', 'SUPER_ADMIN'), deleteBloqueoCtrl);

export default router;
