import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'medico@estegia.com' },
      data: { username: 'medico@estegia.com' },
    });
    
    console.log('✅ Usuario actualizado:');
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
