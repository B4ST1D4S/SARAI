export interface CreateDisponibilidadRequest {
    medicoId: string;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionSlot?: number;
    sede?: string;
    tipoAtencion?: string;
    consultorio?: string;
    fechaDesde?: string;
    fechaHasta?: string;
}
export interface CreateBloqueRequest {
    medicoId: string;
    fechaInicio: string;
    fechaFin: string;
    motivo?: string;
    todoElDia?: boolean;
}
export declare function getDisponibilidadMedico(medicoId: string): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    medicoId: string;
    sede: string | null;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionSlot: number;
    tipoAtencion: string | null;
    consultorio: string | null;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
}[]>;
export declare function createDisponibilidad(data: CreateDisponibilidadRequest): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    medicoId: string;
    sede: string | null;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionSlot: number;
    tipoAtencion: string | null;
    consultorio: string | null;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
}>;
export declare function updateDisponibilidad(id: string, data: Partial<CreateDisponibilidadRequest>): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    medicoId: string;
    sede: string | null;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionSlot: number;
    tipoAtencion: string | null;
    consultorio: string | null;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
}>;
export declare function deleteDisponibilidad(id: string): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    medicoId: string;
    sede: string | null;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionSlot: number;
    tipoAtencion: string | null;
    consultorio: string | null;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
}>;
export declare function getBloqueos(medicoId: string): Promise<{
    id: string;
    createdAt: Date;
    motivo: string | null;
    medicoId: string;
    fechaInicio: Date;
    fechaFin: Date;
    todoElDia: boolean;
}[]>;
export declare function createBloqueo(data: CreateBloqueRequest): Promise<{
    id: string;
    createdAt: Date;
    motivo: string | null;
    medicoId: string;
    fechaInicio: Date;
    fechaFin: Date;
    todoElDia: boolean;
}>;
export declare function deleteBloqueo(id: string): Promise<{
    id: string;
    createdAt: Date;
    motivo: string | null;
    medicoId: string;
    fechaInicio: Date;
    fechaFin: Date;
    todoElDia: boolean;
}>;
export declare function getDisponibilidadesConCitas(medicoId: string): Promise<{
    numCitas: number;
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    medicoId: string;
    sede: string | null;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionSlot: number;
    tipoAtencion: string | null;
    consultorio: string | null;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
}[]>;
/**
 * Devuelve médicos activos que tengan al menos una franja de disponibilidad
 * activa. El tipoConsultaNombre se recibe pero NO filtra por él, ya que la
 * disponibilidad es por horario y el tipo solo afecta la duración del slot.
 */
export declare function getMedicosPorTipoConsulta(_tipoConsultaNombre?: string): Promise<{
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string | null;
    registroMedico: string | null;
}[]>;
/**
 * Devuelve un array de números de día (1-31) del mes indicado que tienen
 * al menos 1 slot libre. No hace 31 consultas separadas: primero carga la
 * configuración semanal, los bloqueos del mes y las citas del mes, y luego
 * computa los días disponibles en memoria.
 */
export declare function getDiasDisponibles(medicoId: string, mes: number, // 1-12
anio: number, duracionOverride?: number): Promise<number[]>;
export type EstadoSlot = 'libre' | 'ocupado' | 'bloqueado';
export interface SlotConEstado {
    hora: string;
    estado: EstadoSlot;
}
export declare function getSlotsConEstado(medicoId: string, fecha: string, duracionOverride?: number): Promise<SlotConEstado[]>;
export declare function getSlotsDisponibles(medicoId: string, fecha: string, duracionOverride?: number): Promise<string[]>;
