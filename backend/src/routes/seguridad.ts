import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import {
  // Empresas
  getEmpresas, createEmpresa, updateEmpresa,
  // Sedes
  getSedes, createSede, updateSede,
  // Perfiles
  getPerfiles, createPerfil, updatePerfil, deletePerfil,
  // Roles IAM
  getIamRoles, createIamRol, updateIamRol,
  // Grupos
  getGrupos, createGrupo, addUsuarioGrupo,
  // Recursos
  getRecursos, seedRecursosSistema,
  // Permisos
  getPermisos, setPermiso, deletePermiso, checkPermiso, getMyPermissions,
  // Políticas
  getPoliticas, createPolitica, updatePolitica,
  // Sesiones
  getSesiones, revocarSesion,
  // Delegaciones
  getDelegaciones, createDelegacion, revokeDelegacion,
  // Auditoría
  getAuditAccesos, getEventosSeguridad, resolverEvento,
  // Dashboard
  getDashboardIam,
} from '../controllers/iamController.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Roles con acceso de administración IAM
const IAM_ADMIN = ['SUPER_ADMIN', 'MEDICO'] as const;

// ── Dashboard ─────────────────────────────────────────
router.get('/dashboard', getDashboardIam);

// ── Empresas ──────────────────────────────────────────
router.get('/empresas',         authorizeRole(...IAM_ADMIN), getEmpresas);
router.post('/empresas',        authorizeRole(...IAM_ADMIN), createEmpresa);
router.put('/empresas/:id',     authorizeRole(...IAM_ADMIN), updateEmpresa);

// ── Sedes ─────────────────────────────────────────────
router.get('/sedes',            authorizeRole(...IAM_ADMIN), getSedes);
router.post('/sedes',           authorizeRole(...IAM_ADMIN), createSede);
router.put('/sedes/:id',        authorizeRole(...IAM_ADMIN), updateSede);

// ── Perfiles ──────────────────────────────────────────
router.get('/perfiles',         authorizeRole(...IAM_ADMIN), getPerfiles);
router.post('/perfiles',        authorizeRole(...IAM_ADMIN), createPerfil);
router.put('/perfiles/:id',     authorizeRole(...IAM_ADMIN), updatePerfil);
router.delete('/perfiles/:id',  authorizeRole(...IAM_ADMIN), deletePerfil);

// ── Roles IAM ─────────────────────────────────────────
router.get('/roles',            authorizeRole(...IAM_ADMIN), getIamRoles);
router.post('/roles',           authorizeRole(...IAM_ADMIN), createIamRol);
router.put('/roles/:id',        authorizeRole(...IAM_ADMIN), updateIamRol);

// ── Grupos ────────────────────────────────────────────
router.get('/grupos',           authorizeRole(...IAM_ADMIN), getGrupos);
router.post('/grupos',          authorizeRole(...IAM_ADMIN), createGrupo);
router.post('/grupos/:grupoId/usuarios', authorizeRole(...IAM_ADMIN), addUsuarioGrupo);

// ── Recursos del sistema ──────────────────────────────
router.get('/recursos',         getRecursos);
router.post('/recursos/seed',   authorizeRole(...IAM_ADMIN), seedRecursosSistema);

// ── Permisos ──────────────────────────────────────────
router.get('/permisos',         authorizeRole(...IAM_ADMIN), getPermisos);
router.post('/permisos',        authorizeRole(...IAM_ADMIN), setPermiso);
router.delete('/permisos/:id',  authorizeRole(...IAM_ADMIN), deletePermiso);
router.post('/permisos/check',  checkPermiso);       // cualquier usuario autenticado
router.get('/permisos/mine',    getMyPermissions);   // cualquier usuario autenticado

// ── Políticas de seguridad ────────────────────────────
router.get('/politicas',        authorizeRole(...IAM_ADMIN), getPoliticas);
router.post('/politicas',       authorizeRole(...IAM_ADMIN), createPolitica);
router.put('/politicas/:id',    authorizeRole(...IAM_ADMIN), updatePolitica);

// ── Sesiones activas ──────────────────────────────────
router.get('/sesiones',         authorizeRole(...IAM_ADMIN), getSesiones);
router.delete('/sesiones/:id',  authorizeRole(...IAM_ADMIN), revocarSesion);

// ── Delegaciones temporales ───────────────────────────
router.get('/delegaciones',     getDelegaciones);
router.post('/delegaciones',    createDelegacion);
router.delete('/delegaciones/:id', revokeDelegacion);

// ── Auditoría ─────────────────────────────────────────
router.get('/auditoria/accesos',  authorizeRole(...IAM_ADMIN), getAuditAccesos);
router.get('/auditoria/eventos',  authorizeRole(...IAM_ADMIN), getEventosSeguridad);
router.put('/auditoria/eventos/:id/resolver', authorizeRole(...IAM_ADMIN), resolverEvento);

export default router;
