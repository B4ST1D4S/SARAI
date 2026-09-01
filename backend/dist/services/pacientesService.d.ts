export interface CreatePacienteRequest {
    numeroDocumento: string;
    tipoDocumento: string;
    nombreCompleto: string;
    fechaNacimiento?: string;
    genero?: string;
    telefonos: string[];
    email?: string;
    whatsapp?: string;
    direccion?: string;
    ciudad?: string;
    creadoPor: string;
}
export interface UpdatePacienteRequest {
    nombreCompleto?: string;
    telefonos?: string[];
    email?: string;
    whatsapp?: string;
    direccion?: string;
    ciudad?: string;
}
export declare function createPaciente(data: CreatePacienteRequest): Promise<{
    id: string;
    email: string | null;
    numeroDocumento: string;
    createdAt: Date;
    updatedAt: Date;
    tipoDocumento: string;
    nombreCompleto: string;
    fechaNacimiento: Date;
    genero: string;
    telefonos: string[];
    whatsapp: string | null;
    direccion: string | null;
    ciudad: string | null;
    fotoPerfil: string | null;
    estado: string;
    creadoPor: string | null;
}>;
export declare function getPacienteById(id: string): Promise<({
    alergias: {
        id: string;
        nombre: string;
        pacienteId: string;
        severidad: string;
        reaccion: string | null;
    }[];
    antecedentes: {
        id: string;
        pacienteId: string;
        procedimiento: string;
        fecha: Date;
        complicaciones: string | null;
        cirujano: string | null;
    }[];
    medicacionActual: {
        id: string;
        nombre: string;
        activo: boolean;
        pacienteId: string | null;
        dosis: string;
        frecuencia: string;
        indicacion: string;
    }[];
} & {
    id: string;
    email: string | null;
    numeroDocumento: string;
    createdAt: Date;
    updatedAt: Date;
    tipoDocumento: string;
    nombreCompleto: string;
    fechaNacimiento: Date;
    genero: string;
    telefonos: string[];
    whatsapp: string | null;
    direccion: string | null;
    ciudad: string | null;
    fotoPerfil: string | null;
    estado: string;
    creadoPor: string | null;
}) | null>;
export declare function getAllPacientes(skip?: number, take?: number): Promise<{
    pacientes: {
        id: string;
        email: string | null;
        numeroDocumento: string;
        createdAt: Date;
        updatedAt: Date;
        tipoDocumento: string;
        nombreCompleto: string;
        fechaNacimiento: Date;
        genero: string;
        telefonos: string[];
        whatsapp: string | null;
        direccion: string | null;
        ciudad: string | null;
        fotoPerfil: string | null;
        estado: string;
        creadoPor: string | null;
    }[];
    total: number;
    page: number;
    pages: number;
} | null>;
export declare function updatePaciente(id: string, data: UpdatePacienteRequest): Promise<{
    id: string;
    email: string | null;
    numeroDocumento: string;
    createdAt: Date;
    updatedAt: Date;
    tipoDocumento: string;
    nombreCompleto: string;
    fechaNacimiento: Date;
    genero: string;
    telefonos: string[];
    whatsapp: string | null;
    direccion: string | null;
    ciudad: string | null;
    fotoPerfil: string | null;
    estado: string;
    creadoPor: string | null;
}>;
export declare function deletePaciente(id: string): Promise<{
    success: boolean;
}>;
export declare function searchPacientes(query: string): Promise<{
    id: string;
    email: string | null;
    numeroDocumento: string;
    createdAt: Date;
    updatedAt: Date;
    tipoDocumento: string;
    nombreCompleto: string;
    fechaNacimiento: Date;
    genero: string;
    telefonos: string[];
    whatsapp: string | null;
    direccion: string | null;
    ciudad: string | null;
    fotoPerfil: string | null;
    estado: string;
    creadoPor: string | null;
}[]>;
