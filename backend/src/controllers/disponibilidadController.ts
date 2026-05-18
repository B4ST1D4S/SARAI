import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  getDisponibilidadMedico,
  createDisponibilidad,
  updateDisponibilidad,
  deleteDisponibilidad,
  getBloqueos,
  createBloqueo,
  deleteBloqueo,
  getSlotsDisponibles,
  getDisponibilidadesConCitas,
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
// Si se envía medicoId en el body se usa ese; si no, se usa el del usuario autenticado
export async function postDisponibilidad(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const medicoId = req.body.medicoId || req.user.userId;
    const d = await createDisponibilidad({ ...req.body, medicoId });
    res.status(201).json({ success: true, disponibilidad: d });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// GET /api/disponibilidad/medicos-list — todos los médicos activos con su especialidad
export async function getMedicosList(req: Request, res: Response): Promise<void> {
  try {
    const medicos = await prisma.user.findMany({
      where: { rol: 'MEDICO', activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        especialidad: true,
        registroMedico: true,
        email: true,
        numeroDocumento: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
    res.json({ success: true, medicos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/disponibilidad/tipos-consulta/:medicoId — tipos de consulta por especialidad del médico
export async function getTiposConsultaMedico(req: Request, res: Response): Promise<void> {
  try {
    const { medicoId } = req.params;
    const medico = await prisma.user.findUnique({
      where: { id: medicoId },
      select: { especialidad: true },
    });
    if (!medico) { res.status(404).json({ error: 'Médico no encontrado' }); return; }

    let tiposConsulta: any[] = [];

    if (medico.especialidad) {
      // Buscar especialidad por nombre para obtener su id
      const especialidad = await prisma.especialidad.findFirst({
        where: { nombre: { equals: medico.especialidad, mode: 'insensitive' }, estado: true },
        select: { id: true, nombre: true },
      });

      if (especialidad) {
        tiposConsulta = await prisma.tipoConsulta.findMany({
          where: { especialidadId: especialidad.id, estado: true, permiteAgendamiento: true },
          select: { id: true, nombre: true, duracionMinutos: true, clasificacion: true },
          orderBy: { nombre: 'asc' },
        });
      }
    }

    // Si no hay tipos por especialidad, retornar los generales (sin especialidad asignada)
    if (tiposConsulta.length === 0) {
      tiposConsulta = await prisma.tipoConsulta.findMany({
        where: { especialidadId: null, estado: true, permiteAgendamiento: true },
        select: { id: true, nombre: true, duracionMinutos: true, clasificacion: true },
        orderBy: { nombre: 'asc' },
      });
    }

    res.json({ success: true, tiposConsulta, especialidadMedico: medico.especialidad });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    const status = error.message?.startsWith('No se puede eliminar') ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
}

// GET /api/disponibilidad/con-citas/:medicoId
export async function getDisponibilidadesConCitasCtrl(req: Request, res: Response): Promise<void> {
  try {
    const disponibilidades = await getDisponibilidadesConCitas(req.params.medicoId);
    res.json({ disponibilidades });
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
