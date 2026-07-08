-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('MODULO', 'SUBMODULO', 'PANTALLA', 'COMPONENTE', 'CAMPO', 'API');

-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'IMPRIMIR', 'EXPORTAR', 'APROBAR', 'RECHAZAR', 'FIRMAR', 'ANULAR', 'DELEGAR', 'CONFIGURAR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EfectoPermiso" AS ENUM ('PERMITIR', 'DENEGAR');

-- CreateEnum
CREATE TYPE "TipoMfa" AS ENUM ('TOTP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "TipoEventoSeg" AS ENUM ('LOGIN_FALLIDO', 'CUENTA_BLOQUEADA', 'PASSWORD_CAMBIADO', 'PASSWORD_EXPIRADO', 'MFA_FALLIDO', 'SESION_EXPIRADA', 'ACCESO_DENEGADO', 'DISPOSITIVO_NUEVO', 'PERMISO_ESCALADO', 'DELEGACION_CREADA', 'ADMIN_ACCION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "perfilId" TEXT,
ADD COLUMN     "sedeId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "razonSocial" TEXT,
    "logo" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "pais" TEXT DEFAULT 'Colombia',
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "esBase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IamRol" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "esBase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,

    CONSTRAINT "IamRol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilIamRol" (
    "perfilId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilIamRol_pkey" PRIMARY KEY ("perfilId","rolId")
);

-- CreateTable
CREATE TABLE "UsuarioIamRol" (
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignadoPor" TEXT,

    CONSTRAINT "UsuarioIamRol_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoUsuario" (
    "grupoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrupoUsuario_pkey" PRIMARY KEY ("grupoId","usuarioId")
);

-- CreateTable
CREATE TABLE "RecursoSistema" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoRecurso" NOT NULL,
    "parentId" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecursoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermisoRecurso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "perfilId" TEXT,
    "rolId" TEXT,
    "grupoId" TEXT,
    "recursoId" TEXT NOT NULL,
    "accion" "TipoAccion" NOT NULL,
    "efecto" "EfectoPermiso" NOT NULL DEFAULT 'PERMITIR',
    "scopeEmpresaId" TEXT,
    "scopeSedeId" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermisoRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliticaSeguridad" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "nombre" TEXT NOT NULL,
    "longitudMinima" INTEGER NOT NULL DEFAULT 8,
    "longitudMaxima" INTEGER NOT NULL DEFAULT 128,
    "requiereMayusculas" BOOLEAN NOT NULL DEFAULT true,
    "requiereMinusculas" BOOLEAN NOT NULL DEFAULT true,
    "requiereNumeros" BOOLEAN NOT NULL DEFAULT true,
    "requiereEspeciales" BOOLEAN NOT NULL DEFAULT false,
    "diasVencimientoPassword" INTEGER NOT NULL DEFAULT 90,
    "historialPasswords" INTEGER NOT NULL DEFAULT 5,
    "tiempoInactividad" INTEGER NOT NULL DEFAULT 30,
    "sesionesMaximas" INTEGER NOT NULL DEFAULT 3,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 5,
    "tiempoBloqueo" INTEGER NOT NULL DEFAULT 15,
    "mfaObligatorio" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "esDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliticaSeguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionActiva" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "ubicacion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SesionActiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispositivoAutorizado" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "nombre" TEXT,
    "tipo" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "autorizado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcceso" TIMESTAMP(3),

    CONSTRAINT "DispositivoAutorizado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditAcceso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "email" TEXT,
    "accion" TEXT NOT NULL,
    "recurso" TEXT,
    "resultado" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "sessionId" TEXT,
    "detalles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoSeguridad" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEventoSeg" NOT NULL,
    "usuarioId" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "detalles" JSONB,
    "severidad" TEXT NOT NULL DEFAULT 'MEDIA',
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "resueltoPor" TEXT,
    "resueltoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoSeguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegacionTemporal" (
    "id" TEXT NOT NULL,
    "deleganteId" TEXT NOT NULL,
    "delegadoId" TEXT NOT NULL,
    "motivo" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "recursosCodigos" TEXT[],
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "aprobadoPor" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegacionTemporal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaConfig" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoMfa" NOT NULL DEFAULT 'EMAIL',
    "secreto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditCambio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "email" TEXT,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "camposAntes" JSONB,
    "camposDespues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nit_key" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Empresa_activo_idx" ON "Empresa"("activo");

-- CreateIndex
CREATE INDEX "Sede_empresaId_idx" ON "Sede"("empresaId");

-- CreateIndex
CREATE INDEX "Sede_activo_idx" ON "Sede"("activo");

-- CreateIndex
CREATE INDEX "Perfil_empresaId_idx" ON "Perfil"("empresaId");

-- CreateIndex
CREATE INDEX "Perfil_activo_idx" ON "Perfil"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "IamRol_nombre_key" ON "IamRol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "IamRol_codigo_key" ON "IamRol"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "RecursoSistema_codigo_key" ON "RecursoSistema"("codigo");

-- CreateIndex
CREATE INDEX "RecursoSistema_parentId_idx" ON "RecursoSistema"("parentId");

-- CreateIndex
CREATE INDEX "RecursoSistema_tipo_idx" ON "RecursoSistema"("tipo");

-- CreateIndex
CREATE INDEX "RecursoSistema_activo_idx" ON "RecursoSistema"("activo");

-- CreateIndex
CREATE INDEX "PermisoRecurso_usuarioId_accion_idx" ON "PermisoRecurso"("usuarioId", "accion");

-- CreateIndex
CREATE INDEX "PermisoRecurso_perfilId_accion_idx" ON "PermisoRecurso"("perfilId", "accion");

-- CreateIndex
CREATE INDEX "PermisoRecurso_rolId_accion_idx" ON "PermisoRecurso"("rolId", "accion");

-- CreateIndex
CREATE INDEX "PermisoRecurso_recursoId_idx" ON "PermisoRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "PoliticaSeguridad_empresaId_idx" ON "PoliticaSeguridad"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "SesionActiva_token_key" ON "SesionActiva"("token");

-- CreateIndex
CREATE INDEX "SesionActiva_usuarioId_activa_idx" ON "SesionActiva"("usuarioId", "activa");

-- CreateIndex
CREATE INDEX "SesionActiva_expiraEn_idx" ON "SesionActiva"("expiraEn");

-- CreateIndex
CREATE INDEX "DispositivoAutorizado_usuarioId_idx" ON "DispositivoAutorizado"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoAutorizado_usuarioId_deviceId_key" ON "DispositivoAutorizado"("usuarioId", "deviceId");

-- CreateIndex
CREATE INDEX "AuditAcceso_usuarioId_idx" ON "AuditAcceso"("usuarioId");

-- CreateIndex
CREATE INDEX "AuditAcceso_accion_idx" ON "AuditAcceso"("accion");

-- CreateIndex
CREATE INDEX "AuditAcceso_createdAt_idx" ON "AuditAcceso"("createdAt");

-- CreateIndex
CREATE INDEX "EventoSeguridad_tipo_idx" ON "EventoSeguridad"("tipo");

-- CreateIndex
CREATE INDEX "EventoSeguridad_usuarioId_idx" ON "EventoSeguridad"("usuarioId");

-- CreateIndex
CREATE INDEX "EventoSeguridad_resuelto_idx" ON "EventoSeguridad"("resuelto");

-- CreateIndex
CREATE INDEX "EventoSeguridad_createdAt_idx" ON "EventoSeguridad"("createdAt");

-- CreateIndex
CREATE INDEX "DelegacionTemporal_deleganteId_idx" ON "DelegacionTemporal"("deleganteId");

-- CreateIndex
CREATE INDEX "DelegacionTemporal_delegadoId_idx" ON "DelegacionTemporal"("delegadoId");

-- CreateIndex
CREATE INDEX "DelegacionTemporal_activa_idx" ON "DelegacionTemporal"("activa");

-- CreateIndex
CREATE INDEX "DelegacionTemporal_fechaFin_idx" ON "DelegacionTemporal"("fechaFin");

-- CreateIndex
CREATE UNIQUE INDEX "MfaConfig_usuarioId_key" ON "MfaConfig"("usuarioId");

-- CreateIndex
CREATE INDEX "AuditCambio_tabla_registroId_idx" ON "AuditCambio"("tabla", "registroId");

-- CreateIndex
CREATE INDEX "AuditCambio_usuarioId_idx" ON "AuditCambio"("usuarioId");

-- CreateIndex
CREATE INDEX "AuditCambio_createdAt_idx" ON "AuditCambio"("createdAt");

-- CreateIndex
CREATE INDEX "User_empresaId_idx" ON "User"("empresaId");

-- CreateIndex
CREATE INDEX "User_sedeId_idx" ON "User"("sedeId");

-- CreateIndex
CREATE INDEX "User_perfilId_idx" ON "User"("perfilId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sede" ADD CONSTRAINT "Sede_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilIamRol" ADD CONSTRAINT "PerfilIamRol_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilIamRol" ADD CONSTRAINT "PerfilIamRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "IamRol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioIamRol" ADD CONSTRAINT "UsuarioIamRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioIamRol" ADD CONSTRAINT "UsuarioIamRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "IamRol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoUsuario" ADD CONSTRAINT "GrupoUsuario_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoUsuario" ADD CONSTRAINT "GrupoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoSistema" ADD CONSTRAINT "RecursoSistema_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RecursoSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRecurso" ADD CONSTRAINT "PermisoRecurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRecurso" ADD CONSTRAINT "PermisoRecurso_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRecurso" ADD CONSTRAINT "PermisoRecurso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "IamRol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRecurso" ADD CONSTRAINT "PermisoRecurso_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRecurso" ADD CONSTRAINT "PermisoRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoSistema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRecurso" ADD CONSTRAINT "PermisoRecurso_scopeSedeId_fkey" FOREIGN KEY ("scopeSedeId") REFERENCES "Sede"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliticaSeguridad" ADD CONSTRAINT "PoliticaSeguridad_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionActiva" ADD CONSTRAINT "SesionActiva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoAutorizado" ADD CONSTRAINT "DispositivoAutorizado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegacionTemporal" ADD CONSTRAINT "DelegacionTemporal_deleganteId_fkey" FOREIGN KEY ("deleganteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegacionTemporal" ADD CONSTRAINT "DelegacionTemporal_delegadoId_fkey" FOREIGN KEY ("delegadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaConfig" ADD CONSTRAINT "MfaConfig_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
