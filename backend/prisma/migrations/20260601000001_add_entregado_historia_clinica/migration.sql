-- AlterTable
ALTER TABLE "HistoriaClinica" ADD COLUMN IF NOT EXISTS "entregadoEn" TIMESTAMP(3);
ALTER TABLE "HistoriaClinica" ADD COLUMN IF NOT EXISTS "entregadoPor" TEXT;
