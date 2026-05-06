import { Request, Response } from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
} from '../services/usuariosService.js';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { username, password, nombre, apellido, rol } = req.body;

    if (!username || !password || !nombre || !apellido || !rol) {
      res.status(400).json({
        error: 'username, password, nombre, apellido y rol son requeridos',
      });
      return;
    }

    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El nombre de usuario o correo ya existe' });
      return;
    }
    console.error('Error en createUser:', error);
    res.status(500).json({ error: error.message || 'Error al crear usuario' });
  }
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const users = await getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener usuarios' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener usuario' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El nombre de usuario o correo ya existe' });
      return;
    }
    res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const result = await toggleUserStatus(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al cambiar estado' });
  }
}
