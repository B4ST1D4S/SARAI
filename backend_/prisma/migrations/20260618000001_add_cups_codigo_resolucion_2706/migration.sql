-- CreateEnum
CREATE TYPE "CupsNivel" AS ENUM ('GRUPO', 'SUBGRUPO', 'CATEGORIA', 'SUBCATEGORIA');

-- CreateTable
CREATE TABLE "CupsCodigo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "codigoFormato" TEXT NOT NULL,
    "nivel" "CupsNivel" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "capitulo" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "subgrupo" TEXT,
    "categoria" TEXT,
    "subcategoria" TEXT,
    "parentId" TEXT,
    "incluye" TEXT,
    "excluye" TEXT,
    "nota" TEXT,
    "esFacturable" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'Resolucion 2706 de 2025',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CupsCodigo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CupsCodigo_codigo_key" ON "CupsCodigo"("codigo");

-- CreateIndex
CREATE INDEX "CupsCodigo_nivel_idx" ON "CupsCodigo"("nivel");

-- CreateIndex
CREATE INDEX "CupsCodigo_seccion_idx" ON "CupsCodigo"("seccion");

-- CreateIndex
CREATE INDEX "CupsCodigo_capitulo_idx" ON "CupsCodigo"("capitulo");

-- CreateIndex
CREATE INDEX "CupsCodigo_grupo_idx" ON "CupsCodigo"("grupo");

-- CreateIndex
CREATE INDEX "CupsCodigo_parentId_idx" ON "CupsCodigo"("parentId");

-- CreateIndex
CREATE INDEX "CupsCodigo_esFacturable_idx" ON "CupsCodigo"("esFacturable");

-- CreateIndex
CREATE INDEX "CupsCodigo_activo_idx" ON "CupsCodigo"("activo");

-- AddForeignKey
ALTER TABLE "CupsCodigo" ADD CONSTRAINT "CupsCodigo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CupsCodigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
