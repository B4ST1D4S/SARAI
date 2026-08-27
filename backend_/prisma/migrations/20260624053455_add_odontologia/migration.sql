/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MapaCorporal" DROP CONSTRAINT "MapaCorporal_procedimientoId_fkey";

-- AlterTable
ALTER TABLE "MapaCorporal" ALTER COLUMN "procedimientoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firmaBase64" TEXT,
ADD COLUMN     "registroMedico" TEXT,
ADD COLUMN     "registroProfesional" TEXT,
ADD COLUMN     "tipoDocumento" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "aplicaAnestesia" BOOLEAN NOT NULL DEFAULT false,
    "aplicaPediatria" BOOLEAN NOT NULL DEFAULT false,
    "aplicaCirugia" BOOLEAN NOT NULL DEFAULT false,
    "aplicaInstrumentacion" BOOLEAN NOT NULL DEFAULT false,
    "aplicaMedicoFamiliar" BOOLEAN NOT NULL DEFAULT false,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoPaciente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "tipoCampo" TEXT NOT NULL DEFAULT 'text',
    "esVisible" BOOLEAN NOT NULL DEFAULT true,
    "esObligatorio" BOOLEAN NOT NULL DEFAULT false,
    "esPersonalizado" BOOLEAN NOT NULL DEFAULT false,
    "opciones" JSONB,
    "placeholder" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampoPaciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'CONSULTA',
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidad" TEXT,
    "codigoReferencia" TEXT,
    "aplicaIva" BOOLEAN NOT NULL DEFAULT false,
    "tasaIva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esObligatorio" BOOLEAN NOT NULL DEFAULT false,
    "aplicaPYP" BOOLEAN NOT NULL DEFAULT false,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigServicioConsulta" (
    "id" TEXT NOT NULL,
    "tipoConsultaId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "generaAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "requiereOrden" BOOLEAN NOT NULL DEFAULT false,
    "centroOperacionId" TEXT,
    "cuentaContable" TEXT,
    "hcModuloId" TEXT,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigServicioConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartamentoCargo" (
    "id" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "permiteSeleccion" BOOLEAN NOT NULL DEFAULT true,
    "manejaInsumos" BOOLEAN NOT NULL DEFAULT false,
    "cumplimientoAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "tomadoAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "interfaceExterno" BOOLEAN NOT NULL DEFAULT false,
    "generaOrden" BOOLEAN NOT NULL DEFAULT false,
    "liquidaHonorarios" BOOLEAN NOT NULL DEFAULT false,
    "cumplimientoParcial" BOOLEAN NOT NULL DEFAULT false,
    "manejaCentroCosto" BOOLEAN NOT NULL DEFAULT false,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartamentoCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HCModulo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipoFinalidad" TEXT,
    "tipoRips" TEXT,
    "parametrosConfiguracion" JSONB,
    "programaId" TEXT,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HCModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaValor" (
    "id" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListaValor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivoCita" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'consulta',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotivoCita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametroSistema" (
    "id" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL DEFAULT '',
    "etiqueta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametroSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preparacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'consulta',
    "especialidadId" TEXT,
    "tipoConsultaId" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preparacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglaOperativa" (
    "id" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "permiteSeleccion" BOOLEAN NOT NULL DEFAULT true,
    "manejaInsumos" BOOLEAN NOT NULL DEFAULT false,
    "generaOrden" BOOLEAN NOT NULL DEFAULT false,
    "liquidaHonorarios" BOOLEAN NOT NULL DEFAULT false,
    "cumplimientoAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "tomadoAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "cumplimientoParcial" BOOLEAN NOT NULL DEFAULT false,
    "manejaCentroCosto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReglaOperativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioFacturable" (
    "id" TEXT NOT NULL,
    "codigoCups" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "subcategoria" TEXT,
    "tipoServicio" TEXT,
    "nivelComplejidad" TEXT,
    "conceptoRips" TEXT,
    "precioBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiereCantidad" BOOLEAN NOT NULL DEFAULT false,
    "esHonorario" BOOLEAN NOT NULL DEFAULT false,
    "esPOS" BOOLEAN NOT NULL DEFAULT false,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicioFacturable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoConsulta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "especialidadId" TEXT,
    "departamentoId" TEXT,
    "hcModuloId" TEXT,
    "requiereCaja" BOOLEAN NOT NULL DEFAULT false,
    "manejaAnestesia" BOOLEAN NOT NULL DEFAULT false,
    "permiteAgendamiento" BOOLEAN NOT NULL DEFAULT true,
    "controlaTiempoCita" BOOLEAN NOT NULL DEFAULT false,
    "abreHistoriaClinica" BOOLEAN NOT NULL DEFAULT true,
    "permiteCargosAdicionales" BOOLEAN NOT NULL DEFAULT false,
    "esProgramaPYP" BOOLEAN NOT NULL DEFAULT false,
    "manejaProtocolos" BOOLEAN NOT NULL DEFAULT false,
    "clasificacion" TEXT NOT NULL DEFAULT 'CONSULTA',
    "esPsicologia" BOOLEAN NOT NULL DEFAULT false,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 30,
    "bodegaId" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoConsultorio" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipoConsultorio" TEXT NOT NULL,
    "descripcion" TEXT,
    "indiceAutomatico" INTEGER,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoConsultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "citaId" TEXT,
    "descripcionServicio" TEXT NOT NULL,
    "lineas" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuentoPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuentoValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "notasAdicionales" TEXT,
    "vigenciaHasta" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'GENERADA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceptadaEn" TIMESTAMP(3),
    "rechazadaEn" TIMESTAMP(3),

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "procedimientos" TEXT[],
    "etapa" TEXT NOT NULL DEFAULT 'NUEVO_LEAD',
    "calificacion" TEXT NOT NULL DEFAULT 'COLD',
    "valorEstimado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "origen" TEXT,
    "notas" TEXT,
    "observaciones" TEXT,
    "tags" TEXT[],
    "pacienteId" TEXT,
    "creadoPor" TEXT,
    "proximoContacto" TIMESTAMP(3),
    "ultimaInteraccion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoHallazgo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT NOT NULL DEFAULT '#ef4444',
    "icono" TEXT,
    "generaTratamiento" BOOLEAN NOT NULL DEFAULT true,
    "prioridadDefault" TEXT,
    "categoria" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontoHallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoHallazgoSugerencia" (
    "id" TEXT NOT NULL,
    "hallazgoId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "porDefecto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdontoHallazgoSugerencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoEstado" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontoEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoPrioridad" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontoPrioridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoRiesgo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontoRiesgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Odontograma" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT,
    "historiaClinicaId" TEXT,
    "citaId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'PRIMERA_VEZ',
    "denticion" TEXT NOT NULL DEFAULT 'PERMANENTE',
    "estado" TEXT NOT NULL DEFAULT 'EN_PROCESO',
    "hallazgosGenerales" JSONB,
    "estetica" JSONB,
    "resumenIA" TEXT,
    "riesgoId" TEXT,
    "firmado" BOOLEAN NOT NULL DEFAULT false,
    "hashIntegridad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Odontograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoPiezaHallazgo" (
    "id" TEXT NOT NULL,
    "odontogramaId" TEXT NOT NULL,
    "diente" INTEGER NOT NULL,
    "superficie" TEXT,
    "hallazgoId" TEXT NOT NULL,
    "estadoId" TEXT,
    "observaciones" TEXT,
    "colorOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontoPiezaHallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoPlanItem" (
    "id" TEXT NOT NULL,
    "odontogramaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "diente" INTEGER,
    "superficie" TEXT,
    "hallazgoId" TEXT,
    "diagnostico" TEXT NOT NULL,
    "cargoId" TEXT,
    "codigoCups" TEXT,
    "descripcionProcedimiento" TEXT NOT NULL,
    "prioridadId" TEXT,
    "estadoTratamiento" TEXT NOT NULL DEFAULT 'PLANEADO',
    "medicoId" TEXT,
    "observaciones" TEXT,
    "evolucion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaProgramada" TIMESTAMP(3),
    "fechaEjecucion" TIMESTAMP(3),
    "cuentaItemId" TEXT,
    "facturado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontoPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontoEvolucion" (
    "id" TEXT NOT NULL,
    "odontogramaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "planItemId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'NOTA',
    "descripcion" TEXT NOT NULL,
    "medicoId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdontoEvolucion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_codigo_key" ON "Especialidad"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- CreateIndex
CREATE INDEX "Especialidad_estado_idx" ON "Especialidad"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "CampoPaciente_nombre_key" ON "CampoPaciente"("nombre");

-- CreateIndex
CREATE INDEX "CampoPaciente_esPersonalizado_idx" ON "CampoPaciente"("esPersonalizado");

-- CreateIndex
CREATE INDEX "CampoPaciente_esVisible_idx" ON "CampoPaciente"("esVisible");

-- CreateIndex
CREATE INDEX "CampoPaciente_seccion_idx" ON "CampoPaciente"("seccion");

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_codigo_key" ON "Cargo"("codigo");

-- CreateIndex
CREATE INDEX "Cargo_estado_idx" ON "Cargo"("estado");

-- CreateIndex
CREATE INDEX "Cargo_tipo_idx" ON "Cargo"("tipo");

-- CreateIndex
CREATE INDEX "ConfigServicioConsulta_servicioId_idx" ON "ConfigServicioConsulta"("servicioId");

-- CreateIndex
CREATE INDEX "ConfigServicioConsulta_tipoConsultaId_idx" ON "ConfigServicioConsulta"("tipoConsultaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigServicioConsulta_tipoConsultaId_servicioId_key" ON "ConfigServicioConsulta"("tipoConsultaId", "servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_codigo_key" ON "Departamento"("codigo");

-- CreateIndex
CREATE INDEX "Departamento_estado_idx" ON "Departamento"("estado");

-- CreateIndex
CREATE INDEX "DepartamentoCargo_departamentoId_idx" ON "DepartamentoCargo"("departamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartamentoCargo_departamentoId_cargoId_key" ON "DepartamentoCargo"("departamentoId", "cargoId");

-- CreateIndex
CREATE UNIQUE INDEX "HCModulo_codigo_key" ON "HCModulo"("codigo");

-- CreateIndex
CREATE INDEX "HCModulo_activo_idx" ON "HCModulo"("activo");

-- CreateIndex
CREATE INDEX "ListaValor_grupo_idx" ON "ListaValor"("grupo");

-- CreateIndex
CREATE UNIQUE INDEX "ListaValor_grupo_valor_key" ON "ListaValor"("grupo", "valor");

-- CreateIndex
CREATE INDEX "MotivoCita_activo_idx" ON "MotivoCita"("activo");

-- CreateIndex
CREATE INDEX "MotivoCita_tipo_idx" ON "MotivoCita"("tipo");

-- CreateIndex
CREATE INDEX "ParametroSistema_grupo_idx" ON "ParametroSistema"("grupo");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroSistema_grupo_clave_key" ON "ParametroSistema"("grupo", "clave");

-- CreateIndex
CREATE INDEX "Preparacion_estado_idx" ON "Preparacion"("estado");

-- CreateIndex
CREATE INDEX "Preparacion_tipoConsultaId_idx" ON "Preparacion"("tipoConsultaId");

-- CreateIndex
CREATE INDEX "ReglaOperativa_departamentoId_idx" ON "ReglaOperativa"("departamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ReglaOperativa_departamentoId_servicioId_key" ON "ReglaOperativa"("departamentoId", "servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicioFacturable_codigoCups_key" ON "ServicioFacturable"("codigoCups");

-- CreateIndex
CREATE INDEX "ServicioFacturable_categoria_idx" ON "ServicioFacturable"("categoria");

-- CreateIndex
CREATE INDEX "ServicioFacturable_estado_idx" ON "ServicioFacturable"("estado");

-- CreateIndex
CREATE INDEX "TipoConsulta_especialidadId_idx" ON "TipoConsulta"("especialidadId");

-- CreateIndex
CREATE INDEX "TipoConsulta_estado_idx" ON "TipoConsulta"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "TipoConsultorio_codigo_key" ON "TipoConsultorio"("codigo");

-- CreateIndex
CREATE INDEX "TipoConsultorio_estado_idx" ON "TipoConsultorio"("estado");

-- CreateIndex
CREATE INDEX "Cotizacion_pacienteId_idx" ON "Cotizacion"("pacienteId");

-- CreateIndex
CREATE INDEX "Cotizacion_medicoId_idx" ON "Cotizacion"("medicoId");

-- CreateIndex
CREATE INDEX "Cotizacion_estado_idx" ON "Cotizacion"("estado");

-- CreateIndex
CREATE INDEX "Cotizacion_creadoEn_idx" ON "Cotizacion"("creadoEn");

-- CreateIndex
CREATE INDEX "CrmLead_etapa_idx" ON "CrmLead"("etapa");

-- CreateIndex
CREATE INDEX "CrmLead_calificacion_idx" ON "CrmLead"("calificacion");

-- CreateIndex
CREATE INDEX "CrmLead_pacienteId_idx" ON "CrmLead"("pacienteId");

-- CreateIndex
CREATE INDEX "CrmLead_creadoPor_idx" ON "CrmLead"("creadoPor");

-- CreateIndex
CREATE UNIQUE INDEX "OdontoHallazgo_codigo_key" ON "OdontoHallazgo"("codigo");

-- CreateIndex
CREATE INDEX "OdontoHallazgo_activo_idx" ON "OdontoHallazgo"("activo");

-- CreateIndex
CREATE INDEX "OdontoHallazgo_categoria_idx" ON "OdontoHallazgo"("categoria");

-- CreateIndex
CREATE INDEX "OdontoHallazgoSugerencia_hallazgoId_idx" ON "OdontoHallazgoSugerencia"("hallazgoId");

-- CreateIndex
CREATE INDEX "OdontoHallazgoSugerencia_cargoId_idx" ON "OdontoHallazgoSugerencia"("cargoId");

-- CreateIndex
CREATE UNIQUE INDEX "OdontoHallazgoSugerencia_hallazgoId_cargoId_key" ON "OdontoHallazgoSugerencia"("hallazgoId", "cargoId");

-- CreateIndex
CREATE UNIQUE INDEX "OdontoEstado_codigo_key" ON "OdontoEstado"("codigo");

-- CreateIndex
CREATE INDEX "OdontoEstado_activo_idx" ON "OdontoEstado"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "OdontoPrioridad_codigo_key" ON "OdontoPrioridad"("codigo");

-- CreateIndex
CREATE INDEX "OdontoPrioridad_activo_idx" ON "OdontoPrioridad"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "OdontoRiesgo_codigo_key" ON "OdontoRiesgo"("codigo");

-- CreateIndex
CREATE INDEX "OdontoRiesgo_activo_idx" ON "OdontoRiesgo"("activo");

-- CreateIndex
CREATE INDEX "Odontograma_pacienteId_idx" ON "Odontograma"("pacienteId");

-- CreateIndex
CREATE INDEX "Odontograma_tipo_idx" ON "Odontograma"("tipo");

-- CreateIndex
CREATE INDEX "Odontograma_estado_idx" ON "Odontograma"("estado");

-- CreateIndex
CREATE INDEX "Odontograma_medicoId_idx" ON "Odontograma"("medicoId");

-- CreateIndex
CREATE INDEX "OdontoPiezaHallazgo_odontogramaId_idx" ON "OdontoPiezaHallazgo"("odontogramaId");

-- CreateIndex
CREATE INDEX "OdontoPiezaHallazgo_diente_idx" ON "OdontoPiezaHallazgo"("diente");

-- CreateIndex
CREATE INDEX "OdontoPiezaHallazgo_hallazgoId_idx" ON "OdontoPiezaHallazgo"("hallazgoId");

-- CreateIndex
CREATE INDEX "OdontoPlanItem_odontogramaId_idx" ON "OdontoPlanItem"("odontogramaId");

-- CreateIndex
CREATE INDEX "OdontoPlanItem_pacienteId_idx" ON "OdontoPlanItem"("pacienteId");

-- CreateIndex
CREATE INDEX "OdontoPlanItem_estadoTratamiento_idx" ON "OdontoPlanItem"("estadoTratamiento");

-- CreateIndex
CREATE INDEX "OdontoPlanItem_cargoId_idx" ON "OdontoPlanItem"("cargoId");

-- CreateIndex
CREATE INDEX "OdontoEvolucion_odontogramaId_idx" ON "OdontoEvolucion"("odontogramaId");

-- CreateIndex
CREATE INDEX "OdontoEvolucion_pacienteId_idx" ON "OdontoEvolucion"("pacienteId");

-- CreateIndex
CREATE INDEX "OdontoEvolucion_fecha_idx" ON "OdontoEvolucion"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "MapaCorporal" ADD CONSTRAINT "MapaCorporal_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigServicioConsulta" ADD CONSTRAINT "ConfigServicioConsulta_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "ServicioFacturable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigServicioConsulta" ADD CONSTRAINT "ConfigServicioConsulta_tipoConsultaId_fkey" FOREIGN KEY ("tipoConsultaId") REFERENCES "TipoConsulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoCargo" ADD CONSTRAINT "DepartamentoCargo_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoCargo" ADD CONSTRAINT "DepartamentoCargo_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparacion" ADD CONSTRAINT "Preparacion_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparacion" ADD CONSTRAINT "Preparacion_tipoConsultaId_fkey" FOREIGN KEY ("tipoConsultaId") REFERENCES "TipoConsulta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaOperativa" ADD CONSTRAINT "ReglaOperativa_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaOperativa" ADD CONSTRAINT "ReglaOperativa_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "ServicioFacturable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoConsulta" ADD CONSTRAINT "TipoConsulta_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoConsulta" ADD CONSTRAINT "TipoConsulta_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoConsulta" ADD CONSTRAINT "TipoConsulta_hcModuloId_fkey" FOREIGN KEY ("hcModuloId") REFERENCES "HCModulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoHallazgoSugerencia" ADD CONSTRAINT "OdontoHallazgoSugerencia_hallazgoId_fkey" FOREIGN KEY ("hallazgoId") REFERENCES "OdontoHallazgo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoHallazgoSugerencia" ADD CONSTRAINT "OdontoHallazgoSugerencia_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "TarifaCargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odontograma" ADD CONSTRAINT "Odontograma_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odontograma" ADD CONSTRAINT "Odontograma_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odontograma" ADD CONSTRAINT "Odontograma_riesgoId_fkey" FOREIGN KEY ("riesgoId") REFERENCES "OdontoRiesgo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPiezaHallazgo" ADD CONSTRAINT "OdontoPiezaHallazgo_odontogramaId_fkey" FOREIGN KEY ("odontogramaId") REFERENCES "Odontograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPiezaHallazgo" ADD CONSTRAINT "OdontoPiezaHallazgo_hallazgoId_fkey" FOREIGN KEY ("hallazgoId") REFERENCES "OdontoHallazgo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPiezaHallazgo" ADD CONSTRAINT "OdontoPiezaHallazgo_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "OdontoEstado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPlanItem" ADD CONSTRAINT "OdontoPlanItem_odontogramaId_fkey" FOREIGN KEY ("odontogramaId") REFERENCES "Odontograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPlanItem" ADD CONSTRAINT "OdontoPlanItem_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPlanItem" ADD CONSTRAINT "OdontoPlanItem_hallazgoId_fkey" FOREIGN KEY ("hallazgoId") REFERENCES "OdontoHallazgo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPlanItem" ADD CONSTRAINT "OdontoPlanItem_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "TarifaCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoPlanItem" ADD CONSTRAINT "OdontoPlanItem_prioridadId_fkey" FOREIGN KEY ("prioridadId") REFERENCES "OdontoPrioridad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoEvolucion" ADD CONSTRAINT "OdontoEvolucion_odontogramaId_fkey" FOREIGN KEY ("odontogramaId") REFERENCES "Odontograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontoEvolucion" ADD CONSTRAINT "OdontoEvolucion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
