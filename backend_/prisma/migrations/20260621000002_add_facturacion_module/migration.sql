-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "citaId" TEXT,
    "medicoId" TEXT,
    "tipoIngreso" TEXT NOT NULL DEFAULT 'AMBULATORIO',
    "entidad" TEXT,
    "plan" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEgreso" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "ingresoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaItem" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "cargoId" TEXT,
    "codigo" TEXT,
    "descripcion" TEXT NOT NULL,
    "departamento" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precioUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "prefijo" TEXT NOT NULL DEFAULT 'FE',
    "cuentaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "entidad" TEXT,
    "plan" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ingreso_numero_key" ON "Ingreso"("numero");

-- CreateIndex
CREATE INDEX "Ingreso_pacienteId_idx" ON "Ingreso"("pacienteId");

-- CreateIndex
CREATE INDEX "Ingreso_citaId_idx" ON "Ingreso"("citaId");

-- CreateIndex
CREATE INDEX "Ingreso_estado_idx" ON "Ingreso"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_numero_key" ON "Cuenta"("numero");

-- CreateIndex
CREATE INDEX "Cuenta_ingresoId_idx" ON "Cuenta"("ingresoId");

-- CreateIndex
CREATE INDEX "Cuenta_estado_idx" ON "Cuenta"("estado");

-- CreateIndex
CREATE INDEX "CuentaItem_cuentaId_idx" ON "CuentaItem"("cuentaId");

-- CreateIndex
CREATE INDEX "CuentaItem_cargoId_idx" ON "CuentaItem"("cargoId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_cuentaId_key" ON "Factura"("cuentaId");

-- CreateIndex
CREATE INDEX "Factura_pacienteId_idx" ON "Factura"("pacienteId");

-- CreateIndex
CREATE INDEX "Factura_estado_idx" ON "Factura"("estado");

-- CreateIndex
CREATE INDEX "Factura_fecha_idx" ON "Factura"("fecha");

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_ingresoId_fkey" FOREIGN KEY ("ingresoId") REFERENCES "Ingreso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaItem" ADD CONSTRAINT "CuentaItem_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaItem" ADD CONSTRAINT "CuentaItem_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "TarifaCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

