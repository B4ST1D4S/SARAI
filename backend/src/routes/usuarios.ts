import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  update,
  toggleStatus,
} from '../controllers/usuariosController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Todos requieren autenticación
router.use(authenticateToken);

// GET /api/usuarios — listar todos (MEDICO, SUPER_ADMIN)
router.get('/', authorizeRole('SUPER_ADMIN', 'MEDICO'), getAll);

// GET /api/usuarios/:id — obtener uno
router.get('/:id', authorizeRole('SUPER_ADMIN', 'MEDICO'), getById);

// POST /api/usuarios — crear usuario (solo SUPER_ADMIN o MEDICO administrador)
router.post('/', authorizeRole('SUPER_ADMIN', 'MEDICO'), create);

// PUT /api/usuarios/:id — actualizar
router.put('/:id', authorizeRole('SUPER_ADMIN', 'MEDICO'), update);

// PATCH /api/usuarios/:id/toggle-status — activar/desactivar
router.patch('/:id/toggle-status', authorizeRole('SUPER_ADMIN', 'MEDICO'), toggleStatus);

export default router;
