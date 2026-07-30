# CAPÍTULO 10 – Resumen Ejecutivo
**Sistema:** SARAI | **Fecha de análisis:** 2026-07-06  
**Analista:** Arquitecto Senior / DBA PostgreSQL + Analista Funcional

---

## Métricas Globales

| Métrica | Valor |
|---------|-------|
| **Total de tablas** | **61** |
| **Enums PostgreSQL** | 2 (Role, CupsNivel) |
| **Relaciones FK físicas** | ~78 |
| **Relaciones inferidas (sin FK)** | 18 |
| **Módulos funcionales** | **15** |
| **Índices declarados** | ~60 |
| **Constraints UNIQUE** | ~35 |
| **Tablas núcleo** | 7 |
| **Tablas aisladas** | 5 |
| **Campos JSON** | 24 |
| **Tablas con hash de integridad** | 3 |
| **Motor de base de datos** | PostgreSQL |
| **ORM** | Prisma v5+ |
| **Patrón de IDs** | CUID + Manual + Autoincrement |

---

## Las 10 Tablas Más Importantes

| # | Tabla | Dependencias entrantes | Por qué es importante |
|---|-------|------------------------|----------------------|
| 1 | `Paciente` | 15 | Núcleo absoluto — sin paciente no hay sistema clínico |
| 2 | `User` | 9 | Identidad y autoría de todas las operaciones |
| 3 | `Procedimiento` | 7 | Acto clínico central — todo parte de aquí |
| 4 | `TarifaCargo` | 5 | Núcleo del sistema de tarifas y facturación |
| 5 | `ProcedimientoCUPS` | 4 | Catálogo clínico que habilita plantillas y protocolos |
| 6 | `Cita` | 3 | Puerta de entrada a toda la atención médica |
| 7 | `Odontograma` | 3 | Núcleo del módulo dental completo |
| 8 | `CupsCodigo` | Árbol de 4 niveles | Catálogo oficial CUPS Res. 2706/2025 completo |
| 9 | `HistoriaClinica` | — | Obligación legal — protege a la clínica |
| 10 | `Ingreso` | — | Punto de entrada del ciclo de facturación |

---

## Módulos por Importancia

```
CRÍTICOS (el sistema no puede operar sin ellos)
════════════════════════════════════════════════
  ✦ Seguridad y Usuarios       (User, AuditLog)
  ✦ Pacientes                  (Paciente + datos clínicos base)
  ✦ Historia Clínica           (cumplimiento normativo legal)
  ✦ Consentimientos            (obligación legal)
  ✦ Tarifas y CUPS             (base de la facturación)

ALTOS (operación normal)
════════════════════════
  ✦ Agenda                     (gestión de citas)
  ✦ Módulo Clínico Core        (procedimientos, fotos, seguimiento)
  ✦ Odontología                (módulo completo y reciente)
  ✦ CRM y Cotizaciones         (motor comercial)
  ✦ Facturación                (ciclo de ingresos)
  ✦ Auditoría                  (cumplimiento y trazabilidad)

MEDIOS (configuración y soporte)
═════════════════════════════════
  ✦ Configuración General
  ✦ Configuración Clínica (Consulta Externa)
  ✦ Fotografía Clínica
  ✦ Mapa Corporal
```

---

## Tablas con Mayor Dependencia

```
PACIENTE          ████████████████████████████████████████  15
USER              █████████████████████                       9
PROCEDIMIENTO     █████████████████                           7
TARIFA_CARGO      █████████████                               5
PROCEDIMIENTO_CUPS ██████████                                 4
CITA              ████████                                    3
ODONTOGRAMA       ████████                                    3
```

---

## Fortalezas del Diseño

| Fortaleza | Descripción |
|-----------|-------------|
| ✅ **Cumplimiento normativo colombiano** | `hashIntegridad` + `version` + `firmadoPorMedico` en HC y Consentimientos cumple Res. 1995/1999, Ley 2015/2020 |
| ✅ **Catálogo CUPS oficial completo** | 4 niveles jerárquicos según Resolución 2706/2025, con auto-relación y notas tabulares |
| ✅ **Módulo dental completo** | Odontograma con numeración FDI, 4 catálogos parametrizables, plan de tratamiento integrado a facturación |
| ✅ **Arquitectura de facturación robusta** | Flujo Ingreso → Cuenta → CuentaItem → Factura bien estructurado con estados definidos |
| ✅ **CRM integrado con conversión** | Pipeline COLD→HOT con conversión directa a Paciente (`CrmLead.pacienteId`) |
| ✅ **Evidencia forense en consentimientos** | 6 factores capturados: IP, navegador, SO, GPS, selfie, firma digital |
| ✅ **Configuración clínica granular** | `TipoConsulta` con 14+ flags de comportamiento |
| ✅ **Multi-sede y multi-médico** | `DisponibilidadMedico` por sede, consultorio y tipo de atención |
| ✅ **Seguimiento post-op automático** | Hitos programados con alertas de IA |
| ✅ **Derivación de tarifarios** | `Tarifario.baseId` + porcentaje para EPS, SOAT, prepagada |
| ✅ **Índices bien distribuidos** | ~60 índices sobre campos de consulta frecuente |
| ✅ **Soft-delete conceptual** | campos `activo`/`estado` en catálogos evitan eliminaciones duras |

---

## Debilidades Identificadas

| Debilidad | Impacto |
|-----------|---------|
| ⚠️ **18 relaciones sin FK formal** | Datos huérfanos potenciales en producción |
| ⚠️ **Catálogos CUPS fragmentados** | 4 representaciones del mismo catálogo sin sincronización |
| ⚠️ **Dos catálogos de cargos paralelos** | `Cargo` vs `TarifaCargo` — precios potencialmente inconsistentes |
| ⚠️ **JSON sin esquema formal** | `Cotizacion.lineas`, `HistoriaClinica.contenido` no tienen estructura garantizada a nivel BD |
| ⚠️ **Sin triggers de auditoría** | La auditoría depende 100% de la aplicación — riesgo de omisión |
| ⚠️ **`PlantillaProcedimiento` aislada** | Tabla legacy sin FK — posiblemente obsoleta con datos inconsistentes |
| ⚠️ **Arrays PostgreSQL desnormalizados** | `telefonos`, `complicaciones`, `procedimientos`, `tags` impiden consultas SQL eficientes |
| ⚠️ **Sin Full-Text Search** | Búsqueda de pacientes solo por prefijo exacto |
| ⚠️ **Sin particionamiento** | `AuditLog` y `HistoriaClinica` crecerán sin límite |
| ⚠️ **Sin Row-Level Security** | Segregación de datos solo a nivel de aplicación |
| ⚠️ **`User.especialidad` texto libre** | Duplica el catálogo `Especialidad` — inconsistencias ortográficas |

---

## Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Nivel | Mitigación |
|--------|-------------|---------|-------|------------|
| Datos huérfanos por FK faltantes | Alta | Alto | 🔴 CRÍTICO | Agregar FKs (C1-C4) |
| Inconsistencia Cargo vs TarifaCargo | Media | Alto | 🔴 CRÍTICO | Unificar catálogos (C5) |
| Auditoría incompleta (sin triggers) | Media | Alto | 🟡 ALTO | Triggers PostgreSQL (A4) |
| Pérdida de integridad de HC | Baja | Muy Alto | 🟡 ALTO | Triggers + versionado optimista |
| Búsquedas lentas de pacientes | Alta | Medio | 🟡 ALTO | Full-Text Search (A7) |
| Crecimiento de AuditLog | Muy Alta | Medio | 🟠 MEDIO | Particionamiento (B4) |
| Race conditions en HC | Baja | Alto | 🟠 MEDIO | Optimistic locking (M7) |
| Cumplimiento HABEAS DATA | Baja | Muy Alto | 🟠 MEDIO | Política retención (B6) |
| Inconsistencia de datos financieros | Baja | Alto | 🟠 MEDIO | Triggers de recálculo |
| Tablas sin FK creciendo con datos incorrectos | Media | Medio | 🟢 BAJO | Limpieza periódica |

---

## Hoja de Ruta Recomendada

### Fase 1 — Inmediata (0-2 semanas)
```
✓ Agregar las 4 FKs críticas faltantes (C1, C2, C3, C4)
✓ Migración de datos: verificar integridad en Consentimiento.plantillaId
✓ Documentar PlantillaProcedimiento como deprecada
✓ Agregar FK Cita.salaQuirofanoId → TipoConsultorio (A6)
✓ Agregar FK User.especialidadId → Especialidad (A5)
```

### Fase 2 — Corto plazo (1-2 meses)
```
✓ Implementar Full-Text Search en Paciente.nombreCompleto (A7)
✓ Crear triggers PostgreSQL de auditoría en tablas críticas (A4)
✓ Consolidar representaciones CUPS en un solo árbol (A2)
✓ Normalizar Cotizacion.lineas JSON → tabla CotizacionLinea (A1)
```

### Fase 3 — Medio plazo (2-6 meses)
```
✓ Unificar Cargo y TarifaCargo (C5) — requiere migración de datos
✓ Implementar soft-delete en tablas clínicas (M3)
✓ Crear tabla PacienteTelefono (M2)
✓ Vistas materializadas para dashboards (M4)
✓ Implementar versionado optimista en HistoriaClinica (M7)
```

### Fase 4 — Largo plazo (6+ meses)
```
✓ Row-Level Security en tablas clínicas (M8)
✓ Particionamiento de AuditLog por mes (B4)
✓ Particionamiento de HistoriaClinica por año (B4)
✓ Índices GIN en campos JSON críticos (M5)
✓ Política formal de retención de datos HABEAS DATA (B6)
✓ Estandarizar convención de nombres (B1)
```

---

## Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────┐
│                    SARAI – ARQUITECTURA OBJETIVO                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  CATÁLOGO CUPS UNIFICADO                                │    │
│  │  CupsCodigo (árbol) → TarifaCargo → TarifaItem         │    │
│  │  ProcedimientoCUPS (FK → CupsCodigo)                   │    │
│  │  ServicioFacturable (FK → CupsCodigo)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌─────────────────┐   ┌─────┴──────────┐   ┌──────────────┐   │
│  │  PACIENTE        │   │  PROCEDIMIENTO │   │  FACTURACIÓN │   │
│  │  (con FK fuerte) │   │  (con trigger  │   │  (Ingreso →  │   │
│  │  + FTS nombre    │   │   de auditoría)│   │  Cuenta →    │   │
│  │  + soft-delete   │   │  + hash BD     │   │  Factura)    │   │
│  └─────────────────┘   └────────────────┘   └──────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AUDITORÍA CON TRIGGERS (no solo desde aplicación)      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ ODONTO-  │  │ CRM /    │  │ AGENDA   │  │ CONFIGURACIÓN│    │
│  │ LOGÍA    │  │ COTIZ.   │  │ (RLS)    │  │ UNIFICADA    │    │
│  │ (íntegra)│  │ (lineas  │  │          │  │ (1 config    │    │
│  │          │  │  normal.)│  │          │  │  + params)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Evaluación General del Diseño

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| Funcionalidad | ⭐⭐⭐⭐⭐ 9/10 | Cobertura funcional muy completa para una clínica estética + dental |
| Normalización | ⭐⭐⭐ 6/10 | Arrays desnormalizados y JSON limitan queries analíticas |
| Integridad | ⭐⭐⭐ 6/10 | 18 FK faltantes son riesgo real en producción |
| Performance | ⭐⭐⭐⭐ 7/10 | Buenos índices, pero sin FTS ni views materializadas |
| Escalabilidad | ⭐⭐⭐ 6/10 | Sin particionamiento en tablas de alto crecimiento |
| Cumplimiento normativo | ⭐⭐⭐⭐⭐ 9/10 | Excelente — hash, versión, firma, evidencia forense |
| Mantenibilidad | ⭐⭐⭐ 6/10 | Dos sistemas paralelos de cargos/plantillas generan confusión |
| **TOTAL** | **⭐⭐⭐⭐ 7/10** | Sistema sólido con deuda técnica gestionable |

---

## Conclusión

SARAI cuenta con un modelo de datos **funcionalmente sólido y bien pensado** para el dominio de una clínica estética y dental en Colombia. Los módulos de historia clínica, consentimientos informados y odontología demuestran un alto nivel de madurez en el diseño clínico con cumplimiento normativo.

Los principales desafíos identificados son:
1. **18 relaciones sin FK formal** que representan riesgo de corrupción de datos
2. **Fragmentación del catálogo CUPS** en cuatro representaciones no sincronizadas
3. **Dos catálogos de cargos paralelos** que pueden generar inconsistencias financieras
4. **Dependencia total de la aplicación para auditoría** sin respaldo de triggers de base de datos

Con la implementación de las **5 recomendaciones críticas** (C1-C5), el sistema alcanzaría un nivel de **integridad referencial adecuado para producción**. Las recomendaciones de alta prioridad (A1-A7) elevarían el sistema a un nivel enterprise.

---

## Referencias de Documentación Completa

| Documento | Contenido |
|-----------|-----------|
| [DB_00_INDICE.md](./DB_00_INDICE.md) | Índice y convenciones |
| [DB_01_INVENTARIO_TABLAS.md](./DB_01_INVENTARIO_TABLAS.md) | 61 tablas inventariadas |
| [DB_02_MODELO_ER.md](./DB_02_MODELO_ER.md) | MER completo con diagramas |
| [DB_03_DICCIONARIO_DATOS.md](./DB_03_DICCIONARIO_DATOS.md) | Ficha técnica de cada tabla |
| [DB_04_ARQUITECTURA_MODULOS.md](./DB_04_ARQUITECTURA_MODULOS.md) | 15 módulos con flujos |
| [DB_05_MAPA_DEPENDENCIAS.md](./DB_05_MAPA_DEPENDENCIAS.md) | Árbol de dependencias |
| [DB_06_FLUJO_INFORMACION.md](./DB_06_FLUJO_INFORMACION.md) | 10 flujos de datos |
| [DB_07_INTEGRIDAD_REFERENCIAL.md](./DB_07_INTEGRIDAD_REFERENCIAL.md) | Problemas de integridad |
| [DB_08_ARQUITECTURA_TECNICA.md](./DB_08_ARQUITECTURA_TECNICA.md) | Índices, IDs, gaps técnicos |
| [DB_09_RECOMENDACIONES.md](./DB_09_RECOMENDACIONES.md) | 22 recomendaciones priorizadas |
| **DB_10_RESUMEN_EJECUTIVO.md** | **Este documento** |
