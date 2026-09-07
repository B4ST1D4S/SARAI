# Gestión Multitenant Dinámica y Connection Pooling

## 1. Flujo de Resolución de Tenant
Cada petición entrante debe identificar el contexto de ejecución antes de tocar la base de datos:

1. El cliente HTTP envía la cabecera `x-tenant-id` (ej. `demo`).
2. `TenantResolverMiddleware` intercepta la solicitud y consulta la base `Master` para obtener la metadata de conexión del subdominio.
3. Se crea una instancia `TenantContext` inyectada en el `AsyncLocalStorage` a través de `TenantContextService.run()`.
4. Los repositorios y servicios obtienen el pool activo mediante `TenancyConnectionService.getTenantPool()`.

## 2. TenancyConnectionService y Cache de Pools
Para evitar agotar los descriptores de sockets de PostgreSQL abriendo conexiones por cada request, los pools se cachean en memoria (`Map<string, Pool>`):

```typescript
private readonly tenantPools = new Map<string, Pool>();

Si el pool no existe en el mapa para la clave del tenant, se instancia uno nuevo y se registra.
3. Pitfall Crítico: SASL SCRAM-SHA-256

Al conectar con los poolers de Supabase mediante autenticación SCRAM, el driver pg arroja el error irrecuperable:

    SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string

Causa Raíz

Discrepancia entre la convención de TypeScript (dbPassword en la entidad) y la columna SQL (db_password), provocando que la propiedad enviada a new Pool(...) sea undefined.
Regla de Implementación Innegociable

Toda instanciación dinámica en TenancyConnectionService debe resolver y castear la contraseña a string de forma estricta:
TypeScript

const resolvedPassword = String(
  (dbConfig as any)?.password ??
  (dbConfig as any)?.dbPassword ??
  (dbConfig as any)?.db_password ??
  defaultPassword ??
  ''
);

pool = new Pool({
  host: dbConfig.host || defaultHost,
  port: Number(dbConfig.port || defaultPort),
  database: dbConfig.database || 'postgres',
  user: (dbConfig as any)?.username ?? (dbConfig as any)?.user ?? defaultUser,
  password: resolvedPassword,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});