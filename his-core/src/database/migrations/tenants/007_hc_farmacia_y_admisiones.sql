-- ==============================================================================
-- MIGRACIÓN 007: Admisiones, Farmacia, Catálogos Normativos e Historia Clínica
-- ==============================================================================

BEGIN;

-- 1. ENUMS REQUERIDOS POR HISTORIA CLÍNICA
DO $$ BEGIN
    CREATE TYPE enum_categoria_antecedente AS ENUM (
        'PATOLOGICO', 'QUIRURGICO', 'FARMACOLOGICO', 'TOXICO_ALERGICO', 
        'TRAUMATOLOGICO', 'FAMILIAR', 'GINECOOBSTETRICO', 'OTRO'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_estado_antecedente AS ENUM ('ACTIVO', 'INACTIVO', 'RESUELTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_momento_diagnostico AS ENUM ('INGRESO', 'EVOLUCION', 'EGRESO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_jerarquia_diagnostico AS ENUM ('PRINCIPAL', 'RELACIONADO_1', 'RELACIONADO_2', 'RELACIONADO_3');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_clase_diagnostico AS ENUM ('IMPRESION_DIAGNOSTICA', 'CONFIRMADO_NUEVO', 'CONFIRMADO_REPETIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. ADMISIONES & ATENCIONES
CREATE SEQUENCE IF NOT EXISTS adm_atenciones_numero_atencion_seq;

CREATE TABLE IF NOT EXISTS adm_atenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_atencion INT NOT NULL DEFAULT nextval('adm_atenciones_numero_atencion_seq'),
    paciente_id UUID NOT NULL,
    grupo_servicio VARCHAR(30) NOT NULL,
    modalidad_atencion VARCHAR(30) NOT NULL,
    via_ingreso VARCHAR(30) NOT NULL,
    contrato_id UUID,
    empresa_administradora_id UUID,
    cobertura_salud VARCHAR(50) DEFAULT 'PARTICULAR',
    fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
    fecha_egreso TIMESTAMPTZ,
    estado VARCHAR(20) DEFAULT 'EN_ATENCION',
    motivo_egreso VARCHAR(50),
    ubicacion_servicio VARCHAR(100),
    profesional_admisor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. CATÁLOGOS NORMATIVOS DE MEDICAMENTOS (REF_*)
CREATE TABLE IF NOT EXISTS ref_formas_farmaceuticas (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_principios_activos (
    codigo VARCHAR(30) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_unidades_medida (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE,
    display VARCHAR
);

CREATE TABLE IF NOT EXISTS ref_unidades_presentacion (
    codigo VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    esta_activo BOOLEAN
);

CREATE TABLE IF NOT EXISTS ref_upr_dispensacion (
    codigo VARCHAR(20) PRIMARY KEY,
    descripcion VARCHAR(150) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_vias_administracion (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE
);


-- 4. FARMACIA E INVENTARIOS
CREATE TABLE IF NOT EXISTS inv_articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno VARCHAR(50) NOT NULL UNIQUE,
    nombre_comercial VARCHAR(255) NOT NULL,
    tipo_articulo VARCHAR(30) NOT NULL,
    aplica_inventario BOOLEAN DEFAULT TRUE,
    stock_minimo INT DEFAULT 0,
    costo_promedio NUMERIC DEFAULT 0,
    precio_venta_particular NUMERIC DEFAULT 0,
    esta_activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inv_medicamentos_detalle (
    articulo_id UUID PRIMARY KEY REFERENCES inv_articulos(id) ON DELETE CASCADE,
    registro_sanitario_invima VARCHAR(100) NOT NULL,
    cum_expediente VARCHAR(20) NOT NULL,
    cum_consecutivo VARCHAR(10) NOT NULL,
    ium_nivel_1 VARCHAR(50),
    ium_nivel_2 VARCHAR(50),
    ium_nivel_3 VARCHAR(50),
    principio_activo_codigo VARCHAR(30) NOT NULL REFERENCES ref_principios_activos(codigo),
    forma_farmaceutica_codigo VARCHAR(20) NOT NULL REFERENCES ref_formas_farmaceuticas(codigo),
    concentracion_cantidad NUMERIC NOT NULL,
    concentracion_unidad VARCHAR(20) NOT NULL,
    es_monopolio_estado BOOLEAN DEFAULT FALSE,
    es_alto_costo BOOLEAN DEFAULT FALSE,
    es_vital_no_disponible BOOLEAN DEFAULT FALSE
);


-- 5. HISTORIA CLÍNICA ELECTRÓNICA (CORE MODULAR)
CREATE TABLE IF NOT EXISTS hc_folios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atencion_id UUID NOT NULL,
    paciente_id UUID NOT NULL,
    profesional_id UUID NOT NULL REFERENCES usuarios(id),
    especialidad_profesional VARCHAR(100) NOT NULL,
    registro_medico_rethus VARCHAR(50) NOT NULL,
    numero_folio INT NOT NULL,
    tipo_registro VARCHAR(50) NOT NULL,
    folio_referenciado_id UUID,
    fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    firma_digital_hash TEXT,
    certificado_digital_id VARCHAR(100),
    ip_registro VARCHAR(45) NOT NULL,
    origen_registro VARCHAR(30) DEFAULT 'WEB',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_file_key TEXT,
    pdf_generado_en TIMESTAMPTZ,
    pdf_estado VARCHAR(20) DEFAULT 'NO_GENERADO'
);

CREATE TABLE IF NOT EXISTS hc_anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES hc_folios(id) ON DELETE CASCADE,
    motivo_consulta TEXT NOT NULL,
    enfermedad_actual TEXT NOT NULL,
    revision_sistemas JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_signos_vitales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES hc_folios(id) ON DELETE CASCADE,
    tension_arterial_sistolica SMALLINT,
    tension_arterial_diastolica SMALLINT,
    tension_arterial_media NUMERIC,
    frecuencia_cardiaca SMALLINT,
    frecuencia_respiratoria SMALLINT,
    saturacion_oxigeno NUMERIC,
    fraccion_inspirada_oxigeno NUMERIC DEFAULT 21.0,
    temperatura_corporal NUMERIC,
    peso_kg NUMERIC,
    talla_cm NUMERIC,
    indice_masa_corporal NUMERIC,
    perimetro_abdominal_cm NUMERIC,
    escala_dolor_eva SMALLINT,
    escala_glasgow SMALLINT,
    observaciones TEXT,
    fecha_toma TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_examen_fisico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES hc_folios(id) ON DELETE CASCADE,
    estado_general VARCHAR(50) DEFAULT 'BUEN_ESTADO',
    estado_conciencia VARCHAR(50) DEFAULT 'ALERTA',
    cabeza_cuello TEXT,
    torax_cardiopulmonar TEXT,
    abdomen TEXT,
    genitourinario TEXT,
    extremidades TEXT,
    neurologico TEXT,
    piel_faneras TEXT,
    hallazgos_especialidad JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_antecedentes_paciente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL,
    categoria enum_categoria_antecedente NOT NULL,
    descripcion_antecedente TEXT NOT NULL,
    codigo_estandar VARCHAR(20),
    sistema_codificacion VARCHAR(50),
    estado enum_estado_antecedente DEFAULT 'ACTIVO',
    fecha_diagnostico_aproximada DATE,
    observaciones TEXT,
    folio_creacion_id UUID REFERENCES hc_folios(id),
    folio_modificacion_id UUID REFERENCES hc_folios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_diagnosticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES hc_folios(id) ON DELETE CASCADE,
    atencion_id UUID NOT NULL,
    codigo_cie VARCHAR(10) NOT NULL,
    nombre_diagnostico VARCHAR(255) NOT NULL,
    momento enum_momento_diagnostico NOT NULL,
    jerarquia enum_jerarquia_diagnostico NOT NULL,
    clase enum_clase_diagnostico NOT NULL,
    observacion_analisis TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hc_prescripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES hc_folios(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES inv_articulos(id),
    ambito_atencion VARCHAR(30) DEFAULT 'AMBULATORIO',
    dosis_cantidad NUMERIC NOT NULL,
    dosis_unidad VARCHAR(20) NOT NULL,
    via_administracion_codigo VARCHAR(20) NOT NULL,
    frecuencia_intervalo SMALLINT NOT NULL,
    frecuencia_unidad VARCHAR(20) NOT NULL,
    frecuencia_texto_indicacion VARCHAR(150),
    duracion_tratamiento_dias SMALLINT NOT NULL,
    cantidad_total_dispensar INT NOT NULL,
    cantidad_total_letras VARCHAR(150),
    diagnostico_asociado_cie VARCHAR(10) NOT NULL,
    indicaciones_paciente TEXT,
    vigencia_formula_dias SMALLINT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. NORMATIVO (RIPS) Y LOGS DEL SISTEMA
CREATE TABLE IF NOT EXISTS rips_lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    num_factura VARCHAR(50) NOT NULL,
    tipo_nota VARCHAR(20),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(25) NOT NULL DEFAULT 'EN_COLA',
    total_usuarios INT DEFAULT 0,
    total_consultas INT DEFAULT 0,
    total_procedimientos INT DEFAULT 0,
    total_medicamentos INT DEFAULT 0,
    json_file_key TEXT,
    hash_sha256 TEXT,
    errores_validacion JSONB DEFAULT '[]'::jsonb,
    usuario_generador_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sys_logs_recientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id_his TEXT,
    tipo_evento TEXT NOT NULL,
    modulo TEXT,
    recurso_afectado TEXT,
    recurso_id TEXT,
    log_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMIT;