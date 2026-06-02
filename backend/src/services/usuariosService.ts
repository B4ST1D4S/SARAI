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
} as const;

const USER_SELECT_WITH_FIRMA = {
  ...USER_SELECT,
  firmaBase64: true,
} as const;

export interface CreateUserDto {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  rol: string;
  especialidad?: string;
  // Campos profesionales
  tipoDocumento?: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  registroMedico?: string;
  firmaBase64?: string;
}

export interface UpdateUserDto {
  password?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  rol?: string;
  especialidad?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  registroMedico?: string;
  firmaBase64?: string;
  activo?: boolean;
}

export async function createUser(data: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const { password, ...rest } = data;

  return prisma.user.create({
    data: {
      ...rest,
      password: hashedPassword,
      rol: rest.rol as any,
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

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: USER_SELECT_WITH_FIRMA,
  });
}

export async function updateUser(id: string, data: UpdateUserDto) {
  const updateData: any = { ...data };

  if (data.password && data.password.trim() !== '') {
    updateData.password = await bcrypt.hash(data.password, 12);
  } else {
    delete updateData.password;
  }

  if (data.rol) {
    updateData.rol = data.rol as any;
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT_WITH_FIRMA,
  });
}

export async function toggleUserStatus(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { activo: true },
  });

  if (!user) throw new Error('Usuario no encontrado');

  return prisma.user.update({
    where: { id },
    data: { activo: !user.activo },
    select: { id: true, activo: true },
  });
}
