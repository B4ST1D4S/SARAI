# SARAI HIS - AI Agent Engineering Directives & Architecture Context

Este documento define los estándares arquitectónicos, directivas de seguridad y convenciones técnicas no negociables del proyecto **SARAI (Health Information System)**. Cualquier cambio de código propuesto por agentes de IA o desarrolladores DEBE cumplir estas reglas.

---

## 1. Topología del Sistema y Repositorio

- **Arquitectura**: Monorepo híbrido desacoplado.
  - `/his-core`: Backend API en **NestJS**, TypeScript, PostgreSQL (`pg` / `pg-pool`), JWT, Argon2id.
  - `/frontend`: Frontend SPA en **Vite + React**, TypeScript, Tailwind CSS, Canvas interactivo.
- **Entorno de Datos**: PostgreSQL multitenant alojado en **Supabase** (Transaction / Session Poolers vía SCRAM-SHA-256).

---

## 2. Directivas Críticas del Backend (`his-core`)

### Multi-Tenancy Dinámico
- **Aislamiento**: Arquitectura basada en bases de datos independientes por cliente (Tenant Database Isolation) administrada por un catálogo Master.
- **Resolución de Tenant**: La cabecera HTTP requerida es obligatoriamente `x-tenant-id` (resuelto por `TenantResolverMiddleware`).
- **Conexiones dinámicas (`TenancyConnectionService`)**:
  - NUNCA instanciar clientes o pools de PostgreSQL directamente dentro de controladores o servicios.
  - Usar siempre `tenancyConnectionService.getTenantPool()` dentro del contexto de ejecución `TenantContextService.run()`.
  - **Manejo de Credenciales (SCRAM)**: Al instanciar `new Pool(...)`, validar siempre que el password sea una cadena no vacía (`String(dbConfig.password ?? dbConfig.dbPassword ?? dbConfig.db_password ?? '')`). Omitir o enviar `undefined` rompe el handshake SASL: `SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`.

### Seguridad y Criptografía
- **Hashing de Contraseñas**: Exclusivamente **Argon2id** (`argon2.hash(password, { type: argon2.argon2id })`). Prohibido el uso de `bcrypt` o algoritmos MD5/SHA.
- **Tokens de Acceso (JWT)**:
  - Vida útil corta (ej. 15 minutos).
  - Claims obligatorios: `sub`, `email`, `username`, `tenantId`, `tenantSubdomain`, `rol`, `profesionalId`, `registroMedico`, `esAsistencial`.
- **Refresh Token Rotation (RTR)**:
  - Persistencia en base de datos cifrada/hasheada gestionada por `TokenVaultService`.
  - Transmisión cliente-servidor estrictamente vía cookie HTTP:
    - Nombre: `__Host-refresh_token`.
    - Flags obligatorias: `httpOnly: true`, `secure: true` (en producción), `sameSite: 'strict'`.
    - Ruta canónica restringida: `path: '/api/v1/auth/refresh'`.
    - Limpieza: Toda revocación o logout DEBE emitir `res.clearCookie()` con los MISMOS parámetros de path (`/api/v1/auth/refresh`) para prevenir tokens huérfanos.

---

## 3. Directivas del Frontend (`frontend`)

### Manejo de Sesión y Red
- **Cliente HTTP (`src/services/api.ts`)**:
  - Toda llamada de red debe transitar por el helper central `apiCall` (o la instancia `api` unificada).
  - Obligatorio `credentials: 'include'` en cada petición hacia el backend para que el navegador transporte la cookie `__Host-refresh_token`.
  - Inyección automática del header `x-tenant-id` resuelto dinámicamente según el subdominio del host (`getSubdomain()`) con fallback a `'demo'`.
- **Almacenamiento de Tokens**:
  - El `accessToken` reside en memoria o `localStorage` para firmas en headers de cabecera (`Authorization: Bearer <token>`).
  - NUNCA persistir refresh tokens en `localStorage` o `sessionStorage`. La rotación es responsabilidad de la cookie HttpOnly.
- **Rotación Silenciosa (Interceptor)**:
  - Ante respuestas `401 Unauthorized`, `apiCall` debe poner en cola las peticiones concurrentes, ejecutar `POST /api/v1/auth/refresh` con `subdomain` y reintentar la cola una vez obtenido el nuevo token.

---

## 4. Convenciones de Dominio Clínico (HIS)

- **Usuarios y Roles**:
  - `ADMIN`, `MEDICO_GENERAL`, `ESPECIALISTA`, `ENFERMERO`, `RECEPCIONISTA`.
  - Los usuarios con rol asistencial poseen vínculo 1:1 con la tabla `profesionales_salud`.
- **Nomenclatura de Base de Datos**:
  - Esquema en snake_case (`historias_clinicas`, `pacientes`, `profesionales_salud`, `mapa_corporal`).
  - DTOs y modelos TypeScript en camelCase.
- **Workers y Tareas Asíncronas**:
  - Generación de RIPS (Resolución normativa de salud) y compilación de Historias Clínicas en PDF deben delegarse a workers desacoplados; nunca procesar archivos pesados en el hilo de respuesta del controlador.