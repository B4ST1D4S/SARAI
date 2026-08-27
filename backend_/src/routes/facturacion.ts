import { Router } from 'express';
import {
  getIngresos,
  getIngresoById,
  createIngreso,
  getCuentaById,
  addCuentaItem,
  updateCuentaItem,
  deleteCuentaItem,
  buscarCargos,
  facturarCuenta,
  validarRips,
  getFacturas,
  getFacturaById,
  anularFactura,
  getResumen,
} from '../controllers/facturacionController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

const onlyStaff = authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR', 'RECEPCIONISTA');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Resumen / KPIs
router.get('/resumen', getResumen);

// Búsqueda de cargos facturables
router.get('/cargos', buscarCargos);

// Ingresos
router.get('/ingresos', getIngresos);
router.get('/ingresos/:id', getIngresoById);
router.post('/ingresos', onlyStaff, createIngreso);

// Cuentas
router.get('/cuentas/:id', getCuentaById);
router.post('/cuentas/:id/items', onlyStaff, addCuentaItem);
router.put('/cuentas/:id/items/:itemId', onlyStaff, updateCuentaItem);
router.delete('/cuentas/:id/items/:itemId', onlyStaff, deleteCuentaItem);
router.get('/cuentas/:id/validar-rips', onlyStaff, validarRips);
router.post('/cuentas/:id/facturar', onlyStaff, facturarCuenta);

// Facturas
router.get('/facturas', getFacturas);
router.get('/facturas/:id', getFacturaById);
router.post('/facturas/:id/anular', onlyStaff, anularFactura);

export default router;
