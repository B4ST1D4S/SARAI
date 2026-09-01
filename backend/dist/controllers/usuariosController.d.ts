import { Request, Response } from 'express';
export declare function create(req: Request, res: Response): Promise<void>;
export declare function getAll(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function update(req: Request, res: Response): Promise<void>;
export declare function toggleStatus(req: Request, res: Response): Promise<void>;
export declare function cargaMasiva(req: Request, res: Response): Promise<void>;
