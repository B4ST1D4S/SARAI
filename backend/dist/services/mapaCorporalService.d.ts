export interface MapaMark {
    id: string;
    tipo: string;
    posicionX: number;
    posicionY: number;
    intensidad: number;
    zona: string;
    fecha: string;
    vista: 'FRONTAL' | 'POSTERIOR' | 'LATERAL_IZQ' | 'LATERAL_DER';
    nota?: string;
}
export interface CreateMapaCorporalRequest {
    pacienteId: string;
    procedimientoId?: string;
    medicoId: string;
    zonasMarcadas: MapaMark[];
    edemaZonas?: Record<string, any>[];
    fibrosisZonas?: Record<string, any>[];
    dolorZonas?: Record<string, any>[];
    anotacionesClinics?: string;
}
export interface UpdateMapaCorporalRequest {
    zonasMarcadas?: MapaMark[];
    edemaZonas?: Record<string, any>[];
    fibrosisZonas?: Record<string, any>[];
    dolorZonas?: Record<string, any>[];
    anotacionesClinics?: string;
}
/**
 * Crear o actualizar mapa corporal para un procedimiento
 */
export declare function saveMapaCorporal(data: CreateMapaCorporalRequest): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    pacienteId: string;
    procedimientoId: string | null;
    fechaEvaluacion: Date;
    zonasMarcadas: import("@prisma/client/runtime/library.js").JsonValue;
    edemaZonas: import("@prisma/client/runtime/library.js").JsonValue;
    fibrosisZonas: import("@prisma/client/runtime/library.js").JsonValue;
    dolorZonas: import("@prisma/client/runtime/library.js").JsonValue;
    colorIndicator: string | null;
    anotacionesClinics: string | null;
    evaluadoPor: string;
}>;
/**
 * Obtener mapa corporal por procedimiento
 */
export declare function getMapaCorporalByProcedimiento(procedimientoId: string, pacienteId: string): Promise<({
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    };
    procedimiento: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        pacienteId: string;
        complicaciones: string[];
        codigoCUPS: string | null;
        descripcion: string | null;
        medicoId: string;
        fechaProgramada: Date;
        fechaRealizada: Date | null;
        tipoProcedimiento: string;
        nombreProcedimiento: string;
        duracionEstimada: number;
        duracionReal: number | null;
        notasPreoperatorio: string | null;
        notasOperatorio: string | null;
        resultadoVisualEsperado: string | null;
        resultadoVisualActual: string | null;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    pacienteId: string;
    procedimientoId: string | null;
    fechaEvaluacion: Date;
    zonasMarcadas: import("@prisma/client/runtime/library.js").JsonValue;
    edemaZonas: import("@prisma/client/runtime/library.js").JsonValue;
    fibrosisZonas: import("@prisma/client/runtime/library.js").JsonValue;
    dolorZonas: import("@prisma/client/runtime/library.js").JsonValue;
    colorIndicator: string | null;
    anotacionesClinics: string | null;
    evaluadoPor: string;
}) | null>;
/**
 * Obtener todos los mapas corporales de un paciente
 */
export declare function getMapaCorporalPorPaciente(pacienteId: string): Promise<({
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    };
    procedimiento: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        pacienteId: string;
        complicaciones: string[];
        codigoCUPS: string | null;
        descripcion: string | null;
        medicoId: string;
        fechaProgramada: Date;
        fechaRealizada: Date | null;
        tipoProcedimiento: string;
        nombreProcedimiento: string;
        duracionEstimada: number;
        duracionReal: number | null;
        notasPreoperatorio: string | null;
        notasOperatorio: string | null;
        resultadoVisualEsperado: string | null;
        resultadoVisualActual: string | null;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    pacienteId: string;
    procedimientoId: string | null;
    fechaEvaluacion: Date;
    zonasMarcadas: import("@prisma/client/runtime/library.js").JsonValue;
    edemaZonas: import("@prisma/client/runtime/library.js").JsonValue;
    fibrosisZonas: import("@prisma/client/runtime/library.js").JsonValue;
    dolorZonas: import("@prisma/client/runtime/library.js").JsonValue;
    colorIndicator: string | null;
    anotacionesClinics: string | null;
    evaluadoPor: string;
})[]>;
/**
 * Actualizar mapa corporal existente
 */
export declare function updateMapaCorporal(id: string, data: UpdateMapaCorporalRequest): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    pacienteId: string;
    procedimientoId: string | null;
    fechaEvaluacion: Date;
    zonasMarcadas: import("@prisma/client/runtime/library.js").JsonValue;
    edemaZonas: import("@prisma/client/runtime/library.js").JsonValue;
    fibrosisZonas: import("@prisma/client/runtime/library.js").JsonValue;
    dolorZonas: import("@prisma/client/runtime/library.js").JsonValue;
    colorIndicator: string | null;
    anotacionesClinics: string | null;
    evaluadoPor: string;
}>;
/**
 * Eliminar mapa corporal
 */
export declare function deleteMapaCorporal(id: string): Promise<{
    message: string;
}>;
