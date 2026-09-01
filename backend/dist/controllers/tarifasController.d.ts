import { Request, Response } from 'express';
export declare function getTarifaGrupos(_req: Request, res: Response): Promise<void>;
export declare function createTarifaGrupo(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTarifaGrupo(req: Request, res: Response): Promise<void>;
export declare function deleteTarifaGrupo(req: Request, res: Response): Promise<void>;
export declare function createTarifaTipo(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTarifaTipo(req: Request, res: Response): Promise<void>;
export declare function deleteTarifaTipo(req: Request, res: Response): Promise<void>;
export declare function getCargosTarifa(req: Request, res: Response): Promise<void>;
export declare function getCargosTarifaStats(_req: Request, res: Response): Promise<void>;
export declare function createCargoTarifa(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCargoTarifa(req: Request, res: Response): Promise<void>;
export declare function deleteCargoTarifa(req: Request, res: Response): Promise<void>;
/** Cargue masivo de cargos por archivo plano/CSV. */
export declare function bulkCreateCargosTarifa(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getTarifarios(req: Request, res: Response): Promise<void>;
export declare function getTarifarioById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createTarifario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTarifario(req: Request, res: Response): Promise<void>;
export declare function deleteTarifario(req: Request, res: Response): Promise<void>;
/**
 * Genera/actualiza los ítems de un tarifario copiando los de su tarifario base
 * y aplicando el porcentaje configurado (ej. 110 = +10%).
 */
export declare function generarTarifarioDesdeBase(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getTarifarioItems(req: Request, res: Response): Promise<void>;
/** Crea o actualiza el precio de un cargo en un tarifario. */
export declare function upsertTarifarioItem(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteTarifarioItem(req: Request, res: Response): Promise<void>;
/** Cargue masivo de precios (ítems) por archivo plano/CSV: columnas cargo, precio. */
export declare function bulkTarifarioItems(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
