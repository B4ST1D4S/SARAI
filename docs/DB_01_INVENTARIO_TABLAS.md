# CAPÍTULO 1 – Inventario General de Tablas
**Sistema:** SARAI | **Fecha:** 2026-07-06 | **Total de tablas:** 61

---

## Resumen de Métricas

| Métrica | Valor |
|---------|-------|
| Total tablas | **61** |
| Tablas maestras | 8 |
| Tablas transaccionales | 22 |
| Tablas de configuración | 13 |
| Tablas catálogo | 12 |
| Tablas auditoría/históricas | 5 |
| Tablas puente (bridge) | 3 |
| Tablas paramétricas | 2 |
| Enums PostgreSQL | 2 (Role, CupsNivel) |

---

## Inventario Completo

| # | Tabla | Descripción Funcional | Cols | Relaciones | Tipo |
|---|-------|-----------------------|------|------------|------|
| 1 | `User` | Usuarios del sistema: médicos, recepcionistas, auxiliares, admins | 20 | 9 | **Maestra** |
| 2 | `Especialidad` | Catálogo de especialidades médicas habilitadas en la clínica | 9 | 2 | **Catálogo** |
| 3 | `Paciente` | Registro maestro demográfico del paciente | 20 | 15 | **Maestra** |
| 4 | `Alergia` | Alergias registradas por paciente con severidad | 5 | 1 | **Transaccional** |
| 5 | `Medicamento` | Medicación activa actual del paciente | 7 | 1 | **Transaccional** |
| 6 | `AntecedentesQuirurgicos` | Historial de cirugías y procedimientos previos | 6 | 1 | **Histórica** |
| 7 | `Procedimiento` | Procedimiento clínico/estético programado o realizado | 22 | 6 | **Transaccional** |
| 8 | `HistoriaClinica` | Registro versionado con hash de integridad legal | 14 | 4 | **Histórica** |
| 9 | `PlantillaProcedimiento` | Plantillas autónomas de contenido HC por código CUPS (legacy) | 12 | 0 | **Configuración** |
| 10 | `Consentimiento` | Consentimientos informados con firma digital y evidencia forense | 18 | 2 | **Transaccional** |
| 11 | `FotoClinica` | Fotografías clínicas pre/durante/post procedimiento | 14 | 2 | **Histórica** |
| 12 | `MapaCorporal` | Evaluación gráfica de zonas corporales (edema, fibrosis, dolor) | 14 | 2 | **Transaccional** |
| 13 | `SeguimientoPostOp` | Seguimiento post-operatorio por hitos de días con checklist | 16 | 2 | **Transaccional** |
| 14 | `Alerta` | Alertas clínicas manuales o detectadas por IA | 11 | 2 | **Transaccional** |
| 15 | `Cita` | Agenda de citas médicas con estado y asistencia | 14 | 3 | **Transaccional** |
| 16 | `Transaccion` | Registro de pagos y movimientos económicos del paciente | 13 | 1 | **Transaccional** |
| 17 | `AuditLog` | Bitácora de auditoría de todas las operaciones del sistema | 10 | 1 | **Auditoría** |
| 18 | `Integracion` | Configuración de integraciones externas (WhatsApp, email, etc.) | 6 | 0 | **Configuración** |
| 19 | `ProcedimientoCUPS` | Catálogo de procedimientos CUPS clínicos con plantillas asociadas | 11 | 4 | **Catálogo** |
| 20 | `PlantillaTemplate` | Plantillas de secciones HC vinculadas a procedimientos CUPS | 15 | 2 | **Configuración** |
| 21 | `ChecklistTemplate` | Plantillas de checklists por fase clínica (preop, intraop, postop) | 8 | 1 | **Configuración** |
| 22 | `ConsentimientoTemplate` | Plantillas HTML de consentimientos por código CUPS (relación 1:1) | 9 | 1 | **Configuración** |
| 23 | `ConfiguracionSistema` | Configuración clave-valor JSON global del sistema | 5 | 0 | **Configuración** |
| 24 | `ChecklistCompletado` | Checklists completados vinculados a procedimientos | 9 | 1 | **Transaccional** |
| 25 | `DisponibilidadMedico` | Horarios de disponibilidad semanal por médico y sede | 12 | 1 | **Transaccional** |
| 26 | `BloqueDisponibilidad` | Bloqueos de agenda del médico (vacaciones, permisos, etc.) | 7 | 1 | **Transaccional** |
| 27 | `CampoPaciente` | Definición dinámica de campos del formulario de registro | 14 | 0 | **Configuración** |
| 28 | `Cargo` | Servicios/ítems internos facturables de la clínica (módulo legacy) | 13 | 1 | **Maestra** |
| 29 | `ConfigServicioConsulta` | Relación entre tipo de consulta y servicios facturables | 11 | 2 | **Configuración** |
| 30 | `Departamento` | Departamentos organizacionales de la clínica | 6 | 3 | **Maestra** |
| 31 | `DepartamentoCargo` | Tabla puente Departamento ↔ Cargo con reglas operativas | 12 | 2 | **Puente** |
| 32 | `HCModulo` | Módulos de historia clínica con codificación RIPS y finalidad | 9 | 1 | **Configuración** |
| 33 | `ListaValor` | Listas de valores paramétricos tipo catálogo (lookup tables) | 7 | 0 | **Catálogo** |
| 34 | `MotivoCita` | Catálogo de motivos de consulta disponibles | 7 | 0 | **Catálogo** |
| 35 | `ParametroSistema` | Parámetros del sistema organizados por grupo y clave | 8 | 0 | **Paramétrica** |
| 36 | `Preparacion` | Preparaciones pre-consulta por tipo de consulta o especialidad | 9 | 2 | **Configuración** |
| 37 | `ReglaOperativa` | Reglas operativas por combinación departamento/servicio | 10 | 2 | **Configuración** |
| 38 | `ServicioFacturable` | Servicios facturables con código CUPS y precio base | 12 | 2 | **Maestra** |
| 39 | `TipoConsulta` | Tipos de consulta con configuración clínica y administrativa completa | 19 | 4 | **Catálogo** |
| 40 | `TipoConsultorio` | Tipos de consultorio/quirófano disponibles en la clínica | 8 | 0 | **Catálogo** |
| 41 | `Cotizacion` | Cotizaciones generadas para pacientes con descuentos | 14 | 2 | **Transaccional** |
| 42 | `CrmLead` | Leads del CRM comercial con pipeline de conversión | 16 | 2 | **Transaccional** |
| 43 | `CupsCodigo` | Catálogo oficial CUPS Res. 2706/2025 con jerarquía auto-referencial | 18 | 1 (auto) | **Catálogo** |
| 44 | `TarifaGrupo` | Agrupación de tipos de tarifa | 5 | 2 | **Maestra** |
| 45 | `TarifaTipo` | Tipos de tarifa dentro de un grupo | 6 | 2 | **Maestra** |
| 46 | `TarifaCargo` | Cargo facturable interno con equivalencia al catálogo CUPS oficial | 13 | 5 | **Maestra** |
| 47 | `Tarifario` | Lista de precios; puede derivarse de otra con porcentaje aplicado | 9 | 2 | **Maestra** |
| 48 | `TarifaItem` | Precio de un cargo dentro de un tarifario específico | 7 | 2 | **Transaccional** |
| 49 | `Ingreso` | Admisión del paciente al sistema (ambulatorio/hospitalario/urgencias) | 13 | 3 | **Transaccional** |
| 50 | `Cuenta` | Documento acumulador de cargos de una admisión | 7 | 2 | **Transaccional** |
| 51 | `CuentaItem` | Línea de servicio/cargo dentro de una cuenta con precio y cantidad | 10 | 2 | **Transaccional** |
| 52 | `Factura` | Factura electrónica generada a partir de una cuenta cerrada | 13 | 2 | **Transaccional** |
| 53 | `OdontoHallazgo` | Catálogo de hallazgos odontológicos (caries, fractura, ausente, etc.) | 12 | 3 | **Catálogo** |
| 54 | `OdontoHallazgoSugerencia` | Puente hallazgo odontológico ↔ cargo facturable sugerido | 5 | 2 | **Puente** |
| 55 | `OdontoEstado` | Catálogo de estados clínicos de piezas dentales | 7 | 1 | **Catálogo** |
| 56 | `OdontoPrioridad` | Catálogo de prioridades de tratamiento dental | 8 | 1 | **Catálogo** |
| 57 | `OdontoRiesgo` | Catálogo de niveles de riesgo clínico odontológico | 7 | 1 | **Catálogo** |
| 58 | `Odontograma` | Odontograma de un paciente: primera vez o seguimiento de tratamiento | 15 | 4 | **Transaccional** |
| 59 | `OdontoPiezaHallazgo` | Hallazgo sobre una pieza dental específica (numeración FDI) | 10 | 3 | **Transaccional** |
| 60 | `OdontoPlanItem` | Ítem del plan de tratamiento dental integrado con facturación | 18 | 5 | **Transaccional** |
| 61 | `OdontoEvolucion` | Línea de tiempo clínica del tratamiento odontológico | 10 | 2 | **Histórica** |

---

## Distribución por Tipo

```
Transaccional  ████████████████████████  22 tablas (36%)
Configuración  █████████████            13 tablas (21%)
Catálogo       ████████████             12 tablas (20%)
Maestra        ████████                  8 tablas (13%)
Histórica      █████                     5 tablas ( 8%)
Puente         ███                       3 tablas ( 5%)
Auditoría      █                         1 tabla  ( 2%)
Paramétrica    ██                        2 tablas ( 3%)
```

---

## Enums PostgreSQL

### `Role`
```
SUPER_ADMIN | MEDICO | AUXILIAR | RECEPCIONISTA | PACIENTE
```
Usado en: `User.rol`

### `CupsNivel`
```
GRUPO | SUBGRUPO | CATEGORIA | SUBCATEGORIA
```
Usado en: `CupsCodigo.nivel`  
Nota: Solo `SUBCATEGORIA` es facturable (`esFacturable = true`)

---

## Tablas con Mayor Número de Relaciones Entrantes

| # | Tabla | Tablas que dependen de ella |
|---|-------|-----------------------------|
| 1 | `Paciente` | 15 (Alergia, Medicamento, Antecedentes, Procedimiento, HistoriaClinica, Consentimiento, FotoClinica, MapaCorporal, SeguimientoPostOp, Alerta, Cita, Transaccion, Cotizacion, CrmLead, OdontoPlanItem...) |
| 2 | `User` | 9 (AuditLog, Cita, Procedimiento, HistoriaClinica, DisponibilidadMedico, BloqueDisponibilidad, Cotizacion, CrmLead, Ingreso) |
| 3 | `Procedimiento` | 7 (HistoriaClinica, Consentimiento, FotoClinica, MapaCorporal, SeguimientoPostOp, Alerta, ChecklistCompletado) |
| 4 | `TarifaCargo` | 5 (TarifaItem, CuentaItem, OdontoPlanItem, OdontoHallazgoSugerencia, + refs) |
| 5 | `ProcedimientoCUPS` | 4 (PlantillaTemplate, ChecklistTemplate, ConsentimientoTemplate, Procedimiento) |
| 6 | `Odontograma` | 3 (OdontoPiezaHallazgo, OdontoPlanItem, OdontoEvolucion) |
| 7 | `Cita` | 3 (Ingreso + refs inferidas) |

---

*Siguiente: [DB_02_MODELO_ER.md](./DB_02_MODELO_ER.md)*
