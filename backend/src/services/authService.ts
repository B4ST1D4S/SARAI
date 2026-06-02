import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';
import { Role } from '@prisma/client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  username?: string;
  password: string;
  nombre: string;
  apellido: string;
  rol?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export async function loginUser(request: LoginRequest): Promise<AuthResponse | null> {
  try {
    // Buscar por username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: request.username.trim().toLowerCase(), mode: 'insensitive' },
      },
    });

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(request.password, user.password);

    if (!passwordMatch) {
      return null;
    }

    if (!user.activo) {
      throw new Error('Usuario inactivo');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: (user.email ?? user.username) as string,
      rol: user.rol as string,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username as string,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol as string,
      },
    };
  } catch (error) {
    console.error('Error en login:', error);
    return null;
  }
}

export async function registerUser(request: RegisterRequest): Promise<AuthResponse | null> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: request.email },
    });

    if (existingUser) {
      throw new Error('Email ya registrado');
    }

    const hashedPassword = await bcrypt.hash(request.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: request.email,
        password: hashedPassword,
        nombre: request.nombre,
        apellido: request.apellido,
        rol: (request.rol || 'PACIENTE') as Role,
        activo: true,
      },
    });

    const tokenPayload: TokenPayload = {
      userId: newUser.id,
      email: (newUser.email ?? newUser.username) as string,
      rol: newUser.rol as string,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username as string,
        nombre: newUser.nombre as string,
        apellido: newUser.apellido as string,
        rol: newUser.rol as string,
      },
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return null;
  }
}
