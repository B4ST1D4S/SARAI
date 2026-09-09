-- 1. SEDES (Nivel 2)
CREATE TABLE IF NOT EXISTS sedes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL,              -- Ej: 'SEDE-01'
  nombre VARCHAR(150) NOT NULL,             -- Ej: 'Sede Principal Norte'
  codigo_reps VARCHAR(20),                  -- Código habilitación MinSalud (12 dígitos)
  direccion VARCHAR(255),
  telefono VARCHAR(50),
  ciudad VARCHAR(100),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sedes_codigo UNIQUE (codigo)
);

-- 2. DEPARTAMENTOS / CENTROS DE COSTOS (Nivel 3)
CREATE TABLE IF NOT EXISTS centros_costo_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL,              -- Ej: 'CC-301' (Código contable del ERP)
  nombre VARCHAR(150) NOT NULL,             -- Ej: 'Consulta Externa Ambulatoria'
  tipo VARCHAR(50) NOT NULL DEFAULT 'ASISTENCIAL', -- 'ASISTENCIAL', 'ADMINISTRATIVO', 'APOYO'
  piso_bloque VARCHAR(50),                  -- Opcional descriptivo: 'Piso 2 - Ala Norte'
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sede_cc_codigo UNIQUE (sede_id, codigo)
);

-- 3. RECURSOS FÍSICOS / CONSULTORIOS (Nivel 4)
CREATE TABLE IF NOT EXISTS consultorios_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id UUID NOT NULL REFERENCES centros_costo_departamentos(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL,              -- Ej: 'CONS-101', 'SILLON-01'
  nombre VARCHAR(100) NOT NULL,             -- Ej: 'Consultorio Medicina General 1'
  tipo VARCHAR(50) NOT NULL DEFAULT 'CONSULTORIO', -- 'CONSULTORIO', 'SALA_PROCEDIMIENTOS', 'SILLON_DENTAL'
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_depto_recurso_codigo UNIQUE (departamento_id, codigo)
);