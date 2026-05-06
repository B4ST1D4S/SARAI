import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const hashed = await bcrypt.hash('123456', 12);

  const existing = await prisma.user.findFirst({ where: { username: 'demo' } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed, username: 'demo' },
    });
    console.log('✓ Usuario demo actualizado con contraseña hasheada');
  } else {
    await prisma.user.create({
      data: {
        username: 'demo',
        email: 'demo@sarai.local',
        password: hashed,
        nombre: 'Demo',
        apellido: 'Usuario',
        rol: 'MEDICO',
      },
    });
    console.log('✓ Usuario demo creado');
  }

  const users = await prisma.user.findMany({
    select: { username: true, email: true, rol: true },
  });
  console.log('\nUsuarios en la BD:');
  users.forEach(u => console.log(`  - ${u.username} (${u.email}) [${u.rol}]`));
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
