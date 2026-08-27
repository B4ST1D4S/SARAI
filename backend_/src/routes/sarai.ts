import { Router } from 'express';
import { procesarVoz, procesarAudio } from '../controllers/saraiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// POST /api/sarai/procesar-voz  (texto)
router.post('/procesar-voz', procesarVoz);

// POST /api/sarai/procesar-audio  (audio base64 → Gemini transcribe + extrae campos)
router.post('/procesar-audio', procesarAudio);

export default router;
