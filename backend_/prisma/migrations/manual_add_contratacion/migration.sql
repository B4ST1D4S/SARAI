-- ============================================================
--  MIGRACIÓN: Módulo de Contratación
--  Aplica en: Supabase SQL Editor
-- ============================================================

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "nit" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'EMPRESA',
    "contactoNombre" TEXT,
    "contactoCargo" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'CONVENIO',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "montoTotal" DOUBLE PRECISION,
    "montoMensual" DOUBLE PRECISION,
    "diasCredito" INTEGER NOT NULL DEFAULT 30,
    "porcentajeDescuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentajeCobertura" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "observaciones" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoTarifa" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "codigoCUPS" TEXT NOT NULL,
    "descripcionCUPS" TEXT NOT NULL,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "precioNegociado" DOUBLE PRECISION NOT NULL,
    "porcentajeDescuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentajeCobertura" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoTarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoPaquete" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoPaquete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoPaqueteItem" (
    "id" TEXT NOT NULL,
    "paqueteId" TEXT NOT NULL,
    "codigoCUPS" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precioUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratoPaqueteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoBeneficiario" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "pacienteId" TEXT,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "tipoDoc" TEXT NOT NULL DEFAULT 'CC',
    "email" TEXT,
    "telefono" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'BENEFICIARIO',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoBeneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nit_key" ON "Empresa"("nit");
CREATE INDEX "Empresa_nit_idx" ON "Empresa"("nit");
CREATE INDEX "Empresa_estado_idx" ON "Empresa"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_numero_key" ON "Contrato"("numero");
CREATE INDEX "Contrato_empresaId_idx" ON "Contrato"("empresaId");
CREATE INDEX "Contrato_estado_idx" ON "Contrato"("estado");
CREATE INDEX "Contrato_fechaFin_idx" ON "Contrato"("fechaFin");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoTarifa_contratoId_codigoCUPS_key" ON "ContratoTarifa"("contratoId", "codigoCUPS");
CREATE INDEX "ContratoTarifa_contratoId_idx" ON "ContratoTarifa"("contratoId");
CREATE INDEX "ContratoTarifa_codigoCUPS_idx" ON "ContratoTarifa"("codigoCUPS");

-- CreateIndex
CREATE INDEX "ContratoPaquete_contratoId_idx" ON "ContratoPaquete"("contratoId");
CREATE INDEX "ContratoPaqueteItem_paqueteId_idx" ON "ContratoPaqueteItem"("paqueteId");

-- CreateIndex
CREATE INDEX "ContratoBeneficiario_contratoId_idx" ON "ContratoBeneficiario"("contratoId");
CREATE INDEX "ContratoBeneficiario_pacienteId_idx" ON "ContratoBeneficiario"("pacienteId");
CREATE INDEX "ContratoBeneficiario_documento_idx" ON "ContratoBeneficiario"("documento");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_creadoPorId_fkey"
    FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContratoTarifa" ADD CONSTRAINT "ContratoTarifa_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContratoPaquete" ADD CONSTRAINT "ContratoPaquete_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContratoPaqueteItem" ADD CONSTRAINT "ContratoPaqueteItem_paqueteId_fkey"
    FOREIGN KEY ("paqueteId") REFERENCES "ContratoPaquete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContratoBeneficiario" ADD CONSTRAINT "ContratoBeneficiario_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContratoBeneficiario" ADD CONSTRAINT "ContratoBeneficiario_pacienteId_fkey"
    FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
