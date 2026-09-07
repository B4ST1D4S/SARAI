# Topología de Base de Datos: Master vs. Tenants

## 1. Modelo de Datos Aislado (Database-per-Tenant)
SARAI adopta un aislamiento físico/lógico estricto por institución médica para garantizar cumplimiento normativo en salud (HIPAA, Habeas Data y normatividad colombiana de historias clínicas). Ningún dato clínico se comparte en esquemas compartidos.

+--------------------------------+
              |     DATABASE: sarai_master     |
              |  - Instituciones / Subdominios |
              |  - Catálogo de Licencias       |
              |  - Credenciales de Conexión    |
              +--------------------------------+
                              |
        +---------------------+---------------------+
        |                                           |
        v                                           v

+------------------------+                 +------------------------+
|  TENANT: clinica_demo  |                 |  TENANT: clinica_norte |
|  - Pacientes           |                 |  - Pacientes           |
|  - Historias Clínicas  |                 |  - Historias Clínicas  |
|  - Citas y Médicos     |                 |  - Citas y Médicos     |
|  - Refresh Tokens      |                 |  - Refresh Tokens      |
+------------------------+                 +------------------------+

## 2. Base de Datos Master (`his_master`)
- **Propósito**: Registro central de clientes, subdominios válidos y metadata de aprovisionamiento.
- **Acceso**: Únicamente consumida durante el arranque y por `TenantResolverMiddleware` o tareas administrativas del sistema (Tenant Runner).
- **Entidades clave**:
  - `instituciones`: `id`, `nombre`, `subdomain` (único, ej: `demo`), `db_host`, `db_port`, `db_name`, `db_user`, `db_password`, `estado`, `db_ssl`.

## 3. Bases de Datos de Tenants (Supabase Poolers)
- **Alojamiento**: Proyectos en Supabase o PostgreSQL dedicados.
- **Modo de Conexión**: Transaction / Session Pooler (puerto `6543` o `5432`).
- **Autenticación**: SCRAM-SHA-256 obligatoria.
- **Esquema Interno**:
  - `usuarios` y `profesionales_salud` (vinculados por `usuario_id`).
  - `pacientes` y `historias_clinicas`.
  - `refresh_tokens`: almacena el hash criptográfico para rotación y control de sesiones activas.