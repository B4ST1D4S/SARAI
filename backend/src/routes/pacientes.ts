import { Router } from 'express';
import {
  create,
  getById,
  getAll,
  update,
  deletePac,
  search,
} from '../controllers/pacientesController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Todos los endpoints de pacientes requieren autenticación
router.use(authenticateToken);

// GET /api/pacientes/search - Buscar pacientes (DEBE ir antes de /:id)
router.get('/search', search);

// POST /api/pacientes - Crear paciente (solo médicos, auxiliares, recepcionistas)
router.post('/', authorizeRole('MEDICO', 'AUXILIAR', 'RECEPCIONISTA'), create);

// GET /api/pacientes - Listar pacientes
router.get('/', getAll);

// GET /api/pacientes/:id - Obtener paciente por ID
router.get('/:id', getById);

// PUT /api/pacientes/:id - Actualizar paciente
router.put('/:id', authorizeRole('MEDICO', 'AUXILIAR', 'RECEPCIONISTA'), update);

// DELETE /api/pacientes/:id - Eliminar paciente
router.delete('/:id', authorizeRole('MEDICO', 'SUPER_ADMIN'), deletePac);

export default router;
