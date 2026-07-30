-- CreateTable
CREATE TABLE "TarifaGrupo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaTipo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "grupoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaTipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaCargo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cupsCodigoId" TEXT,
    "cupsCodigoStr" TEXT,
    "grupoId" TEXT,
    "tipoId" TEXT,
    "nivel" TEXT,
    "tipoUnidad" TEXT,
    "conceptoRips" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarifario" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT,
    "baseId" TEXT,
    "porcentaje" DOUBLE PRECISION,
    "vigenciaDesde" TIMESTAMP(3),
    "vigenciaHasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarifario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaItem" (
    "id" TEXT NOT NULL,
    "tarifarioId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TarifaGrupo_codigo_key" ON "TarifaGrupo"("codigo");

-- CreateIndex
CREATE INDEX "TarifaGrupo_activo_idx" ON "TarifaGrupo"("activo");

-- CreateIndex
CREATE INDEX "TarifaTipo_grupoId_idx" ON "TarifaTipo"("grupoId");

-- CreateIndex
CREATE INDEX "TarifaTipo_activo_idx" ON "TarifaTipo"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaTipo_grupoId_codigo_key" ON "TarifaTipo"("grupoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaCargo_codigo_key" ON "TarifaCargo"("codigo");

-- CreateIndex
CREATE INDEX "TarifaCargo_cupsCodigoId_idx" ON "TarifaCargo"("cupsCodigoId");

-- CreateIndex
CREATE INDEX "TarifaCargo_grupoId_idx" ON "TarifaCargo"("grupoId");

-- CreateIndex
CREATE INDEX "TarifaCargo_tipoId_idx" ON "TarifaCargo"("tipoId");

-- CreateIndex
CREATE INDEX "TarifaCargo_activo_idx" ON "TarifaCargo"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Tarifario_codigo_key" ON "Tarifario"("codigo");

-- CreateIndex
CREATE INDEX "Tarifario_activo_idx" ON "Tarifario"("activo");

-- CreateIndex
CREATE INDEX "Tarifario_baseId_idx" ON "Tarifario"("baseId");

-- CreateIndex
CREATE INDEX "TarifaItem_tarifarioId_idx" ON "TarifaItem"("tarifarioId");

-- CreateIndex
CREATE INDEX "TarifaItem_cargoId_idx" ON "TarifaItem"("cargoId");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaItem_tarifarioId_cargoId_key" ON "TarifaItem"("tarifarioId", "cargoId");

-- AddForeignKey
ALTER TABLE "TarifaTipo" ADD CONSTRAINT "TarifaTipo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "TarifaGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaCargo" ADD CONSTRAINT "TarifaCargo_cupsCodigoId_fkey" FOREIGN KEY ("cupsCodigoId") REFERENCES "CupsCodigo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaCargo" ADD CONSTRAINT "TarifaCargo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "TarifaGrupo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaCargo" ADD CONSTRAINT "TarifaCargo_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TarifaTipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarifario" ADD CONSTRAINT "Tarifario_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Tarifario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaItem" ADD CONSTRAINT "TarifaItem_tarifarioId_fkey" FOREIGN KEY ("tarifarioId") REFERENCES "Tarifario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaItem" ADD CONSTRAINT "TarifaItem_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "TarifaCargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

