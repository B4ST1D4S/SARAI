# Walkthrough: Gestión de Conexiones Dinámicas Multi-Tenant (`TenancyConnectionService`)

Se ha diseñado, implementado y probado exhaustivamente el servicio `TenancyConnectionService` para gestionar conexiones dinámicas a bases de datos PostgreSQL por cliente en el sistema HIS.

---

## 1. Diagrama de Arquitectura de Conexiones Dinámicas

```
                    ┌──────────────────────────────┐
                    │     Petición HTTP entrante   │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │    TenantContextService      │
                    │   (AsyncLocalStorage ALS)    │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      TenancyConnectionService                          │
│                                                                        │
│ 1. getTenantConnection():                                              │
│    ├── ¿Existe en pools.get(tenantId)?                                 │
│    │    ├── SÍ ──> Retorna Pool en memoria                             │
│    │    └── NO ──> Desencripta dbPassword (AES-256-GCM)                │
│    │               Instancia nuevo pg.Pool:                            │
│    │                 - max: 10 conexiones                              │
│    │                 - idleTimeoutMillis: 30000 ms                     │
│    │                 - connectionTimeoutMillis: 5000 ms                │
│    │               Guarda en pools.set(tenantId, pool)                 │
│                                                                        │
│ 2. Helpers de Ejecución Directa:                                       │
│    ├── query(sql, params): Consultas parametrizadas                    │
│    └── transaction(callback): BEGIN / COMMIT / ROLLBACK automático     │
│                                                                        │
│ 3. Ciclo de Vida:                                                      │
│    └── onApplicationShutdown / onModuleDestroy: pool.end() a todos     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │    Base de Datos Aislada del Tenant       │
             │   (PostgreSQL: his_tenant_sanjose, etc.)  │
             └───────────────────────────────────────────┘
```

---

## 2. Componentes Creados

### 1. `TenancyConnectionService` (`src/core/tenancy/services/tenancy-connection.service.ts`)
- Mantiene `Map<string, pg.Pool>` en memoria.
- `getTenantConnection()`: Retorna el pool del tenant actual desde el `TenantContextService`.
- `getPoolForTenant(tenantId)`: Inicializa el pool si no existe con límites estrictos (`max: 10`, `idleTimeout: 30s`).
- `query<T>(sql, params)`: Ejecuta sentencias SQL parametrizadas seguras contra la BD del tenant.
- `transaction<T>(callback)`: Ejecuta bloques transaccionales con control automático de `BEGIN`, `COMMIT` y `ROLLBACK`.
- `closeTenantPool(tenantId)`: Cierra individualmente el pool de un tenant suspendido o actualizado.
- `onApplicationShutdown` & `onModuleDestroy`: Drena y cierra ordenadamente todos los pools de tenants activos durante el apagado del servidor.

### 2. `CryptoService` (`src/core/security/crypto.service.ts`)
- Encriptación y desencriptación con algoritmo **AES-256-GCM** (autenticado con IV y AuthTag).
- Clave de cifrado derivada mediante `SHA-256` a partir del secreto institucional.
- Retrocompatibilidad transparente con credenciales de texto plano durante migraciones o entornos de desarrollo.

---

## 3. Verificación Automatizada

### Pruebas Unitarias Ejecutadas (`npm test`):
```text
PASS test/env.validation.spec.ts
PASS test/tenant-context.service.spec.ts
PASS test/crypto.service.spec.ts
PASS test/tenant.service.spec.ts
PASS test/tenant-resolver.middleware.spec.ts
PASS test/tenancy-connection.service.spec.ts

Test Suites: 6 passed, 6 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        23.553 s
```

### Compilación con TypeScript (`npm run build`):
```text
> his-core@1.0.0 build
> nest build
(Compilación exitosa con código de salida 0)
```
