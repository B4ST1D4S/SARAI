-- CreateTable
CREATE TABLE IF NOT EXISTS "Cotizacion" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "citaId" TEXT,
    "descripcionServicio" TEXT NOT NULL,
    "lineas" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuentoPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuentoValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "notasAdicionales" TEXT,
    "vigenciaHasta" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'GENERADA',
    "aceptadaEn" TIMESTAMP(3),
    "rechazadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cotizacion_pacienteId_idx" ON "Cotizacion"("pacienteId");
CREATE INDEX IF NOT EXISTS "Cotizacion_medicoId_idx" ON "Cotizacion"("medicoId");
CREATE INDEX IF NOT EXISTS "Cotizacion_estado_idx" ON "Cotizacion"("estado");
CREATE INDEX IF NOT EXISTS "Cotizacion_creadoEn_idx" ON "Cotizacion"("creadoEn");

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT IF NOT EXISTS "Cotizacion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cotizacion" ADD CONSTRAINT IF NOT EXISTS "Cotizacion_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
