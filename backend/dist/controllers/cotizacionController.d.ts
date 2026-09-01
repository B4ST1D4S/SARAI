import { Request, Response } from 'express';
export declare function create(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function getPaciente(req: Request, res: Response): Promise<void>;
export declare function aceptar(req: Request, res: Response): Promise<void>;
export declare function rechazar(req: Request, res: Response): Promise<void>;
export declare function getAll(req: Request, res: Response): Promise<void>;
