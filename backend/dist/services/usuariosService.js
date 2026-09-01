import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
// Campos que se devuelven (nunca la contraseña)
const USER_SELECT = {
    id: true,
    username: true,
    nombre: true,
    apellido: true,
    email: true,
    telefono: true,
    rol: true,
    especialidad: true,
    tipoDocumento: true,
    numeroDocumento: true,
    registroProfesional: true,
    registroMedico: true,
    activo: true,
    createdAt: true,
    updatedAt: true,
    perfilId: true,
    perfil: { select: { id: true, nombre: true } },
};
const USER_SELECT_WITH_FIRMA = {
    ...USER_SELECT,
    firmaBase64: true,
};
export async function createUser(data) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const { password, ...rest } = data;
    return prisma.user.create({
        data: {
            ...rest,
            password: hashedPassword,
            rol: rest.rol,
        },
        select: USER_SELECT_WITH_FIRMA,
    });
}
export async function getAllUsers() {
    return prisma.user.findMany({
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
    });
}
export async function getUserById(id) {
    return prisma.user.findUnique({
        where: { id },
        select: USER_SELECT_WITH_FIRMA,
    });
}
export async function updateUser(id, data) {
    const updateData = { ...data };
    if (data.password && data.password.trim() !== '') {
        updateData.password = await bcrypt.hash(data.password, 12);
    }
    else {
        delete updateData.password;
    }
    if (data.rol) {
        updateData.rol = data.rol;
    }
    // perfilId vacío → null (desasignar perfil)
    if ('perfilId' in updateData) {
        updateData.perfilId = updateData.perfilId || null;
    }
    return prisma.user.update({
        where: { id },
        data: updateData,
        select: USER_SELECT_WITH_FIRMA,
    });
}
export async function toggleUserStatus(id) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { activo: true },
    });
    if (!user)
        throw new Error('Usuario no encontrado');
    return prisma.user.update({
        where: { id },
        data: { activo: !user.activo },
        select: { id: true, activo: true },
    });
}
