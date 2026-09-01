import { Request, Response } from 'express';
export declare function getCupsCodigos(req: Request, res: Response): Promise<void>;
export declare function getCupsCodigosStats(_req: Request, res: Response): Promise<void>;
export declare function createCupsCodigo(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCupsCodigo(req: Request, res: Response): Promise<void>;
export declare function deleteCupsCodigo(req: Request, res: Response): Promise<void>;
export declare function bulkCreateCupsCodigos(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
