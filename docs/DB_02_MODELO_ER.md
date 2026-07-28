# CAPÍTULO 2 – Modelo Entidad-Relación (MER)
**Sistema:** SARAI | **Fecha:** 2026-07-06

---

## Tabla de Relaciones Completa

| Tabla Origen | Campo Origen | → | Tabla Destino | Campo Destino | Cardinalidad | Origen | Acción |
|---|---|---|---|---|---|---|---|
| `Alergia` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | Cascade |
| `Medicamento` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | Cascade |
| `AntecedentesQuirurgicos` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | Cascade |
| `Paciente` | `creadoPor` | → | `User` | `id` | N:1 | FK física | SetNull |
| `Procedimiento` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Procedimiento` | `medicoId` | → | `User` | `id` | N:1 | FK física | — |
| `Procedimiento` | `codigoCUPS` | → | `ProcedimientoCUPS` | `codigoCUPS` | N:1 | FK física | — |
| `HistoriaClinica` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `HistoriaClinica` | `editadoPor` | → | `User` | `id` | N:1 | FK física | — |
| `HistoriaClinica` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | — |
| `HistoriaClinica` | `plantillaId` | → | `PlantillaTemplate` | `id` | N:1 | FK física | — |
| `Consentimiento` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Consentimiento` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | — |
| `Consentimiento` | `plantillaId` | → | `ConsentimientoTemplate` | `id` | N:1 | **⚠️ Inferida** | — |
| `FotoClinica` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `FotoClinica` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | — |
| `MapaCorporal` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `MapaCorporal` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | SET NULL |
| `MapaCorporal` | `evaluadoPor` | → | `User` | `id` | N:1 | **⚠️ Inferida** | — |
| `SeguimientoPostOp` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `SeguimientoPostOp` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | — |
| `Alerta` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Alerta` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | — |
| `ChecklistCompletado` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | FK física | Cascade |
| `ChecklistCompletado` | `templateId` | → | `ChecklistTemplate` | `id` | N:1 | **⚠️ Inferida** | — |
| `ChecklistCompletado` | `completadoPor` | → | `User` | `id` | N:1 | **⚠️ Inferida** | — |
| `Cita` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Cita` | `medicoId` | → | `User` | `id` | N:1 | FK física | — |
| `Cita` | `salaQuirofanoId` | → | `TipoConsultorio` | `id` | N:1 | **⚠️ Inferida** | — |
| `Transaccion` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Transaccion` | `procedimientoId` | → | `Procedimiento` | `id` | N:1 | **⚠️ Inferida** | — |
| `Transaccion` | `creadoPor` | → | `User` | `id` | N:1 | **⚠️ Inferida** | — |
| `AuditLog` | `usuarioId` | → | `User` | `id` | N:1 | FK física | — |
| `PlantillaTemplate` | `codigoCUPS` | → | `ProcedimientoCUPS` | `codigoCUPS` | N:1 | FK física | Cascade |
| `PlantillaTemplate` | `creadoPor` | → | `User` | `id` | N:1 | **⚠️ Inferida** | — |
| `ChecklistTemplate` | `codigoCUPS` | → | `ProcedimientoCUPS` | `codigoCUPS` | N:1 | FK física | Cascade |
| `ConsentimientoTemplate` | `codigoCUPS` | → | `ProcedimientoCUPS` | `codigoCUPS` | **1:1** | FK física | Cascade |
| `DisponibilidadMedico` | `medicoId` | → | `User` | `id` | N:1 | FK física | Cascade |
| `BloqueDisponibilidad` | `medicoId` | → | `User` | `id` | N:1 | FK física | Cascade |
| `Cotizacion` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Cotizacion` | `medicoId` | → | `User` | `id` | N:1 | FK física | — |
| `Cotizacion` | `citaId` | → | `Cita` | `id` | N:1 | **⚠️ Inferida** | — |
| `CrmLead` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `CrmLead` | `creadoPor` | → | `User` | `id` | N:1 | FK física | — |
| `TarifaTipo` | `grupoId` | → | `TarifaGrupo` | `id` | N:1 | FK física | Cascade |
| `TarifaCargo` | `cupsCodigoId` | → | `CupsCodigo` | `id` | N:1 | FK física | — |
| `TarifaCargo` | `grupoId` | → | `TarifaGrupo` | `id` | N:1 | FK física | — |
| `TarifaCargo` | `tipoId` | → | `TarifaTipo` | `id` | N:1 | FK física | — |
| `TarifaItem` | `tarifarioId` | → | `Tarifario` | `id` | N:1 | FK física | Cascade |
| `TarifaItem` | `cargoId` | → | `TarifaCargo` | `id` | N:1 | FK física | Cascade |
| `Tarifario` | `baseId` | → | `Tarifario` | `id` | N:1 (auto) | FK física | — |
| `CupsCodigo` | `parentId` | → | `CupsCodigo` | `id` | N:1 (auto) | FK física | Cascade |
| `Ingreso` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `Ingreso` | `citaId` | → | `Cita` | `id` | N:1 | FK física | — |
| `Ingreso` | `medicoId` | → | `User` | `id` | N:1 | FK física | — |
| `Cuenta` | `ingresoId` | → | `Ingreso` | `id` | N:1 | FK física | Cascade |
| `CuentaItem` | `cuentaId` | → | `Cuenta` | `id` | N:1 | FK física | Cascade |
| `CuentaItem` | `cargoId` | → | `TarifaCargo` | `id` | N:1 | FK física | — |
| `Factura` | `cuentaId` | → | `Cuenta` | `id` | **1:1** | FK física | — |
| `Factura` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | — |
| `DepartamentoCargo` | `departamentoId` | → | `Departamento` | `id` | N:1 | FK física | Cascade |
| `DepartamentoCargo` | `cargoId` | → | `Cargo` | `id` | N:1 | FK física | — |
| `ReglaOperativa` | `departamentoId` | → | `Departamento` | `id` | N:1 | FK física | Cascade |
| `ReglaOperativa` | `servicioId` | → | `ServicioFacturable` | `id` | N:1 | FK física | — |
| `ConfigServicioConsulta` | `tipoConsultaId` | → | `TipoConsulta` | `id` | N:1 | FK física | Cascade |
| `ConfigServicioConsulta` | `servicioId` | → | `ServicioFacturable` | `id` | N:1 | FK física | — |
| `TipoConsulta` | `especialidadId` | → | `Especialidad` | `id` | N:1 | FK física | — |
| `TipoConsulta` | `departamentoId` | → | `Departamento` | `id` | N:1 | FK física | — |
| `TipoConsulta` | `hcModuloId` | → | `HCModulo` | `id` | N:1 | FK física | — |
| `Preparacion` | `especialidadId` | → | `Especialidad` | `id` | N:1 | FK física | — |
| `Preparacion` | `tipoConsultaId` | → | `TipoConsulta` | `id` | N:1 | FK física | — |
| `Odontograma` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | Cascade |
| `Odontograma` | `medicoId` | → | `User` | `id` | N:1 | FK física | — |
| `Odontograma` | `riesgoId` | → | `OdontoRiesgo` | `id` | N:1 | FK física | — |
| `Odontograma` | `historiaClinicaId` | → | `HistoriaClinica` | `id` | N:1 | **⚠️ Inferida** | — |
| `Odontograma` | `citaId` | → | `Cita` | `id` | N:1 | **⚠️ Inferida** | — |
| `OdontoPiezaHallazgo` | `odontogramaId` | → | `Odontograma` | `id` | N:1 | FK física | Cascade |
| `OdontoPiezaHallazgo` | `hallazgoId` | → | `OdontoHallazgo` | `id` | N:1 | FK física | — |
| `OdontoPiezaHallazgo` | `estadoId` | → | `OdontoEstado` | `id` | N:1 | FK física | — |
| `OdontoPlanItem` | `odontogramaId` | → | `Odontograma` | `id` | N:1 | FK física | Cascade |
| `OdontoPlanItem` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | Cascade |
| `OdontoPlanItem` | `hallazgoId` | → | `OdontoHallazgo` | `id` | N:1 | FK física | — |
| `OdontoPlanItem` | `cargoId` | → | `TarifaCargo` | `id` | N:1 | FK física | — |
| `OdontoPlanItem` | `prioridadId` | → | `OdontoPrioridad` | `id` | N:1 | FK física | — |
| `OdontoPlanItem` | `medicoId` | → | `User` | `id` | N:1 | **⚠️ Inferida** | — |
| `OdontoPlanItem` | `cuentaItemId` | → | `CuentaItem` | `id` | N:1 | **⚠️ Inferida** | — |
| `OdontoEvolucion` | `odontogramaId` | → | `Odontograma` | `id` | N:1 | FK física | Cascade |
| `OdontoEvolucion` | `pacienteId` | → | `Paciente` | `id` | N:1 | FK física | Cascade |
| `OdontoEvolucion` | `planItemId` | → | `OdontoPlanItem` | `id` | N:1 | **⚠️ Inferida** | — |
| `OdontoEvolucion` | `medicoId` | → | `User` | `id` | N:1 | **⚠️ Inferida** | — |
| `OdontoHallazgoSugerencia` | `hallazgoId` | → | `OdontoHallazgo` | `id` | N:1 | FK física | Cascade |
| `OdontoHallazgoSugerencia` | `cargoId` | → | `TarifaCargo` | `id` | N:1 | FK física | Cascade |

**Total FK físicas:** ~78 | **Total relaciones inferidas:** 18 | **⚠️ = sin constraint formal**

---

## MER en Texto – Vista General

```
PACIENTE (núcleo - 15 deps)
│
├──────< ALERGIA
├──────< MEDICAMENTO  
├──────< ANTECEDENTES_QUIRURGICOS
│
├──────< CITA ──────────────────────────────────────────────────────────┐
│              └──────< INGRESO ─────< CUENTA ─────< CUENTA_ITEM        │
│                                              └──── FACTURA (1:1)       │
│                                                                        │
├──────< PROCEDIMIENTO                                                   │
│              ├──────< HISTORIA_CLINICA ──> PLANTILLA_TEMPLATE          │
│              │                        └──> PROCEDIMIENTO_CUPS          │
│              ├──────< CONSENTIMIENTO  ──> CONSENT_TEMPLATE             │
│              ├──────< FOTO_CLINICA                                     │
│              ├──────< MAPA_CORPORAL                                    │
│              ├──────< SEGUIMIENTO_POST_OP                              │
│              ├──────< ALERTA                                           │
│              └──────< CHECKLIST_COMPLETADO ──> CHECKLIST_TEMPLATE      │
│                                                                        │
├──────< COTIZACION ──> USER (médico)                                    │
├──────< TRANSACCION                                                     │
├──────< CRM_LEAD ──> USER (creador)                                     │
│                                                                        │
└──────< ODONTOGRAMA ──────────────────────────────────── citaId ───────┘
               ├──────< ODONTO_PIEZA_HALLAZGO ──> ODONTO_HALLAZGO
               │                              └──> ODONTO_ESTADO
               ├──────< ODONTO_PLAN_ITEM ──> TARIFA_CARGO
               │                         ──> ODONTO_HALLAZGO
               │                         ──> ODONTO_PRIORIDAD
               └──────< ODONTO_EVOLUCION

USER (identidad - 9 deps)
├──────< CITA
├──────< PROCEDIMIENTO (como médico)
├──────< HISTORIA_CLINICA (como editor)
├──────< DISPONIBILIDAD_MEDICO
├──────< BLOQUEO_DISPONIBILIDAD
├──────< COTIZACION (como médico)
├──────< CRM_LEAD (como creador)
├──────< INGRESO (como médico)
└──────< AUDIT_LOG

CUPS_CODIGO (árbol auto-referencial - 4 niveles)
└──────< CUPS_CODIGO (hijos)
         GRUPO → SUBGRUPO → CATEGORÍA → SUBCATEGORÍA (facturable)
              └──────────────────────────> TARIFA_CARGO

TARIFARIO (auto-referencial: base → derivados con %)
└──────< TARIFA_ITEM ──> TARIFA_CARGO

PROCEDIMIENTO_CUPS (catálogo clínico CUPS)
├──────< PLANTILLA_TEMPLATE (plantillas HC)
├──────< CHECKLIST_TEMPLATE (checklists por fase)
└────── CONSENTIMIENTO_TEMPLATE (1:1)
```

---

## MER Agrupado por Módulos

```
╔══════════════════════════════════════════╗
║  MÓDULO CLÍNICO CORE                     ║
║                                          ║
║  PACIENTE ──< PROCEDIMIENTO              ║
║                ├──< HISTORIA_CLINICA     ║
║                ├──< CONSENTIMIENTO       ║
║                ├──< FOTO_CLINICA         ║
║                ├──< MAPA_CORPORAL        ║
║                ├──< SEGUIMIENTO_POST_OP  ║
║                ├──< ALERTA              ║
║                └──< CHECKLIST_COMPL.    ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║  MÓDULO AGENDA                           ║
║                                          ║
║  USER ──< CITA ──> PACIENTE              ║
║  USER ──< DISPONIBILIDAD_MEDICO          ║
║  USER ──< BLOQUEO_DISPONIBILIDAD         ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║  MÓDULO ODONTOLOGÍA                      ║
║                                          ║
║  PACIENTE ──< ODONTOGRAMA                ║
║                ├──< ODONTO_PIEZA_HALLAZGO║
║                ├──< ODONTO_PLAN_ITEM     ║
║                └──< ODONTO_EVOLUCION     ║
║  ODONTO_HALLAZGO ──< SUGERENCIA          ║
║                        └──> TARIFA_CARGO ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║  MÓDULO FACTURACIÓN                      ║
║                                          ║
║  CITA ──< INGRESO ──< CUENTA             ║
║                        ├──< CUENTA_ITEM ║
║                        │      └──> CARGO ║
║                        └── FACTURA(1:1) ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║  MÓDULO TARIFAS / CUPS                   ║
║                                          ║
║  CUPS_CODIGO (árbol)                     ║
║       └──> TARIFA_CARGO                  ║
║  TARIFA_GRUPO ──< TARIFA_TIPO            ║
║       └──< TARIFA_CARGO                  ║
║  TARIFARIO ──< TARIFA_ITEM               ║
║       └──> TARIFA_CARGO                  ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║  MÓDULO CRM                              ║
║                                          ║
║  CRM_LEAD ──> PACIENTE (opcional)        ║
║  CRM_LEAD ──> USER (creador)             ║
║  COTIZACION ──> PACIENTE                 ║
║  COTIZACION ──> USER (médico)            ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║  MÓDULO CONFIGURACIÓN CLÍNICA            ║
║                                          ║
║  ESPECIALIDAD ──< TIPO_CONSULTA          ║
║  DEPARTAMENTO ──< TIPO_CONSULTA          ║
║  DEPARTAMENTO ──< DEPTO_CARGO ──> CARGO  ║
║  DEPTO ──< REGLA_OPER. ──> SERV_FACT.    ║
║  TIPO_CONSULTA ──< CONF_SERV_CONS.       ║
║  PROC_CUPS ──< PLANTILLA_TEMPLATE        ║
║  PROC_CUPS ──< CHECKLIST_TEMPLATE        ║
║  PROC_CUPS ── CONSENT_TEMPLATE (1:1)     ║
╚══════════════════════════════════════════╝
```

---

## Relaciones Especiales

### Auto-relacionales
| Tabla | Campo | Propósito |
|---|---|---|
| `CupsCodigo` | `parentId → CupsCodigo.id` | Árbol jerárquico de 4 niveles (Grupo→Subcategoría) |
| `Tarifario` | `baseId → Tarifario.id` | Derivación de tarifarios con porcentaje |

### Relaciones 1:1 (exclusivas)
| Tabla A | Tabla B | Campo |
|---|---|---|
| `Cuenta` | `Factura` | `Factura.cuentaId UNIQUE` |
| `ProcedimientoCUPS` | `ConsentimientoTemplate` | `codigoCUPS UNIQUE` |

### Relaciones de conversión (CRM)
| Campo | Descripción |
|---|---|
| `CrmLead.pacienteId` | Se llena cuando el lead se convierte en paciente registrado |

---

*Anterior: [DB_01_INVENTARIO_TABLAS.md](./DB_01_INVENTARIO_TABLAS.md) | Siguiente: [DB_03_DICCIONARIO_DATOS.md](./DB_03_DICCIONARIO_DATOS.md)*
