import { verifyToken } from '../utils/jwt.js';
export function authenticateToken(req, res, next) {
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
export function authorizeRole(...roles) {
    return (req, res, next) => {
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
