import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario de prueba con el mismo ID que usamos en el token
  try {
    const user = await prisma.user.create({
      data: {
        id: 'test-user-123',
        email: 'test@estegia.com',
        password: await bcryptjs.hash('123456', 10),
        nombre: 'Test',
        apellido: 'User',
        rol: 'MEDICO',
        numeroDocumento: '9999999999',
        especialidad: 'Cirugía Estética',
        telefono: '3101234567',
        activo: true,
      },
    });
    console.log('✅ Usuario de prueba creado:', user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Usuario ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  await prisma.$disconnect();
}

main();
