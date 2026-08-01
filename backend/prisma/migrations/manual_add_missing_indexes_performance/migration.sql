-- Migration: add_missing_indexes_performance
-- Agrega índices faltantes en tablas de alta consulta para mejorar tiempos de respuesta.
-- Tablas afectadas: Paciente, HistoriaClinica, Ingreso, CrmLead, Contrato, OdontoPlanItem

-- ─── Paciente ───────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Paciente_email_idx"     ON "Paciente"("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Paciente_creadoPor_idx" ON "Paciente"("creadoPor");

-- ─── HistoriaClinica ─────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "HistoriaClinica_editadoPor_idx" ON "HistoriaClinica"("editadoPor");

-- ─── Ingreso ─────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Ingreso_medicoId_idx"     ON "Ingreso"("medicoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Ingreso_tipoIngreso_idx"  ON "Ingreso"("tipoIngreso");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Ingreso_fechaIngreso_idx" ON "Ingreso"("fechaIngreso");

-- ─── CrmLead ─────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CrmLead_proximoContacto_idx"   ON "CrmLead"("proximoContacto");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CrmLead_ultimaInteraccion_idx" ON "CrmLead"("ultimaInteraccion");

-- ─── Contrato ─────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contrato_fechaInicio_idx"  ON "Contrato"("fechaInicio");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contrato_tipo_idx"         ON "Contrato"("tipo");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contrato_creadoPorId_idx"  ON "Contrato"("creadoPorId");

-- ─── OdontoPlanItem ──────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OdontoPlanItem_medicoId_idx"        ON "OdontoPlanItem"("medicoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OdontoPlanItem_facturado_idx"       ON "OdontoPlanItem"("facturado");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OdontoPlanItem_fechaProgramada_idx" ON "OdontoPlanItem"("fechaProgramada");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OdontoPlanItem_fechaEjecucion_idx"  ON "OdontoPlanItem"("fechaEjecucion");
