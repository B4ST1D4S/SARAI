import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getLeads, getStats, createLead, updateLead, deleteLead, syncLeads } from '../controllers/crmController.js';

const router = Router();

router.use(authenticateToken);

router.get('/stats',    getStats);
router.get('/leads',    getLeads);
router.post('/leads',   createLead);
router.post('/sync',    syncLeads);
router.put('/leads/:id',    updateLead);
router.delete('/leads/:id', deleteLead);

export default router;
