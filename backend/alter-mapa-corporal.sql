-- Hacer procedimientoId opcional en MapaCorporal
-- Eliminar FK constraint primero
ALTER TABLE "MapaCorporal" DROP CONSTRAINT IF EXISTS "MapaCorporal_procedimientoId_fkey";

-- Hacer la columna nullable
ALTER TABLE "MapaCorporal" ALTER COLUMN "procedimientoId" DROP NOT NULL;

-- Volver a agregar el FK constraint como opcional (ON DELETE SET NULL)
ALTER TABLE "MapaCorporal" 
  ADD CONSTRAINT "MapaCorporal_procedimientoId_fkey" 
  FOREIGN KEY ("procedimientoId") 
  REFERENCES "Procedimiento"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
