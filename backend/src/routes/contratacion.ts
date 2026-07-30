import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/contratacionController.js';

const router = Router();
router.use(authenticateToken);

// Stats
router.get('/stats', ctrl.getStats);

// Empresas
router.get('/empresas', ctrl.listEmpresas);
router.post('/empresas', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.createEmpresa);
router.get('/empresas/:id', ctrl.getEmpresa);
router.put('/empresas/:id', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.updateEmpresa);

// Contratos
router.get('/', ctrl.listContratos);
router.post('/', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.createContrato);
router.get('/:id', ctrl.getContrato);
router.put('/:id', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.updateContrato);
router.patch('/:id/estado', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.cambiarEstado);

// Tarifas del contrato
router.post('/:id/tarifas', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.upsertTarifa);
router.delete('/:id/tarifas/:tarifaId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.deleteTarifa);

// Excepciones del contrato (rangos por tipo de afiliado, copagos/cuotas moderadoras)
router.get('/:id/excepciones', ctrl.listExcepciones);
router.post('/:id/excepciones', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.createExcepcion);
router.delete('/:id/excepciones/:excepcionId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.deleteExcepcion);

// Clonar contrato (copia tarifas, paquetes y excepciones como plantilla)
router.post('/:id/clonar', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.clonarContrato);

// Paquetes del contrato
router.post('/:id/paquetes', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.createPaquete);
router.put('/:id/paquetes/:paqueteId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.updatePaquete);
router.delete('/:id/paquetes/:paqueteId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.deletePaquete);

// Beneficiarios del contrato
router.get('/:id/beneficiarios', ctrl.listBeneficiarios);
router.post('/:id/beneficiarios', authorizeRole('SUPER_ADMIN', 'MEDICO', 'RECEPCIONISTA'), ctrl.addBeneficiario);
router.put('/:id/beneficiarios/:benefId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.updateBeneficiario);
router.delete('/:id/beneficiarios/:benefId', authorizeRole('SUPER_ADMIN', 'MEDICO'), ctrl.removeBeneficiario);

export default router;
