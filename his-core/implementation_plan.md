# Arquitectura Base Modular Multi-Tenant para HIS (NestJS + TypeScript)

Este plan detalla la inicialización y construcción de la arquitectura base multi-tenant para el sistema HIS (Hospital Information System), desacoplando la gestión de tenants en la base de datos maestra `his_master` (PostgreSQL) y proporcionando una base modular escalable.

## Decisiones de Arquitectura

1. **Gestión de Configuración y Validación**:
   - Uso de `@nestjs/config` con **Zod** para validación tipada estricta (`z.infer<typeof envSchema>`), coerción automática de tipos numéricos y booleanos, y fail-fast en el bootstraping de la aplicación.
   - Configuración namespaced (`app`, `masterDb`, `security`) con `registerAs` para inyección fuertemente tipada mediante `ConfigType<T>`.

2. **Base de Datos Maestra (`his_master`)**:
   - Configuración de `MasterDatabaseModule` utilizando `@nestjs/typeorm` y `pg`.
   - Conexión global con pool de conexiones configurables (max/min/timeout) y registro explícito de entidades maestras.

3. **Módulo de Tenancy (`core/tenancy`)**:
   - **Entidad `Tenant`**: Diseñada para sistemas hospitalarios (subdomain, code/NIT, status, plan, credenciales de BD aislada `dbName`/`dbHost`/`dbUser`, y `clinicalSettings` en formato JSONB para módulos clínicos como Odontología, Urgencias, etc.).
   - **`TenantService`**: Resolución por `subdomain` o `id`, validación de estados de suscripción (`ACTIVE`, `SUSPENDED`, `INACTIVE`), y capa de caché en memoria con TTL para optimizar la latencia en transacciones clínicas concurrentes.
   - **Contexto Multi-Tenant**: Soporte para resolución mediante cabecera `X-Tenant-ID` o subdominio en el `Host`.

4. **Ubicación del Proyecto**:
   - Se creará en `his-backend/` manteniendo intacto el backend legacy `backend_/`, permitiendo coexistencia y migración progresiva.

---

## Cambios Propuestos

### Componente: Configuración (`src/core/config/`)

#### [NEW] `his-backend/.env.example`
- Variables de entorno documentadas para entorno, puerto, conexión `his_master`, dominios y seguridad.

#### [NEW] `his-backend/src/core/config/env.validation.ts`
- Esquema Zod exhaustivo con validación de rangos, defaults y transformaciones.

#### [NEW] `his-backend/src/core/config/configuration.ts`
- Definición de factories namespaced `appConfig`, `masterDbConfig` y `securityConfig`.

#### [NEW] `his-backend/src/core/config/core-config.module.ts`
- Módulo `CoreConfigModule` que encapsula `ConfigModule.forRoot`.

---

### Componente: Base de Datos Maestra (`src/core/database/`)

#### [NEW] `his-backend/src/core/database/master-database.module.ts`
- Configuración asíncrona de TypeORM apuntando a `his_master`.
- Exportación de la conexión y constantes de conexión `MASTER_CONNECTION_NAME`.

---

### Componente: Tenancy (`src/core/tenancy/`)

#### [NEW] `his-backend/src/core/tenancy/entities/tenant.entity.ts`
- Entidad TypeORM `Tenant` con soporte de aislamiento de datos y configuración clínica.

#### [NEW] `his-backend/src/core/tenancy/services/tenant.service.ts`
- Servicio de resolución de tenants por subdominio o ID con validación de estado y caché TTL.

#### [NEW] `his-backend/src/core/tenancy/tenancy.module.ts`
- Módulo NestJS que registra el repositorio `Tenant` sobre la conexión maestra y exporta `TenantService`.

---

### Componente: Aplicación Base y Pruebas

#### [NEW] `his-backend/package.json` & `his-backend/tsconfig.json` & `his-backend/nest-cli.json`
- Configuración de dependencias, scripts de build, test y arranque.

#### [NEW] `his-backend/src/app.module.ts` & `his-backend/src/main.ts`
- Registro de módulos core y bootstrap con validación de pipes y logs estructurados.

#### [NEW] `his-backend/src/core/tenancy/services/tenant.service.spec.ts`
- Pruebas unitarias de resolución, validación de estado (suspendido/activo) y funcionamiento del caché.

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar suite de pruebas unitarias con Jest:
  ```powershell
  cd his-backend
  npm run test
  ```
- Validar compilación de TypeScript:
  ```powershell
  npm run build
  ```

### Verificación Manual
- Validar que al arrancar sin variables requeridas falle con el mensaje descriptivo de Zod.
- Validar la tipificación estricta de `Tenant` y los métodos `findBySubdomain` y `findById`.
