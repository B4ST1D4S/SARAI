-- CreateTable
CREATE TABLE "DisponibilidadMedico" (
    "id" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionSlot" INTEGER NOT NULL DEFAULT 60,
    "sede" TEXT DEFAULT 'Principal',
    "tipoAtencion" TEXT DEFAULT 'CONSULTA',
    "consultorio" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisponibilidadMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueDisponibilidad" (
    "id" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT DEFAULT 'Bloqueo',
    "todoElDia" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloqueDisponibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisponibilidadMedico_medicoId_idx" ON "DisponibilidadMedico"("medicoId");

-- CreateIndex
CREATE INDEX "DisponibilidadMedico_diaSemana_idx" ON "DisponibilidadMedico"("diaSemana");

-- CreateIndex
CREATE INDEX "BloqueDisponibilidad_medicoId_idx" ON "BloqueDisponibilidad"("medicoId");

-- CreateIndex
CREATE INDEX "BloqueDisponibilidad_fechaInicio_idx" ON "BloqueDisponibilidad"("fechaInicio");

-- AddForeignKey
ALTER TABLE "DisponibilidadMedico" ADD CONSTRAINT "DisponibilidadMedico_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueDisponibilidad" ADD CONSTRAINT "BloqueDisponibilidad_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
