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

// ── Dashboard ─────────────────────────────────────────
router.get('/dashboard', getDashboardIam);

// ── Empresas ──────────────────────────────────────────
router.get('/empresas',         authorizeRole('SUPER_ADMIN'), getEmpresas);
router.post('/empresas',        authorizeRole('SUPER_ADMIN'), createEmpresa);
router.put('/empresas/:id',     authorizeRole('SUPER_ADMIN'), updateEmpresa);

// ── Sedes ─────────────────────────────────────────────
router.get('/sedes',            authorizeRole('SUPER_ADMIN', 'MEDICO'), getSedes);
router.post('/sedes',           authorizeRole('SUPER_ADMIN'), createSede);
router.put('/sedes/:id',        authorizeRole('SUPER_ADMIN'), updateSede);

// ── Perfiles ──────────────────────────────────────────
router.get('/perfiles',         authorizeRole('SUPER_ADMIN'), getPerfiles);
router.post('/perfiles',        authorizeRole('SUPER_ADMIN'), createPerfil);
router.put('/perfiles/:id',     authorizeRole('SUPER_ADMIN'), updatePerfil);
router.delete('/perfiles/:id',  authorizeRole('SUPER_ADMIN'), deletePerfil);

// ── Roles IAM ─────────────────────────────────────────
router.get('/roles',            authorizeRole('SUPER_ADMIN'), getIamRoles);
router.post('/roles',           authorizeRole('SUPER_ADMIN'), createIamRol);
router.put('/roles/:id',        authorizeRole('SUPER_ADMIN'), updateIamRol);

// ── Grupos ────────────────────────────────────────────
router.get('/grupos',           authorizeRole('SUPER_ADMIN'), getGrupos);
router.post('/grupos',          authorizeRole('SUPER_ADMIN'), createGrupo);
router.post('/grupos/:grupoId/usuarios', authorizeRole('SUPER_ADMIN'), addUsuarioGrupo);

// ── Recursos del sistema ──────────────────────────────
router.get('/recursos',         getRecursos);
router.post('/recursos/seed',   authorizeRole('SUPER_ADMIN'), seedRecursosSistema);

// ── Permisos ──────────────────────────────────────────
router.get('/permisos',         authorizeRole('SUPER_ADMIN'), getPermisos);
router.post('/permisos',        authorizeRole('SUPER_ADMIN'), setPermiso);
router.delete('/permisos/:id',  authorizeRole('SUPER_ADMIN'), deletePermiso);
router.post('/permisos/check',  checkPermiso);          // Any authenticated user
router.get('/permisos/mine',    getMyPermissions);      // Any authenticated user

// ── Políticas de seguridad ────────────────────────────
router.get('/politicas',        authorizeRole('SUPER_ADMIN'), getPoliticas);
router.post('/politicas',       authorizeRole('SUPER_ADMIN'), createPolitica);
router.put('/politicas/:id',    authorizeRole('SUPER_ADMIN'), updatePolitica);

// ── Sesiones activas ──────────────────────────────────
router.get('/sesiones',         authorizeRole('SUPER_ADMIN'), getSesiones);
router.delete('/sesiones/:id',  authorizeRole('SUPER_ADMIN'), revocarSesion);

// ── Delegaciones temporales ───────────────────────────
router.get('/delegaciones',     getDelegaciones);
router.post('/delegaciones',    createDelegacion);
router.delete('/delegaciones/:id', revokeDelegacion);

// ── Auditoría ─────────────────────────────────────────
router.get('/auditoria/accesos',  authorizeRole('SUPER_ADMIN'), getAuditAccesos);
router.get('/auditoria/eventos',  authorizeRole('SUPER_ADMIN'), getEventosSeguridad);
router.put('/auditoria/eventos/:id/resolver', authorizeRole('SUPER_ADMIN'), resolverEvento);

export default router;
