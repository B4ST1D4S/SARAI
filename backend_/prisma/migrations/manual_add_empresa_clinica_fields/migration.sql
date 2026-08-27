-- ============================================================
--  MIGRACIÓN: Campos de "Datos de la Clínica" en Empresa
--  Aplica en: Supabase SQL Editor (o script node con prisma migrate
--  no puede conectar directo por IPv6 en algunas redes; usar el pooler)
-- ============================================================

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "esClinicaPropia" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "sitioWeb" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "regimenTributario" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
