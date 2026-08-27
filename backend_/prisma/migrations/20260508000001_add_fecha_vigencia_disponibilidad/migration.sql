-- AlterTable: agregar rango de vigencia opcional a DisponibilidadMedico
ALTER TABLE "DisponibilidadMedico" ADD COLUMN "fechaDesde" TIMESTAMP(3);
ALTER TABLE "DisponibilidadMedico" ADD COLUMN "fechaHasta" TIMESTAMP(3);
