-- 1. Roles permitidos
DO $$ BEGIN
    CREATE TYPE rol_usuario_enum AS ENUM (
        'SUPER_ADMIN_CLINICA',
        'ADMINISTRATIVO',
        'MEDICO_GENERAL',
        'MEDICO_ESPECIALISTA',
        'ENFERMERO',
        'RECEPCIONISTA'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabla de usuarios (Credenciales y acceso)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'CC',
    numero_documento VARCHAR(30) NOT NULL UNIQUE,
    primer_nombre VARCHAR(60) NOT NULL,
    primer_apellido VARCHAR(60) NOT NULL,
    rol rol_usuario_enum NOT NULL DEFAULT 'RECEPCIONISTA',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de profesionales asistenciales (1:1 opcional con usuarios)
CREATE TABLE IF NOT EXISTS profesionales_salud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    registro_medico VARCHAR(50) NOT NULL,
    especialidad_principal VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Usuario 1: Administrador Demo (Solo en usuarios)
-- Password:  Sarai2026*
INSERT INTO usuarios (username, email, password_hash, numero_documento, primer_nombre, primer_apellido, rol)
VALUES (
    'admin',
    'admin@clinicademo.com',
    '$2b$10$wH6qZzZlY1gP2dC3R7yLce6kH9mN4P1vYF8tT5rE2wQ0yU7xK8s.a',
    '1000000001',
    'Administrador',
    'Demo',
    'SUPER_ADMIN_CLINICA'
) ON CONFLICT (username) DO NOTHING;

-- 5. Usuario 2: Médico Demo (Vinculado a profesional_salud)
-- Password:  Sarai2026*
WITH medico_creado AS (
    INSERT INTO usuarios (username, email, password_hash, numero_documento, primer_nombre, primer_apellido, rol)
    VALUES (
        'cperez',
        'cperez@clinicademo.com',
        '$2b$10$wH6qZzZlY1gP2dC3R7yLce6kH9mN4P1vYF8tT5rE2wQ0yU7xK8s.a',
        '1000000002',
        'Carlos',
        'Perez',
        'MEDICO_GENERAL'
    ) ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
    RETURNING id
)
INSERT INTO profesionales_salud (usuario_id, registro_medico, especialidad_principal)
SELECT id, 'RM-COL-89210', 'Medicina General'
FROM medico_creado
ON CONFLICT (usuario_id) DO NOTHING;