import { Router } from 'express';
import {
  create,
  getMedico,
  getPaciente,
  getById,
  update,
  confirmar,
  completar,
  cancelar,
  recordatorios,
} from '../controllers/citasController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Todos los endpoints de citas requieren autenticación
router.use(authenticateToken);

// POST /api/citas - Crear cita
router.post(
  '/',
  authorizeRole('MEDICO', 'RECEPCIONISTA', 'AUXILIAR'),
  create
);

// GET /api/citas/medico - Obtener citas del médico autenticado
router.get('/medico/agenda', getMedico);

// GET /api/citas/paciente/:pacienteId - Obtener citas de un paciente
router.get('/paciente/:pacienteId', getPaciente);

// GET /api/citas/:id - Obtener cita por ID
router.get('/:id', getById);

// PUT /api/citas/:id - Actualizar cita
router.put('/:id', authorizeRole('MEDICO', 'RECEPCIONISTA', 'AUXILIAR'), update);

// POST /api/citas/:id/confirmar - Confirmar asistencia del paciente
router.post('/:id/confirmar', confirmar);

// POST /api/citas/:id/completar - Completar cita (atención médica)
router.post(
  '/:id/completar',
  authorizeRole('MEDICO', 'AUXILIAR'),
  completar
);

// DELETE /api/citas/:id - Cancelar cita
router.delete('/:id', authorizeRole('MEDICO', 'RECEPCIONISTA', 'AUXILIAR'), cancelar);

// POST /api/citas/recordatorios/enviar - Enviar recordatorios
router.post('/recordatorios/enviar', recordatorios);

export default router;
