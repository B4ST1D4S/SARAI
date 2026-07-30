# CAPÍTULO 8 – Arquitectura Técnica
**Sistema:** SARAI | **Fecha:** 2026-07-06

---

## 1. Tablas por Categoría Técnica

### Tablas Centrales (mayor cantidad de dependencias entrantes)

| Tabla | Dependencias entrantes | Categoría |
|---|---|---|
| `Paciente` | 15 | **Núcleo clínico** |
| `User` | 9 | **Núcleo de identidad** |
| `Procedimiento` | 7 | **Núcleo de acto clínico** |
| `TarifaCargo` | 5 | **Núcleo de tarifas** |
| `ProcedimientoCUPS` | 4 | **Núcleo de catálogo CUPS** |
| `Odontograma` | 3 | **Núcleo dental** |
| `Cita` | 3 | **Núcleo de agenda** |
| `Paciente` / `Odontograma` | 3 (desde OdontoPlanItem y OdontoEvolucion) | Dual |

### Tablas Maestras

| Tabla | Descripción |
|---|---|
| `User` | Identidad y autorización |
| `Paciente` | Registro maestro del paciente |
| `Cargo` | Catálogo de cargos (legacy) |
| `Departamento` | Departamentos organizacionales |
| `ServicioFacturable` | Servicios facturables |
| `TarifaGrupo` | Grupos de tarifa |
| `TarifaTipo` | Tipos de tarifa |
| `TarifaCargo` | Cargos con equivalencia CUPS |
| `Tarifario` | Listas de precios |

### Tablas Transaccionales

| Tabla | Volumen estimado |
|---|---|
| `AuditLog` | **Muy alto** — crece con cada operación |
| `HistoriaClinica` | Alto — por cita clínica |
| `Cita` | Alto — operación diaria |
| `Procedimiento` | Alto |
| `SeguimientoPostOp` | Alto — múltiples por procedimiento |
| `FotoClinica` | Alto — múltiples por paciente |
| `OdontoPiezaHallazgo` | Alto — hasta 32 piezas × odontograma |
| `OdontoPlanItem` | Alto |
| `CuentaItem` | Alto |
| `Consentimiento` | Medio |
| `Cotizacion` | Medio |
| `CrmLead` | Medio |
| `Transaccion` | Medio |
| `Ingreso` / `Cuenta` / `Factura` | Medio |
| `Alerta` | Variable |
| `MapaCorporal` | Bajo-Medio |

### Tablas de Catálogo (datos estáticos o de baja mutación)

| Tabla | Frecuencia de cambio |
|---|---|
| `CupsCodigo` | Muy baja — actualización por resolución |
| `Especialidad` | Muy baja |
| `ListaValor` | Baja |
| `MotivoCita` | Baja |
| `TipoConsulta` | Baja |
| `TipoConsultorio` | Muy baja |
| `OdontoHallazgo` | Baja |
| `OdontoEstado` | Muy baja |
| `OdontoPrioridad` | Muy baja |
| `OdontoRiesgo` | Muy baja |
| `ProcedimientoCUPS` | Baja |

### Tablas de Configuración

| Tabla | Descripción |
|---|---|
| `ConfiguracionSistema` | Pares clave/JSON — configuración técnica |
| `ParametroSistema` | Parámetros funcionales por grupo/clave |
| `CampoPaciente` | Campos dinámicos del formulario |
| `PlantillaTemplate` | Plantillas de HC por CUPS y tipo |
| `ChecklistTemplate` | Checklists por fase y CUPS |
| `ConsentimientoTemplate` | HTML de consentimientos por CUPS |
| `PlantillaProcedimiento` | Plantillas legacy (posiblemente obsoletas) |
| `Integracion` | Credenciales de integraciones externas |
| `HCModulo` | Módulos HC con codificación RIPS |
| `DepartamentoCargo` | Reglas departamento-cargo |
| `ReglaOperativa` | Reglas departamento-servicio |
| `ConfigServicioConsulta` | Servicios por tipo de consulta |
| `Preparacion` | Instrucciones pre-consulta |

### Tablas de Auditoría / Históricas

| Tabla | Descripción |
|---|---|
| `AuditLog` | Bitácora completa de operaciones |
| `HistoriaClinica` | Registro versionado — inmutable tras firma |
| `AntecedentesQuirurgicos` | Historial de cirugías previas |
| `FotoClinica` | Archivo fotográfico clínico |
| `OdontoEvolucion` | Línea de tiempo dental |

### Tablas Puente (Bridge)

| Tabla | Relación que une |
|---|---|
| `DepartamentoCargo` | Departamento ↔ Cargo (+ 9 flags de negocio) |
| `OdontoHallazgoSugerencia` | OdontoHallazgo ↔ TarifaCargo |
| `TarifaItem` | Tarifario ↔ TarifaCargo (+ precio) |
| `ConfigServicioConsulta` | TipoConsulta ↔ ServicioFacturable |
| `ReglaOperativa` | Departamento ↔ ServicioFacturable |

---

## 2. Sistema de Identificadores

### CUID (`@default(cuid())`)
Usado en la mayoría de tablas transaccionales y de catálogo modernas:

```
Características:
  - Prefijo 'c' + timestamp + huella aleatoria
  - Longitud fija de 25 caracteres
  - Ordenable por tiempo de creación (parcialmente)
  - Sin colisiones en entorno distribuido
  - Generado por Prisma Client en la aplicación

Tablas: User, Paciente, Procedimiento, HistoriaClinica, Cita, Alerta,
        Cotizacion, CrmLead, CupsCodigo, TarifaCargo, Tarifario,
        Ingreso, Cuenta, Factura, todos los Odonto*...
```

### ID Manual (asignado desde la aplicación)
```
Usado en tablas de configuración heredadas del módulo legacy:
  Cargo, Departamento, DepartamentoCargo, HCModulo, ListaValor,
  MotivoCita, ParametroSistema, TipoConsulta, TipoConsultorio,
  Preparacion, ReglaOperativa, ServicioFacturable, ConfigServicioConsulta,
  CampoPaciente, Especialidad

Riesgo: Mayor posibilidad de colisiones si no se gestiona correctamente.
```

### Autoincrement (secuencia PostgreSQL)
```
Usado para números visibles al usuario (trazabilidad humana):
  Ingreso.numero   → número de admisión
  Cuenta.numero    → número de cuenta
  Factura.numero   → número de factura (con prefijo "FE")

Ventaja: Números simples y auditables (FE-0001, FE-0002...)
```

---

## 3. Índices Declarados

### Índices por tabla

| Tabla | Campos indexados |
|---|---|
| `User` | `rol`, `email` |
| `Paciente` | `nombreCompleto`, `estado` |
| `Alergia` | `pacienteId` |
| `Medicamento` | `pacienteId` |
| `AntecedentesQuirurgicos` | `pacienteId` |
| `Procedimiento` | `pacienteId`, `medicoId`, `codigoCUPS`, `estado`, `fechaProgramada` |
| `HistoriaClinica` | `pacienteId`, `procedimientoId`, `plantillaId`, `tipoHistoria`, `fechaCreacion` |
| `Consentimiento` | `pacienteId`, `procedimientoId`, `firmado` |
| `FotoClinica` | `pacienteId`, `procedimientoId`, `tipo` |
| `MapaCorporal` | `pacienteId`, `procedimientoId` |
| `SeguimientoPostOp` | `pacienteId`, `procedimientoId`, `diaPostOp`, `completado` |
| `Alerta` | `pacienteId`, `severidad`, `resuelta` |
| `Cita` | `pacienteId`, `medicoId`, `fechaHora`, `estado` |
| `Transaccion` | `pacienteId`, `estado` |
| `AuditLog` | `usuarioId`, `tablaAfectada`, `timestamp` |
| `ProcedimientoCUPS` | `codigoCUPS`, `tipoCategoria`, `activo` |
| `PlantillaTemplate` | `codigoCUPS`, `tipo` |
| `ChecklistTemplate` | `codigoCUPS` |
| `ConsentimientoTemplate` | `codigoCUPS` |
| `DisponibilidadMedico` | `medicoId`, `diaSemana` |
| `BloqueDisponibilidad` | `medicoId`, `fechaInicio` |
| `CampoPaciente` | `esPersonalizado`, `esVisible`, `seccion` |
| `Cargo` | `estado`, `tipo` |
| `Departamento` | `estado` |
| `HCModulo` | `activo` |
| `ListaValor` | `grupo` |
| `MotivoCita` | `activo`, `tipo` |
| `ParametroSistema` | `grupo` |
| `Preparacion` | `estado`, `tipoConsultaId` |
| `ServicioFacturable` | `categoria`, `estado` |
| `TipoConsulta` | `especialidadId`, `estado` |
| `Cotizacion` | `pacienteId`, `medicoId`, `estado`, `creadoEn` |
| `CrmLead` | `etapa`, `calificacion`, `pacienteId`, `creadoPor` |
| `CupsCodigo` | `nivel`, `seccion`, `capitulo`, `grupo`, `parentId`, `esFacturable`, `activo` |
| `TarifaGrupo` | `activo` |
| `TarifaTipo` | `grupoId`, `activo` |
| `TarifaCargo` | `cupsCodigoId`, `grupoId`, `tipoId`, `activo` |
| `Tarifario` | `activo`, `baseId` |
| `TarifaItem` | `tarifarioId`, `cargoId` |
| `Ingreso` | `pacienteId`, `citaId`, `estado` |
| `Cuenta` | `ingresoId`, `estado` |
| `CuentaItem` | `cuentaId`, `cargoId` |
| `Factura` | `pacienteId`, `estado`, `fecha` |
| `Especialidad` | `estado` |
| `OdontoHallazgo` | `activo`, `categoria` |
| `OdontoEstado` | `activo` |
| `OdontoPrioridad` | `activo` |
| `OdontoRiesgo` | `activo` |
| `Odontograma` | `pacienteId`, `tipo`, `estado`, `medicoId` |
| `OdontoPiezaHallazgo` | `odontogramaId`, `diente`, `hallazgoId` |
| `OdontoPlanItem` | `odontogramaId`, `pacienteId`, `estadoTratamiento`, `cargoId` |
| `OdontoEvolucion` | `odontogramaId`, `pacienteId`, `fecha` |
| `OdontoHallazgoSugerencia` | `hallazgoId`, `cargoId` |
| `ChecklistCompletado` | `procedimientoId`, `completadoEn` |

**Total de índices declarados:** ~60

---

## 4. Constraints UNIQUE Declarados

| Tabla | Campos UNIQUE |
|---|---|
| `User` | `email`, `username` |
| `Especialidad` | `codigo`, `nombre` |
| `Paciente` | `(numeroDocumento, tipoDocumento)` — compuesto |
| `ProcedimientoCUPS` | `codigoCUPS` |
| `PlantillaTemplate` | `(codigoCUPS, tipo)` — compuesto |
| `ChecklistTemplate` | `(codigoCUPS, fase)` — compuesto |
| `ConsentimientoTemplate` | `codigoCUPS` |
| `ConfiguracionSistema` | `clave` |
| `CupsCodigo` | `codigo` |
| `TarifaGrupo` | `codigo` |
| `TarifaTipo` | `(grupoId, codigo)` — compuesto |
| `TarifaCargo` | `codigo` |
| `Tarifario` | `codigo` |
| `TarifaItem` | `(tarifarioId, cargoId)` — compuesto |
| `Ingreso` | `numero` (autoincrement) |
| `Cuenta` | `numero` (autoincrement) |
| `Factura` | `numero` (autoincrement), `cuentaId` (1:1) |
| `Cargo` | `codigo` |
| `Departamento` | `codigo` |
| `DepartamentoCargo` | `(departamentoId, cargoId)` — compuesto |
| `HCModulo` | `codigo` |
| `ListaValor` | `(grupo, valor)` — compuesto |
| `ParametroSistema` | `(grupo, clave)` — compuesto |
| `ReglaOperativa` | `(departamentoId, servicioId)` — compuesto |
| `ServicioFacturable` | `codigoCups` |
| `TipoConsultorio` | `codigo` |
| `CampoPaciente` | `nombre` |
| `OdontoHallazgo` | `codigo` |
| `OdontoEstado` | `codigo` |
| `OdontoPrioridad` | `codigo` |
| `OdontoRiesgo` | `codigo` |
| `OdontoHallazgoSugerencia` | `(hallazgoId, cargoId)` — compuesto |
| `ConfigServicioConsulta` | `(tipoConsultaId, servicioId)` — compuesto |
| `Especialidad` | `codigo`, `nombre` |

---

## 5. Mecanismos de Integridad de Datos

### Hash de integridad (no repudio)

| Tabla | Campo | Propósito |
|---|---|---|
| `HistoriaClinica` | `hashIntegridad` | Prueba que el contenido clínico no fue alterado |
| `Consentimiento` | `hashIntegridad` | Validez legal del consentimiento firmado |
| `Odontograma` | `hashIntegridad` | Integridad del odontograma firmado |

**Implementación:** SHA-256 calculado en la aplicación sobre el campo `contenido/contenidoHtml`.  
**Gap:** No calculado por trigger PostgreSQL, por lo que depende de que la aplicación lo llame siempre.

### Versionado

| Tabla | Campo | Descripción |
|---|---|---|
| `HistoriaClinica` | `version INT default(1)` | Incrementa en cada edición |

### Firma digital

| Tabla | Campo | Descripción |
|---|---|---|
| `HistoriaClinica` | `firmadoPorMedico BOOLEAN`, `fechaFirma` | Cierra el registro — inmutable |
| `Consentimiento` | `firmado BOOLEAN`, `fechaFirma` | Validez del consentimiento |
| `Odontograma` | `firmado BOOLEAN` | Cierre del odontograma |

### Evidencia forense digital (Consentimiento)

El modelo captura 6 factores de evidencia: `ipDispositivo`, `navegador`, `sistemaOperativo`, `geolocation`, `selfieUrl`, `firmaDigitalUrl`.

---

## 6. Comportamientos de Eliminación (onDelete)

| onDelete | Tablas configuradas |
|---|---|
| **Cascade** (eliminar hijos al eliminar padre) | `Alergia`, `Medicamento`, `AntecedentesQuirurgicos` (desde Paciente), `PlantillaTemplate`, `ChecklistTemplate`, `ConsentimientoTemplate` (desde ProcedimientoCUPS), `DisponibilidadMedico`, `BloqueDisponibilidad` (desde User), `Cuenta` (desde Ingreso), `CuentaItem` (desde Cuenta), `Odontograma`, `OdontoPiezaHallazgo`, `OdontoPlanItem`, `OdontoEvolucion` (desde Paciente/Odontograma), `OdontoHallazgoSugerencia` (desde Hallazgo/TarifaCargo), `TarifaItem` (desde Tarifario/TarifaCargo), `DepartamentoCargo`, `ReglaOperativa`, `ConfigServicioConsulta`, `TarifaTipo` (desde TarifaGrupo), `CupsCodigo` hijos |
| **SET NULL** (poner null al eliminar padre) | `MapaCorporal.procedimientoId` |
| **Restrict** (default — impide eliminar si hay hijos) | Todo lo no configurado explícitamente |

---

## 7. Gaps Técnicos Identificados

| Elemento | Estado | Impacto |
|---|---|---|
| **Triggers PostgreSQL** | ❌ No definidos en Prisma | Auditoría 100% manual — puede omitirse |
| **Stored Procedures** | ❌ No existen | Lógica 100% en la aplicación |
| **Views** | ❌ No definidas | Sin vistas para reportes/dashboards |
| **Materialized Views** | ❌ No existen | Sin caché de agregaciones |
| **Full-Text Search** | ❌ No configurado (tsvector) | Búsqueda por nombre solo por LIKE |
| **Índices GIN** en JSON | ❌ No configurados | Sin búsqueda dentro de campos JSON |
| **Particionamiento** | ❌ No existe | AuditLog y HC crecerán sin límite |
| **Optimistic Locking** | ❌ No implementado | Riesgo de race conditions en HC |
| **Row-Level Security (RLS)** | ❌ No configurado | Segregación de datos por rol a nivel BD |
| **Encriptación de columnas** | ❌ No explícita | `Integracion.credencialesEncriptadas` es texto |

---

## 8. Campos JSON (sin esquema formal)

| Tabla | Campo JSON | Descripción | Riesgo |
|---|---|---|---|
| `HistoriaClinica` | `contenido` | Contenido clínico libre | Estructura variable por tipo |
| `PlantillaTemplate` | `seccionesJSON` | Secciones del formulario | Requiere validación en aplicación |
| `ChecklistTemplate` | `itemsJSON`, `alertasAutomaticasJSON` | Ítems y alertas | |
| `ConsentimientoTemplate` | `seccionesJSON`, `riesgosJSON`, `recomendacionesJSON` | Estructura del consentimiento | |
| `Cotizacion` | `lineas` | Líneas de la cotización | **No normalizado** |
| `SeguimientoPostOp` | `checklistPreguntas`, `checklistRespuestas` | Checklist de hito | |
| `SeguimientoPostOp` | `alertasGeneradas JSON[]` | Alertas de hito | Duplica tabla Alerta |
| `FotoClinica` | `metadatos`, `anotaciones` | EXIF y anotaciones | |
| `MapaCorporal` | `zonasMarcadas`, `edemaZonas`, `fibrosisZonas`, `dolorZonas` | Coordenadas SVG | |
| `Odontograma` | `hallazgosGenerales`, `estetica` | Datos generales del examen | |
| `ProcedimientoCUPS` | `datosAdicionales` | Metadatos extra | |
| `TipoConsulta` / `HCModulo` | `parametrosConfiguracion` | Configuración adicional | |
| `Consentimiento` | `geolocation` | Coordenadas GPS | |
| `AuditLog` | `datosAntes`, `datosDespues` | Snapshots de estado | Crecimiento de almacenamiento |
| `CampoPaciente` | `opciones` | Opciones de campos select | |

---

*Anterior: [DB_07_INTEGRIDAD_REFERENCIAL.md](./DB_07_INTEGRIDAD_REFERENCIAL.md) | Siguiente: [DB_09_RECOMENDACIONES.md](./DB_09_RECOMENDACIONES.md)*
