import { Router } from 'express';
import {
  create,
  getById,
  getPorPaciente,
  getPorMedico,
  update,
  entregar,
} from '../controllers/historiaClinicaController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authenticateToken);

// GET /api/historia-clinica/por-medico - Obtener historias del médico (DEBE ir antes de /:id)
router.get('/por-medico', authorizeRole('MEDICO'), getPorMedico);

// GET /api/historia-clinica/paciente/:pacienteId - Obtener historias del paciente (DEBE ir antes de /:id)
router.get('/paciente/:pacienteId', getPorPaciente);

// POST /api/historia-clinica - Crear historia clínica (solo médicos)
router.post('/', authorizeRole('MEDICO'), create);

// GET /api/historia-clinica/:id - Obtener historia clínica por ID
router.get('/:id', getById);

// PUT /api/historia-clinica/:id - Actualizar historia clínica
router.put('/:id', authorizeRole('MEDICO'), update);

// POST /api/historia-clinica/:id/entregar - Entregar historia clínica al paciente
router.post('/:id/entregar', authorizeRole('MEDICO'), entregar);

export default router;
