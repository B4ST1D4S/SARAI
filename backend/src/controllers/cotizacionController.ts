import { Request, Response } from 'express';
import {
  createCotizacion,
  getCotizacionById,
  getCotizacionesPaciente,
  aceptarCotizacion,
  rechazarCotizacion,
} from '../services/cotizacionService.js';

// Crear cotización
export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const {
      pacienteId,
      citaId,
      descripcionServicio,
      lineas,
      descuentoPorcentaje,
      notasAdicionales,
      vigenciaDias,
    } = req.body;

    if (!pacienteId || !descripcionServicio || !lineas || lineas.length === 0) {
      res.status(400).json({ error: 'Datos incompletos' });
      return;
    }

    const cotizacion = await createCotizacion({
      pacienteId,
      medicoId: req.user.userId,
      citaId,
      descripcionServicio,
      lineas,
      descuentoPorcentaje,
      notasAdicionales,
      vigenciaDias,
    });

    res.status(201).json({
      success: true,
      message: 'Cotización creada y enviada al paciente',
      cotizacion,
    });
  } catch (error: any) {
    console.error('Error en create:', error);
    res.status(500).json({ error: error.message || 'Error al crear cotización' });
  }
}

// Obtener cotización por ID
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const cotizacion = await getCotizacionById(id);

    res.json({
      success: true,
      cotizacion,
    });
  } catch (error: any) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cotización' });
  }
}

// Obtener cotizaciones de paciente
export async function getPaciente(req: Request, res: Response): Promise<void> {
  try {
    const { pacienteId } = req.params;

    if (!pacienteId) {
      res.status(400).json({ error: 'ID del paciente requerido' });
      return;
    }

    const cotizaciones = await getCotizacionesPaciente(pacienteId);

    res.json({
      success: true,
      count: cotizaciones.length,
      cotizaciones,
    });
  } catch (error: any) {
    console.error('Error en getPaciente:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cotizaciones' });
  }
}

// Aceptar cotización
export async function aceptar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const cotizacion = await aceptarCotizacion(id);

    res.json({
      success: true,
      message: 'Cotización aceptada',
      cotizacion,
    });
  } catch (error: any) {
    console.error('Error en aceptar:', error);
    res.status(500).json({ error: error.message || 'Error al aceptar cotización' });
  }
}

// Rechazar cotización
export async function rechazar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const cotizacion = await rechazarCotizacion(id, motivo);

    res.json({
      success: true,
      message: 'Cotización rechazada',
      cotizacion,
    });
  } catch (error: any) {
    console.error('Error en rechazar:', error);
    res.status(500).json({ error: error.message || 'Error al rechazar cotización' });
  }
}
