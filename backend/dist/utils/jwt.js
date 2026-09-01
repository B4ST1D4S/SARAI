import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_muy_seguro_aqui_2024';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_secreto_refresh_aqui_2024';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
    });
}
export function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRATION,
    });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    }
    catch (error) {
        return null;
    }
}
export function decodeToken(token) {
    try {
        return jwt.decode(token);
    }
    catch (error) {
        return null;
    }
}
// Función para generar token de prueba (solo para desarrollo)
export function generateTestToken() {
    const testPayload = {
        userId: 'test-user-123',
        email: 'test@estegia.com',
        rol: 'MEDICO',
    };
    return generateToken(testPayload);
}
