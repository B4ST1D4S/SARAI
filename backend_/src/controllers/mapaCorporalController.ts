import { Request, Response } from 'express';
import {
  saveMapaCorporal,
  getMapaCorporalByProcedimiento,
  getMapaCorporalPorPaciente,
  updateMapaCorporal,
  deleteMapaCorporal,
} from '../services/mapaCorporalService.js';

/**
 * Guardar/actualizar mapa corporal
 * POST /api/mapa-corporal
 */
export async function save(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const {
      pacienteId,
      procedimientoId,
      zonasMarcadas,
      edemaZonas,
      fibrosisZonas,
      dolorZonas,
      anotacionesClinics,
    } = req.body;

    if (!pacienteId || !zonasMarcadas) {
      res.status(400).json({
        error: 'Datos incompletos: pacienteId y zonasMarcadas son requeridos',
      });
      return;
    }

    const mapaCorporal = await saveMapaCorporal({
      pacienteId,
      procedimientoId,
      medicoId: req.user.userId,
      zonasMarcadas,
      edemaZonas: edemaZonas || [],
      fibrosisZonas: fibrosisZonas || [],
      dolorZonas: dolorZonas || [],
      anotacionesClinics: anotacionesClinics || '',
    });

    res.status(201).json({
      success: true,
      message: 'Mapa corporal guardado exitosamente',
      data: mapaCorporal,
    });
  } catch (error: any) {
    console.error('Error en save:', error);
    res.status(500).json({ error: error.message || 'Error al guardar mapa corporal' });
  }
}

/**
 * Obtener mapa corporal por procedimiento
 * GET /api/mapa-corporal/procedimiento/:procedimientoId/:pacienteId
 */
export async function getByProcedimiento(req: Request, res: Response): Promise<void> {
  try {
    const { procedimientoId, pacienteId } = req.params;

    if (!procedimientoId || !pacienteId) {
      res.status(400).json({
        error: 'procedimientoId y pacienteId son requeridos',
      });
      return;
    }

    const mapaCorporal = await getMapaCorporalByProcedimiento(
      procedimientoId,
      pacienteId
    );

    if (!mapaCorporal) {
      res.status(404).json({ error: 'Mapa corporal no encontrado' });
      return;
    }

    res.json(mapaCorporal);
  } catch (error: any) {
    console.error('Error en getByProcedimiento:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener mapa corporal',
    });
  }
}

/**
 * Obtener mapas corporales de un paciente
 * GET /api/mapa-corporal/paciente/:pacienteId
 */
export async function getByPaciente(req: Request, res: Response): Promise<void> {
  try {
    const { pacienteId } = req.params;

    if (!pacienteId) {
      res.status(400).json({ error: 'pacienteId es requerido' });
      return;
    }

    const mapas = await getMapaCorporalPorPaciente(pacienteId);

    res.json({
      total: mapas.length,
      data: mapas,
    });
  } catch (error: any) {
    console.error('Error en getByPaciente:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener mapas corporales',
    });
  }
}

/**
 * Actualizar mapa corporal
 * PUT /api/mapa-corporal/:id
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { id } = req.params;
    const {
      zonasMarcadas,
      edemaZonas,
      fibrosisZonas,
      dolorZonas,
      anotacionesClinics,
    } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    if (!zonasMarcadas) {
      res.status(400).json({ error: 'zonasMarcadas es requerido' });
      return;
    }

    const updated = await updateMapaCorporal(id, {
      zonasMarcadas,
      edemaZonas: edemaZonas || [],
      fibrosisZonas: fibrosisZonas || [],
      dolorZonas: dolorZonas || [],
      anotacionesClinics: anotacionesClinics || '',
    });

    res.json({
      success: true,
      message: 'Mapa corporal actualizado exitosamente',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error en update:', error);
    res.status(500).json({
      error: error.message || 'Error al actualizar mapa corporal',
    });
  }
}

/**
 * Eliminar mapa corporal
 * DELETE /api/mapa-corporal/:id
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const result = await deleteMapaCorporal(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error en remove:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar mapa corporal',
    });
  }
}
