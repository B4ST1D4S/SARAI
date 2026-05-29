import { PrismaClient } from '@prisma/client';

// Singleton: una sola instancia compartida en todo el proceso
const prisma = new PrismaClient();

export default prisma;
