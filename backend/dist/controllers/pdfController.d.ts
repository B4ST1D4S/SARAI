/**
 * pdfController.ts
 * Genera PDFs de Historia Clínica y Órdenes Médicas usando Puppeteer
 */
import { Request, Response } from 'express';
export declare function descargarHCPdf(req: Request, res: Response): Promise<void>;
export declare function descargarOrdenesPdf(req: Request, res: Response): Promise<void>;
