# SARAI – Documentación Oficial de Base de Datos
**Fecha de análisis:** 2026-07-06  
**Motor:** PostgreSQL | **ORM:** Prisma | **Tablas analizadas:** 61 | **Módulos:** 15

---

## Índice de Documentos

| Documento | Contenido | Audiencia |
|-----------|-----------|-----------|
| [DB_01_INVENTARIO_TABLAS.md](./DB_01_INVENTARIO_TABLAS.md) | Listado completo de las 61 tablas con tipo y métricas | Arquitectos, DBA |
| [DB_02_MODELO_ER.md](./DB_02_MODELO_ER.md) | Modelo Entidad-Relación completo con diagramas | Arquitectos, Desarrolladores |
| [DB_03_DICCIONARIO_DATOS.md](./DB_03_DICCIONARIO_DATOS.md) | Ficha técnica de cada tabla y sus columnas | Desarrolladores, DBA |
| [DB_04_ARQUITECTURA_MODULOS.md](./DB_04_ARQUITECTURA_MODULOS.md) | 15 módulos funcionales con flujos y dependencias | Analistas, Arquitectos |
| [DB_05_MAPA_DEPENDENCIAS.md](./DB_05_MAPA_DEPENDENCIAS.md) | Árbol de dependencias entre tablas por niveles | DBA, Arquitectos |
| [DB_06_FLUJO_INFORMACION.md](./DB_06_FLUJO_INFORMACION.md) | Flujos de datos por módulo y proceso clínico | Analistas Funcionales |
| [DB_07_INTEGRIDAD_REFERENCIAL.md](./DB_07_INTEGRIDAD_REFERENCIAL.md) | FK faltantes, redundancias, tablas aisladas, problemas de normalización | DBA, Arquitectos |
| [DB_08_ARQUITECTURA_TECNICA.md](./DB_08_ARQUITECTURA_TECNICA.md) | Tablas centrales, índices, identificadores, gaps técnicos | DBA |
| [DB_09_RECOMENDACIONES.md](./DB_09_RECOMENDACIONES.md) | Recomendaciones clasificadas: Crítica / Alta / Media / Baja | CTO, Arquitectos |
| [DB_10_RESUMEN_EJECUTIVO.md](./DB_10_RESUMEN_EJECUTIVO.md) | Métricas globales, fortalezas, debilidades y riesgos | Dirección, CTO |

---

## Vista Rápida del Sistema

```
SARAI – Sistema Asistido con IA para Clínicas Estéticas

┌─────────────────────────────────────────────────────────┐
│  MÓDULOS PRINCIPALES                                     │
│                                                         │
│  🏥 Clínico Core     → Procedimiento, HistoriaClinica   │
│  📅 Agenda           → Cita, Disponibilidad              │
│  🦷 Odontología      → Odontograma, PlanTratamiento      │
│  💰 Facturación      → Ingreso, Cuenta, Factura          │
│  📊 Tarifas/CUPS     → TarifaCargo, CupsCodigo           │
│  🎯 CRM              → CrmLead, Cotizacion               │
│  ⚙️  Configuración   → TipoConsulta, Especialidad        │
│  🔍 Auditoría        → AuditLog                          │
└─────────────────────────────────────────────────────────┘

Tablas núcleo: Paciente (15 deps) · User (9 deps) · Procedimiento (7 deps)
```

---

## Convenciones de este Análisis

- **FK física**: Constraint `FOREIGN KEY` declarado en Prisma/PostgreSQL
- **Relación inferida**: Deducida por nombre de columna, patrón `*_id` o lógica funcional — sin constraint formal
- **Cascade**: `onDelete: Cascade` — si el padre se elimina, los hijos también
- **SET NULL**: `onDelete: SET NULL` — si el padre se elimina, la FK queda en NULL
