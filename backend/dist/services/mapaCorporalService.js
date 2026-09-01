import prisma from '../lib/prisma.js';
/**
 * Crear o actualizar mapa corporal para un procedimiento
 */
export async function saveMapaCorporal(data) {
    try {
        // Buscar mapa existente: por procedimientoId+pacienteId si hay procedimiento, sino solo por pacienteId
        let existente;
        if (data.procedimientoId) {
            existente = await prisma.mapaCorporal.findFirst({
                where: { procedimientoId: data.procedimientoId, pacienteId: data.pacienteId },
            });
        }
        else {
            // Sin procedimiento: tomar el mapa más reciente del paciente sin procedimientoId
            const todos = await prisma.mapaCorporal.findMany({
                where: { pacienteId: data.pacienteId },
                orderBy: { createdAt: 'desc' },
            });
            existente = todos.find((m) => !m.procedimientoId) || null;
        }
        if (existente) {
            // Actualizar si existe
            return await prisma.mapaCorporal.update({
                where: { id: existente.id },
                data: {
                    zonasMarcadas: data.zonasMarcadas,
                    edemaZonas: data.edemaZonas || [],
                    fibrosisZonas: data.fibrosisZonas || [],
                    dolorZonas: data.dolorZonas || [],
                    anotacionesClinics: data.anotacionesClinics,
                    updatedAt: new Date(),
                },
                include: {
                    paciente: {
                        select: { id: true, nombreCompleto: true, numeroDocumento: true },
                    },
                    procedimiento: true,
                },
            });
        }
        else {
            // Crear nuevo si no existe
            return await prisma.mapaCorporal.create({
                data: {
                    pacienteId: data.pacienteId,
                    procedimientoId: data.procedimientoId || null,
                    fechaEvaluacion: new Date(),
                    evaluadoPor: data.medicoId,
                    zonasMarcadas: data.zonasMarcadas,
                    edemaZonas: data.edemaZonas || [],
                    fibrosisZonas: data.fibrosisZonas || [],
                    dolorZonas: data.dolorZonas || [],
                    anotacionesClinics: data.anotacionesClinics,
                },
                include: {
                    paciente: {
                        select: { id: true, nombreCompleto: true, numeroDocumento: true },
                    },
                    procedimiento: true,
                },
            });
        }
    }
    catch (error) {
        console.error('Error guardando mapa corporal:', error);
        throw new Error(error.message || 'Error al guardar mapa corporal');
    }
}
/**
 * Obtener mapa corporal por procedimiento
 */
export async function getMapaCorporalByProcedimiento(procedimientoId, pacienteId) {
    try {
        const mapaCorporal = await prisma.mapaCorporal.findFirst({
            where: {
                procedimientoId,
                pacienteId,
            },
            include: {
                paciente: {
                    select: { id: true, nombreCompleto: true, numeroDocumento: true },
                },
                procedimiento: true,
            },
        });
        return mapaCorporal;
    }
    catch (error) {
        console.error('Error obteniendo mapa corporal:', error);
        throw new Error(error.message || 'Error al obtener mapa corporal');
    }
}
/**
 * Obtener todos los mapas corporales de un paciente
 */
export async function getMapaCorporalPorPaciente(pacienteId) {
    try {
        const mapas = await prisma.mapaCorporal.findMany({
            where: { pacienteId },
            include: {
                paciente: {
                    select: { id: true, nombreCompleto: true, numeroDocumento: true },
                },
                procedimiento: true,
            },
            orderBy: { fechaEvaluacion: 'desc' },
        });
        return mapas;
    }
    catch (error) {
        console.error('Error obteniendo mapas corporales del paciente:', error);
        throw new Error(error.message || 'Error al obtener mapas corporales');
    }
}
/**
 * Actualizar mapa corporal existente
 */
export async function updateMapaCorporal(id, data) {
    try {
        const updated = await prisma.mapaCorporal.update({
            where: { id },
            data: {
                zonasMarcadas: data.zonasMarcadas,
                edemaZonas: data.edemaZonas,
                fibrosisZonas: data.fibrosisZonas,
                dolorZonas: data.dolorZonas,
                anotacionesClinics: data.anotacionesClinics,
                updatedAt: new Date(),
            },
            include: {
                paciente: {
                    select: { id: true, nombreCompleto: true, numeroDocumento: true },
                },
                procedimiento: true,
            },
        });
        return updated;
    }
    catch (error) {
        console.error('Error actualizando mapa corporal:', error);
        throw new Error(error.message || 'Error al actualizar mapa corporal');
    }
}
/**
 * Eliminar mapa corporal
 */
export async function deleteMapaCorporal(id) {
    try {
        await prisma.mapaCorporal.delete({
            where: { id },
        });
        return { message: 'Mapa corporal eliminado correctamente' };
    }
    catch (error) {
        console.error('Error eliminando mapa corporal:', error);
        throw new Error(error.message || 'Error al eliminar mapa corporal');
    }
}
