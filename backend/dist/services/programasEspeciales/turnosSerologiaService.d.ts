export declare function listarTurnos(params: {
    esquema?: string;
    jornada?: string;
    activo?: boolean;
}): Promise<({
    inscripcion: {
        paciente: {
            id: string;
            numeroDocumento: string;
            tipoDocumento: string;
            nombreCompleto: string;
            fechaNacimiento: Date;
            genero: string;
        };
        historiaRenal: {
            estadioERC: string | null;
            riesgoKDIGO: string | null;
            modalidadActual: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sedeId: string | null;
        estado: string;
        pacienteId: string;
        fechaIngreso: Date;
        observaciones: string | null;
        fechaEgreso: Date | null;
        programaId: string;
        codigoPrograma: string;
        motivoEgreso: string | null;
        entidadRemitente: string | null;
        medicoIngresoId: string | null;
    };
    maquina: {
        id: string;
        codigo: string;
        sillon: string | null;
        marca: string;
    } | null;
} & {
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date | null;
    inscripcionId: string;
    maquinaId: string | null;
    esquema: string;
    jornada: string;
    sillaNumero: string | null;
})[]>;
export declare function obtenerTurnoPorInscripcion(inscripcionId: string): Promise<({
    maquina: {
        id: string;
        codigo: string;
        sillon: string | null;
        marca: string;
    } | null;
} & {
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date | null;
    inscripcionId: string;
    maquinaId: string | null;
    esquema: string;
    jornada: string;
    sillaNumero: string | null;
}) | null>;
export declare function asignarTurno(data: {
    inscripcionId: string;
    esquema: string;
    jornada: string;
    sillaNumero?: string;
    maquinaId?: string;
    observaciones?: string;
}): Promise<{
    maquina: {
        id: string;
        codigo: string;
        sillon: string | null;
        marca: string;
    } | null;
} & {
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date | null;
    inscripcionId: string;
    maquinaId: string | null;
    esquema: string;
    jornada: string;
    sillaNumero: string | null;
}>;
export declare function inactivarTurno(inscripcionId: string): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date | null;
    inscripcionId: string;
    maquinaId: string | null;
    esquema: string;
    jornada: string;
    sillaNumero: string | null;
}>;
export declare function contadoresDia(): Promise<{
    programadosHoy: number;
    enSala: number;
    finalizados: number;
    suspendidos: number;
    ausentes: number;
}>;
export declare const MARCADORES_HD: string[];
export declare function listarSerologia(inscripcionId: string): Promise<{
    registros: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pacienteId: string;
        observaciones: string | null;
        resultado: string;
        inscripcionId: string;
        fechaToma: Date | null;
        fechaResultado: Date | null;
        marcador: string;
        valorNumerico: number | null;
        laboratorio: string | null;
        validadoPor: string | null;
    }[];
    mapa: Record<string, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pacienteId: string;
        observaciones: string | null;
        resultado: string;
        inscripcionId: string;
        fechaToma: Date | null;
        fechaResultado: Date | null;
        marcador: string;
        valorNumerico: number | null;
        laboratorio: string | null;
        validadoPor: string | null;
    } | null>;
    marcadores: string[];
}>;
export declare function guardarResultadoSerologico(inscripcionId: string, pacienteId: string, data: {
    marcador: string;
    resultado: string;
    valorNumerico?: number;
    fechaToma?: string;
    fechaResultado?: string;
    laboratorio?: string;
    observaciones?: string;
    validadoPor?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    pacienteId: string;
    observaciones: string | null;
    resultado: string;
    inscripcionId: string;
    fechaToma: Date | null;
    fechaResultado: Date | null;
    marcador: string;
    valorNumerico: number | null;
    laboratorio: string | null;
    validadoPor: string | null;
}>;
export declare function obtenerEstadoSerologico(inscripcionId: string): Promise<{
    completo: boolean;
    pendientes: number;
    reactivos: string[];
    hayRiesgo: boolean;
}>;
