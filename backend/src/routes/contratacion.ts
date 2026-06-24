import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/contratacionController.js';

const router = Router();
router.use(authenticateToken);

// Stats
router.get('/stats', ctrl.getStats);

// Empresas
router.get('/empresas', ctrl.listEmpresas);
router.post('/empresas', authorizeRole('ADMIN', 'MEDICO'), ctrl.createEmpresa);
router.get('/empresas/:id', ctrl.getEmpresa);
router.put('/empresas/:id', authorizeRole('ADMIN', 'MEDICO'), ctrl.updateEmpresa);

// Contratos
router.get('/', ctrl.listContratos);
router.post('/', authorizeRole('ADMIN', 'MEDICO'), ctrl.createContrato);
router.get('/:id', ctrl.getContrato);
router.put('/:id', authorizeRole('ADMIN', 'MEDICO'), ctrl.updateContrato);
router.patch('/:id/estado', authorizeRole('ADMIN', 'MEDICO'), ctrl.cambiarEstado);

// Tarifas del contrato
router.post('/:id/tarifas', authorizeRole('ADMIN', 'MEDICO'), ctrl.upsertTarifa);
router.delete('/:id/tarifas/:tarifaId', authorizeRole('ADMIN', 'MEDICO'), ctrl.deleteTarifa);

// Paquetes del contrato
router.post('/:id/paquetes', authorizeRole('ADMIN', 'MEDICO'), ctrl.createPaquete);
router.put('/:id/paquetes/:paqueteId', authorizeRole('ADMIN', 'MEDICO'), ctrl.updatePaquete);
router.delete('/:id/paquetes/:paqueteId', authorizeRole('ADMIN', 'MEDICO'), ctrl.deletePaquete);

// Beneficiarios del contrato
router.get('/:id/beneficiarios', ctrl.listBeneficiarios);
router.post('/:id/beneficiarios', authorizeRole('ADMIN', 'MEDICO', 'RECEPCIONISTA'), ctrl.addBeneficiario);
router.put('/:id/beneficiarios/:benefId', authorizeRole('ADMIN', 'MEDICO'), ctrl.updateBeneficiario);
router.delete('/:id/beneficiarios/:benefId', authorizeRole('ADMIN', 'MEDICO'), ctrl.removeBeneficiario);

export default router;
