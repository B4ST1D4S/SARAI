export declare const FACTURA_SIN_CONTRATO_CODIGOS: Record<string, string>;
export declare function getEmpresas(soloActivas?: boolean): Promise<({
    _count: {
        contratos: number;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    direccion: string | null;
    ciudad: string | null;
    estado: boolean;
    tipo: string;
    nit: string;
    razonSocial: string;
    contactoTelefono: string | null;
    contactoEmail: string | null;
    sitioWeb: string | null;
    contactoNombre: string | null;
    regimenTributario: string | null;
    logoUrl: string | null;
    nombreComercial: string | null;
    contactoCargo: string | null;
    esClinicaPropia: boolean;
})[]>;
export declare function getEmpresaById(id: string): Promise<{
    contratos: ({
        empresa: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            direccion: string | null;
            ciudad: string | null;
            estado: boolean;
            tipo: string;
            nit: string;
            razonSocial: string;
            contactoTelefono: string | null;
            contactoEmail: string | null;
            sitioWeb: string | null;
            contactoNombre: string | null;
            regimenTributario: string | null;
            logoUrl: string | null;
            nombreComercial: string | null;
            contactoCargo: string | null;
            esClinicaPropia: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        empresaId: string;
        estado: string;
        tipo: string;
        numero: number;
        descripcion: string;
        observaciones: string | null;
        fechaInicio: Date;
        fechaFin: Date;
        montoTotal: number | null;
        montoMensual: number | null;
        diasCredito: number;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        tieneCucon: boolean;
        codigoCucon: string | null;
        facturaSinContrato: string | null;
        creadoPorId: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    direccion: string | null;
    ciudad: string | null;
    estado: boolean;
    tipo: string;
    nit: string;
    razonSocial: string;
    contactoTelefono: string | null;
    contactoEmail: string | null;
    sitioWeb: string | null;
    contactoNombre: string | null;
    regimenTributario: string | null;
    logoUrl: string | null;
    nombreComercial: string | null;
    contactoCargo: string | null;
    esClinicaPropia: boolean;
}>;
export declare function createEmpresa(data: {
    razonSocial: string;
    nombreComercial?: string;
    nit: string;
    tipo?: string;
    contactoNombre?: string;
    contactoCargo?: string;
    contactoEmail?: string;
    contactoTelefono?: string;
    direccion?: string;
    ciudad?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    direccion: string | null;
    ciudad: string | null;
    estado: boolean;
    tipo: string;
    nit: string;
    razonSocial: string;
    contactoTelefono: string | null;
    contactoEmail: string | null;
    sitioWeb: string | null;
    contactoNombre: string | null;
    regimenTributario: string | null;
    logoUrl: string | null;
    nombreComercial: string | null;
    contactoCargo: string | null;
    esClinicaPropia: boolean;
}>;
export declare function updateEmpresa(id: string, data: Partial<{
    razonSocial: string;
    nombreComercial: string;
    tipo: string;
    contactoNombre: string;
    contactoCargo: string;
    contactoEmail: string;
    contactoTelefono: string;
    direccion: string;
    ciudad: string;
    estado: boolean;
}>): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    direccion: string | null;
    ciudad: string | null;
    estado: boolean;
    tipo: string;
    nit: string;
    razonSocial: string;
    contactoTelefono: string | null;
    contactoEmail: string | null;
    sitioWeb: string | null;
    contactoNombre: string | null;
    regimenTributario: string | null;
    logoUrl: string | null;
    nombreComercial: string | null;
    contactoCargo: string | null;
    esClinicaPropia: boolean;
}>;
export declare function getContratos(filtros?: {
    estado?: string;
    empresaId?: string;
    busqueda?: string;
}): Promise<({
    _count: {
        beneficiarios: number;
    };
    creadoPor: {
        id: string;
        nombre: string;
        apellido: string;
    };
    empresa: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        direccion: string | null;
        ciudad: string | null;
        estado: boolean;
        tipo: string;
        nit: string;
        razonSocial: string;
        contactoTelefono: string | null;
        contactoEmail: string | null;
        sitioWeb: string | null;
        contactoNombre: string | null;
        regimenTributario: string | null;
        logoUrl: string | null;
        nombreComercial: string | null;
        contactoCargo: string | null;
        esClinicaPropia: boolean;
    };
    tarifas: {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        codigoCUPS: string;
        contratoId: string;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        precioBase: number;
        descripcionCUPS: string;
        precioNegociado: number;
    }[];
    paquetes: ({
        items: {
            id: string;
            createdAt: Date;
            codigoCUPS: string | null;
            descripcion: string;
            cantidad: number;
            esPrincipal: boolean;
            precioUnit: number;
            paqueteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        contratoId: string;
        precio: number;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    empresaId: string;
    estado: string;
    tipo: string;
    numero: number;
    descripcion: string;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date;
    montoTotal: number | null;
    montoMensual: number | null;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    tieneCucon: boolean;
    codigoCucon: string | null;
    facturaSinContrato: string | null;
    creadoPorId: string;
})[]>;
export declare function getContratoById(id: string): Promise<{
    _count: {
        beneficiarios: number;
    };
    creadoPor: {
        id: string;
        nombre: string;
        apellido: string;
    };
    empresa: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        direccion: string | null;
        ciudad: string | null;
        estado: boolean;
        tipo: string;
        nit: string;
        razonSocial: string;
        contactoTelefono: string | null;
        contactoEmail: string | null;
        sitioWeb: string | null;
        contactoNombre: string | null;
        regimenTributario: string | null;
        logoUrl: string | null;
        nombreComercial: string | null;
        contactoCargo: string | null;
        esClinicaPropia: boolean;
    };
    tarifas: {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        codigoCUPS: string;
        contratoId: string;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        precioBase: number;
        descripcionCUPS: string;
        precioNegociado: number;
    }[];
    paquetes: ({
        items: {
            id: string;
            createdAt: Date;
            codigoCUPS: string | null;
            descripcion: string;
            cantidad: number;
            esPrincipal: boolean;
            precioUnit: number;
            paqueteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        contratoId: string;
        precio: number;
    })[];
    beneficiarios: ({
        paciente: {
            id: string;
            numeroDocumento: string;
            nombreCompleto: string;
        } | null;
    } & {
        id: string;
        email: string | null;
        nombre: string;
        telefono: string | null;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        pacienteId: string | null;
        documento: string;
        tipo: string;
        contratoId: string;
        tipoDoc: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    empresaId: string;
    estado: string;
    tipo: string;
    numero: number;
    descripcion: string;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date;
    montoTotal: number | null;
    montoMensual: number | null;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    tieneCucon: boolean;
    codigoCucon: string | null;
    facturaSinContrato: string | null;
    creadoPorId: string;
}>;
export declare function createContrato(data: {
    descripcion: string;
    empresaId: string;
    tipo?: string;
    fechaInicio: string;
    fechaFin: string;
    montoTotal?: number;
    montoMensual?: number;
    diasCredito?: number;
    porcentajeDescuento?: number;
    porcentajeCobertura?: number;
    observaciones?: string;
    tieneCucon?: boolean;
    codigoCucon?: string;
    facturaSinContrato?: string;
    creadoPorId: string;
}): Promise<{
    _count: {
        beneficiarios: number;
    };
    creadoPor: {
        id: string;
        nombre: string;
        apellido: string;
    };
    empresa: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        direccion: string | null;
        ciudad: string | null;
        estado: boolean;
        tipo: string;
        nit: string;
        razonSocial: string;
        contactoTelefono: string | null;
        contactoEmail: string | null;
        sitioWeb: string | null;
        contactoNombre: string | null;
        regimenTributario: string | null;
        logoUrl: string | null;
        nombreComercial: string | null;
        contactoCargo: string | null;
        esClinicaPropia: boolean;
    };
    tarifas: {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        codigoCUPS: string;
        contratoId: string;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        precioBase: number;
        descripcionCUPS: string;
        precioNegociado: number;
    }[];
    paquetes: ({
        items: {
            id: string;
            createdAt: Date;
            codigoCUPS: string | null;
            descripcion: string;
            cantidad: number;
            esPrincipal: boolean;
            precioUnit: number;
            paqueteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        contratoId: string;
        precio: number;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    empresaId: string;
    estado: string;
    tipo: string;
    numero: number;
    descripcion: string;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date;
    montoTotal: number | null;
    montoMensual: number | null;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    tieneCucon: boolean;
    codigoCucon: string | null;
    facturaSinContrato: string | null;
    creadoPorId: string;
}>;
export declare function updateContrato(id: string, data: Partial<{
    descripcion: string;
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
    montoTotal: number;
    montoMensual: number;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    observaciones: string;
    tieneCucon: boolean;
    codigoCucon: string;
    facturaSinContrato: string;
}>): Promise<{
    _count: {
        beneficiarios: number;
    };
    creadoPor: {
        id: string;
        nombre: string;
        apellido: string;
    };
    empresa: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        direccion: string | null;
        ciudad: string | null;
        estado: boolean;
        tipo: string;
        nit: string;
        razonSocial: string;
        contactoTelefono: string | null;
        contactoEmail: string | null;
        sitioWeb: string | null;
        contactoNombre: string | null;
        regimenTributario: string | null;
        logoUrl: string | null;
        nombreComercial: string | null;
        contactoCargo: string | null;
        esClinicaPropia: boolean;
    };
    tarifas: {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        codigoCUPS: string;
        contratoId: string;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        precioBase: number;
        descripcionCUPS: string;
        precioNegociado: number;
    }[];
    paquetes: ({
        items: {
            id: string;
            createdAt: Date;
            codigoCUPS: string | null;
            descripcion: string;
            cantidad: number;
            esPrincipal: boolean;
            precioUnit: number;
            paqueteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        contratoId: string;
        precio: number;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    empresaId: string;
    estado: string;
    tipo: string;
    numero: number;
    descripcion: string;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date;
    montoTotal: number | null;
    montoMensual: number | null;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    tieneCucon: boolean;
    codigoCucon: string | null;
    facturaSinContrato: string | null;
    creadoPorId: string;
}>;
export declare function cambiarEstadoContrato(id: string, estado: string, userId: string): Promise<{
    _count: {
        beneficiarios: number;
    };
    creadoPor: {
        id: string;
        nombre: string;
        apellido: string;
    };
    empresa: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        direccion: string | null;
        ciudad: string | null;
        estado: boolean;
        tipo: string;
        nit: string;
        razonSocial: string;
        contactoTelefono: string | null;
        contactoEmail: string | null;
        sitioWeb: string | null;
        contactoNombre: string | null;
        regimenTributario: string | null;
        logoUrl: string | null;
        nombreComercial: string | null;
        contactoCargo: string | null;
        esClinicaPropia: boolean;
    };
    tarifas: {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        codigoCUPS: string;
        contratoId: string;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        precioBase: number;
        descripcionCUPS: string;
        precioNegociado: number;
    }[];
    paquetes: ({
        items: {
            id: string;
            createdAt: Date;
            codigoCUPS: string | null;
            descripcion: string;
            cantidad: number;
            esPrincipal: boolean;
            precioUnit: number;
            paqueteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        contratoId: string;
        precio: number;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    empresaId: string;
    estado: string;
    tipo: string;
    numero: number;
    descripcion: string;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date;
    montoTotal: number | null;
    montoMensual: number | null;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    tieneCucon: boolean;
    codigoCucon: string | null;
    facturaSinContrato: string | null;
    creadoPorId: string;
}>;
export declare function upsertTarifa(data: {
    contratoId: string;
    codigoCUPS: string;
    descripcionCUPS: string;
    precioBase: number;
    precioNegociado: number;
    porcentajeDescuento?: number;
    porcentajeCobertura?: number;
}): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    codigoCUPS: string;
    contratoId: string;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    precioBase: number;
    descripcionCUPS: string;
    precioNegociado: number;
}>;
export declare function deleteTarifa(contratoId: string, tarifaId: string): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    codigoCUPS: string;
    contratoId: string;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    precioBase: number;
    descripcionCUPS: string;
    precioNegociado: number;
}>;
export declare function getExcepciones(contratoId: string): Promise<({
    tarifa: {
        id: string;
        codigoCUPS: string;
        descripcionCUPS: string;
    } | null;
} & {
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    contratoId: string;
    tarifaId: string | null;
    tipoAfiliado: string;
    edadMinima: number | null;
    edadMaxima: number | null;
    sexo: string;
    aplicaCopago: boolean;
    porcentajeCopago: number;
    aplicaCuotaModeradora: boolean;
    porcentajeCuotaModeradora: number;
    numVecesMaximo: number | null;
    excluyePorEdad: boolean;
    excluyePorCotizar: boolean;
})[]>;
export declare function createExcepcion(data: {
    contratoId: string;
    tarifaId?: string;
    tipoAfiliado?: string;
    edadMinima?: number;
    edadMaxima?: number;
    sexo?: string;
    aplicaCopago?: boolean;
    porcentajeCopago?: number;
    aplicaCuotaModeradora?: boolean;
    porcentajeCuotaModeradora?: number;
    numVecesMaximo?: number;
    excluyePorEdad?: boolean;
    excluyePorCotizar?: boolean;
    observaciones?: string;
}): Promise<{
    tarifa: {
        id: string;
        codigoCUPS: string;
        descripcionCUPS: string;
    } | null;
} & {
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    contratoId: string;
    tarifaId: string | null;
    tipoAfiliado: string;
    edadMinima: number | null;
    edadMaxima: number | null;
    sexo: string;
    aplicaCopago: boolean;
    porcentajeCopago: number;
    aplicaCuotaModeradora: boolean;
    porcentajeCuotaModeradora: number;
    numVecesMaximo: number | null;
    excluyePorEdad: boolean;
    excluyePorCotizar: boolean;
}>;
export declare function deleteExcepcion(contratoId: string, excepcionId: string): Promise<{
    id: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    observaciones: string | null;
    contratoId: string;
    tarifaId: string | null;
    tipoAfiliado: string;
    edadMinima: number | null;
    edadMaxima: number | null;
    sexo: string;
    aplicaCopago: boolean;
    porcentajeCopago: number;
    aplicaCuotaModeradora: boolean;
    porcentajeCuotaModeradora: number;
    numVecesMaximo: number | null;
    excluyePorEdad: boolean;
    excluyePorCotizar: boolean;
}>;
export declare function clonarContrato(contratoOrigenId: string, data: {
    descripcion: string;
    empresaId: string;
    fechaInicio: string;
    fechaFin: string;
    creadoPorId: string;
}): Promise<({
    _count: {
        beneficiarios: number;
    };
    creadoPor: {
        id: string;
        nombre: string;
        apellido: string;
    };
    empresa: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        direccion: string | null;
        ciudad: string | null;
        estado: boolean;
        tipo: string;
        nit: string;
        razonSocial: string;
        contactoTelefono: string | null;
        contactoEmail: string | null;
        sitioWeb: string | null;
        contactoNombre: string | null;
        regimenTributario: string | null;
        logoUrl: string | null;
        nombreComercial: string | null;
        contactoCargo: string | null;
        esClinicaPropia: boolean;
    };
    tarifas: {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        codigoCUPS: string;
        contratoId: string;
        porcentajeDescuento: number;
        porcentajeCobertura: number;
        precioBase: number;
        descripcionCUPS: string;
        precioNegociado: number;
    }[];
    paquetes: ({
        items: {
            id: string;
            createdAt: Date;
            codigoCUPS: string | null;
            descripcion: string;
            cantidad: number;
            esPrincipal: boolean;
            precioUnit: number;
            paqueteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        contratoId: string;
        precio: number;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    empresaId: string;
    estado: string;
    tipo: string;
    numero: number;
    descripcion: string;
    observaciones: string | null;
    fechaInicio: Date;
    fechaFin: Date;
    montoTotal: number | null;
    montoMensual: number | null;
    diasCredito: number;
    porcentajeDescuento: number;
    porcentajeCobertura: number;
    tieneCucon: boolean;
    codigoCucon: string | null;
    facturaSinContrato: string | null;
    creadoPorId: string;
}) | null>;
export declare function createPaquete(data: {
    contratoId: string;
    nombre: string;
    descripcion?: string;
    precio: number;
    items: {
        codigoCUPS?: string;
        descripcion: string;
        cantidad: number;
        precioUnit: number;
        esPrincipal?: boolean;
    }[];
}): Promise<{
    items: {
        id: string;
        createdAt: Date;
        codigoCUPS: string | null;
        descripcion: string;
        cantidad: number;
        esPrincipal: boolean;
        precioUnit: number;
        paqueteId: string;
    }[];
} & {
    id: string;
    nombre: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    descripcion: string | null;
    contratoId: string;
    precio: number;
}>;
export declare function updatePaquete(id: string, data: {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    activo?: boolean;
}): Promise<{
    items: {
        id: string;
        createdAt: Date;
        codigoCUPS: string | null;
        descripcion: string;
        cantidad: number;
        esPrincipal: boolean;
        precioUnit: number;
        paqueteId: string;
    }[];
} & {
    id: string;
    nombre: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    descripcion: string | null;
    contratoId: string;
    precio: number;
}>;
export declare function deletePaquete(id: string): Promise<{
    id: string;
    nombre: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    descripcion: string | null;
    contratoId: string;
    precio: number;
}>;
export declare function getBeneficiarios(contratoId: string): Promise<({
    paciente: {
        id: string;
        email: string | null;
        numeroDocumento: string;
        nombreCompleto: string;
    } | null;
} & {
    id: string;
    email: string | null;
    nombre: string;
    telefono: string | null;
    createdAt: Date;
    updatedAt: Date;
    estado: string;
    pacienteId: string | null;
    documento: string;
    tipo: string;
    contratoId: string;
    tipoDoc: string;
})[]>;
export declare function addBeneficiario(data: {
    contratoId: string;
    pacienteId?: string;
    nombre: string;
    documento: string;
    tipoDoc?: string;
    email?: string;
    telefono?: string;
    tipo?: string;
}): Promise<{
    paciente: {
        id: string;
        numeroDocumento: string;
        nombreCompleto: string;
    } | null;
} & {
    id: string;
    email: string | null;
    nombre: string;
    telefono: string | null;
    createdAt: Date;
    updatedAt: Date;
    estado: string;
    pacienteId: string | null;
    documento: string;
    tipo: string;
    contratoId: string;
    tipoDoc: string;
}>;
export declare function updateBeneficiario(id: string, data: {
    estado?: string;
    email?: string;
    telefono?: string;
}): Promise<{
    id: string;
    email: string | null;
    nombre: string;
    telefono: string | null;
    createdAt: Date;
    updatedAt: Date;
    estado: string;
    pacienteId: string | null;
    documento: string;
    tipo: string;
    contratoId: string;
    tipoDoc: string;
}>;
export declare function removeBeneficiario(id: string): Promise<{
    id: string;
    email: string | null;
    nombre: string;
    telefono: string | null;
    createdAt: Date;
    updatedAt: Date;
    estado: string;
    pacienteId: string | null;
    documento: string;
    tipo: string;
    contratoId: string;
    tipoDoc: string;
}>;
export declare function getStats(): Promise<{
    totalContratos: number;
    activos: number;
    porVencer: number;
    empresas: number;
}>;
