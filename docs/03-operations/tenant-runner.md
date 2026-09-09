# Operaciones: Tenant Runner (Migraciones y Scripts Multitenant)

## 1. Propósito y Responsabilidad
En una arquitectura *Database-per-Tenant*, los cambios de esquema (migraciones DDL) y las actualizaciones masivas de datos maestros (catálogos CIE-10, CUPS, tablas de configuración) no pueden ejecutarse apuntando a un único destino.

El **Tenant Runner** es la utilidad CLI interna de SARAI responsable de:
1. Conectarse a la base de datos `his_master`.
2. Descubrir todas las instituciones médicas activas.
3. Orquestar de forma secuencial o concurrente (con límite de hilos) la ejecución de scripts en cada base de datos de cliente.
4. Reportar el estado de éxito, rollback o inconsistencia por institución.

---

## 2. Flujo de Ejecución del Runner

         +------------------------------+
         | CLI: npm run tenant:migrate  |
         +------------------------------+
                        |
                        v
         +------------------------------+
         | Conexión a `sarai_master`    |
         | SELECT * FROM instituciones  |
         | WHERE activo = true;         |
         +------------------------------+
                        |
       [Institución 1, Institución 2, ...]
                        |
        +---------------+---------------+
        |                               |
        v                               v
+-----------------------+       +-----------------------+|  Procesar: clinica_a  |       |  Procesar: clinica_b  || 1. Resuelve dbConfig  |       | 1. Resuelve dbConfig  || 2. Abre Pool Temporal |       | 2. Abre Pool Temporal || 3. Inicia Transacción |       | 3. Inicia Transacción || 4. Aplica SQL / Seed  |       | 4. Aplica SQL / Seed  || 5. COMMIT o ROLLBACK  |       | 5. COMMIT o ROLLBACK  || 6. Cierra Pool        |       | 6. Cierra Pool        |+-----------------------+       +-----------------------+|                               |+---------------+---------------+|v+------------------------------+| Reporte Final Consolidado    || - Exitosos: 14               || - Fallidos: 0                |+------------------------------+
---

## 3. Reglas Críticas de Implementación

### Aislamiento Transaccional
Todo script ejecutado por el runner en una base de datos tenant **DEBE** envolverse dentro de un bloque transaccional:
```sql
BEGIN;
  -- Instrucciones DDL o DML
COMMIT;
Si una institución falla por conflicto de bloqueos o sintaxis, el runner debe emitir ROLLBACK en ese tenant específico y continuar con el siguiente, dejando un registro en la bitácora de auditoría.Manejo Seguro de Credenciales (SCRAM-SHA-256)Al igual que en el backend API, el runner debe validar estrictamente las credenciales que provienen de la entidad institucion antes de instanciar el cliente temporal:TypeScriptconst resolvedPassword = String(
  tenant.dbPassword ?? 
  tenant.db_password ?? 
  tenant.password ?? 
  process.env.MASTER_DB_PASSWORD ?? 
  ''
);
Destrucción de ConexionesA diferencia de TenancyConnectionService (que cachea los pools para tráfico web HTTP continuo), el Tenant Runner debe drenar y cerrar cada pool una vez finalizada su tarea mediante await pool.end(). No liberar las conexiones causará el agotamiento del pooler de Supabase (Max client connections reached).4. Estructura Típica del Script RunnerTypeScript// scripts/tenant-runner.ts
import { Pool } from 'pg';
import { MasterDatabaseService } from '../src/core/database/master-db.service';

interface RunnerOptions {
  migrationFile?: string;
  concurrencyLimit?: number;
  tenantFilter?: string; // Subdominio opcional para aislar la ejecución
}

export async function runAcrossTenants(options: RunnerOptions): Promise<void> {
  const masterDb = new MasterDatabaseService();
  const tenants = await masterDb.getActiveTenants(options.tenantFilter);

  console.log(`[TenantRunner] Iniciando tareas sobre ${tenants.length} tenants...`);

  for (const tenant of tenants) {
    console.log(`[TenantRunner] -> Ejecutando en tenant: ${tenant.subdomain}`);
    
    const tenantPool = new Pool({
      host: tenant.dbHost || tenant.db_host,
      port: Number(tenant.dbPort || tenant.db_port || 5432),
      database: tenant.dbName || tenant.db_name,
      user: tenant.dbUser || tenant.db_user,
      password: String(tenant.dbPassword ?? tenant.db_password ?? ''),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    const client = await tenantPool.connect();

    try {
      await client.query('BEGIN');

      // Ejecutar la migración o seed específico
      // await applyMigration(client, options.migrationFile);

      await client.query('COMMIT');
      console.log(`[TenantRunner] ✔ Exitoso: ${tenant.subdomain}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[TenantRunner] ✖ Falló en ${tenant.subdomain}:`, error.message);
      // Opcional: throw si se requiere abortar toda la cadena
    } finally {
      client.release();
      await tenantPool.end();
    }
  }

  console.log('[TenantRunner] Procesamiento finalizado.');
}
5. Comandos de Operación Habituales npm run migrate:tenants Ejecuta las migraciones pendientes en todos los tenants activos.
npm run migrate:tenants -- --subdomain=demoEjecuta las migraciones exclusivamente en el tenant demo.
npm run tenant:seed:catalogs Inserta o sincroniza los catálogos normativos (CIE-10 / CUPS) en todos los clientes.
npm run tenant:status Comprueba la conectividad de red y handshake SCRAM con cada base de datos registrada.