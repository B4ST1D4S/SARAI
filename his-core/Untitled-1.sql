-- 1. Extensión para búsquedas difusas / autocompletado médico rápido
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Catálogo Oficial SISPRO: Unidades de Presentación y Dispensación (UPR - 78 registros)
CREATE TABLE ref_upr_dispensacion (
    codigo VARCHAR(20) PRIMARY KEY,
    descripcion VARCHAR(150) NOT NULL,
    esta_activo BOOLEAN DEFAULT true
);

-- 3. Catálogo Oficial MinSalud: Vías de Administración (119 registros)
CREATE TABLE ref_vias_administracion (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    esta_activo BOOLEAN DEFAULT true
);

-- 4. Catálogo Oficial MinSalud: Formas Farmacéuticas (61 registros)
CREATE TABLE ref_formas_farmaceuticas (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    esta_activo BOOLEAN DEFAULT true
);

-- 5. Catálogo Oficial MinSalud / UCUM: Unidades de Medida (273 registros)
CREATE TABLE ref_unidades_medida (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    esta_activo BOOLEAN DEFAULT true
);

-- 6. Catálogo de Principios Activos (con índices de búsqueda rápida)
CREATE TABLE ref_principios_activos (
    codigo VARCHAR(30) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo_atc VARCHAR(10),
    esta_activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_ref_principios_nombre_trgm 
ON ref_principios_activos USING gin (nombre gin_trgm_ops);

CREATE INDEX idx_ref_principios_atc 
ON ref_principios_activos (codigo_atc);

-- 7. Maestro de Artículos (Logística de Clínica)
CREATE TABLE inv_articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno VARCHAR(50) NOT NULL UNIQUE,
    nombre_comercial VARCHAR(255) NOT NULL,
    tipo_articulo VARCHAR(30) NOT NULL,             -- 'MEDICAMENTO', 'DISPOSITIVO_MEDICO', 'INSUMO_GENERAL'
    aplica_inventario BOOLEAN DEFAULT true,
    stock_minimo INT DEFAULT 0,
    costo_promedio NUMERIC(12,2) DEFAULT 0,
    costo_ultima_compra NUMERIC(12,2) DEFAULT 0,
    esta_activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Detalle Clínico y Regulatorio para Medicamentos
CREATE TABLE inv_medicamentos_detalle (
    articulo_id UUID PRIMARY KEY REFERENCES inv_articulos(id) ON DELETE CASCADE,
    registro_sanitario_invima VARCHAR(100) NOT NULL,
    cum_expediente VARCHAR(20) NOT NULL,
    cum_consecutivo VARCHAR(10) NOT NULL,
    ium_nivel_1 VARCHAR(50),
    ium_nivel_2 VARCHAR(50),
    ium_nivel_3 VARCHAR(50),
    principio_activo_codigo VARCHAR(30) NOT NULL REFERENCES ref_principios_activos(codigo),
    forma_farmaceutica_codigo VARCHAR(20) NOT NULL REFERENCES ref_formas_farmaceuticas(codigo),
    upr_codigo VARCHAR(20) NOT NULL REFERENCES ref_upr_dispensacion(codigo),
    concentracion_cantidad NUMERIC(10,3) NOT NULL,
    concentracion_unidad VARCHAR(20) NOT NULL REFERENCES ref_unidades_medida(codigo),
    es_monopolio_estado BOOLEAN DEFAULT false,
    es_alto_costo BOOLEAN DEFAULT false,
    es_vital_no_disponible BOOLEAN DEFAULT false
);

CREATE INDEX idx_inv_med_cum ON inv_medicamentos_detalle(cum_expediente, cum_consecutivo);
CREATE INDEX idx_inv_med_upr ON inv_medicamentos_detalle(upr_codigo);

-- 9. Prescripciones Médicas Normalizadas
CREATE TABLE hc_prescripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES hc_folios(id) ON DELETE RESTRICT,
    articulo_id UUID NOT NULL REFERENCES inv_articulos(id) ON DELETE RESTRICT,
    ambito_atencion VARCHAR(30) DEFAULT 'AMBULATORIO',
    dosis_cantidad NUMERIC(8,2) NOT NULL,
    dosis_unidad VARCHAR(20) NOT NULL REFERENCES ref_unidades_medida(codigo),
    via_administracion_codigo VARCHAR(20) NOT NULL REFERENCES ref_vias_administracion(codigo),
    frecuencia_intervalo SMALLINT NOT NULL,
    frecuencia_unidad VARCHAR(20) NOT NULL,
    frecuencia_texto_indicacion VARCHAR(150),
    duracion_tratamiento_dias SMALLINT NOT NULL CHECK (duracion_tratamiento_dias > 0),
    upr_dispensacion_codigo VARCHAR(20) NOT NULL REFERENCES ref_upr_dispensacion(codigo),
    cantidad_total_dispensar INT NOT NULL CHECK (cantidad_total_dispensar > 0),
    cantidad_total_letras VARCHAR(150),
    diagnostico_asociado_cie VARCHAR(10) NOT NULL,
    indicaciones_paciente TEXT,
    vigencia_formula_dias SMALLINT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prescripciones_folio ON hc_prescripciones(folio_id);
CREATE INDEX idx_prescripciones_articulo ON hc_prescripciones(articulo_id);

-- Tabla de auditoría en caliente (30 días de retención local)
CREATE TABLE sys_logs_recientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    usuario_id_his TEXT NULL,                       -- ID del usuario que ejecutó la acción
    tipo_evento TEXT NOT NULL,                      -- 'ACCESO_FOLIO', 'CREAR_FOLIO', 'DESCARGA_PDF', etc.
    modulo TEXT NULL,                               -- 'HISTORIA_CLINICA', 'ODONTOLOGIA', 'ESTETICA', 'FARMACIA'
    recurso_afectado TEXT NULL,                     -- 'hc_folios', 'pacientes', 'hc_prescripciones'
    recurso_id TEXT NULL,                           -- ID del registro afectado
    log_data JSONB NOT NULL DEFAULT '{}'::jsonb     -- Payload compatible con SaaS de Compliance
);

CREATE INDEX idx_sys_logs_creado_en ON sys_logs_recientes (creado_en DESC);
CREATE INDEX idx_sys_logs_tipo_evento ON sys_logs_recientes (tipo_evento, creado_en DESC);
CREATE INDEX idx_sys_logs_data_gin ON sys_logs_recientes USING gin (log_data);