import { Request, Response } from 'express';
import {
  createHistoriaClinica,
  getHistoriaClinicaById,
  getHistoriasPaciente,
  updateHistoriaClinica,
  getHistoriasPorMedico,
  entregarHistoriaClinica,
} from '../services/historiaClinicaService.js';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const {
      pacienteId,
      tipoHistoria,
      tipoConsulta,
      quejaPrincipal,
      historiaEnfermedad,
      observacionesAntropometricas,
      diagnostico,
      tratamientoRecomendado,
      fotos,
      datosExtendidos,
    } = req.body;

    if (!pacienteId || !tipoHistoria || !tipoConsulta || !quejaPrincipal) {
      res.status(400).json({ error: 'Datos incompletos: pacienteId, tipoHistoria, tipoConsulta y quejaPrincipal son requeridos' });
      return;
    }

    const historia = await createHistoriaClinica({
      pacienteId,
      medicoId: req.user.userId,
      tipoHistoria,
      tipoConsulta,
      quejaPrincipal,
      historiaEnfermedad: historiaEnfermedad || '',
      observacionesAntropometricas: observacionesAntropometricas || '',
      diagnostico: diagnostico || '',
      tratamientoRecomendado: tratamientoRecomendado || '',
      fotos: fotos || [],
      datosExtendidos: datosExtendidos || {},
    });

    res.status(201).json(historia);
  } catch (error: any) {
    console.error('Error en create:', error);
    res.status(500).json({ error: error.message || 'Error al crear historia clínica' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const historia = await getHistoriaClinicaById(id);

    if (!historia) {
      res.status(404).json({ error: 'Historia clínica no encontrada' });
      return;
    }

    res.json(historia);
  } catch (error: any) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener historia clínica' });
  }
}

export async function getPorPaciente(req: Request, res: Response): Promise<void> {
  try {
    const { pacienteId } = req.params;

    if (!pacienteId) {
      res.status(400).json({ error: 'ID del paciente requerido' });
      return;
    }

    const historias = await getHistoriasPaciente(pacienteId);
    res.json(historias);
  } catch (error: any) {
    console.error('Error en getPorPaciente:', error);
    res.status(500).json({ error: error.message || 'Error al obtener historias' });
  }
}

export async function getPorMedico(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getHistoriasPorMedico(req.user.userId, page, limit);

    res.json(result);
  } catch (error: any) {
    console.error('Error en getPorMedico:', error);
    res.status(500).json({ error: error.message || 'Error al obtener historias' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { id } = req.params;
    const {
      tipoConsulta,
      tipoHistoria,
      quejaPrincipal,
      historiaEnfermedad,
      observacionesAntropometricas,
      diagnostico,
      tratamientoRecomendado,
      datosExtendidos,
    } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const historia = await updateHistoriaClinica(id, req.user.userId, {
      tipoConsulta,
      tipoHistoria,
      quejaPrincipal,
      historiaEnfermedad,
      observacionesAntropometricas,
      diagnostico,
      tratamientoRecomendado,
      datosExtendidos,
    });

    res.json(historia);
  } catch (error: any) {
    console.error('Error en update:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar historia clínica' });
  }
}

// Entregar historia clínica
export async function entregar(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de historia clínica requerido' });
      return;
    }

    const historia = await entregarHistoriaClinica(id, req.user.userId);

    res.json({
      success: true,
      message: 'Historia clínica entregada al paciente',
      historia,
    });
  } catch (error: any) {
    console.error('Error en entregar:', error);
    res.status(500).json({ error: error.message || 'Error al entregar historia clínica' });
  }
}
