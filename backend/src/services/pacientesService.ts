import prisma from '../lib/prisma.ts';

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

export async function createPaciente(data: CreatePacienteRequest) {
  try {
    const paciente = await prisma.paciente.create({
      data: {
        numeroDocumento: data.numeroDocumento,
        tipoDocumento: data.tipoDocumento,
        nombreCompleto: data.nombreCompleto,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : new Date('1900-01-01'),
        genero: data.genero || 'No especificado',
        telefonos: data.telefonos,
        email: data.email,
        whatsapp: data.whatsapp,
        direccion: data.direccion,
        ciudad: data.ciudad,
        creadoPor: data.creadoPor,
      },
    });
    return paciente;
  } catch (error: any) {
    console.error('Error creando paciente:', error);
    throw new Error(error.message || 'Error al crear paciente');
  }
}

export async function getPacienteById(id: string) {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
      include: {
        alergias: true,
        medicacionActual: true,
        antecedentes: true,
      },
    });
    return paciente;
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    return null;
  }
}

export async function getAllPacientes(skip: number = 0, take: number = 10) {
  try {
    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paciente.count(),
    ]);

    return {
      pacientes,
      total,
      page: Math.ceil(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    return null;
  }
}

export async function updatePaciente(id: string, data: UpdatePacienteRequest) {
  try {
    const paciente = await prisma.paciente.update({
      where: { id },
      data: {
        nombreCompleto: data.nombreCompleto,
        telefonos: data.telefonos,
        email: data.email,
        whatsapp: data.whatsapp,
        direccion: data.direccion,
        ciudad: data.ciudad,
        updatedAt: new Date(),
      },
    });
    return paciente;
  } catch (error: any) {
    console.error('Error actualizando paciente:', error);
    throw new Error(error.message || 'Error al actualizar paciente');
  }
}

export async function deletePaciente(id: string) {
  try {
    await prisma.paciente.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando paciente:', error);
    throw new Error(error.message || 'Error al eliminar paciente');
  }
}

export async function searchPacientes(query: string) {
  try {
    const pacientes = await prisma.paciente.findMany({
      where: {
        OR: [
          { nombreCompleto: { contains: query, mode: 'insensitive' } },
          { numeroDocumento: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    return pacientes;
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    return [];
  }
}
