import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import {
  // Especialidades
  getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad,
  // HC Módulos
  getHCModulos, createHCModulo, updateHCModulo, deleteHCModulo,
  // Departamentos
  getDepartamentos, createDepartamento, updateDepartamento, deleteDepartamento,
  // Servicios
  getServicios, createServicio, updateServicio, deleteServicio,
  // Tipos Consulta
  getTiposConsulta, getTipoConsultaById, createTipoConsulta, updateTipoConsulta, deleteTipoConsulta,
  // Config Servicios
  getConfigServicios, addServicioAConsulta, removeServicioDeConsulta,
  // Reglas operativas
  getReglasOperativas, upsertReglaOperativa,
  // Preparaciones
  getPreparaciones, createPreparacion, updatePreparacion, deletePreparacion,
} from '../controllers/adminController.js';

const router = Router();

// ── Todos los endpoints requieren autenticación ──
router.use(authenticateToken);

// Sólo SUPER_ADMIN puede crear/editar/eliminar
const onlyAdmin = authorizeRole('SUPER_ADMIN');

// ─────────────────────────────────────────
// ESPECIALIDADES
// ─────────────────────────────────────────
router.get('/especialidades', getEspecialidades);
router.post('/especialidades', onlyAdmin, createEspecialidad);
router.put('/especialidades/:id', onlyAdmin, updateEspecialidad);
router.delete('/especialidades/:id', onlyAdmin, deleteEspecialidad);

// ─────────────────────────────────────────
// HC MÓDULOS
// ─────────────────────────────────────────
router.get('/hc-modulos', getHCModulos);
router.post('/hc-modulos', onlyAdmin, createHCModulo);
router.put('/hc-modulos/:id', onlyAdmin, updateHCModulo);
router.delete('/hc-modulos/:id', onlyAdmin, deleteHCModulo);

// ─────────────────────────────────────────
// DEPARTAMENTOS
// ─────────────────────────────────────────
router.get('/departamentos', getDepartamentos);
router.post('/departamentos', onlyAdmin, createDepartamento);
router.put('/departamentos/:id', onlyAdmin, updateDepartamento);
router.delete('/departamentos/:id', onlyAdmin, deleteDepartamento);

// ─────────────────────────────────────────
// SERVICIOS FACTURABLES (CUPS)
// ─────────────────────────────────────────
router.get('/servicios', getServicios);
router.post('/servicios', onlyAdmin, createServicio);
router.put('/servicios/:id', onlyAdmin, updateServicio);
router.delete('/servicios/:id', onlyAdmin, deleteServicio);

// ─────────────────────────────────────────
// TIPOS DE CONSULTA
// ─────────────────────────────────────────
router.get('/tipos-consulta', getTiposConsulta);
router.get('/tipos-consulta/:id', getTipoConsultaById);
router.post('/tipos-consulta', onlyAdmin, createTipoConsulta);
router.put('/tipos-consulta/:id', onlyAdmin, updateTipoConsulta);
router.delete('/tipos-consulta/:id', onlyAdmin, deleteTipoConsulta);

// ─────────────────────────────────────────
// CONFIG SERVICIOS POR CONSULTA
// ─────────────────────────────────────────
router.get('/tipos-consulta/:tipoConsultaId/servicios', getConfigServicios);
router.post('/tipos-consulta/:tipoConsultaId/servicios', onlyAdmin, addServicioAConsulta);
router.delete('/config-servicios/:id', onlyAdmin, removeServicioDeConsulta);

// ─────────────────────────────────────────
// REGLAS OPERATIVAS
// ─────────────────────────────────────────
router.get('/departamentos/:departamentoId/reglas', getReglasOperativas);
router.post('/departamentos/:departamentoId/reglas', onlyAdmin, upsertReglaOperativa);

// ─────────────────────────────────────────
// PREPARACIONES
// ─────────────────────────────────────────
router.get('/preparaciones', getPreparaciones);
router.post('/preparaciones', onlyAdmin, createPreparacion);
router.put('/preparaciones/:id', onlyAdmin, updatePreparacion);
router.delete('/preparaciones/:id', onlyAdmin, deletePreparacion);

export default router;
