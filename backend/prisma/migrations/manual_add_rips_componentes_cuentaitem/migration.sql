-- ============================================================
--  MIGRACIÓN: Campos por componente RIPS (AC/AP/AH/AU/AT) en CuentaItem
--  Aplica en: Supabase SQL Editor (o script node con el pooler, ya que
--  prisma migrate no puede conectar directo por IPv6 en algunas redes)
-- ============================================================

ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "tipoRips" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "tipoDiagnosticoPrincipal" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "causaMotivoAtencion" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "modalidadGrupoServicioTecSal" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "ambitoRealizacionProcedimiento" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "viaAccesoQuirurgico" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "numMipres" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "fechaAtencion" TIMESTAMP(3);
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "fechaIngreso" TIMESTAMP(3);
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "fechaSalida" TIMESTAMP(3);
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "estadoSalida" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "destinoUsuarioEgreso" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "codDiagnosticoIngreso" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "codDiagnosticoSalida" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "codDiagnosticoMuerte" TEXT;
ALTER TABLE "CuentaItem" ADD COLUMN IF NOT EXISTS "tipoOtroServicio" TEXT;
