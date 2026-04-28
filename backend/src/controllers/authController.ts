import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    const result = await loginUser({ email, password });

    if (!result) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message || 'Error en login' });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, nombre, apellido, rol } = req.body;

    if (!email || !password || !nombre || !apellido) {
      res.status(400).json({ error: 'Datos incompletos' });
      return;
    }

    const result = await registerUser({
      email,
      password,
      nombre,
      apellido,
      rol: rol || 'PACIENTE',
    });

    if (!result) {
      res.status(400).json({ error: 'Error al registrarse' });
      return;
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message || 'Error en registro' });
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
