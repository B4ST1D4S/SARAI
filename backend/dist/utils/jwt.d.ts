export interface TokenPayload {
    userId: string;
    email: string;
    rol: string;
}
export declare function generateToken(payload: TokenPayload): string;
export declare function generateRefreshToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload | null;
export declare function verifyRefreshToken(token: string): TokenPayload | null;
export declare function decodeToken(token: string): TokenPayload | null;
export declare function generateTestToken(): string;
