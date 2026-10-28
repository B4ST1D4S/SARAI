BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pe_programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(40) NOT NULL DEFAULT 'ALTO_COSTO',
  icono VARCHAR(40),
  color VARCHAR(20),
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pe_programas (codigo, nombre, descripcion, categoria, icono, color, activo)
VALUES
  ('RENAL', 'Programa Renal', 'Nefroprotección, hemodiálisis, diálisis peritoneal y trasplante', 'ALTO_COSTO', 'HeartPulse', '#00B4D8', TRUE),
  ('VIH', 'Programa VIH', 'TAR, carga viral, CD4, adherencia y dispensación', 'ALTO_COSTO', 'FlaskConical', '#a855f7', TRUE),
  ('DIAB', 'Programa Diabetes', 'Control glicémico, HbA1c, complicaciones y pie diabético', 'GESTION_RIESGO', 'Activity', '#f59e0b', FALSE),
  ('HTA', 'Programa Hipertensión', 'Control de riesgo cardiovascular', 'GESTION_RIESGO', 'HeartPulse', '#0ea5e9', FALSE),
  ('HEMO', 'Hemofilia', 'Factor VIII/IX, profilaxis y eventos hemorrágicos', 'ALTO_COSTO', 'Droplet', '#ef4444', FALSE),
  ('ART', 'Artritis Reumatoide', 'Biológicos, DAS28 y seguimiento reumatológico', 'ALTO_COSTO', 'Bone', '#22c55e', FALSE),
  ('ONC', 'Oncología', 'Quimioterapia, seguimiento oncológico y toxicidades', 'ALTO_COSTO', 'Ribbon', '#ec4899', FALSE)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS pe_inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  programa_id UUID NOT NULL REFERENCES pe_programas(id) ON DELETE RESTRICT,
  codigo_programa VARCHAR(30) NOT NULL,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_egreso DATE,
  motivo_egreso TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
    CHECK (estado IN ('ACTIVO', 'RETIRADO', 'TRASLADADO', 'FALLECIDO', 'ALTA')),
  entidad_remitente VARCHAR(150),
  medico_ingreso_id UUID,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pe_inscripcion_activa
  ON pe_inscripciones (paciente_id, programa_id)
  WHERE estado = 'ACTIVO';
CREATE INDEX IF NOT EXISTS idx_pe_inscripciones_programa_estado
  ON pe_inscripciones (programa_id, estado);
CREATE INDEX IF NOT EXISTS idx_pe_inscripciones_paciente
  ON pe_inscripciones (paciente_id);

CREATE TABLE IF NOT EXISTS pe_maquinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100),
  serie VARCHAR(100),
  sillon VARCHAR(50),
  estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
  sede_id UUID,
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pe_registros_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID REFERENCES pe_inscripciones(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE RESTRICT,
  tipo VARCHAR(30) NOT NULL
    CHECK (tipo IN ('HISTORIA_RENAL', 'ACCESO', 'SESION', 'LABORATORIO', 'EVENTO', 'EVOLUCION', 'TAMIZAJE', 'TURNO', 'SEROLOGIA')),
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pe_historia_renal_inscripcion
  ON pe_registros_clinicos (inscripcion_id)
  WHERE tipo = 'HISTORIA_RENAL';
CREATE UNIQUE INDEX IF NOT EXISTS uq_pe_turno_activo_inscripcion
  ON pe_registros_clinicos (inscripcion_id)
  WHERE tipo = 'TURNO' AND activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_pe_registros_inscripcion_tipo
  ON pe_registros_clinicos (inscripcion_id, tipo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pe_registros_tipo_fecha
  ON pe_registros_clinicos (tipo, created_at DESC);

CREATE TABLE IF NOT EXISTS pe_configuracion (
  clave VARCHAR(60) PRIMARY KEY,
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pe_configuracion (clave, datos)
VALUES (
  'RENAL_HD',
  '{"sillones":[],"esquemas":[],"jornadas":[]}'::jsonb
)
ON CONFLICT (clave) DO NOTHING;

COMMIT;
