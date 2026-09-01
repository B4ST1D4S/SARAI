import { Request, Response } from 'express';
/**
 * Guardar/actualizar mapa corporal
 * POST /api/mapa-corporal
 */
export declare function save(req: Request, res: Response): Promise<void>;
/**
 * Obtener mapa corporal por procedimiento
 * GET /api/mapa-corporal/procedimiento/:procedimientoId/:pacienteId
 */
export declare function getByProcedimiento(req: Request, res: Response): Promise<void>;
/**
 * Obtener mapas corporales de un paciente
 * GET /api/mapa-corporal/paciente/:pacienteId
 */
export declare function getByPaciente(req: Request, res: Response): Promise<void>;
/**
 * Actualizar mapa corporal
 * PUT /api/mapa-corporal/:id
 */
export declare function update(req: Request, res: Response): Promise<void>;
/**
 * Eliminar mapa corporal
 * DELETE /api/mapa-corporal/:id
 */
export declare function remove(req: Request, res: Response): Promise<void>;
