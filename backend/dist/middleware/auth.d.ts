import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/jwt.js';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): void;
export declare function authorizeRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
