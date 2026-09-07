-- ============================================================================
-- MIGRACIÓN: 003_seg_auth_tokens_y_bloqueos
-- DESCRIPCIÓN: Tabla de Refresh Tokens (RTR) y columnas de bloqueo progresivo
-- ============================================================================

-- 1. Ampliación de control de accesos en la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ NULL;

-- 2. Tabla para persistencia y rotación de Refresh Tokens (SHA-256)
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,     -- Hash SHA-256 del token aleatorio
    jti VARCHAR(36) NOT NULL,                    -- Identificador único de sesión / JWT ID
    ip_origen VARCHAR(45),
    user_agent TEXT,
    revocado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida para validación y revocación masiva
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_hash ON auth_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_usuario ON auth_refresh_tokens(usuario_id);

-- Trigger de actualización de updated_at
DROP TRIGGER IF EXISTS trg_auth_refresh_tokens_updated_at ON auth_refresh_tokens;
CREATE TRIGGER trg_auth_refresh_tokens_updated_at
    BEFORE UPDATE ON auth_refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();