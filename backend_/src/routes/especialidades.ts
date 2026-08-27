import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/especialidades — listar activas (requiere sesión)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const especialidades = await prisma.especialidad.findMany({
      where: { estado: true },
      select: { id: true, codigo: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(especialidades);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener especialidades' });
  }
});

export default router;
