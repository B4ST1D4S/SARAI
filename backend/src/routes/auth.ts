import { Router } from 'express';
import { login, register, me } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateTestToken } from '../utils/jwt.js';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/me
router.get('/me', authenticateToken, me);

// GET /api/auth/test-token (SOLO DESARROLLO)
router.get('/test-token', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({ error: 'No disponible en producción' });
    return;
  }
  const token = generateTestToken();
  res.json({ 
    token,
    user: {
      userId: 'test-user-123',
      email: 'test@estegia.com',
      rol: 'MEDICO'
    }
  });
});

export default router;
