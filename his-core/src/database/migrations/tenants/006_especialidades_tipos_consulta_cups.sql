BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento VARCHAR(10) NOT NULL,
  numero_documento VARCHAR(50) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  primer_nombre VARCHAR(100),
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100),
  segundo_apellido VARCHAR(100),
  fecha_nacimiento DATE NOT NULL,
  genero VARCHAR(20) NOT NULL,
  estado_civil VARCHAR(30),
  grupo_etnico VARCHAR(50),
  nivel_educacion VARCHAR(50),
  discapacidad VARCHAR(100),
  telefonos TEXT[] DEFAULT '{}',
  telefono_fijo VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(150),
  direccion VARCHAR(255),
  barrio VARCHAR(100),
  ciudad VARCHAR(100),
  zona_residencia VARCHAR(20) DEFAULT 'URBANA',
  entidad_salud VARCHAR(150),
  tipo_afiliado VARCHAR(30),
  foto_perfil TEXT,
  observaciones TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pacientes_identificacion UNIQUE (tipo_documento, numero_documento)
);

CREATE INDEX IF NOT EXISTS idx_pacientes_num_doc ON pacientes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_estado ON pacientes(estado);
CREATE INDEX IF NOT EXISTS idx_pacientes_entidad ON pacientes(entidad_salud);


-- 2. CATÁLOGO ASISTENCIAL
CREATE TABLE IF NOT EXISTS especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  aplica_cirugia BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_anestesia BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_pediatria BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_instrumentacion BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_medico_familiar BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidad_id UUID NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  requiere_caja BOOLEAN NOT NULL DEFAULT FALSE,
  permite_agendamiento BOOLEAN NOT NULL DEFAULT TRUE,
  abre_historia_clinica BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_consulta_cups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_consulta_id UUID NOT NULL REFERENCES tipos_consulta(id) ON DELETE CASCADE,
  codigo_cups VARCHAR(10) NOT NULL,
  nombre_procedimiento VARCHAR(255) NOT NULL,
  finalidad VARCHAR(50) NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 20,
  es_principal BOOLEAN NOT NULL DEFAULT TRUE,
  requiere_autorizacion BOOLEAN NOT NULL DEFAULT FALSE,
  permite_sobrecupo BOOLEAN NOT NULL DEFAULT FALSE,
  copago_aplica BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tipo_cups_finalidad UNIQUE (tipo_consulta_id, codigo_cups, finalidad)
);

CREATE TABLE IF NOT EXISTS hc_configuracion_plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_consulta_id UUID NOT NULL REFERENCES tipos_consulta(id) ON DELETE CASCADE,
  finalidad VARCHAR(50),
  sede_id UUID REFERENCES sedes(id) ON DELETE CASCADE,
  profesional_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  submodulos_orden JSONB NOT NULL,
  opciones_ui JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MOTOR DE AGENDA
CREATE TABLE IF NOT EXISTS agenda_plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_slot_minutos INT NOT NULL DEFAULT 20,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS agenda_turnos_profesional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id UUID NOT NULL REFERENCES sedes(id),
  departamento_id UUID NOT NULL REFERENCES centros_costo_departamentos(id),
  consultorio_id UUID NOT NULL REFERENCES consultorios_recursos(id),
  profesional_id UUID NOT NULL REFERENCES usuarios(id),
  especialidad_id UUID NOT NULL REFERENCES especialidades(id),
  plantilla_id UUID REFERENCES agenda_plantillas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  intervalo_minutos INT NOT NULL DEFAULT 15,
  sobrecupos_max INT NOT NULL DEFAULT 0,
  modalidad VARCHAR(30) NOT NULL DEFAULT 'PRESENCIAL',
  estado VARCHAR(30) NOT NULL DEFAULT 'HABILITADO',
  motivo_bloqueo VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_turno_consultorio_horario UNIQUE (consultorio_id, fecha, hora_inicio)
);

CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID REFERENCES agenda_turnos_profesional(id) ON DELETE SET NULL, -- Corregido: apunta a turnos
  sede_id UUID NOT NULL REFERENCES sedes(id),
  consultorio_id UUID NOT NULL REFERENCES consultorios_recursos(id),
  profesional_id UUID NOT NULL REFERENCES usuarios(id),
  especialidad_id UUID NOT NULL REFERENCES especialidades(id),
  tipo_consulta_id UUID NOT NULL REFERENCES tipos_consulta(id),
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  fecha_hora_fin TIMESTAMPTZ NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 20,
  estado VARCHAR(30) NOT NULL DEFAULT 'AGENDADA',
  motivo_consulta TEXT,
  numero_autorizacion VARCHAR(100),
  es_sobrecupo BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_cancelacion VARCHAR(255),
  usuario_cancelo_id UUID REFERENCES usuarios(id),
  fecha_cancelacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;