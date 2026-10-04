-- ============================================================================
-- MIGRACIÓN 010: Facturación — Ingresos, Cuentas, Ítems y Facturas
-- ============================================================================
-- Puerto del modelo Ingreso/Cuenta/CuentaItem/Factura de backend_ (Prisma) al
-- modelo nuevo de his-core (tenant-per-DB, raw SQL). Flujo: al admitir o
-- completar una cita se crea automáticamente un Ingreso con una Cuenta
-- ABIERTA; a la cuenta se le agregan ítems/servicios; se factura cuando está
-- lista (o se anula, reabriendo la cuenta). CuentaItem incluye los campos de
-- la Resolución 2275/2023 (RIPS) que ya usaba el sistema anterior, para poder
-- pre-validar antes de facturar.
--
-- Deliberadamente fuera de alcance en esta migración (se abordan en fases
-- posteriores, no bloquean el flujo de facturación básico):
--   - Catálogo oficial CUPS (CupsCodigo) y su importación masiva.
--   - Contratación (EmpresaContratante/Contrato/ContratoTarifa/etc.) — la
--     validación RIPS de "contrato sin CUCON" del sistema anterior depende de
--     esto y queda pendiente hasta que exista ese módulo.
-- ============================================================================

BEGIN;

-- 1. INGRESOS ----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS fac_ingresos_numero_seq;

CREATE TABLE IF NOT EXISTS fac_ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT NOT NULL UNIQUE DEFAULT nextval('fac_ingresos_numero_seq'),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    cita_id UUID REFERENCES citas(id),
    medico_id UUID REFERENCES usuarios(id),
    tipo_ingreso VARCHAR(30) NOT NULL DEFAULT 'AMBULATORIO',
    entidad VARCHAR(150),
    plan VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_egreso TIMESTAMPTZ,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fac_ingresos_paciente ON fac_ingresos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fac_ingresos_cita ON fac_ingresos(cita_id);
CREATE INDEX IF NOT EXISTS idx_fac_ingresos_estado ON fac_ingresos(estado);
CREATE INDEX IF NOT EXISTS idx_fac_ingresos_fecha ON fac_ingresos(fecha_ingreso);

-- 2. CUENTAS -------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS fac_cuentas_numero_seq;

CREATE TABLE IF NOT EXISTS fac_cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT NOT NULL UNIQUE DEFAULT nextval('fac_cuentas_numero_seq'),
    ingreso_id UUID NOT NULL REFERENCES fac_ingresos(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA', -- ABIERTA | FACTURADA | ANULADA
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fac_cuentas_ingreso ON fac_cuentas(ingreso_id);
CREATE INDEX IF NOT EXISTS idx_fac_cuentas_estado ON fac_cuentas(estado);

-- 3. ÍTEMS DE CUENTA (con campos RIPS por ítem) --------------------------------
CREATE TABLE IF NOT EXISTS fac_cuenta_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES fac_cuentas(id) ON DELETE CASCADE,
    cargo_id UUID, -- reservado para el futuro catálogo de tarifas/CUPS propio
    codigo VARCHAR(20),
    descripcion TEXT NOT NULL,
    departamento VARCHAR(100),
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
    valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- Componente RIPS del ítem: AC=Consulta, AP=Procedimiento, AH=Hospitalizacion,
    -- AU=Urgencias, AT=Otros servicios (Resolución 2275/2023, Documento Técnico 1)
    tipo_rips VARCHAR(5),
    cod_diagnostico_principal VARCHAR(10),
    tipo_diagnostico_principal VARCHAR(5),
    finalidad_tecnologia_salud VARCHAR(5),
    causa_motivo_atencion VARCHAR(5),
    via_ingreso_servicio_salud VARCHAR(5),
    modalidad_grupo_servicio_tec_sal VARCHAR(5),
    num_autorizacion VARCHAR(50),
    cod_prestador VARCHAR(20),
    concepto_recaudo VARCHAR(5),
    valor_pago_moderador NUMERIC(14,2),
    -- Específicos de Procedimientos (AP)
    ambito_realizacion_procedimiento VARCHAR(5),
    via_acceso_quirurgico VARCHAR(5),
    num_mipres VARCHAR(50),
    -- Específicos de Hospitalización (AH) / Urgencias (AU)
    fecha_atencion TIMESTAMPTZ,
    fecha_ingreso TIMESTAMPTZ,
    fecha_salida TIMESTAMPTZ,
    estado_salida VARCHAR(5), -- 1 Vivo, 2 Muerto
    destino_usuario_egreso VARCHAR(5),
    cod_diagnostico_ingreso VARCHAR(10),
    cod_diagnostico_salida VARCHAR(10),
    cod_diagnostico_muerte VARCHAR(10),
    -- Específico de Otros Servicios (AT)
    tipo_otro_servicio VARCHAR(5),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fac_cuenta_items_cuenta ON fac_cuenta_items(cuenta_id);

-- 4. FACTURAS -------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS fac_facturas_numero_seq;

CREATE TABLE IF NOT EXISTS fac_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT NOT NULL UNIQUE DEFAULT nextval('fac_facturas_numero_seq'),
    prefijo VARCHAR(10) NOT NULL DEFAULT 'FE',
    cuenta_id UUID NOT NULL UNIQUE REFERENCES fac_cuentas(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    entidad VARCHAR(150),
    plan VARCHAR(150),
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDA', -- EMITIDA | ANULADA | PAGADA
    observaciones TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fac_facturas_paciente ON fac_facturas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fac_facturas_estado ON fac_facturas(estado);
CREATE INDEX IF NOT EXISTS idx_fac_facturas_fecha ON fac_facturas(fecha);

COMMIT;
