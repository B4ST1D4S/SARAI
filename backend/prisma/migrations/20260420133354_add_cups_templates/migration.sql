-- DropIndex
DROP INDEX "Integracion_tipo_key";

-- AlterTable
ALTER TABLE "HistoriaClinica" ADD COLUMN     "plantillaId" TEXT;

-- AlterTable
ALTER TABLE "Procedimiento" ADD COLUMN     "codigoCUPS" TEXT;

-- CreateTable
CREATE TABLE "ProcedimientoCUPS" (
    "id" TEXT NOT NULL,
    "codigoCUPS" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoCategoria" TEXT NOT NULL,
    "riesgoNivel" TEXT NOT NULL,
    "diasSeguimiento" INTEGER NOT NULL DEFAULT 30,
    "datosAdicionales" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedimientoCUPS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaTemplate" (
    "id" TEXT NOT NULL,
    "codigoCUPS" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "seccionesJSON" JSONB NOT NULL,
    "requiereSignatura" BOOLEAN NOT NULL DEFAULT false,
    "requiereFoto" BOOLEAN NOT NULL DEFAULT false,
    "requiereMapaCorporal" BOOLEAN NOT NULL DEFAULT false,
    "ordenVisualizacion" INTEGER NOT NULL DEFAULT 1,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "codigoCUPS" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "itemsJSON" JSONB NOT NULL,
    "alertasAutomaticasJSON" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentimientoTemplate" (
    "id" TEXT NOT NULL,
    "codigoCUPS" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "seccionesJSON" JSONB NOT NULL,
    "riesgosJSON" JSONB NOT NULL,
    "recomendacionesJSON" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentimientoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionSistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistCompletado" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "respuestasJSON" JSONB,
    "completadoEn" TIMESTAMP(3),
    "completadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistCompletado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcedimientoCUPS_codigoCUPS_key" ON "ProcedimientoCUPS"("codigoCUPS");

-- CreateIndex
CREATE INDEX "ProcedimientoCUPS_codigoCUPS_idx" ON "ProcedimientoCUPS"("codigoCUPS");

-- CreateIndex
CREATE INDEX "ProcedimientoCUPS_tipoCategoria_idx" ON "ProcedimientoCUPS"("tipoCategoria");

-- CreateIndex
CREATE INDEX "ProcedimientoCUPS_activo_idx" ON "ProcedimientoCUPS"("activo");

-- CreateIndex
CREATE INDEX "PlantillaTemplate_codigoCUPS_idx" ON "PlantillaTemplate"("codigoCUPS");

-- CreateIndex
CREATE INDEX "PlantillaTemplate_tipo_idx" ON "PlantillaTemplate"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaTemplate_codigoCUPS_tipo_key" ON "PlantillaTemplate"("codigoCUPS", "tipo");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_codigoCUPS_idx" ON "ChecklistTemplate"("codigoCUPS");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTemplate_codigoCUPS_fase_key" ON "ChecklistTemplate"("codigoCUPS", "fase");

-- CreateIndex
CREATE INDEX "ConsentimientoTemplate_codigoCUPS_idx" ON "ConsentimientoTemplate"("codigoCUPS");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentimientoTemplate_codigoCUPS_key" ON "ConsentimientoTemplate"("codigoCUPS");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionSistema_clave_key" ON "ConfiguracionSistema"("clave");

-- CreateIndex
CREATE INDEX "ConfiguracionSistema_clave_idx" ON "ConfiguracionSistema"("clave");

-- CreateIndex
CREATE INDEX "ChecklistCompletado_procedimientoId_idx" ON "ChecklistCompletado"("procedimientoId");

-- CreateIndex
CREATE INDEX "ChecklistCompletado_completadoEn_idx" ON "ChecklistCompletado"("completadoEn");

-- CreateIndex
CREATE INDEX "HistoriaClinica_plantillaId_idx" ON "HistoriaClinica"("plantillaId");

-- CreateIndex
CREATE INDEX "Procedimiento_codigoCUPS_idx" ON "Procedimiento"("codigoCUPS");

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_codigoCUPS_fkey" FOREIGN KEY ("codigoCUPS") REFERENCES "ProcedimientoCUPS"("codigoCUPS") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "PlantillaTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaTemplate" ADD CONSTRAINT "PlantillaTemplate_codigoCUPS_fkey" FOREIGN KEY ("codigoCUPS") REFERENCES "ProcedimientoCUPS"("codigoCUPS") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_codigoCUPS_fkey" FOREIGN KEY ("codigoCUPS") REFERENCES "ProcedimientoCUPS"("codigoCUPS") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentimientoTemplate" ADD CONSTRAINT "ConsentimientoTemplate_codigoCUPS_fkey" FOREIGN KEY ("codigoCUPS") REFERENCES "ProcedimientoCUPS"("codigoCUPS") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCompletado" ADD CONSTRAINT "ChecklistCompletado_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
