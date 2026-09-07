# Workers Asíncronos: Generación y Validación de RIPS

## 1. Contexto Normativo y Propósito
El Registro Individual de Prestación de Servicios de Salud (RIPS) bajo la Resolución 2275 (MinSalud Colombia) exige la consolidación, validación semántica, estructuración en formato JSON y firma digital de todas las consultas, procedimientos, urgencias, hospitalizaciones y medicamentos prestados a los pacientes.

Debido al volumen de registros y la rigurosidad de las validaciones de códigos CUPS, CIE-10 y montos de facturación, este proceso es intensivo en CPU e I/O. **Está estrictamente prohibido procesar RIPS en el hilo HTTP principal de NestJS**. Toda generación debe orquestarse en segundo plano a través de colas (`rips-queue`).

## 2. Flujo de Procesamiento del Job

[Cliente HTTP / Facturación]
|
v  1. POST /api/v1/facturacion/rips/generar { periodo, tenantId }
[NestJS API Core]
|
v  2. Encola Job con metadata: { tenantId, rangoFechas, loteId }
[Redis / BullMQ]
|
+-----------------------+
v
[RIPS Background Worker]
|
+--------------------------------+--------------------------------+
|                                |                                |
v                                v                                v
3. Conexión Pool Tenant      4. Extracción & Mapeo         5. Validación Normativa
(TenancyConnectionService)      - Consultas (AC)              - Catálogo CUPS
- Procedimientos (AP)         - Diagnósticos CIE-10
- Medicamentos (AM)           - Coherencia valores
|
v
6. Generación de JSON
y Hash Criptográfico
|
v
7. Actualización de Lote
y Notificación (WebSocket)


## 3. Consideraciones Multitenant en el Worker
Al ejecutarse en un proceso desacoplado o worker independiente:
1. **Pérdida de Contexto HTTP**: El worker no cuenta con la cabecera `x-tenant-id` inyectada por el middleware.
2. **Payload Obligatorio**: El job DEBE recibir explícitamente `tenantId` y `subdomain` dentro de sus datos (`job.data`).
3. **Resolución de Base de Datos**: El worker debe invocar `tenantContextService.run(tenantContext, ...)` para enlazar las consultas SQL al pool correspondiente de la institución médica, garantizando aislamiento total.

```typescript
@Processor('rips-queue')
export class RipsProcessor extends WorkerHost {
  constructor(
    private readonly tenancyService: TenancyConnectionService,
    private readonly masterDb: MasterDatabaseService,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; loteId: string }>): Promise<void> {
    const { tenantId, loteId } = job.data;
    const dbConfig = await this.masterDb.getTenantConnectionConfig(tenantId);

    // Obtener conexión aislada al pool del tenant
    const tenantPool = await this.tenancyService.getPoolByConfig(dbConfig);

    // Ejecución de extracción por lotes y validación semántica
    await this.processRipsBatch(tenantPool, loteId);
  }
}

4. Estados del Proceso

Cada ejecución persiste su ciclo de vida en la tabla rips_lotes:

    ENCOLADO: Solicitud registrada, pendiente de asignación en worker.

    PROCESANDO: Validación sintáctica y extracción de tablas clínicas.

    COMPLETADO: Archivo JSON final almacenado y validado estructuralmente.

    FALLIDO: Errores de validación cruzada (códigos CIE-10 inválidos, inconsistencias de fecha o desconexión).