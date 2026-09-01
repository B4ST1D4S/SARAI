export interface CreateHistoriaClinicaRequest {
    pacienteId: string;
    medicoId: string;
    tipoHistoria: string;
    tipoConsulta: string;
    quejaPrincipal: string;
    historiaEnfermedad: string;
    observacionesAntropometricas: string;
    diagnostico: string;
    tratamientoRecomendado: string;
    fotos?: string[];
    datosExtendidos?: Record<string, any>;
}
export interface UpdateHistoriaClinicaRequest {
    tipoConsulta?: string;
    tipoHistoria?: string;
    quejaPrincipal?: string;
    historiaEnfermedad?: string;
    observacionesAntropometricas?: string;
    diagnostico?: string;
    tratamientoRecomendado?: string;
    datosExtendidos?: Record<string, any>;
}
export declare function createHistoriaClinica(data: CreateHistoriaClinicaRequest): Promise<{
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    };
    usuario: {
        id: string;
        nombre: string;
        apellido: string;
    };
} & {
    id: string;
    pacienteId: string;
    tipoHistoria: string;
    contenido: import("@prisma/client/runtime/library.js").JsonValue;
    version: number;
    fechaCreacion: Date;
    fechaUltimaEdicion: Date;
    firmadoPorMedico: boolean;
    fechaFirma: Date | null;
    hashIntegridad: string;
    procedimientoId: string | null;
    editadoPor: string;
    plantillaId: string | null;
}>;
export declare function getHistoriaClinicaById(id: string): Promise<({
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    };
    usuario: {
        id: string;
        nombre: string;
        apellido: string;
    };
} & {
    id: string;
    pacienteId: string;
    tipoHistoria: string;
    contenido: import("@prisma/client/runtime/library.js").JsonValue;
    version: number;
    fechaCreacion: Date;
    fechaUltimaEdicion: Date;
    firmadoPorMedico: boolean;
    fechaFirma: Date | null;
    hashIntegridad: string;
    procedimientoId: string | null;
    editadoPor: string;
    plantillaId: string | null;
}) | null>;
export declare function getHistoriasPaciente(pacienteId: string): Promise<({
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    };
    usuario: {
        id: string;
        nombre: string;
        apellido: string;
    };
} & {
    id: string;
    pacienteId: string;
    tipoHistoria: string;
    contenido: import("@prisma/client/runtime/library.js").JsonValue;
    version: number;
    fechaCreacion: Date;
    fechaUltimaEdicion: Date;
    firmadoPorMedico: boolean;
    fechaFirma: Date | null;
    hashIntegridad: string;
    procedimientoId: string | null;
    editadoPor: string;
    plantillaId: string | null;
})[]>;
export declare function getHistoriasPorMedico(medicoId: string, page?: number, limit?: number): Promise<{
    historias: ({
        paciente: {
            id: string;
            numeroDocumento: string;
            nombreCompleto: string;
        };
    } & {
        id: string;
        pacienteId: string;
        tipoHistoria: string;
        contenido: import("@prisma/client/runtime/library.js").JsonValue;
        version: number;
        fechaCreacion: Date;
        fechaUltimaEdicion: Date;
        firmadoPorMedico: boolean;
        fechaFirma: Date | null;
        hashIntegridad: string;
        procedimientoId: string | null;
        editadoPor: string;
        plantillaId: string | null;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare function updateHistoriaClinica(id: string, medicoId: string, data: UpdateHistoriaClinicaRequest): Promise<{
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    };
} & {
    id: string;
    pacienteId: string;
    tipoHistoria: string;
    contenido: import("@prisma/client/runtime/library.js").JsonValue;
    version: number;
    fechaCreacion: Date;
    fechaUltimaEdicion: Date;
    firmadoPorMedico: boolean;
    fechaFirma: Date | null;
    hashIntegridad: string;
    procedimientoId: string | null;
    editadoPor: string;
    plantillaId: string | null;
}>;
export declare function entregarHistoriaClinica(id: string, medicoId: string): Promise<{
    id: string;
    pacienteId: string;
    tipoHistoria: string;
    contenido: import("@prisma/client/runtime/library.js").JsonValue;
    version: number;
    fechaCreacion: Date;
    fechaUltimaEdicion: Date;
    firmadoPorMedico: boolean;
    fechaFirma: Date | null;
    hashIntegridad: string;
    procedimientoId: string | null;
    editadoPor: string;
    plantillaId: string | null;
}>;
