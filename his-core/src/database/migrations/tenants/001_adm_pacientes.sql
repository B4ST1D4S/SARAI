-- ==============================================================================
-- MIGRACIÓN 001: Creación de la tabla base de pacientes (adm_pacientes)
-- Módulo: Admisiones y Registro de Pacientes
-- Cumplimiento: Resolución 2275 de 2023 (RIPS) e ISO/IEC 27001
-- ==============================================================================

CREATE TABLE IF NOT EXISTS adm_pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(20) NOT NULL,
    tipo_usuario VARCHAR(10) DEFAULT '01',
    cod_pais_residencia VARCHAR(10) DEFAULT '170',
    cod_municipio_residencia VARCHAR(10) DEFAULT '11001',
    cod_zona_residencia VARCHAR(10) DEFAULT '01',
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(150),
    incapacidad BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_adm_pacientes_documento UNIQUE (tipo_documento, numero_documento)
);

CREATE INDEX IF NOT EXISTS idx_adm_pacientes_documento ON adm_pacientes (tipo_documento, numero_documento);
CREATE INDEX IF NOT EXISTS idx_adm_pacientes_apellidos ON adm_pacientes (primer_apellido, segundo_apellido);
