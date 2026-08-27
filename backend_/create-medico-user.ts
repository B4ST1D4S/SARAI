import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'medico@estegia.com',
        password: await bcryptjs.hash('123456', 10),
        nombre: 'Médico',
        apellido: 'Demo',
        rol: 'MEDICO',
        numeroDocumento: '1234567890',
        especialidad: 'Cirugía Estética',
        telefono: '3101234567',
        activo: true,
      },
    });
    console.log('✅ Usuario médico creado:', user);
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
