export type Ambiente = 'STAGE' | 'PRODUCCION';
export interface LoginSisproResult {
    token: string | null;
    login: boolean;
    registrado: boolean;
    errors: string[] | null;
}
export declare function loginSispro(ambiente: Ambiente, usuario: {
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    clave: string;
    nit: string;
    tipoUsuario?: string | null;
}): Promise<LoginSisproResult>;
export declare function moduloSoportado(modulo: string): boolean;
export declare function cargarPaquete(ambiente: Ambiente, token: string, modulo: string, ripsJson: unknown, xmlFevFile: string | null): Promise<any>;
export declare function consultarCuv(ambiente: Ambiente, codigoUnicoValidacion: string): Promise<any>;
export declare function recuperarCuv(ambiente: Ambiente, token: string, codigoUnicoValidacion: string): Promise<any>;
