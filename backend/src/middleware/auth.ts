import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';

// Extender tipo Request para agregar usuario
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const user = verifyToken(token);

  if (!user) {
    res.status(403).json({ error: 'Token inválido o expirado' });
    return;
  }

  req.user = user;
  next();
}

export function authorizeRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'No autorizado para esta acción' });
      return;
    }

    next();
  };
}
