/**
 * IAM Controller — Identity & Access Management Enterprise
 * RBAC + ABAC · Multiempresa · Multisede · Herencia de permisos
 * Permisos temporales · Delegaciones · MFA · Auditoría completa
 */
import { Request, Response } from 'express';
import { TipoAccion } from '@prisma/client';
export declare function resolverPermiso(usuarioId: string, recursoCodigo: string, accion: TipoAccion, contexto?: {
    empresaId?: string;
    sedeId?: string;
}): Promise<{
    permitido: boolean;
    fuente: string;
}>;
export declare const getEmpresas: (req: Request, res: Response) => Promise<void>;
export declare const createEmpresa: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateEmpresa: (req: Request, res: Response) => Promise<void>;
export declare const getSedes: (req: Request, res: Response) => Promise<void>;
export declare const createSede: (req: Request, res: Response) => Promise<void>;
export declare const updateSede: (req: Request, res: Response) => Promise<void>;
export declare const getPerfiles: (req: Request, res: Response) => Promise<void>;
export declare const createPerfil: (req: Request, res: Response) => Promise<void>;
export declare const updatePerfil: (req: Request, res: Response) => Promise<void>;
export declare const deletePerfil: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getIamRoles: (req: Request, res: Response) => Promise<void>;
export declare const createIamRol: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateIamRol: (req: Request, res: Response) => Promise<void>;
export declare const getGrupos: (req: Request, res: Response) => Promise<void>;
export declare const createGrupo: (req: Request, res: Response) => Promise<void>;
export declare const addUsuarioGrupo: (req: Request, res: Response) => Promise<void>;
export declare const getRecursos: (req: Request, res: Response) => Promise<void>;
export declare const seedRecursosSistema: (req: Request, res: Response) => Promise<void>;
export declare const getPermisos: (req: Request, res: Response) => Promise<void>;
export declare const setPermiso: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePermiso: (req: Request, res: Response) => Promise<void>;
export declare const checkPermiso: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMapaPermisos: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMyPermissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPoliticas: (req: Request, res: Response) => Promise<void>;
export declare const createPolitica: (req: Request, res: Response) => Promise<void>;
export declare const updatePolitica: (req: Request, res: Response) => Promise<void>;
export declare const getSesiones: (req: Request, res: Response) => Promise<void>;
export declare const revocarSesion: (req: Request, res: Response) => Promise<void>;
export declare const getDelegaciones: (req: Request, res: Response) => Promise<void>;
export declare const createDelegacion: (req: Request, res: Response) => Promise<void>;
export declare const revokeDelegacion: (req: Request, res: Response) => Promise<void>;
export declare const getAuditAccesos: (req: Request, res: Response) => Promise<void>;
export declare const getEventosSeguridad: (req: Request, res: Response) => Promise<void>;
export declare const resolverEvento: (req: Request, res: Response) => Promise<void>;
export declare const getDashboardIam: (req: Request, res: Response) => Promise<void>;
