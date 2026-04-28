-- DropForeignKey
ALTER TABLE "Paciente" DROP CONSTRAINT "Paciente_creadoPor_fkey";

-- AlterTable
ALTER TABLE "Paciente" ALTER COLUMN "creadoPor" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
