-- AlterTable: agregar entidadSalud (entidad/plan a cobrar) a Cita
ALTER TABLE "Cita" ADD COLUMN "entidadSalud" TEXT;
