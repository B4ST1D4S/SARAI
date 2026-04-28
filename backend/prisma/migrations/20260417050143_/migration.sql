-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'MEDICO', 'AUXILIAR', 'RECEPCIONISTA', 'PACIENTE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'RECEPCIONISTA',
    "especialidad" TEXT,
    "numeroDocumento" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "telefonos" TEXT[],
    "email" TEXT,
    "whatsapp" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "fotoPerfil" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alergia" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "reaccion" TEXT,

    CONSTRAINT "Alergia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT,
    "nombre" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "indicacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AntecedentesQuirurgicos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimiento" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "complicaciones" TEXT,
    "cirujano" TEXT,

    CONSTRAINT "AntecedentesQuirurgicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedimiento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "tipoProcedimiento" TEXT NOT NULL,
    "nombreProcedimiento" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaRealizada" TIMESTAMP(3),
    "duracionEstimada" INTEGER NOT NULL,
    "duracionReal" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notasPreoperatorio" TEXT,
    "notasOperatorio" TEXT,
    "complicaciones" TEXT[],
    "resultadoVisualEsperado" TEXT,
    "resultadoVisualActual" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriaClinica" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT,
    "tipoHistoria" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "editadoPor" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaEdicion" TIMESTAMP(3) NOT NULL,
    "firmadoPorMedico" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirma" TIMESTAMP(3),
    "hashIntegridad" TEXT NOT NULL,

    CONSTRAINT "HistoriaClinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaProcedimiento" (
    "id" TEXT NOT NULL,
    "codigoCups" TEXT NOT NULL,
    "nombreProcedimiento" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "camposObligatorios" JSONB NOT NULL,
    "camposOpcionales" JSONB NOT NULL,
    "riesgosAuto" TEXT[],
    "complicacionesEsperadas" TEXT[],
    "medicacionRecomendada" JSONB NOT NULL,
    "postoperatorioPorDias" JSONB NOT NULL,
    "consentimientoTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaProcedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consentimiento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "plantillaId" TEXT NOT NULL,
    "contenidoHtml" TEXT NOT NULL,
    "contenidoPdfUrl" TEXT,
    "firmaDigitalUrl" TEXT,
    "selfieUrl" TEXT,
    "fechaFirma" TIMESTAMP(3),
    "ipDispositivo" TEXT,
    "navegador" TEXT,
    "sistemaOperativo" TEXT,
    "geolocation" JSONB,
    "firmado" BOOLEAN NOT NULL DEFAULT false,
    "hashIntegridad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoClinica" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT,
    "tipo" TEXT NOT NULL,
    "diasPostOperatorio" INTEGER,
    "urlOriginal" TEXT NOT NULL,
    "urlComprimida" TEXT NOT NULL,
    "urlMiniatura" TEXT NOT NULL,
    "metadatos" JSONB,
    "anotaciones" JSONB,
    "visibleAlPaciente" BOOLEAN NOT NULL DEFAULT false,
    "fechaCaptura" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoClinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapaCorporal" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "fechaEvaluacion" TIMESTAMP(3) NOT NULL,
    "zonasMarcadas" JSONB NOT NULL,
    "edemaZonas" JSONB NOT NULL,
    "fibrosisZonas" JSONB NOT NULL,
    "dolorZonas" JSONB NOT NULL,
    "colorIndicator" TEXT,
    "anotacionesClinics" TEXT,
    "evaluadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapaCorporal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoPostOp" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "diaPostOp" INTEGER NOT NULL,
    "fechaPrevista" TIMESTAMP(3) NOT NULL,
    "fechaCompletada" TIMESTAMP(3),
    "tipoSeguimiento" TEXT NOT NULL,
    "checklistPreguntas" JSONB NOT NULL,
    "checklistRespuestas" JSONB,
    "reportarComplicacion" BOOLEAN NOT NULL DEFAULT false,
    "descripcionComplicacion" TEXT,
    "alertasGeneradas" JSONB[],
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "notificacionWhatsappEnviada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguimientoPostOp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT,
    "tipoAlerta" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "accionRecomendada" TEXT NOT NULL,
    "iaDetectada" BOOLEAN NOT NULL DEFAULT false,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "fechaResolucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "tipoCita" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 60,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT,
    "notas" TEXT,
    "recordatorioWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "asistencia" BOOLEAN,
    "salaQuirofanoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaccion" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "procedimientoId" TEXT,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "metodoPago" TEXT NOT NULL,
    "referenciaPago" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "reciboUrl" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tablaAfectada" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "tipoOperacion" TEXT NOT NULL,
    "datosAntes" JSONB,
    "datosDespues" JSONB,
    "ipOrigen" TEXT,
    "userAgent" TEXT,
    "razon" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integracion" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "credencialesEncriptadas" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaUltimaSincronizacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE INDEX "Paciente_nombreCompleto_idx" ON "Paciente"("nombreCompleto");

-- CreateIndex
CREATE INDEX "Paciente_estado_idx" ON "Paciente"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_numeroDocumento_tipoDocumento_key" ON "Paciente"("numeroDocumento", "tipoDocumento");

-- CreateIndex
CREATE INDEX "Alergia_pacienteId_idx" ON "Alergia"("pacienteId");

-- CreateIndex
CREATE INDEX "Medicamento_pacienteId_idx" ON "Medicamento"("pacienteId");

-- CreateIndex
CREATE INDEX "AntecedentesQuirurgicos_pacienteId_idx" ON "AntecedentesQuirurgicos"("pacienteId");

-- CreateIndex
CREATE INDEX "Procedimiento_pacienteId_idx" ON "Procedimiento"("pacienteId");

-- CreateIndex
CREATE INDEX "Procedimiento_medicoId_idx" ON "Procedimiento"("medicoId");

-- CreateIndex
CREATE INDEX "Procedimiento_estado_idx" ON "Procedimiento"("estado");

-- CreateIndex
CREATE INDEX "Procedimiento_fechaProgramada_idx" ON "Procedimiento"("fechaProgramada");

-- CreateIndex
CREATE INDEX "HistoriaClinica_pacienteId_idx" ON "HistoriaClinica"("pacienteId");

-- CreateIndex
CREATE INDEX "HistoriaClinica_procedimientoId_idx" ON "HistoriaClinica"("procedimientoId");

-- CreateIndex
CREATE INDEX "HistoriaClinica_tipoHistoria_idx" ON "HistoriaClinica"("tipoHistoria");

-- CreateIndex
CREATE INDEX "HistoriaClinica_fechaCreacion_idx" ON "HistoriaClinica"("fechaCreacion");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaProcedimiento_codigoCups_key" ON "PlantillaProcedimiento"("codigoCups");

-- CreateIndex
CREATE INDEX "PlantillaProcedimiento_categoria_idx" ON "PlantillaProcedimiento"("categoria");

-- CreateIndex
CREATE INDEX "Consentimiento_pacienteId_idx" ON "Consentimiento"("pacienteId");

-- CreateIndex
CREATE INDEX "Consentimiento_procedimientoId_idx" ON "Consentimiento"("procedimientoId");

-- CreateIndex
CREATE INDEX "Consentimiento_firmado_idx" ON "Consentimiento"("firmado");

-- CreateIndex
CREATE INDEX "FotoClinica_pacienteId_idx" ON "FotoClinica"("pacienteId");

-- CreateIndex
CREATE INDEX "FotoClinica_procedimientoId_idx" ON "FotoClinica"("procedimientoId");

-- CreateIndex
CREATE INDEX "FotoClinica_tipo_idx" ON "FotoClinica"("tipo");

-- CreateIndex
CREATE INDEX "MapaCorporal_pacienteId_idx" ON "MapaCorporal"("pacienteId");

-- CreateIndex
CREATE INDEX "MapaCorporal_procedimientoId_idx" ON "MapaCorporal"("procedimientoId");

-- CreateIndex
CREATE INDEX "SeguimientoPostOp_pacienteId_idx" ON "SeguimientoPostOp"("pacienteId");

-- CreateIndex
CREATE INDEX "SeguimientoPostOp_procedimientoId_idx" ON "SeguimientoPostOp"("procedimientoId");

-- CreateIndex
CREATE INDEX "SeguimientoPostOp_diaPostOp_idx" ON "SeguimientoPostOp"("diaPostOp");

-- CreateIndex
CREATE INDEX "SeguimientoPostOp_completado_idx" ON "SeguimientoPostOp"("completado");

-- CreateIndex
CREATE INDEX "Alerta_pacienteId_idx" ON "Alerta"("pacienteId");

-- CreateIndex
CREATE INDEX "Alerta_severidad_idx" ON "Alerta"("severidad");

-- CreateIndex
CREATE INDEX "Alerta_resuelta_idx" ON "Alerta"("resuelta");

-- CreateIndex
CREATE INDEX "Cita_pacienteId_idx" ON "Cita"("pacienteId");

-- CreateIndex
CREATE INDEX "Cita_medicoId_idx" ON "Cita"("medicoId");

-- CreateIndex
CREATE INDEX "Cita_fechaHora_idx" ON "Cita"("fechaHora");

-- CreateIndex
CREATE INDEX "Cita_estado_idx" ON "Cita"("estado");

-- CreateIndex
CREATE INDEX "Transaccion_pacienteId_idx" ON "Transaccion"("pacienteId");

-- CreateIndex
CREATE INDEX "Transaccion_estado_idx" ON "Transaccion"("estado");

-- CreateIndex
CREATE INDEX "AuditLog_usuarioId_idx" ON "AuditLog"("usuarioId");

-- CreateIndex
CREATE INDEX "AuditLog_tablaAfectada_idx" ON "AuditLog"("tablaAfectada");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Integracion_tipo_key" ON "Integracion"("tipo");

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alergia" ADD CONSTRAINT "Alergia_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AntecedentesQuirurgicos" ADD CONSTRAINT "AntecedentesQuirurgicos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_editadoPor_fkey" FOREIGN KEY ("editadoPor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoClinica" ADD CONSTRAINT "FotoClinica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoClinica" ADD CONSTRAINT "FotoClinica_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaCorporal" ADD CONSTRAINT "MapaCorporal_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaCorporal" ADD CONSTRAINT "MapaCorporal_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoPostOp" ADD CONSTRAINT "SeguimientoPostOp_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoPostOp" ADD CONSTRAINT "SeguimientoPostOp_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
