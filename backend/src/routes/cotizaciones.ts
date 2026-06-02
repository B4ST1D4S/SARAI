import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  getPaciente,
  aceptar,
  rechazar,
} from '../controllers/cotizacionController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authenticateToken);

// GET /api/cotizaciones - Listar cotizaciones del médico autenticado
router.get('/', getAll);

// POST /api/cotizaciones - Crear cotización (solo médicos)
router.post('/', authorizeRole('MEDICO', 'RECEPCIONISTA'), create);

// GET /api/cotizaciones/paciente/:pacienteId - Obtener cotizaciones de paciente
router.get('/paciente/:pacienteId', getPaciente);

// GET /api/cotizaciones/:id - Obtener cotización por ID
router.get('/:id', getById);

// POST /api/cotizaciones/:id/aceptar - Aceptar cotización
router.post('/:id/aceptar', aceptar);

// POST /api/cotizaciones/:id/rechazar - Rechazar cotización
router.post('/:id/rechazar', rechazar);

export default router;
