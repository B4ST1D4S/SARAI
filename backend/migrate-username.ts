import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Aplicando migración: añadir campo username...');

  // 1. Agregar columna username como nullable
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
  `);
  console.log('✓ Columna username agregada (nullable)');

  // 2. Rellenar username con el prefijo del email para filas existentes
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "username" = SPLIT_PART("email", '@', 1)
    WHERE "username" IS NULL AND "email" IS NOT NULL;
  `);
  console.log('✓ Username derivado del email para usuarios existentes');

  // 3. Fallback: si aún hay nulls, usar el id truncado
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "username" = CONCAT('user_', SUBSTRING("id", 1, 8))
    WHERE "username" IS NULL;
  `);

  // 4. Hacer NOT NULL
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
  `);
  console.log('✓ Columna username marcada como NOT NULL');

  // 5. Agregar constraint UNIQUE si no existe
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'User' AND indexname = 'User_username_key'
      ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
      END IF;
    END$$;
  `);
  console.log('✓ Constraint UNIQUE en username');

  // 6. Crear índice si no existe
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");
  `);
  console.log('✓ Índice en username');

  // 7. Hacer email opcional (nullable) — ya debería ser si así está en schema
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
  `);
  console.log('✓ Email marcado como opcional (nullable)');

  console.log('\n✅ Migración completada exitosamente');

  // Mostrar usuarios actuales
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, rol: true } });
  console.log('\nUsuarios en la base de datos:');
  users.forEach(u => console.log(`  - ${u.username} (${u.email ?? 'sin email'}) [${u.rol}]`));
}

main()
  .catch(err => {
    console.error('Error en migración:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
