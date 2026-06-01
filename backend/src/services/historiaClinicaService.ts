import prisma from '../lib/prisma.ts';

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

export async function createHistoriaClinica(data: CreateHistoriaClinicaRequest) {
  try {
    const historia = await prisma.historiaClinica.create({
      data: {
        pacienteId: data.pacienteId,
        editadoPor: data.medicoId,
        tipoHistoria: data.tipoHistoria,
        contenido: {
          tipoConsulta: data.tipoConsulta,
          quejaPrincipal: data.quejaPrincipal,
          historiaEnfermedad: data.historiaEnfermedad,
          observacionesAntropometricas: data.observacionesAntropometricas,
          diagnostico: data.diagnostico,
          tratamientoRecomendado: data.tratamientoRecomendado,
          fotos: data.fotos || [],
          ...(data.datosExtendidos || {}),
        },
        version: 1,
        hashIntegridad: 'hash_' + Date.now(),
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            numeroDocumento: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
    return historia;
  } catch (error: any) {
    console.error('Error creando historia clínica:', error);
    throw new Error(error.message || 'Error al crear historia clínica');
  }
}

export async function getHistoriaClinicaById(id: string) {
  try {
    const historia = await prisma.historiaClinica.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            numeroDocumento: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
    return historia;
  } catch (error: any) {
    console.error('Error obteniendo historia clínica:', error);
    throw new Error(error.message || 'Error al obtener historia clínica');
  }
}

export async function getHistoriasPaciente(pacienteId: string) {
  try {
    const historias = await prisma.historiaClinica.findMany({
      where: { pacienteId },
      orderBy: { fechaCreacion: 'desc' },
      include: {
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            numeroDocumento: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
    return historias;
  } catch (error: any) {
    console.error('Error obteniendo historias del paciente:', error);
    throw new Error(error.message || 'Error al obtener historias');
  }
}

export async function getHistoriasPorMedico(
  medicoId: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const skip = (page - 1) * limit;

    const [historias, total] = await Promise.all([
      prisma.historiaClinica.findMany({
        where: { editadoPor: medicoId },
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombreCompleto: true,
              numeroDocumento: true,
            },
          },
        },
      }),
      prisma.historiaClinica.count({
        where: { editadoPor: medicoId },
      }),
    ]);

    return {
      historias,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error('Error obteniendo historias por médico:', error);
    throw new Error(error.message || 'Error al obtener historias');
  }
}

export async function updateHistoriaClinica(
  id: string,
  medicoId: string,
  data: UpdateHistoriaClinicaRequest
) {
  try {
    const historia = await prisma.historiaClinica.update({
      where: { id },
      data: {
        contenido: {
          ...((await prisma.historiaClinica.findUnique({ where: { id }, select: { contenido: true } }))?.contenido as any || {}),
          ...(data.tipoConsulta && { tipoConsulta: data.tipoConsulta }),
          ...(data.quejaPrincipal && { quejaPrincipal: data.quejaPrincipal }),
          ...(data.historiaEnfermedad !== undefined && { historiaEnfermedad: data.historiaEnfermedad }),
          ...(data.observacionesAntropometricas !== undefined && { observacionesAntropometricas: data.observacionesAntropometricas }),
          ...(data.diagnostico !== undefined && { diagnostico: data.diagnostico }),
          ...(data.tratamientoRecomendado !== undefined && { tratamientoRecomendado: data.tratamientoRecomendado }),
          ...(data.datosExtendidos || {}),
        } as any,
        version: { increment: 1 },
        editadoPor: medicoId,
        hashIntegridad: 'hash_' + Date.now(),
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            numeroDocumento: true,
          },
        },
      },
    });
    return historia;
  } catch (error: any) {
    console.error('Error actualizando historia clínica:', error);
    throw new Error(error.message || 'Error al actualizar historia clínica');
  }
}

// Entregar historia clínica a paciente
export async function entregarHistoriaClinica(id: string, medicoId: string) {
  try {
    const historia = await prisma.historiaClinica.update({
      where: { id },
      data: {
        entregadoEn: new Date(),
        entregadoPor: medicoId,
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });
    return historia;
  } catch (error: any) {
    console.error('Error entregando historia clínica:', error);
    throw new Error(error.message || 'Error al entregar historia clínica');
  }
}

