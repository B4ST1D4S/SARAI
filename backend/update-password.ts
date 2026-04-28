import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash de la contraseña "123456"
    const hashedPassword = await bcryptjs.hash('123456', 10);
    
    // Actualizar usuario
    const user = await prisma.user.update({
      where: { email: 'medico@estegia.com' },
      data: {
        password: hashedPassword,
      },
    });
    console.log('✅ Contraseña actualizada para usuario:', user.email);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  await prisma.$disconnect();
}

main();
