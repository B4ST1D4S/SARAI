# CAPÍTULO 9 – Recomendaciones de Arquitectura
**Sistema:** SARAI | **Fecha:** 2026-07-06

> Cada recomendación incluye: descripción, problema que resuelve, esfuerzo estimado y prioridad.

---

## 🔴 CRÍTICAS (Deben resolverse antes del siguiente release)

---

### C1 — Agregar FK `Consentimiento.plantillaId → ConsentimientoTemplate.id`

**Problema:** El campo `plantillaId` no tiene constraint formal. Se pueden registrar consentimientos con plantillas inexistentes o ya eliminadas, invalidando la evidencia legal.

**Solución Prisma:**
```prisma
model Consentimiento {
  // ...
  plantillaId       String
  plantilla         ConsentimientoTemplate @relation(fields: [plantillaId], references: [id])
}
```

**SQL directo:**
```sql
ALTER TABLE "Consentimiento"
  ADD CONSTRAINT "Consentimiento_plantillaId_fkey"
  FOREIGN KEY ("plantillaId")
  REFERENCES "ConsentimientoTemplate"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

**Esfuerzo:** Bajo | **Impacto:** Alto (integridad legal)

---

### C2 — Agregar FK `Cotizacion.citaId → Cita.id`

**Problema:** Una cotización puede referenciar una cita eliminada sin saberlo, creando datos huérfanos en el módulo CRM.

**Solución Prisma:**
```prisma
model Cotizacion {
  // ...
  citaId  String?
  cita    Cita?   @relation(fields: [citaId], references: [id], onDelete: SetNull)
}
```

**Esfuerzo:** Bajo | **Impacto:** Medio

---

### C3 — Agregar FK `ChecklistCompletado.templateId → ChecklistTemplate.id`

**Problema:** No se garantiza que un checklist completado corresponda a una plantilla existente.

**Solución Prisma:**
```prisma
model ChecklistCompletado {
  // ...
  templateId  String
  template    ChecklistTemplate @relation(fields: [templateId], references: [id])
}
```

**Esfuerzo:** Bajo | **Impacto:** Medio

---

### C4 — Agregar FK `OdontoPlanItem.cuentaItemId → CuentaItem.id`

**Problema:** La integración entre facturación y odontología no está garantizada por la BD. El campo `facturado = true` puede perder la referencia real a `CuentaItem`.

**Solución Prisma:**
```prisma
model OdontoPlanItem {
  // ...
  cuentaItemId  String?
  cuentaItem    CuentaItem? @relation(fields: [cuentaItemId], references: [id], onDelete: SetNull)
}
```

**Esfuerzo:** Bajo | **Impacto:** Alto (integridad financiera)

---

### C5 — Unificar catálogos de cargos (`Cargo` y `TarifaCargo`)

**Problema:** Existen dos catálogos de cargos/servicios independientes:
- `Cargo` (módulo legacy, sin equivalencia CUPS formal)
- `TarifaCargo` (módulo moderno, con FK a `CupsCodigo`)

El módulo de facturación usa `TarifaCargo`, pero el módulo de configuración clínica usa `Cargo`. Los precios pueden ser inconsistentes.

**Opciones:**

*Opción A (recomendada):* Migrar `DepartamentoCargo` para apuntar a `TarifaCargo`:
```prisma
model DepartamentoCargo {
  cargoId       String?     // legacy
  tarifaCargoId String?     // nuevo
  tarifaCargo   TarifaCargo? @relation(...)
}
```

*Opción B:* Agregar FK `Cargo.tarifaCargoId → TarifaCargo.id` para sincronizar precios.

**Esfuerzo:** Alto (requiere migración de datos) | **Impacto:** Crítico (consistencia financiera)

---

## 🟡 ALTAS (Resolver en próximo sprint o release)

---

### A1 — Normalizar `Cotizacion.lineas JSON` → tabla `CotizacionLinea`

**Problema:** Las líneas de cotización están incrustadas en JSON. No es posible consultar qué servicios se cotizan más, calcular totales por servicio, ni aplicar FKs a `TarifaCargo`.

**Solución:**
```prisma
model CotizacionLinea {
  id            String     @id @default(cuid())
  cotizacionId  String
  cotizacion    Cotizacion @relation(fields: [cotizacionId], references: [id], onDelete: Cascade)
  cargoId       String?
  cargo         TarifaCargo? @relation(...)
  descripcion   String
  cantidad      Float       @default(1)
  precioUnitario Float
  descuento     Float       @default(0)
  subtotal      Float
  createdAt     DateTime    @default(now())

  @@index([cotizacionId])
}
```

**Esfuerzo:** Medio (requiere migración de JSON existentes) | **Impacto:** Alto (reportería, análisis comercial)

---

### A2 — Consolidar las representaciones del catálogo CUPS

**Problema:** El código CUPS aparece en 4 lugares sin FK cruzadas:
- `CupsCodigo.codigo` (catálogo oficial)
- `ProcedimientoCUPS.codigoCUPS` (catálogo clínico)
- `ServicioFacturable.codigoCups` (servicios facturables)
- `PlantillaProcedimiento.codigoCups` (plantillas legacy)

**Solución:** Agregar FKs desde `ProcedimientoCUPS` y `ServicioFacturable` hacia `CupsCodigo`:
```prisma
model ProcedimientoCUPS {
  codigoCUPS    String    @unique
  cupsCodigoId  String?
  cupsCodigo    CupsCodigo? @relation(fields: [cupsCodigoId], references: [id])
}
```

**Esfuerzo:** Medio | **Impacto:** Alto (integridad del catálogo)

---

### A3 — Deprecar `PlantillaProcedimiento` o migrarla al modelo actual

**Problema:** `PlantillaProcedimiento` es una tabla aislada sin FKs, posiblemente de una versión anterior del sistema. Sus datos pueden estar desactualizados.

**Acciones:**
1. Auditar si algún código en producción la consulta
2. Si no se usa: marcar como `@deprecated` y planificar eliminación
3. Si se usa: migrar su contenido a `PlantillaTemplate` + `ConsentimientoTemplate`

**Esfuerzo:** Bajo-Medio | **Impacto:** Medio (limpieza de deuda técnica)

---

### A4 — Implementar triggers PostgreSQL para auditoría automática

**Problema:** La auditoría actual es manual (llamada desde la aplicación). Si hay un bug o la app omite la llamada, la operación no queda auditada.

**Solución:** Trigger en tablas críticas:
```sql
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
BEGIN
  INSERT INTO "AuditLog" (
    id, "usuarioId", "tablaAfectada", "registroId",
    "tipoOperacion", "datosAntes", "datosDespues", timestamp
  ) VALUES (
    gen_random_uuid()::text,
    current_setting('app.current_user_id', true),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW),
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas:
CREATE TRIGGER audit_historia_clinica
AFTER INSERT OR UPDATE OR DELETE ON "HistoriaClinica"
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

**Esfuerzo:** Medio | **Impacto:** Alto (cumplimiento y seguridad)

---

### A5 — Agregar `especialidadId FK` en `User` y deprecar `especialidad TEXT`

**Problema:** `User.especialidad` es texto libre que duplica el catálogo `Especialidad`. Un médico podría registrarse con `"Cirugia Plastica"` y otro con `"Cirugía Plástica"` siendo la misma especialidad.

**Solución:**
```prisma
model User {
  // Agregar:
  especialidadId  String?
  especialidadRef Especialidad? @relation(fields: [especialidadId], references: [id])
  // Deprecar gradualmente: especialidad String?
}
```

**Esfuerzo:** Bajo | **Impacto:** Medio (coherencia de datos)

---

### A6 — Agregar FK `Cita.salaQuirofanoId → TipoConsultorio.id`

**Problema:** El campo existe pero no tiene constraint. No se puede saber si la sala es válida.

```prisma
model Cita {
  salaQuirofanoId   String?
  salaQuirofano     TipoConsultorio? @relation(fields: [salaQuirofanoId], references: [id])
}
```

**Esfuerzo:** Bajo | **Impacto:** Medio

---

### A7 — Implementar Full-Text Search en `Paciente.nombreCompleto`

**Problema:** La búsqueda de pacientes usa índice B-Tree sobre `nombreCompleto`, lo que requiere coincidencia exacta de prefijo. Búsquedas como `"garcia ana"` no funcionarán.

**Solución PostgreSQL:**
```sql
ALTER TABLE "Paciente" ADD COLUMN nombre_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('spanish', "nombreCompleto")) STORED;

CREATE INDEX idx_paciente_nombre_tsv ON "Paciente" USING GIN(nombre_tsv);
```

**Consulta:**
```sql
SELECT * FROM "Paciente"
WHERE nombre_tsv @@ to_tsquery('spanish', 'garcia & ana');
```

**Esfuerzo:** Bajo | **Impacto:** Alto (UX de búsqueda)

---

## 🟠 MEDIAS (Planificar para versión siguiente)

---

### M1 — Tabla `ComplicacionProcedimiento` en lugar de `complicaciones TEXT[]`

```prisma
model ComplicacionProcedimiento {
  id              String        @id @default(cuid())
  procedimientoId String
  procedimiento   Procedimiento @relation(...)
  descripcion     String
  fechaOcurrencia DateTime?
  severidad       String?
  resuelta        Boolean       @default(false)
  createdAt       DateTime      @default(now())
}
```

---

### M2 — Tabla `PacienteTelefono` en lugar de `telefonos TEXT[]`

```prisma
model PacienteTelefono {
  id         String   @id @default(cuid())
  pacienteId String
  paciente   Paciente @relation(...)
  numero     String
  tipo       String   @default("CELULAR") // CELULAR, FIJO, TRABAJO
  principal  Boolean  @default(false)
  activo     Boolean  @default(true)

  @@index([pacienteId])
  @@index([numero])
}
```

---

### M3 — Implementar soft-delete (`deletedAt`) en tablas clínicas

**Principio:** Nunca eliminar registros clínicos; solo marcarlos como eliminados.

```prisma
// Agregar a tablas clínicas:
deletedAt DateTime?
deletedBy String?   // FK → User.id

@@index([deletedAt])
```

**Tablas prioritarias:** `Paciente`, `Procedimiento`, `HistoriaClinica`, `Consentimiento`

---

### M4 — Views materializadas para dashboards

```sql
-- Dashboard de citas por médico
CREATE MATERIALIZED VIEW mv_citas_stats AS
SELECT
  "medicoId",
  DATE_TRUNC('month', "fechaHora") as mes,
  COUNT(*) as total_citas,
  COUNT(*) FILTER (WHERE estado = 'COMPLETADA') as completadas,
  COUNT(*) FILTER (WHERE estado = 'CANCELADA') as canceladas
FROM "Cita"
GROUP BY "medicoId", DATE_TRUNC('month', "fechaHora");

CREATE UNIQUE INDEX ON mv_citas_stats ("medicoId", mes);

-- Refrescar periódicamente:
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_citas_stats;
```

---

### M5 — Índices GIN en campos JSON críticos

```sql
-- Buscar dentro del contenido de HistoriaClinica
CREATE INDEX idx_hc_contenido ON "HistoriaClinica" USING GIN(contenido);

-- Buscar hallazgos en Odontograma
CREATE INDEX idx_odonto_generales ON "Odontograma" USING GIN("hallazgosGenerales");

-- Buscar en lineas de Cotizacion
CREATE INDEX idx_cotizacion_lineas ON "Cotizacion" USING GIN(lineas);
```

---

### M6 — Unificar `ConfiguracionSistema` y `ParametroSistema`

**Problema:** Dos tablas con propósito solapado generan confusión sobre dónde guardar configuraciones.

**Solución:** Consolidar en `ConfiguracionSistema` con soporte para texto y JSON:
```prisma
model ConfiguracionSistema {
  clave       String  @unique
  valor       Json    // puede ser string, number, boolean u objeto
  tipo        String  @default("text") // text, json, boolean, number
  grupo       String? // para agrupar (antes ParametroSistema)
  descripcion String?
  updatedAt   DateTime @updatedAt

  @@index([grupo])
}
```

---

### M7 — Versionado optimista para Historia Clínica

```prisma
// HistoriaClinica ya tiene version INT, pero se necesita:
// 1. Verificar versión al actualizar
// 2. Rechazar actualización si versión difiere
```

**Implementación en aplicación:**
```typescript
await prisma.historiaClinica.update({
  where: { id, version: currentVersion }, // optimistic lock
  data: { contenido: newContent, version: { increment: 1 } }
})
// Si no encuentra el registro (versión cambió), lanzar conflicto
```

---

### M8 — Row-Level Security (RLS) en PostgreSQL

**Problema:** La segregación de datos actualmente se hace en la aplicación. Un bug podría exponer datos de pacientes de otro médico.

```sql
-- Habilitar RLS en tablas clínicas
ALTER TABLE "HistoriaClinica" ENABLE ROW LEVEL SECURITY;

CREATE POLICY paciente_aislamiento ON "HistoriaClinica"
  USING ("pacienteId" IN (
    SELECT "pacienteId" FROM pacientes_autorizados
    WHERE medico_id = current_setting('app.current_user_id')::text
  ));
```

---

## 🟢 BAJAS (Backlog / mejoras continuas)

---

### B1 — Estandarizar convención de nombres

**Problema:** Inconsistencia en nomenclatura:
- Algunas tablas usan prefijos: `Odonto*`, `Tarifa*`, `Cuenta*`
- Otras no: `Procedimiento`, `Consentimiento`, `Alerta`
- Módulos futuros deberían documentar la convención antes de crear tablas

**Convención sugerida:**
```
Tablas de módulo específico: PrefixoEntidad (ej: OdontoHallazgo, FacturaItem)
Tablas generales: Entidad (ej: Paciente, User, Cita)
Tablas puente: EntidadAEntidadB (ej: DepartamentoCargo, TarifaItem)
```

---

### B2 — Crear tabla `Bodega` para `TipoConsulta.bodegaId`

```prisma
model Bodega {
  id          String @id @default(cuid())
  codigo      String @unique
  nombre      String
  descripcion String?
  activo      Boolean @default(true)
}

model TipoConsulta {
  // Cambiar bodegaId a FK formal:
  bodegaId    String?
  bodega      Bodega? @relation(fields: [bodegaId], references: [id])
}
```

---

### B3 — Crear tabla `Programa` para `HCModulo.programaId`

Campo actualmente huérfano. Si los programas de salud son importantes para el sistema, deben modelarse.

---

### B4 — Particionamiento de tablas de alto crecimiento

**Candidatas para particionamiento por rango de fecha:**
```sql
-- AuditLog particionada por mes
CREATE TABLE "AuditLog_2026_07" PARTITION OF "AuditLog"
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- HistoriaClinica particionada por año
CREATE TABLE "HistoriaClinica_2026" PARTITION OF "HistoriaClinica"
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

**Umbral recomendado para considerar:** > 10 millones de registros en AuditLog, > 500k en HistoriaClinica.

---

### B5 — Agregar campo `version` en tablas de catálogo

Para detectar modificaciones concurrentes en tablas de configuración:
```prisma
model TarifaCargo {
  // ...
  version Int @default(1) // para optimistic locking
}
```

---

### B6 — Documentar política de retención de datos (HABEAS DATA)

**Normativa aplicable en Colombia:**
- Ley 1581/2012 (Habeas Data)
- Ley 2015/2020 (Historia Clínica Digital)
- Circular SFC para datos financieros

**Campos sensibles que requieren política de retención:**
- `FotoClinica` (imágenes biométricas)
- `Consentimiento.selfieUrl` (foto del paciente)
- `AuditLog` (datos de uso)
- `Integracion.credencialesEncriptadas`

---

## Resumen de Recomendaciones

| Tipo | # | Descripción | Esfuerzo | Impacto |
|------|---|-------------|----------|---------|
| 🔴 Crítica | C1 | FK Consentimiento.plantillaId | Bajo | Alto |
| 🔴 Crítica | C2 | FK Cotizacion.citaId | Bajo | Medio |
| 🔴 Crítica | C3 | FK ChecklistCompletado.templateId | Bajo | Medio |
| 🔴 Crítica | C4 | FK OdontoPlanItem.cuentaItemId | Bajo | Alto |
| 🔴 Crítica | C5 | Unificar Cargo y TarifaCargo | Alto | Crítico |
| 🟡 Alta | A1 | Normalizar Cotizacion.lineas | Medio | Alto |
| 🟡 Alta | A2 | Consolidar catálogos CUPS | Medio | Alto |
| 🟡 Alta | A3 | Deprecar PlantillaProcedimiento | Bajo | Medio |
| 🟡 Alta | A4 | Triggers PostgreSQL para auditoría | Medio | Alto |
| 🟡 Alta | A5 | especialidadId FK en User | Bajo | Medio |
| 🟡 Alta | A6 | FK Cita.salaQuirofanoId | Bajo | Medio |
| 🟡 Alta | A7 | Full-Text Search en Paciente | Bajo | Alto |
| 🟠 Media | M1-M8 | Normalización, soft-delete, views, RLS | Medio | Medio |
| 🟢 Baja | B1-B6 | Nomenclatura, tablas faltantes, particionamiento | Variable | Bajo |

---

*Anterior: [DB_08_ARQUITECTURA_TECNICA.md](./DB_08_ARQUITECTURA_TECNICA.md) | Siguiente: [DB_10_RESUMEN_EJECUTIVO.md](./DB_10_RESUMEN_EJECUTIVO.md)*
