import { Request, Response } from 'express';
export declare function create(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function getAll(req: Request, res: Response): Promise<void>;
export declare function update(req: Request, res: Response): Promise<void>;
export declare function deletePac(req: Request, res: Response): Promise<void>;
export declare function search(req: Request, res: Response): Promise<void>;
export declare function verificarDuplicados(req: Request, res: Response): Promise<void>;
