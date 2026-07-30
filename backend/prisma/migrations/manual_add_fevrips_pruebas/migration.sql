-- ============================================================
--  MIGRACIÓN: Datos de prueba para integración FEV-RIPS (Docker API MSPS)
--  Aplica en: Supabase SQL Editor (o script node con el pooler, ya que
--  prisma migrate no puede conectar directo por IPv6 en algunas redes)
-- ============================================================

-- CreateTable
CREATE TABLE "UsuarioSispro" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoIdentificacion" TEXT NOT NULL DEFAULT 'CC',
    "numeroIdentificacion" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "tipoUsuario" TEXT,
    "ambiente" TEXT NOT NULL DEFAULT 'STAGE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioSispro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSispro_numeroIdentificacion_nit_ambiente_key" ON "UsuarioSispro"("numeroIdentificacion", "nit", "ambiente");
CREATE INDEX "UsuarioSispro_nit_idx" ON "UsuarioSispro"("nit");

-- CreateTable
CREATE TABLE "RipsPrueba" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'FacturaElectronica',
    "numDocumentoIdObligado" TEXT NOT NULL,
    "numFactura" TEXT,
    "tipoNota" TEXT,
    "numNota" TEXT,
    "ripsJson" JSONB NOT NULL,
    "xmlFevFile" TEXT,
    "ultimoResultado" JSONB,
    "cuv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RipsPrueba_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RipsPrueba_numFactura_idx" ON "RipsPrueba"("numFactura");
CREATE INDEX "RipsPrueba_modulo_idx" ON "RipsPrueba"("modulo");
