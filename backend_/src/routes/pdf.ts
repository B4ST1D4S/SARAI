import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { descargarHCPdf, descargarOrdenesPdf } from '../controllers/pdfController.js';

const router = Router();

// GET /api/pdf/historia-clinica/:id  → descarga PDF de Historia Clínica
router.get('/historia-clinica/:id', authenticateToken, descargarHCPdf);

// GET /api/pdf/ordenes/:id  → descarga PDF de Órdenes Médicas
router.get('/ordenes/:id', authenticateToken, descargarOrdenesPdf);

export default router;
