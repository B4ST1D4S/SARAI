import { Request, Response } from 'express';
import { loginUser } from '../services/authService.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }

    const result = await loginUser({ username, password });

    if (!result) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message || 'Error en login' });
  }
}

export function me(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  res.json({
    userId: req.user.userId,
    email: req.user.email,
    rol: req.user.rol,
  });
}
