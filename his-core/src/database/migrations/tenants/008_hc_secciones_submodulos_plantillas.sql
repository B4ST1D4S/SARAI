-- ============================================================================
-- MIGRACIÓN: 008_hc_secciones_submodulos_plantillas.sql
-- DESCRIPCIÓN: Catálogo de submódulos de Historia Clínica, plantillas 
--              estructuradas por secciones y resolución dinámica (overrides).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CATÁLOGO ATÓMICO DE SUBMÓDULOS CLÍNICOS (Los bloques constructivos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hc_submodulos_catalogo (
  id VARCHAR(60) PRIMARY KEY,               -- Ej: 'motivo_consulta', 'signos_vitales'
  nombre VARCHAR(120) NOT NULL,             -- Ej: 'Signos Vitales y Biometría'
  descripcion TEXT,
  categoria_sugerida VARCHAR(50) NOT NULL DEFAULT 'VALORACION', -- 'VALORACION', 'EXAMEN', 'DIAGNOSTICO', 'ORDENAMIENTO'
  componente_front VARCHAR(100) NOT NULL,   -- Nombre exacto del componente React: 'SignosVitalesModule'
  icono VARCHAR(50) DEFAULT 'Activity',     -- Icono de Lucide
  es_obligatorio_ley BOOLEAN NOT NULL DEFAULT FALSE, -- Res. 1995: no se puede apagar si es true
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. CATÁLOGO DE PLANTILLAS MAESTRAS DE HISTORIA CLÍNICA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hc_plantillas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,      -- Ej: 'PLANT-CAR-PRIMERA-VEZ', 'PLANT-CAR-CONTROL'
  nombre VARCHAR(150) NOT NULL,             -- Ej: 'Cardiología - Consulta de Primera Vez'
  descripcion TEXT,
  
  -- Estructura jerárquica: Secciones (Sidebar) -> Submódulos en cascada
  -- Formato: [{ id, titulo, icono, submodulos: [{ id, requerido, orden }] }]
  estructura JSONB NOT NULL,
  
  es_institucional BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. ENLACE DE PLANTILLAS A TIPOS DE CONSULTA Y OVERRIDES POR MÉDICO / SEDE
-- ----------------------------------------------------------------------------
-- Si la tabla ya existía, añadimos la FK hacia hc_plantillas_catalogo
DO $$ BEGIN   IF NOT EXISTS (     SELECT 1 FROM information_schema.columns      WHERE table_name = 'hc_configuracion_plantillas' AND column_name = 'plantilla_id'   ) THEN     ALTER TABLE hc_configuracion_plantillas        ADD COLUMN plantilla_id UUID REFERENCES hc_plantillas_catalogo(id) ON DELETE RESTRICT;   END IF; END $$;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_hc_submod_activo ON hc_submodulos_catalogo(activo);
CREATE INDEX IF NOT EXISTS idx_hc_plantillas_codigo ON hc_plantillas_catalogo(codigo);
CREATE INDEX IF NOT EXISTS idx_hc_conf_resolucion ON hc_configuracion_plantillas(tipo_consulta_id, finalidad, sede_id, profesional_id);

-- ----------------------------------------------------------------------------
-- 4. SEMILLERO BASE: SUBMÓDULOS Y PLANTILLAS
-- ----------------------------------------------------------------------------
INSERT INTO hc_submodulos_catalogo (id, nombre, descripcion, categoria_sugerida, componente_front, icono, es_obligatorio_ley)
VALUES 
  ('motivo_consulta', 'Motivo de Consulta y Enfermedad Actual', 'Anamnesis del motivo de atención', 'VALORACION', 'MotivoConsultaModule', 'MessageSquare', TRUE),
  ('antecedentes', 'Antecedentes Personales y Familiares', 'Patológicos, quirúrgicos, tóxicos, familiares', 'VALORACION', 'AntecedentesModule', 'History', FALSE),
  ('signos_vitales', 'Signos Vitales y Antropometría', 'Presión, pulso, temperatura, peso, talla, IMC', 'VALORACION', 'SignosVitalesModule', 'Activity', FALSE),
  ('revision_sistemas', 'Revisión por Sistemas', 'Inspección sintomática general por órganos', 'VALORACION', 'RevisionSistemasModule', 'CheckSquare', FALSE),
  ('examen_fisico', 'Examen Físico Segmentario', 'Hallazgos cefalocaudales', 'EXAMEN', 'ExamenFisicoModule', 'Stethoscope', TRUE),
  ('diagnosticos', 'Impresión Diagnóstica (CIE-10 / CIE-11)', 'Diagnóstico principal y relacionados', 'DIAGNOSTICO', 'DiagnosticosModule', 'FileText', TRUE),
  ('evolucion_nota', 'Nota de Evolución Clínica', 'Resumen de evolución y respuesta al tratamiento', 'DIAGNOSTICO', 'EvolucionModule', 'FileEdit', TRUE),
  ('plan_manejo', 'Conducta y Plan de Manejo', 'Recomendaciones médicas y plan general', 'DIAGNOSTICO', 'PlanManejoModule', 'ClipboardList', TRUE),
  ('prescripcion_medica', 'Formulación y Recetario Médico', 'Medicamentos, dosis, frecuencia y vía', 'ORDENAMIENTO', 'PrescripcionModule', 'Pill', FALSE),
  ('solicitud_ayudas_diag', 'Solicitud de Ayudas Diagnósticas (CUPS)', 'Laboratorios, imágenes diagnósticas, ecografías', 'ORDENAMIENTO', 'AyudasDiagnosticasModule', 'Microscope', FALSE),
  ('solicitud_procedimientos', 'Solicitud de Procedimientos Quirúrgicos', 'Órdenes de cirugías o procedimientos ambulatorios', 'ORDENAMIENTO', 'ProcedimientosModule', 'Scissors', FALSE)
ON CONFLICT (id) DO UPDATE SET 
  nombre = EXCLUDED.nombre,
  componente_front = EXCLUDED.componente_front;

-- 1. Insertar Plantilla Completa: Primera Vez
INSERT INTO hc_plantillas_catalogo (codigo, nombre, descripcion, estructura)
VALUES (
  'PLANT-CONS-PRIMERA-VEZ',
  'Consulta Ambulatoria - Primera Vez (Estándar)',
  'Estructura exhaustiva con antecedentes, revisión por sistemas y ordenamiento',
  '{
    "secciones": [
      {
        "id": "sec_valoracion",
        "titulo": "Valoración Clínica",
        "icono": "Stethoscope",
        "submodulos": [
          { "id": "motivo_consulta", "requerido": true },
          { "id": "antecedentes", "requerido": false },
          { "id": "signos_vitales", "requerido": true },
          { "id": "revision_sistemas", "requerido": false }
        ]
      },
      {
        "id": "sec_examen",
        "titulo": "Examen Clínico",
        "icono": "Eye",
        "submodulos": [
          { "id": "examen_fisico", "requerido": true }
        ]
      },
      {
        "id": "sec_diagnostico_plan",
        "titulo": "Diagnóstico & Plan",
        "icono": "ClipboardCheck",
        "submodulos": [
          { "id": "diagnosticos", "requerido": true },
          { "id": "plan_manejo", "requerido": true }
        ]
      },
      {
        "id": "sec_ordenamiento",
        "titulo": "Ordenamiento Médico",
        "icono": "Share2",
        "submodulos": [
          { "id": "prescripcion_medica", "requerido": false },
          { "id": "solicitud_ayudas_diag", "requerido": false },
          { "id": "solicitud_procedimientos", "requerido": false }
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (codigo) DO UPDATE 
SET estructura = EXCLUDED.estructura, 
    nombre = EXCLUDED.nombre;

-- 2. Insertar Plantilla Ágil: Control / Seguimiento
INSERT INTO hc_plantillas_catalogo (codigo, nombre, descripcion, estructura)
VALUES (
  'PLANT-CONS-CONTROL',
  'Consulta Ambulatoria - Control / Seguimiento (Ágil)',
  'Estructura condensada centrada en evolución, ajuste terapéutico y nuevas órdenes',
  '{
    "secciones": [
      {
        "id": "sec_valoracion",
        "titulo": "Seguimiento Clínico",
        "icono": "History",
        "submodulos": [
          { "id": "motivo_consulta", "requerido": true },
          { "id": "signos_vitales", "requerido": true },
          { "id": "evolucion_nota", "requerido": true }
        ]
      },
      {
        "id": "sec_diagnostico_plan",
        "titulo": "Diagnóstico & Conducta",
        "icono": "ClipboardCheck",
        "submodulos": [
          { "id": "diagnosticos", "requerido": true },
          { "id": "plan_manejo", "requerido": true }
        ]
      },
      {
        "id": "sec_ordenamiento",
        "titulo": "Ordenamiento Médico",
        "icono": "Share2",
        "submodulos": [
          { "id": "prescripcion_medica", "requerido": false },
          { "id": "solicitud_ayudas_diag", "requerido": false }
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (codigo) DO UPDATE 
SET estructura = EXCLUDED.estructura, 
    nombre = EXCLUDED.nombre;

-- 3. Actualizar o Vincular a Tipos de Consulta sin riesgo de conflicto
-- Enlace: Primera Vez
UPDATE hc_configuracion_plantillas
SET plantilla_id = (SELECT id FROM hc_plantillas_catalogo WHERE codigo = 'PLANT-CONS-PRIMERA-VEZ')
WHERE tipo_consulta_id = (SELECT id FROM tipos_consulta WHERE codigo = 'CONS-CARDIO' LIMIT 1)
  AND finalidad = 'PRIMERA_VEZ'
  AND profesional_id IS NULL
  AND sede_id IS NULL;

INSERT INTO hc_configuracion_plantillas (tipo_consulta_id, finalidad, plantilla_id, submodulos_orden)
SELECT 
  tc.id, 
  'PRIMERA_VEZ', 
  p.id, 
  '[]'::jsonb
FROM tipos_consulta tc
CROSS JOIN hc_plantillas_catalogo p
WHERE tc.codigo = 'CONS-CARDIO' 
  AND p.codigo = 'PLANT-CONS-PRIMERA-VEZ'
  AND NOT EXISTS (
    SELECT 1 FROM hc_configuracion_plantillas hcp 
    WHERE hcp.tipo_consulta_id = tc.id 
      AND hcp.finalidad = 'PRIMERA_VEZ' 
      AND hcp.profesional_id IS NULL 
      AND hcp.sede_id IS NULL
  );

-- Enlace: Control
UPDATE hc_configuracion_plantillas
SET plantilla_id = (SELECT id FROM hc_plantillas_catalogo WHERE codigo = 'PLANT-CONS-CONTROL')
WHERE tipo_consulta_id = (SELECT id FROM tipos_consulta WHERE codigo = 'CONS-CARDIO' LIMIT 1)
  AND finalidad = 'CONTROL'
  AND profesional_id IS NULL
  AND sede_id IS NULL;

INSERT INTO hc_configuracion_plantillas (tipo_consulta_id, finalidad, plantilla_id, submodulos_orden)
SELECT 
  tc.id, 
  'CONTROL', 
  p.id, 
  '[]'::jsonb
FROM tipos_consulta tc
CROSS JOIN hc_plantillas_catalogo p
WHERE tc.codigo = 'CONS-CARDIO' 
  AND p.codigo = 'PLANT-CONS-CONTROL'
  AND NOT EXISTS (
    SELECT 1 FROM hc_configuracion_plantillas hcp 
    WHERE hcp.tipo_consulta_id = tc.id 
      AND hcp.finalidad = 'CONTROL' 
      AND hcp.profesional_id IS NULL 
      AND hcp.sede_id IS NULL
  );