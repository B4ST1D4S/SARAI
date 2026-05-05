import { Request, Response } from 'express';
import {
  createCita,
  getCitasByMedico,
  getCitasByPaciente,
  getCitaById,
  updateCita,
  cancelarCita,
  confirmarAsistencia,
  completarCita,
  enviarRecordatorios24h,
} from '../services/citasService.js';

// Crear cita
export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const {
      pacienteId,
      medicoId,
      tipoCita,
      fechaHora,
      duracionMinutos,
      motivo,
      notas,
    } = req.body;

    if (!pacienteId || !medicoId || !tipoCita || !fechaHora) {
      res.status(400).json({ error: 'Datos incompletos' });
      return;
    }

    const cita = await createCita({
      pacienteId,
      medicoId,
      tipoCita,
      fechaHora,
      duracionMinutos,
      motivo,
      notas,
    });

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      cita,
    });
  } catch (error: any) {
    console.error('Error en create:', error);
    res.status(500).json({ error: error.message || 'Error al crear cita' });
  }
}

// Obtener citas del médico
export async function getMedico(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { estado } = req.query;
    const citas = await getCitasByMedico(req.user.userId, estado as string);

    res.json({
      success: true,
      count: citas.length,
      citas,
    });
  } catch (error: any) {
    console.error('Error en getMedico:', error);
    res.status(500).json({ error: error.message || 'Error al obtener citas' });
  }
}

// Obtener citas de paciente
export async function getPaciente(req: Request, res: Response): Promise<void> {
  try {
    const { pacienteId } = req.params;

    if (!pacienteId) {
      res.status(400).json({ error: 'ID de paciente requerido' });
      return;
    }

    const citas = await getCitasByPaciente(pacienteId);

    res.json({
      success: true,
      count: citas.length,
      citas,
    });
  } catch (error: any) {
    console.error('Error en getPaciente:', error);
    res.status(500).json({ error: error.message || 'Error al obtener citas' });
  }
}

// Obtener cita por ID
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de cita requerido' });
      return;
    }

    const cita = await getCitaById(id);

    if (!cita) {
      res.status(404).json({ error: 'Cita no encontrada' });
      return;
    }

    res.json({
      success: true,
      cita,
    });
  } catch (error: any) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cita' });
  }
}

// Actualizar cita
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { estado, asistencia, notas, motivo } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID de cita requerido' });
      return;
    }

    const cita = await updateCita(id, {
      estado,
      asistencia,
      notas,
      motivo,
    });

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      cita,
    });
  } catch (error: any) {
    console.error('Error en update:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar cita' });
  }
}

// Confirmar asistencia de paciente
export async function confirmar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de cita requerido' });
      return;
    }

    const cita = await confirmarAsistencia(id);

    res.json({
      success: true,
      message: 'Asistencia confirmada',
      cita,
    });
  } catch (error: any) {
    console.error('Error en confirmar:', error);
    res
      .status(500)
      .json({ error: error.message || 'Error al confirmar asistencia' });
  }
}

// Completar cita (atención médica)
export async function completar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID de cita requerido' });
      return;
    }

    const cita = await completarCita(id, notas);

    res.json({
      success: true,
      message: 'Cita completada exitosamente',
      cita,
    });
  } catch (error: any) {
    console.error('Error en completar:', error);
    res.status(500).json({ error: error.message || 'Error al completar cita' });
  }
}

// Cancelar cita
export async function cancelar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { razon } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID de cita requerido' });
      return;
    }

    const cita = await cancelarCita(id, razon);

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      cita,
    });
  } catch (error: any) {
    console.error('Error en cancelar:', error);
    res.status(500).json({ error: error.message || 'Error al cancelar cita' });
  }
}

// Enviar recordatorios 24h antes
export async function recordatorios(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const count = await enviarRecordatorios24h();

    res.json({
      success: true,
      message: `${count} recordatorios enviados exitosamente`,
      count,
    });
  } catch (error: any) {
    console.error('Error en recordatorios:', error);
    res
      .status(500)
      .json({ error: error.message || 'Error al enviar recordatorios' });
  }
}

// CU-03: Admisión — Paciente llega, pasa a EN_SALA
export async function admision(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ error: 'ID de cita requerido' }); return; }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const cita = await prisma.cita.update({
      where: { id },
      data: { estado: 'EN_SALA', asistencia: true },
      include: { paciente: true, medico: true },
    });
    res.json({ success: true, message: 'Paciente en sala de espera', cita });
  } catch (error: any) {
    console.error('Error en admision:', error);
    res.status(500).json({ error: error.message || 'Error al registrar admisión' });
  }
}

