import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/programasEspeciales/hemodialisisController.js';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authenticateToken);

// ── Dashboard ────────────────────────────────────────────────
// GET /api/programas-especiales/renal/dashboard
router.get('/renal/dashboard', ctrl.getDashboard);

// ── Máquinas de Diálisis ─────────────────────────────────────
// GET  /api/programas-especiales/renal/maquinas
// POST /api/programas-especiales/renal/maquinas
router.get('/renal/maquinas', ctrl.getMaquinas);
router.post(
  '/renal/maquinas',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postMaquina
);
router.patch(
  '/renal/maquinas/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'),
  ctrl.patchMaquina
);

// ── Inscripciones al Programa Renal ──────────────────────────
// GET  /api/programas-especiales/renal/inscripciones
// POST /api/programas-especiales/renal/inscripciones
router.get('/renal/inscripciones', ctrl.getInscripciones);
router.post(
  '/renal/inscripciones',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postInscripcion
);

// GET   /api/programas-especiales/renal/inscripciones/:id
// PATCH /api/programas-especiales/renal/inscripciones/:id
router.get('/renal/inscripciones/:id', ctrl.getInscripcion);
router.patch(
  '/renal/inscripciones/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.patchInscripcion
);

// ── Historia Clínica Renal ───────────────────────────────────
// GET   /api/programas-especiales/renal/inscripciones/:inscripcionId/historia
// PATCH /api/programas-especiales/renal/inscripciones/:inscripcionId/historia
router.get('/renal/inscripciones/:inscripcionId/historia', ctrl.getHistoriaRenal);
router.patch(
  '/renal/inscripciones/:inscripcionId/historia',
  authorizeRole('SUPER_ADMIN', 'MEDICO'),
  ctrl.patchHistoriaRenal
);

// ── Accesos Vasculares ───────────────────────────────────────
// GET  /api/programas-especiales/renal/inscripciones/:inscripcionId/accesos
// POST /api/programas-especiales/renal/inscripciones/:inscripcionId/accesos
router.get('/renal/inscripciones/:inscripcionId/accesos', ctrl.getAccesos);
router.post(
  '/renal/inscripciones/:inscripcionId/accesos',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postAcceso
);
router.patch(
  '/renal/accesos/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.patchAcceso
);

// ── Sesiones de Hemodiálisis ─────────────────────────────────
// GET  /api/programas-especiales/renal/inscripciones/:inscripcionId/sesiones
// POST /api/programas-especiales/renal/inscripciones/:inscripcionId/sesiones
router.get('/renal/inscripciones/:inscripcionId/sesiones', ctrl.getSesiones);
router.post(
  '/renal/inscripciones/:inscripcionId/sesiones',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postSesion
);

// GET   /api/programas-especiales/renal/sesiones/:id
// PATCH /api/programas-especiales/renal/sesiones/:id
router.get('/renal/sesiones/:id', ctrl.getSesion);
router.patch(
  '/renal/sesiones/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.patchSesion
);

// ── Laboratorios Renales ─────────────────────────────────────
// GET  /api/programas-especiales/renal/inscripciones/:inscripcionId/laboratorios
// POST /api/programas-especiales/renal/inscripciones/:inscripcionId/laboratorios
router.get('/renal/inscripciones/:inscripcionId/laboratorios', ctrl.getLaboratorios);
router.post(
  '/renal/inscripciones/:inscripcionId/laboratorios',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postLaboratorio
);
router.patch(
  '/renal/laboratorios/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.patchLaboratorio
);

// ── Eventos Adversos ─────────────────────────────────────────
router.get('/renal/inscripciones/:inscripcionId/eventos', ctrl.getEventos);
router.post(
  '/renal/inscripciones/:inscripcionId/eventos',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postEvento
);

// ── Evoluciones Multidisciplinarias ─────────────────────────
router.get('/renal/inscripciones/:inscripcionId/evoluciones', ctrl.getEvoluciones);
router.post(
  '/renal/inscripciones/:inscripcionId/evoluciones',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postEvolucion
);

// ── Tamizajes ─────────────────────────────────────────────────
router.get('/renal/inscripciones/:inscripcionId/tamizajes', ctrl.getTamizajes);
router.patch(
  '/renal/tamizajes/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.patchTamizaje
);

// ── HD-02: Turnos de Hemodiálisis ────────────────────────────
// GET  /api/programas-especiales/renal/turnos          — lista todos
// POST /api/programas-especiales/renal/turnos          — asignar/actualizar turno
// GET  /api/programas-especiales/renal/contadores-dia  — contadores del día
// GET  /api/programas-especiales/renal/inscripciones/:inscripcionId/turno
// DELETE /api/programas-especiales/renal/turnos/:inscripcionId
router.get('/renal/turnos', ctrl.getTurnos);
router.post(
  '/renal/turnos',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postTurno
);
router.get('/renal/contadores-dia', ctrl.getContadoresDia);
router.get('/renal/inscripciones/:inscripcionId/turno', ctrl.getTurnoByInscripcion);
router.delete(
  '/renal/turnos/:inscripcionId',
  authorizeRole('SUPER_ADMIN', 'MEDICO'),
  ctrl.deleteTurno
);

// ── P3: Serología ─────────────────────────────────────────────
// GET  /api/programas-especiales/renal/inscripciones/:inscripcionId/serologia
// POST /api/programas-especiales/renal/inscripciones/:inscripcionId/serologia
router.get('/renal/inscripciones/:inscripcionId/serologia', ctrl.getSerologia);
router.post(
  '/renal/inscripciones/:inscripcionId/serologia',
  authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR'),
  ctrl.postSerologia
);

// ── Parametrización HD (sillones, esquemas, jornadas) ─────────
// GET /api/programas-especiales/renal/parametrizacion
// PUT /api/programas-especiales/renal/parametrizacion
router.get('/renal/parametrizacion', ctrl.getParametrizacion);
router.put(
  '/renal/parametrizacion',
  authorizeRole('SUPER_ADMIN', 'MEDICO'),
  ctrl.putParametrizacion
);

// Sillones
router.post('/renal/parametrizacion/sillones',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.postSillon);
router.patch('/renal/parametrizacion/sillones/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.patchSillon);
router.delete('/renal/parametrizacion/sillones/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.deleteSillon);

// Esquemas de turno
router.post('/renal/parametrizacion/esquemas',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.postEsquema);
router.patch('/renal/parametrizacion/esquemas/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.patchEsquema);
router.delete('/renal/parametrizacion/esquemas/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.deleteEsquema);

// Jornadas
router.post('/renal/parametrizacion/jornadas',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.postJornada);
router.patch('/renal/parametrizacion/jornadas/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.patchJornada);
router.delete('/renal/parametrizacion/jornadas/:id',
  authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.deleteJornada);

export default router;
