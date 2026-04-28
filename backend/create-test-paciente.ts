import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Crear paciente de prueba
    const paciente = await prisma.paciente.create({
      data: {
        numeroDocumento: '3001234567',
        tipoDocumento: 'CC',
        nombreCompleto: 'Juan Pérez García',
        fechaNacimiento: new Date('1990-05-15'),
        genero: 'M',
        telefonos: ['3101234567'],
        email: 'juan.perez@example.com',
        whatsapp: '3101234567',
        direccion: 'Calle 123 #456',
        ciudad: 'Bogotá',
      },
    });
    console.log('✅ Paciente de prueba creado:', paciente);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Paciente ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  await prisma.$disconnect();
}

main();
