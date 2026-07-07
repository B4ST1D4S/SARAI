import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  createPaciente,
  getPacienteById,
  getAllPacientes,
  updatePaciente,
  deletePaciente,
  searchPacientes,
} from '../services/pacientesService.js';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const {
      numeroDocumento,
      tipoDocumento,
      nombreCompleto,
      fechaNacimiento,
      genero,
      telefonos,
      email,
      whatsapp,
      direccion,
      ciudad,
    } = req.body;

    if (!numeroDocumento || !tipoDocumento || !nombreCompleto) {
      res.status(400).json({ error: 'Datos incompletos: documento, tipo y nombre son requeridos' });
      return;
    }

    const paciente = await createPaciente({
      numeroDocumento,
      tipoDocumento,
      nombreCompleto,
      fechaNacimiento,
      genero,
      telefonos: telefonos || [],
      email,
      whatsapp,
      direccion,
      ciudad,
      creadoPor: req.user.userId,
    });

    res.status(201).json(paciente);
  } catch (error: any) {
    console.error('Error en create:', error);
    res.status(500).json({ error: error.message || 'Error al crear paciente' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const paciente = await getPacienteById(id);

    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    res.json(paciente);
  } catch (error: any) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener paciente' });
  }
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const result = await getAllPacientes(skip, limit);

    if (!result) {
      res.status(500).json({ error: 'Error al obtener pacientes' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error en getAll:', error);
    res.status(500).json({ error: error.message || 'Error al obtener pacientes' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombreCompleto, telefonos, email, whatsapp, direccion, ciudad } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    const paciente = await updatePaciente(id, {
      nombreCompleto,
      telefonos,
      email,
      whatsapp,
      direccion,
      ciudad,
    });

    res.json(paciente);
  } catch (error: any) {
    console.error('Error en update:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar paciente' });
  }
}

export async function deletePac(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID requerido' });
      return;
    }

    await deletePaciente(id);
    res.json({ message: 'Paciente eliminado' });
  } catch (error: any) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar paciente' });
  }
}

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const { q, documento, tipo } = req.query;

    // Soportar búsqueda por documento y tipo
    if (documento && tipo) {
      const paciente = await prisma.paciente.findFirst({
        where: {
          numeroDocumento: documento as string,
          tipoDocumento: tipo as string,
        },
      });
      
      if (paciente) {
        res.json(paciente);
      } else {
        res.status(404).json({ error: 'Paciente no encontrado' });
      }
      return;
    }

    // O búsqueda por query general
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query o documento requerido' });
      return;
    }

    const pacientes = await searchPacientes(q);
    res.json(pacientes);
  } catch (error: any) {
    console.error('Error en search:', error);
    res.status(500).json({ error: error.message || 'Error al buscar pacientes' });
  }
}

export async function verificarDuplicados(req: Request, res: Response): Promise<void> {
  try {
    const { numero, tipo, nombre } = req.query;

    const campoBase = {
      id: true,
      numeroDocumento: true,
      tipoDocumento: true,
      nombreCompleto: true,
      fechaNacimiento: true,
      telefonos: true,
      email: true,
    };

    // 1. Mismo número de documento, DISTINTO tipo → posible misma persona registrada con tipo diferente
    const mismoNumeroOtroTipo = numero
      ? await prisma.paciente.findMany({
          where: {
            numeroDocumento: numero as string,
            ...(tipo ? { tipoDocumento: { not: tipo as string } } : {}),
          },
          select: campoBase,
        })
      : [];

    // 2. Mismo nombre completo (búsqueda insensible a mayúsculas) → posible homónimo
    const mismoNombre =
      nombre && typeof nombre === 'string' && nombre.trim().length >= 4
        ? await prisma.paciente.findMany({
            where: {
              nombreCompleto: {
                contains: nombre.trim(),
                mode: 'insensitive',
              },
            },
            select: campoBase,
            take: 10,
          })
        : [];

    res.json({ mismoNumeroOtroTipo, mismoNombre });
  } catch (error: any) {
    console.error('Error en verificarDuplicados:', error);
    res.status(500).json({ error: error.message || 'Error al verificar duplicados' });
  }
}
