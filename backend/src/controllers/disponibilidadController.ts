import { Request, Response } from 'express';
import {
  getDisponibilidadMedico,
  createDisponibilidad,
  updateDisponibilidad,
  deleteDisponibilidad,
  getBloqueos,
  createBloqueo,
  deleteBloqueo,
  getSlotsDisponibles,
} from '../services/disponibilidadService.js';

// GET /api/disponibilidad/medico/:medicoId
export async function getMedicoDisponibilidad(req: Request, res: Response): Promise<void> {
  try {
    const { medicoId } = req.params;
    const disponibilidades = await getDisponibilidadMedico(medicoId);
    res.json({ success: true, disponibilidades });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/disponibilidad
export async function postDisponibilidad(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const d = await createDisponibilidad({ ...req.body, medicoId: req.user.userId });
    res.status(201).json({ success: true, disponibilidad: d });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// PUT /api/disponibilidad/:id
export async function putDisponibilidad(req: Request, res: Response): Promise<void> {
  try {
    const d = await updateDisponibilidad(req.params.id, req.body);
    res.json({ success: true, disponibilidad: d });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/disponibilidad/:id
export async function deleteDisponibilidadCtrl(req: Request, res: Response): Promise<void> {
  try {
    await deleteDisponibilidad(req.params.id);
    res.json({ success: true, message: 'Disponibilidad desactivada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/disponibilidad/slots?medicoId=X&fecha=YYYY-MM-DD
export async function getSlots(req: Request, res: Response): Promise<void> {
  try {
    const { medicoId, fecha } = req.query as { medicoId: string; fecha: string };
    if (!medicoId || !fecha) {
      res.status(400).json({ error: 'medicoId y fecha son requeridos' });
      return;
    }
    const slots = await getSlotsDisponibles(medicoId, fecha);
    res.json({ success: true, slots });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/disponibilidad/bloqueos/medico/:medicoId
export async function getBloqueosMedico(req: Request, res: Response): Promise<void> {
  try {
    const bloqueos = await getBloqueos(req.params.medicoId);
    res.json({ success: true, bloqueos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/disponibilidad/bloqueos
export async function postBloqueo(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const b = await createBloqueo({ ...req.body, medicoId: req.user.userId });
    res.status(201).json({ success: true, bloqueo: b });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// DELETE /api/disponibilidad/bloqueos/:id
export async function deleteBloqueoCtrl(req: Request, res: Response): Promise<void> {
  try {
    await deleteBloqueo(req.params.id);
    res.json({ success: true, message: 'Bloqueo eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
