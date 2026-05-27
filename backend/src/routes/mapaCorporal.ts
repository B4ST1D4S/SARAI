import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────────
// POST /api/mapa-corporal  →  upsert: actualiza el más reciente del
// paciente (o del procedimiento si viene) o crea uno nuevo.
// ─────────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      pacienteId,
      procedimientoId,
      zonasMarcadas,
      edemaZonas = [],
      fibrosisZonas = [],
      dolorZonas = [],
      anotacionesClinics,
    } = req.body;

    if (!pacienteId) {
      res.status(400).json({ error: 'pacienteId es requerido' });
      return;
    }

    // Buscar el mapa más reciente del paciente (con o sin procedimiento)
    const whereClause: any = { pacienteId };
    if (procedimientoId) whereClause.procedimientoId = procedimientoId;

    const existing = await prisma.mapaCorporal.findFirst({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
    });

    let mapa;
    if (existing) {
      mapa = await prisma.mapaCorporal.update({
        where: { id: existing.id },
        data: {
          zonasMarcadas,
          edemaZonas,
          fibrosisZonas,
          dolorZonas,
          anotacionesClinics: anotacionesClinics ?? existing.anotacionesClinics,
          fechaEvaluacion: new Date(),
          evaluadoPor: userId,
          ...(procedimientoId ? { procedimientoId } : {}),
        },
      });
    } else {
      mapa = await prisma.mapaCorporal.create({
        data: {
          pacienteId,
          procedimientoId: procedimientoId || null,
          zonasMarcadas,
          edemaZonas,
          fibrosisZonas,
          dolorZonas,
          anotacionesClinics: anotacionesClinics ?? null,
          fechaEvaluacion: new Date(),
          evaluadoPor: userId,
        },
      });
    }

    res.json({ success: true, message: 'Mapa corporal guardado', data: mapa });
  } catch (error: any) {
    console.error('Error guardando mapa corporal:', error);
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/mapa-corporal/paciente/:pacienteId  →  historial completo
// ─────────────────────────────────────────────────────────────────
router.get('/paciente/:pacienteId', async (req: Request, res: Response) => {
  try {
    const { pacienteId } = req.params;

    const mapas = await prisma.mapaCorporal.findMany({
      where: { pacienteId },
      orderBy: { updatedAt: 'desc' },
      include: {
        procedimiento: { select: { nombreProcedimiento: true, tipoProcedimiento: true } },
      },
    });

    res.json({ success: true, data: mapas });
  } catch (error: any) {
    console.error('Error obteniendo mapas:', error);
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/mapa-corporal/procedimiento/:procedimientoId/:pacienteId
// ─────────────────────────────────────────────────────────────────
router.get('/procedimiento/:procedimientoId/:pacienteId', async (req: Request, res: Response) => {
  try {
    const { procedimientoId, pacienteId } = req.params;

    const mapa = await prisma.mapaCorporal.findFirst({
      where: { procedimientoId, pacienteId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!mapa) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }

    res.json({ success: true, data: mapa });
  } catch (error: any) {
    console.error('Error obteniendo mapa:', error);
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/mapa-corporal/:id  →  por ID
// ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const mapa = await prisma.mapaCorporal.findUnique({ where: { id: req.params.id } });
    if (!mapa) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    res.json({ success: true, data: mapa });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/mapa-corporal/:id  →  actualizar por ID
// ─────────────────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { zonasMarcadas, edemaZonas, fibrosisZonas, dolorZonas, anotacionesClinics } = req.body;

    const mapa = await prisma.mapaCorporal.update({
      where: { id: req.params.id },
      data: {
        ...(zonasMarcadas !== undefined && { zonasMarcadas }),
        ...(edemaZonas !== undefined && { edemaZonas }),
        ...(fibrosisZonas !== undefined && { fibrosisZonas }),
        ...(dolorZonas !== undefined && { dolorZonas }),
        ...(anotacionesClinics !== undefined && { anotacionesClinics }),
        fechaEvaluacion: new Date(),
        evaluadoPor: req.user!.id,
      },
    });

    res.json({ success: true, message: 'Mapa actualizado', data: mapa });
  } catch (error: any) {
    console.error('Error actualizando mapa:', error);
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/mapa-corporal/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.mapaCorporal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Mapa eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

export default router;
