import { Router } from 'express';
import {
  save,
  getByProcedimiento,
  getByPaciente,
  update,
  remove,
} from '../controllers/mapaCorporalController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authenticateToken);

// POST /api/mapa-corporal - Guardar/actualizar mapa corporal (solo médicos)
router.post('/', authorizeRole('MEDICO'), save);

// GET /api/mapa-corporal/paciente/:pacienteId - Obtener mapas corporales de un paciente
router.get('/paciente/:pacienteId', getByPaciente);

// GET /api/mapa-corporal/procedimiento/:procedimientoId/:pacienteId - Obtener mapa corporal por procedimiento (DEBE ir después de /paciente)
router.get('/procedimiento/:procedimientoId/:pacienteId', getByProcedimiento);

// PUT /api/mapa-corporal/:id - Actualizar mapa corporal (solo médicos)
router.put('/:id', authorizeRole('MEDICO'), update);

// DELETE /api/mapa-corporal/:id - Eliminar mapa corporal (solo médicos)
router.delete('/:id', authorizeRole('MEDICO'), remove);

export default router;
