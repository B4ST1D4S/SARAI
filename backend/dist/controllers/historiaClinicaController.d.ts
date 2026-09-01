import { Request, Response } from 'express';
export declare function create(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function getPorPaciente(req: Request, res: Response): Promise<void>;
export declare function getPorMedico(req: Request, res: Response): Promise<void>;
export declare function update(req: Request, res: Response): Promise<void>;
export declare function entregar(req: Request, res: Response): Promise<void>;
