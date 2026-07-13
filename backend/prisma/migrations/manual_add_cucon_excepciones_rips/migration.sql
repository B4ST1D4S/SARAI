-- ============================================================
--  MIGRACIÓN: CUCON/factura-sin-contrato, ContratoExcepcion (rangos
--  por tipo de afiliado, copagos/cuotas moderadoras) y campos RIPS en CuentaItem
--  Aplica en: Supabase SQL Editor (o script node con el pooler, ya que
--  prisma migrate no puede conectar directo por IPv6 en algunas redes)
-- ============================================================

-- AlterTable: CUCON / factura sin contrato
ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "tieneCucon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "codigoCucon" TEXT;
ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "facturaSinContrato" TEXT;

-- CreateTable: ContratoExcepcion
CREATE TABLE "ContratoExcepcion" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tarifaId" TEXT,
    "tipoAfiliado" TEXT NOT NULL DEFAULT 'AMBOS',
    "edadMinima" INTEGER,
    "edadMaxima" INTEGER,
    "sexo" TEXT NOT NULL DEFAULT 'AMBOS',
    "aplicaCopago" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeCopago" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aplicaCuotaModeradora" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeCuotaModeradora" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numVecesMaximo" INTEGER,
    "excluyePorEdad" BOOLEAN NOT NULL DEFAULT false,
    "excluyePorCotizar" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoExcepcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContratoExcepcion_contratoId_idx" ON "ContratoExcepcion"("contratoId");
CREATE INDEX "ContratoExcepcion_tarifaId_idx" ON "ContratoExcepcion"("tarifaId");

-- AddForeignKey
ALTER TABLE "ContratoExcepcion" ADD CONSTRAINT "ContratoExcepcion_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContratoExcepcion" ADD CONSTRAINT "ContratoExcepcion_tarifaId_fkey"
    FOREIGN KEY ("tarifaId") REFERENCES "ContratoTarifa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: campos RIPS en CuentaItem
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "codDiagnosticoPrincipal" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "finalidadTecnologiaSalud" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "viaIngresoServicioSalud" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "numAutorizacion" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "codPrestador" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "conceptoRecaudo" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "valorPagoModerador" DOUBLE PRECISION;
