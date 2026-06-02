import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';

const prisma = new PrismaClient();

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
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
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export async function loginUser(request: LoginRequest): Promise<AuthResponse | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: request.email },
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
      userId: user.id as string,
      email: user.email as string,
      rol: user.rol as string,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id as string,
        email: user.email as string,
        nombre: user.nombre as string,
        apellido: user.apellido as string,
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
      userId: newUser.id as string,
      email: newUser.email as string,
      rol: newUser.rol as string,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id as string,
        email: newUser.email as string,
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
