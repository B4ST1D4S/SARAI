-- ============================================================================
-- MIGRACIÓN: 009_seg_usuarios_extendido
-- DESCRIPCIÓN: Campos adicionales para el CRUD completo de Usuarios (teléfono,
-- firma digital, perfil IAM) y nuevos roles operativos usados por el frontend.
-- ============================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS firma_base64 TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil_id UUID;

ALTER TYPE rol_usuario_enum ADD VALUE IF NOT EXISTS 'MEDICO';
ALTER TYPE rol_usuario_enum ADD VALUE IF NOT EXISTS 'AUXILIAR';
ALTER TYPE rol_usuario_enum ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

ALTER TABLE profesionales_salud ADD COLUMN IF NOT EXISTS registro_profesional VARCHAR(50);
ALTER TABLE profesionales_salud ALTER COLUMN registro_medico DROP NOT NULL;
ALTER TABLE profesionales_salud ALTER COLUMN especialidad_principal DROP NOT NULL;
