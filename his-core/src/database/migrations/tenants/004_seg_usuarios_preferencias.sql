-- ============================================================================
-- MIGRACIÓN: 004_seg_usuarios_preferencias
-- DESCRIPCIÓN: Agregar columna JSONB de preferencias de usuario y updated_at
-- ============================================================================

-- 1. Columna JSONB para preferencias de usuario (modo de navegación, tema, etc.)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{"navMode": "hub", "theme": "dark"}'::jsonb;

-- 2. Columna updated_at para trazabilidad de modificaciones
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
