-- Indices de rendimiento (sin CONCURRENTLY para compatibilidad con transacciones)
CREATE INDEX IF NOT EXISTS "Paciente_email_idx"                  ON "Paciente"("email");
CREATE INDEX IF NOT EXISTS "Paciente_creadoPor_idx"              ON "Paciente"("creadoPor");
CREATE INDEX IF NOT EXISTS "HistoriaClinica_editadoPor_idx"      ON "HistoriaClinica"("editadoPor");
CREATE INDEX IF NOT EXISTS "Ingreso_medicoId_idx"                ON "Ingreso"("medicoId");
CREATE INDEX IF NOT EXISTS "Ingreso_tipoIngreso_idx"             ON "Ingreso"("tipoIngreso");
CREATE INDEX IF NOT EXISTS "Ingreso_fechaIngreso_idx"            ON "Ingreso"("fechaIngreso");
CREATE INDEX IF NOT EXISTS "CrmLead_proximoContacto_idx"         ON "CrmLead"("proximoContacto");
CREATE INDEX IF NOT EXISTS "CrmLead_ultimaInteraccion_idx"       ON "CrmLead"("ultimaInteraccion");
CREATE INDEX IF NOT EXISTS "Contrato_fechaInicio_idx"            ON "Contrato"("fechaInicio");
CREATE INDEX IF NOT EXISTS "Contrato_tipo_idx"                   ON "Contrato"("tipo");
CREATE INDEX IF NOT EXISTS "Contrato_creadoPorId_idx"            ON "Contrato"("creadoPorId");
CREATE INDEX IF NOT EXISTS "OdontoPlanItem_medicoId_idx"         ON "OdontoPlanItem"("medicoId");
CREATE INDEX IF NOT EXISTS "OdontoPlanItem_facturado_idx"        ON "OdontoPlanItem"("facturado");
CREATE INDEX IF NOT EXISTS "OdontoPlanItem_fechaProgramada_idx"  ON "OdontoPlanItem"("fechaProgramada");
CREATE INDEX IF NOT EXISTS "OdontoPlanItem_fechaEjecucion_idx"   ON "OdontoPlanItem"("fechaEjecucion");
