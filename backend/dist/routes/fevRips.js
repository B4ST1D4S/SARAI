import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/fevRipsController.js';
const router = Router();
router.use(authenticateToken);
// Usuarios SISPRO (credenciales de prueba para LoginSISPRO)
router.get('/usuarios-sispro', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.listUsuariosSispro);
router.post('/usuarios-sispro', authorizeRole('SUPER_ADMIN'), ctrl.createUsuarioSispro);
router.put('/usuarios-sispro/:id', authorizeRole('SUPER_ADMIN'), ctrl.updateUsuarioSispro);
router.delete('/usuarios-sispro/:id', authorizeRole('SUPER_ADMIN'), ctrl.deleteUsuarioSispro);
// RIPS de prueba (payloads guardados en SARAI, listos para reenviar)
router.get('/rips-pruebas', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.listRipsPruebas);
router.get('/rips-pruebas/:id', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.getRipsPrueba);
router.post('/rips-pruebas', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.createRipsPrueba);
router.delete('/rips-pruebas/:id', authorizeRole('SUPER_ADMIN'), ctrl.deleteRipsPrueba);
// ── Envío a ambiente de PRUEBAS (stage-fevrips.sispro.gov.co) ──────────────
router.post('/stage/login', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.login);
router.post('/stage/enviar/:ripsPruebaId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.enviar);
router.post('/stage/recuperar-cuv', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.recuperarCuv);
router.post('/stage/consultar-cuv', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.consultarCuv);
// ── Envío a ambiente de PRODUCCIÓN (fevrips.sispro.gov.co) ─────────────────
// Restringido a SUPER_ADMIN: un envío aquí es real ante el Ministerio.
router.post('/produccion/login', authorizeRole('SUPER_ADMIN'), ctrl.login);
router.post('/produccion/enviar/:ripsPruebaId', authorizeRole('SUPER_ADMIN'), ctrl.enviar);
router.post('/produccion/recuperar-cuv', authorizeRole('SUPER_ADMIN'), ctrl.recuperarCuv);
router.post('/produccion/consultar-cuv', authorizeRole('SUPER_ADMIN'), ctrl.consultarCuv);
export default router;
