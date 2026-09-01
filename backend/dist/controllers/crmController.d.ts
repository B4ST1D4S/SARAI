import { Request, Response } from 'express';
export declare function getLeads(req: Request, res: Response): Promise<void>;
export declare function getStats(req: Request, res: Response): Promise<void>;
export declare function createLead(req: Request, res: Response): Promise<void>;
export declare function updateLead(req: Request, res: Response): Promise<void>;
export declare function deleteLead(req: Request, res: Response): Promise<void>;
export declare function syncLeads(req: Request, res: Response): Promise<void>;
