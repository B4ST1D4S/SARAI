# CAPÍTULO 7 – Integridad Referencial
**Sistema:** SARAI | **Fecha:** 2026-07-06

---

## 1. Foreign Keys Faltantes (Relaciones sin Constraint)

Las siguientes columnas contienen IDs que referencian otras tablas pero **no tienen FK formal declarada** en Prisma/PostgreSQL.

| # | Tabla | Campo | Referencia esperada | Impacto | Severidad |
|---|-------|-------|---------------------|---------|-----------|
| 1 | `Consentimiento` | `plantillaId` | `ConsentimientoTemplate.id` | Se puede registrar un consentimiento con una plantilla inexistente | **🔴 Alta** |
| 2 | `Cotizacion` | `citaId` | `Cita.id` | Cotizaciones pueden quedar referenciando citas eliminadas | **🔴 Alta** |
| 3 | `ChecklistCompletado` | `templateId` | `ChecklistTemplate.id` | Checklist completado sin plantilla válida | **🔴 Alta** |
| 4 | `OdontoPlanItem` | `cuentaItemId` | `CuentaItem.id` | Integración facturación-odontología sin constraint | **🔴 Alta** |
| 5 | `MapaCorporal` | `evaluadoPor` | `User.id` | El médico evaluador no se valida contra la tabla User | **🟡 Media** |
| 6 | `Transaccion` | `procedimientoId` | `Procedimiento.id` | Pago ligado a procedimiento inexistente | **🟡 Media** |
| 7 | `Transaccion` | `creadoPor` | `User.id` | Sin rastreo de quién registró el pago | **🟡 Media** |
| 8 | `Cita` | `salaQuirofanoId` | `TipoConsultorio.id` | Sala no validada en catálogo | **🟡 Media** |
| 9 | `OdontoPlanItem` | `medicoId` | `User.id` | Médico del tratamiento sin validación | **🟡 Media** |
| 10 | `OdontoEvolucion` | `planItemId` | `OdontoPlanItem.id` | Evolución sin ítem de plan validado | **🟡 Media** |
| 11 | `OdontoEvolucion` | `medicoId` | `User.id` | Médico sin validación | **🟡 Media** |
| 12 | `Odontograma` | `historiaClinicaId` | `HistoriaClinica.id` | Odontograma sin HC formal vinculada | **🟡 Media** |
| 13 | `Odontograma` | `citaId` | `Cita.id` | Odontograma sin cita validada | **🟡 Media** |
| 14 | `ChecklistCompletado` | `completadoPor` | `User.id` | Sin autoría formal del checklist | **🟡 Media** |
| 15 | `PlantillaTemplate` | `creadoPor` | `User.id` | Trazabilidad de creación incompleta | **🟢 Baja** |
| 16 | `PlantillaTemplate` | `actualizadoPor` | `User.id` | Trazabilidad de actualización incompleta | **🟢 Baja** |
| 17 | `HCModulo` | `programaId` | — (tabla no existe) | Campo huérfano — no existe tabla Programa | **🟢 Baja** |
| 18 | `TipoConsulta` | `bodegaId` | — (tabla no existe) | Campo huérfano — no existe tabla Bodega | **🟢 Baja** |

---

## 2. Tablas Paralelas con Propósito Similar (Redundancia)

### Problema 1: Dos catálogos de cargos

| Tabla | Módulo | Relación con CUPS | Estado |
|---|---|---|---|
| `Cargo` | Configuración clínica legacy | `codigoReferencia` (texto libre, sin FK) | Posiblemente obsoleto |
| `TarifaCargo` | Módulo de tarifas moderno | `cupsCodigoId → CupsCodigo.id` (FK formal) | Activo |

**Riesgo:** Precio de un servicio puede ser diferente en `Cargo.valor` vs `TarifaItem.precio`. Sin sincronización entre ambos, la facturación puede basarse en datos inconsistentes.

**Solución recomendada:** Migrar `Cargo` a `TarifaCargo` y establecer FK entre `DepartamentoCargo.cargoId → TarifaCargo.id`.

---

### Problema 2: Tres representaciones del catálogo CUPS

| Tabla/Campo | Cómo almacena CUPS | FK hacia CupsCodigo |
|---|---|---|
| `CupsCodigo.codigo` | Árbol jerárquico oficial 4 niveles, Res. 2706/2025 | Auto-referencial |
| `ProcedimientoCUPS.codigoCUPS` | Código plano de procedimientos clínicos | ❌ Sin FK a CupsCodigo |
| `ServicioFacturable.codigoCups` | Código de servicios facturables | ❌ Sin FK a CupsCodigo |
| `PlantillaProcedimiento.codigoCups` | Código en plantillas legacy | ❌ Sin FK a nada |
| `TarifaCargo.cupsCodigoStr` | Código sin puntos para búsqueda | Solo campo de texto |

**Riesgo:** El mismo código CUPS puede aparecer en 4 tablas con datos diferentes o desactualizados.

---

### Problema 3: Dos sistemas de plantillas de HC

| Tabla | Propósito | Estado |
|---|---|---|
| `PlantillaProcedimiento` | Plantilla legacy con todo incluido (consentimiento, campos, medicación) | **Sin FK, posiblemente obsoleta** |
| `PlantillaTemplate` + `ChecklistTemplate` + `ConsentimientoTemplate` | Sistema moderno dividido por tipo | **Activo y con FK** |

**Riesgo:** Si ambos sistemas se usan simultáneamente, puede haber inconsistencias en qué plantilla se aplica.

---

### Problema 4: Configuración duplicada

| Tabla | Propósito | Diferencia |
|---|---|---|
| `ConfiguracionSistema` | Pares clave → JSON | Para valores complejos (objetos) |
| `ParametroSistema` | Grupo + Clave → Texto | Para valores simples (strings) |

**Riesgo:** Sin convención clara de cuándo usar cada una, pueden existir el mismo parámetro en ambas tablas con valores diferentes.

---

## 3. Campos Huérfanos / Sin Uso Evidente

| Campo | Tabla | Problema | Acción sugerida |
|---|---|---|---|
| `User.especialidad` | `User` | Texto libre que duplica el catálogo `Especialidad` | Reemplazar por `especialidadId FK → Especialidad.id` |
| `Cargo.codigoReferencia` | `Cargo` | Sin FK; referencia desconocida | Clarificar propósito o eliminar |
| `HCModulo.programaId` | `HCModulo` | No existe tabla `Programa` en el esquema | Crear tabla o eliminar campo |
| `TipoConsulta.bodegaId` | `TipoConsulta` | No existe tabla `Bodega` en el esquema | Crear tabla o eliminar campo |
| `OdontoPlanItem.codigoCups` | `OdontoPlanItem` | Duplica `TarifaCargo.cupsCodigoStr` | Eliminar (usar FK a TarifaCargo) |

---

## 4. Tablas Aisladas (sin relaciones formales)

| Tabla | Relaciones formales | Razón | Riesgo |
|---|---|---|---|
| `Integracion` | Ninguna | Diseño intencional (config. externa) | **Bajo** |
| `PlantillaProcedimiento` | Ninguna | Sistema legacy sin migrar | **Alto** — datos posiblemente sin uso |
| `TipoConsultorio` | Ninguna (solo referencia inferida desde `Cita.salaQuirofanoId`) | FK no declarada | **Medio** |
| `ListaValor` | Ninguna | Diseño intencional (lookup genérico) | **Bajo** |
| `MotivoCita` | Ninguna | Catálogo que no se usa como FK | **Medio** — catálogo sin consumo formal |
| `ConfiguracionSistema` | Ninguna | Diseño intencional | **Bajo** |
| `ParametroSistema` | Ninguna | Diseño intencional | **Bajo** |

---

## 5. Problemas de Normalización

### Violaciones de Primera Forma Normal (1FN)

| Tabla | Campo | Problema | Solución |
|---|---|---|---|
| `Paciente` | `telefonos TEXT[]` | Array desnormalizado | Crear tabla `PacienteTelefono` |
| `CrmLead` | `procedimientos TEXT[]` | Array de texto sin FK | Crear tabla `CrmLeadProcedimiento` |
| `CrmLead` | `tags TEXT[]` | Array de etiquetas | Crear tabla `CrmLeadTag` o aceptar como diseño |
| `Procedimiento` | `complicaciones TEXT[]` | Array de texto sin estructura | Crear tabla `ComplicacionProcedimiento` |
| `SeguimientoPostOp` | `alertasGeneradas JSON[]` | Array de JSON | Normalizar hacia tabla `Alerta` (ya existe) |
| `Cotizacion` | `lineas JSON` | Líneas de cotización incrustadas | Crear tabla `CotizacionLinea` |

**Impacto de los arrays:** Imposible filtrar por teléfono específico, procedimiento de interés o complicación con SQL estándar eficientemente.

### Violaciones de Segunda Forma Normal (2FN)

| Problema | Descripción |
|---|---|
| `User.especialidad TEXT` vs `Especialidad` tabla | El campo texto repite información que ya está en la tabla catálogo. Dependencia parcial. |
| `OdontoPlanItem.codigoCups` vs `TarifaCargo.cupsCodigoStr` | El código CUPS se almacena dos veces sin garantía de consistencia. |
| `CuentaItem.codigo` snapshot + `CuentaItem.cargoId FK` | El snapshot es intencional para historial (precio en el momento), pero puede generar confusión. |

---

## 6. Relaciones Duplicadas o Redundantes

| Tabla | Relación redundante | Descripción |
|---|---|---|
| `OdontoPlanItem` | Tiene tanto `pacienteId` como `odontogramaId → Odontograma.pacienteId` | El `pacienteId` directo es redundante; ya se puede obtener desde `Odontograma`. Puede generar inconsistencias si difieren. |
| `OdontoEvolucion` | Tiene tanto `pacienteId` como `odontogramaId → Odontograma.pacienteId` | Mismo problema. |
| `Factura` | Tiene `pacienteId` y `cuentaId → Cuenta → Ingreso → pacienteId` | Desnormalización intencional para queries directos, pero requiere sincronía. |

---

## 7. Problemas de Integridad Potencial

### Integridad en datos financieros

| Riesgo | Descripción |
|---|---|
| `Cotizacion.lineas JSON` | Los precios dentro del JSON no están validados contra `TarifaCargo`. Un precio puede no corresponder a ningún cargo real. |
| `CuentaItem.valorTotal` | Campo calculado almacenado (`cantidad × precioUnitario`). Si se modifica `precioUnitario` sin recalcular, `valorTotal` queda desincronizado. |
| `Factura.total` | También almacenado; si se añaden/modifican `CuentaItem` después, puede quedar desfasado. |

### Integridad en datos clínicos

| Riesgo | Descripción |
|---|---|
| `HistoriaClinica.hashIntegridad` | El hash se calcula en la aplicación, no en la BD. Si la app tiene un bug, el hash puede ser incorrecto. |
| `Consentimiento.hashIntegridad` | Mismo riesgo. |
| `Odontograma.hashIntegridad` | Mismo riesgo. |
| `firmadoPorMedico = true` | Una vez firmado, la aplicación debe impedir modificaciones, pero no existe trigger que lo garantice a nivel BD. |

---

## 8. Resumen de Problemas por Severidad

| Severidad | Cantidad | Principales problemas |
|---|---|---|
| 🔴 **Crítica** | 4 | FK faltantes en Consentimiento.plantillaId, Cotizacion.citaId, ChecklistCompletado.templateId, OdontoPlanItem.cuentaItemId |
| 🟡 **Alta** | 5 | Catálogos CUPS fragmentados, catálogos de cargos duplicados, sistemas de plantillas paralelos, arrays desnormalizados críticos |
| 🟠 **Media** | 10 | FK inferidas de User (evaluadoPor, creadoPor, medicoId), salaQuirofanoId, redundancias pacienteId |
| 🟢 **Baja** | 8 | Campos huérfanos, trazabilidad de creación/actualización, tablas aisladas por diseño |

---

*Anterior: [DB_06_FLUJO_INFORMACION.md](./DB_06_FLUJO_INFORMACION.md) | Siguiente: [DB_08_ARQUITECTURA_TECNICA.md](./DB_08_ARQUITECTURA_TECNICA.md)*
