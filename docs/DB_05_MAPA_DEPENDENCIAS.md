# CAPÍTULO 5 – Mapa de Dependencias
**Sistema:** SARAI | **Fecha:** 2026-07-06

---

## Árbol de Dependencias por Niveles

```
═══════════════════════════════════════════════════════════════
NIVEL 0 — TABLAS COMPLETAMENTE INDEPENDIENTES (sin FKs entrantes ni salientes)
═══════════════════════════════════════════════════════════════

  ConfiguracionSistema    ParametroSistema    ListaValor
  MotivoCita              TipoConsultorio     Integracion
  CampoPaciente

═══════════════════════════════════════════════════════════════
NIVEL 1 — CATÁLOGOS PRIMARIOS (referenciados pero sin dependencias)
═══════════════════════════════════════════════════════════════

  Especialidad    Departamento    HCModulo
  TarifaGrupo     OdontoEstado    OdontoPrioridad    OdontoRiesgo

  CupsCodigo ──────────── auto-relacional (parentId → CupsCodigo.id)
  (árbol de 4 niveles: GRUPO → SUBGRUPO → CATEGORÍA → SUBCATEGORÍA)

═══════════════════════════════════════════════════════════════
NIVEL 2 — CATÁLOGOS SECUNDARIOS (dependen de nivel 1)
═══════════════════════════════════════════════════════════════

  TarifaTipo ──────────> TarifaGrupo
  Cargo
  ServicioFacturable
  OdontoHallazgo
  TipoConsultorio (nivel 0, sin dependencias)

═══════════════════════════════════════════════════════════════
NIVEL 3 — MAESTRAS PRINCIPALES
═══════════════════════════════════════════════════════════════

  User (Role enum)
  Paciente ────────────> User (creadoPor)

═══════════════════════════════════════════════════════════════
NIVEL 4 — CONFIGURACIÓN CLÍNICA Y DE TARIFAS
═══════════════════════════════════════════════════════════════

  ProcedimientoCUPS
  PlantillaTemplate ──────────────> ProcedimientoCUPS (Cascade)
  ChecklistTemplate ──────────────> ProcedimientoCUPS (Cascade)
  ConsentimientoTemplate ─────────> ProcedimientoCUPS (Cascade, 1:1)
  PlantillaProcedimiento (aislada — codigoCups sin FK)

  TarifaCargo ────────────────────> TarifaGrupo
                                  > TarifaTipo
                                  > CupsCodigo (equiv. CUPS)

  Tarifario ──────────── auto-relacional (baseId → Tarifario.id)
  TarifaItem ─────────────────────> Tarifario (Cascade)
                                  > TarifaCargo (Cascade)

  DepartamentoCargo ──────────────> Departamento (Cascade)
                                  > Cargo
  ReglaOperativa ─────────────────> Departamento (Cascade)
                                  > ServicioFacturable
  ConfigServicioConsulta ─────────> TipoConsulta (Cascade)
                                  > ServicioFacturable
  TipoConsulta ───────────────────> Especialidad
                                  > Departamento
                                  > HCModulo
  Preparacion ────────────────────> Especialidad
                                  > TipoConsulta

  OdontoHallazgoSugerencia ───────> OdontoHallazgo (Cascade)
                                  > TarifaCargo (Cascade)

═══════════════════════════════════════════════════════════════
NIVEL 5 — TRANSACCIONAL PRIMARIO
═══════════════════════════════════════════════════════════════

  Cita ───────────────────────────> Paciente
                                  > User (médico)
                                  ⚠️> TipoConsultorio (inferida)

  DisponibilidadMedico ───────────> User (Cascade)
  BloqueDisponibilidad ───────────> User (Cascade)

  Procedimiento ──────────────────> Paciente
                                  > User (médico)
                                  > ProcedimientoCUPS

  Cotizacion ─────────────────────> Paciente
                                  > User (médico)
                                  ⚠️> Cita (inferida)

  CrmLead ────────────────────────> Paciente (opcional)
                                  > User (creador)

  Odontograma ────────────────────> Paciente (Cascade)
                                  > User (médico)
                                  > OdontoRiesgo
                                  ⚠️> HistoriaClinica (inferida)
                                  ⚠️> Cita (inferida)

  Ingreso ────────────────────────> Paciente
                                  > Cita
                                  > User (médico)

═══════════════════════════════════════════════════════════════
NIVEL 6 — TRANSACCIONAL SECUNDARIO
═══════════════════════════════════════════════════════════════

  Alergia ────────────────────────> Paciente (Cascade)
  Medicamento ────────────────────> Paciente (Cascade)
  AntecedentesQuirurgicos ────────> Paciente (Cascade)

  HistoriaClinica ────────────────> Paciente
                                  > User (editor)
                                  > Procedimiento
                                  > PlantillaTemplate

  Consentimiento ─────────────────> Paciente
                                  > Procedimiento
                                  ⚠️> ConsentimientoTemplate (inferida)

  FotoClinica ────────────────────> Paciente
                                  > Procedimiento

  MapaCorporal ───────────────────> Paciente
                                  > Procedimiento (SET NULL)
                                  ⚠️> User (evaluadoPor — inferida)

  SeguimientoPostOp ──────────────> Paciente
                                  > Procedimiento

  Alerta ─────────────────────────> Paciente
                                  > Procedimiento

  ChecklistCompletado ────────────> Procedimiento (Cascade)
                                  ⚠️> ChecklistTemplate (inferida)
                                  ⚠️> User (completadoPor — inferida)

  Transaccion ────────────────────> Paciente
                                  ⚠️> Procedimiento (inferida)
                                  ⚠️> User (creadoPor — inferida)

  AuditLog ───────────────────────> User

  Cuenta ─────────────────────────> Ingreso (Cascade)

  OdontoPiezaHallazgo ────────────> Odontograma (Cascade)
                                  > OdontoHallazgo
                                  > OdontoEstado

  OdontoPlanItem ─────────────────> Odontograma (Cascade)
                                  > Paciente (Cascade)
                                  > OdontoHallazgo
                                  > TarifaCargo
                                  > OdontoPrioridad
                                  ⚠️> User (medicoId — inferida)
                                  ⚠️> CuentaItem (integración — inferida)

  OdontoEvolucion ────────────────> Odontograma (Cascade)
                                  > Paciente (Cascade)
                                  ⚠️> OdontoPlanItem (inferida)
                                  ⚠️> User (medicoId — inferida)

═══════════════════════════════════════════════════════════════
NIVEL 7 — TRANSACCIONAL TERMINAL (tablas hoja)
═══════════════════════════════════════════════════════════════

  CuentaItem ─────────────────────> Cuenta (Cascade)
                                  > TarifaCargo

  Factura ────────────────────────> Cuenta (1:1 UNIQUE)
                                  > Paciente
```

---

## Diagrama Árbol — Tablas con Mayor Dependencia

```
                        ╔═══════════╗
                        ║  PACIENTE ║  ← 15 dependencias
                        ╚═════╤═════╝
          ┌──────────┬─────────┼─────────┬──────────┐
          ▼          ▼         ▼         ▼          ▼
       Alergia   Medicam.  Antecedent. Cita    Procedimiento
                                        │          │
                                        │    ┌─────┼─────┐
                                        ▼    ▼     ▼     ▼
                                     Ingreso HC  Consent. Foto
                                        │
                                     Cuenta
                                        │
                                   CuentaItem ──> TarifaCargo
                                        │              │
                                     Factura      TarifaItem ──> Tarifario

                        ╔══════════╗
                        ║   USER   ║  ← 9 dependencias
                        ╚════╤═════╝
          ┌──────┬───────┬────┼─────┬──────────┐
          ▼      ▼       ▼   ▼      ▼           ▼
        Cita  Proced.  HC  Dispon. CrmLead   AuditLog

                     ╔══════════════════╗
                     ║  PROCEDIMIENTO   ║  ← 7 dependencias
                     ╚════════╤═════════╝
          ┌────────┬──────────┼─────────┬──────┐
          ▼        ▼          ▼         ▼      ▼
       Historia  Consent.   Foto    MapaCorp  Alerta
                              └── Seguim.PostOp
                              └── Checklist

                ╔══════════════╗
                ║  TARIFA_CARGO ║  ← 5 dependencias
                ╚══════╤═══════╝
        ┌───────┬───────┼────────┐
        ▼       ▼       ▼        ▼
   TarifaItem CuentaItem OdontoPlanItem OdontoSugerencia
```

---

## Tabla de Dependencias Obligatorias vs Opcionales

### Dependencias Obligatorias (NOT NULL FK)
| Tabla hijo | FK obligatoria | Tabla padre |
|---|---|---|
| `Alergia` | `pacienteId` | `Paciente` |
| `Medicamento` | `pacienteId` | `Paciente` |
| `AntecedentesQuirurgicos` | `pacienteId` | `Paciente` |
| `Procedimiento` | `pacienteId`, `medicoId` | `Paciente`, `User` |
| `HistoriaClinica` | `pacienteId`, `editadoPor` | `Paciente`, `User` |
| `Consentimiento` | `pacienteId`, `procedimientoId` | `Paciente`, `Procedimiento` |
| `Cita` | `pacienteId`, `medicoId` | `Paciente`, `User` |
| `SeguimientoPostOp` | `pacienteId`, `procedimientoId` | `Paciente`, `Procedimiento` |
| `MapaCorporal` | `pacienteId`, `evaluadoPor` | `Paciente`, User (inferida) |
| `DisponibilidadMedico` | `medicoId` | `User` |
| `BloqueDisponibilidad` | `medicoId` | `User` |
| `Cotizacion` | `pacienteId`, `medicoId` | `Paciente`, `User` |
| `TarifaTipo` | `grupoId` | `TarifaGrupo` |
| `TarifaItem` | `tarifarioId`, `cargoId` | `Tarifario`, `TarifaCargo` |
| `Ingreso` | `pacienteId` | `Paciente` |
| `Cuenta` | `ingresoId` | `Ingreso` |
| `CuentaItem` | `cuentaId` | `Cuenta` |
| `Factura` | `cuentaId`, `pacienteId` | `Cuenta`, `Paciente` |
| `Odontograma` | `pacienteId` | `Paciente` |
| `OdontoPiezaHallazgo` | `odontogramaId`, `hallazgoId` | `Odontograma`, `OdontoHallazgo` |
| `OdontoPlanItem` | `odontogramaId`, `pacienteId` | `Odontograma`, `Paciente` |
| `OdontoEvolucion` | `odontogramaId`, `pacienteId` | `Odontograma`, `Paciente` |

### Dependencias Opcionales (NULL FK)
| Tabla | FK opcional | Padre |
|---|---|---|
| `Paciente` | `creadoPor` | `User` |
| `Procedimiento` | `codigoCUPS` | `ProcedimientoCUPS` |
| `HistoriaClinica` | `procedimientoId`, `plantillaId` | `Procedimiento`, `PlantillaTemplate` |
| `FotoClinica` | `procedimientoId` | `Procedimiento` |
| `MapaCorporal` | `procedimientoId` | `Procedimiento` (SET NULL) |
| `Alerta` | `procedimientoId` | `Procedimiento` |
| `Cita` | `salaQuirofanoId` | `TipoConsultorio` (⚠️ inferida) |
| `Cotizacion` | `citaId` | `Cita` (⚠️ inferida) |
| `CrmLead` | `pacienteId`, `creadoPor` | `Paciente`, `User` |
| `TarifaCargo` | `cupsCodigoId`, `grupoId`, `tipoId` | `CupsCodigo`, `TarifaGrupo`, `TarifaTipo` |
| `Tarifario` | `baseId` | `Tarifario` (auto-rel.) |
| `Ingreso` | `citaId`, `medicoId` | `Cita`, `User` |
| `CuentaItem` | `cargoId` | `TarifaCargo` |
| `Odontograma` | `medicoId`, `riesgoId` | `User`, `OdontoRiesgo` |
| `OdontoPlanItem` | `hallazgoId`, `cargoId`, `prioridadId` | varios |

---

## Dependencias con Cascade Delete

| Padre eliminado | Tablas afectadas (eliminadas automáticamente) |
|---|---|
| `Paciente` | `Alergia`, `Medicamento`, `AntecedentesQuirurgicos`, `Odontograma`, `OdontoPlanItem`, `OdontoEvolucion` |
| `Procedimiento` | `ChecklistCompletado` |
| `ProcedimientoCUPS` | `PlantillaTemplate`, `ChecklistTemplate`, `ConsentimientoTemplate` |
| `User` | `DisponibilidadMedico`, `BloqueDisponibilidad` |
| `Odontograma` | `OdontoPiezaHallazgo`, `OdontoPlanItem`, `OdontoEvolucion` |
| `OdontoHallazgo` | `OdontoHallazgoSugerencia` |
| `TarifaCargo` | `OdontoHallazgoSugerencia`, `TarifaItem` |
| `Tarifario` | `TarifaItem` |
| `Ingreso` | `Cuenta` |
| `Cuenta` | `CuentaItem` |
| `Departamento` | `DepartamentoCargo`, `ReglaOperativa` |
| `TipoConsulta` | `ConfigServicioConsulta` |
| `CupsCodigo` | `CupsCodigo` hijos (árbol auto-relacional) |
| `TarifaGrupo` | `TarifaTipo` |

---

## Tablas con SET NULL al eliminar padre
| Campo | Tabla | Comportamiento |
|---|---|---|
| `MapaCorporal.procedimientoId` | `MapaCorporal` | Si se elimina el procedimiento, el campo queda NULL pero el mapa se conserva |

---

## Tablas Aisladas (sin FK en ninguna dirección)

| Tabla | Razón | Riesgo |
|---|---|---|
| `Integracion` | No tiene FK hacia ni desde otras tablas | Bajo — configuración independiente |
| `PlantillaProcedimiento` | `codigoCups` sin FK formal; no hay tabla que la referencie | **Alto** — datos posiblemente inconsistentes |
| `TipoConsultorio` | `Cita.salaQuirofanoId` existe pero sin FK formal | Medio — no se valida la sala |
| `ListaValor` | Diseño intencional (catálogo genérico) | Bajo |
| `MotivoCita` | Ninguna tabla referencia este catálogo con FK | Medio — catálogo sin uso activo |

---

## Dependencias Circulares

| Tipo | Tablas | ¿Es un problema? |
|---|---|---|
| Auto-relacional válida | `CupsCodigo.parentId → CupsCodigo.id` | NO — árbol jerárquico intencional |
| Auto-relacional válida | `Tarifario.baseId → Tarifario.id` | NO — derivación de tarifarios intencional |
| Potencial indirecta | `OdontoPlanItem.cuentaItemId → CuentaItem` y `CuentaItem.cargoId → TarifaCargo` y `TarifaCargo ←── OdontoPlanItem.cargoId` | Baja — no es circular real, pero requiere cuidado en cascadas |

---

## Tablas Núcleo del Sistema

Las siguientes tablas son esenciales para la operación. Su eliminación o corrupción compromete el sistema completo:

| Tabla | Por qué es núcleo |
|---|---|
| `Paciente` | 15 tablas dependen de ella; sin paciente no hay atención |
| `User` | 9 tablas dependen; sin usuarios no hay acceso ni autoría |
| `Procedimiento` | 7 tablas dependen; centro del acto clínico |
| `TarifaCargo` | 5 tablas dependen; sin tarifas no hay facturación |
| `ProcedimientoCUPS` | 4 tablas dependen; sin CUPS no hay plantillas ni protocolos |
| `Odontograma` | 3 tablas dependen; núcleo del módulo dental |
| `Cita` | 3 tablas dependen; entrada a la atención |

---

*Anterior: [DB_04_ARQUITECTURA_MODULOS.md](./DB_04_ARQUITECTURA_MODULOS.md) | Siguiente: [DB_06_FLUJO_INFORMACION.md](./DB_06_FLUJO_INFORMACION.md)*
