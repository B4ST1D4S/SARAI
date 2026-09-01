export interface LoginRequest {
    username: string;
    password: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        nombre: string;
        apellido: string;
        rol: string;
    };
}
export declare function loginUser(request: LoginRequest): Promise<AuthResponse | null>;
export declare function registerUser(request: RegisterRequest): Promise<AuthResponse | null>;
