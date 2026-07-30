# CAPÍTULO 4 – Arquitectura por Módulos
**Sistema:** SARAI | **Fecha:** 2026-07-06 | **Módulos identificados:** 15

---

## Mapa de Módulos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SISTEMA SARAI                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  SEGURIDAD   │  │  PACIENTES   │  │      AGENDA              │  │
│  │  Módulo 1    │  │  Módulo 3    │  │      Módulo 2            │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
│  ┌──────▼─────────────────▼────────────────────────▼─────────────┐ │
│  │              NÚCLEO CLÍNICO (Módulos 4-8)                      │ │
│  │  Historia Clínica · Consentimientos · Fotos · Mapa Corporal   │ │
│  │  Seguimiento Post-Op · Alertas · Procedimientos               │ │
│  └──────────────────────────────┬────────────────────────────────┘ │
│                                 │                                   │
│  ┌──────────────────┐  ┌────────▼──────────┐  ┌─────────────────┐  │
│  │  ODONTOLOGÍA     │  │   FACTURACIÓN     │  │    TARIFAS/CUPS │  │
│  │  Módulo 9        │  │   Módulo 12       │  │    Módulo 11    │  │
│  └──────────────────┘  └───────────────────┘  └─────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │    CRM       │  │  AUDITORÍA   │  │   CONFIGURACIÓN          │  │
│  │  Módulo 10   │  │  Módulo 15   │  │   Módulos 13-14          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## MÓDULO 1 – Gestión de Usuarios y Seguridad

**Objetivo:** Autenticación, autorización y control de acceso por roles.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `User` |
| **Tablas secundarias** | `AuditLog` |
| **Importancia** | **CRÍTICA** – toda acción del sistema requiere usuario autenticado |

### Roles del sistema
| Rol | Permisos principales |
|---|---|
| `SUPER_ADMIN` | Acceso total, configuración del sistema |
| `MEDICO` | Historia clínica, procedimientos, agenda propia, cotizaciones |
| `AUXILIAR` | Apoyo clínico, fotos, checklists, mapa corporal |
| `RECEPCIONISTA` | Agenda, registro de pacientes, citas, CRM |
| `PACIENTE` | Acceso limitado a su propia información |

### Flujo de autenticación
```
Login (email + password)
    │
    ▼ Verificar bcrypt hash
    │
    ▼ Generar JWT
    │
    ▼ Incluir rol en payload
    │
    ▼ Acceso por middleware de autorización
    │
    ▼ AuditLog → registrar operación
```

### Dependencias salientes
Prácticamente todos los módulos dependen de `User` como referencia de identidad.

---

## MÓDULO 2 – Agenda y Disponibilidad

**Objetivo:** Gestión de citas médicas y control de disponibilidad de médicos con slots automáticos.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `Cita`, `DisponibilidadMedico` |
| **Tablas secundarias** | `BloqueDisponibilidad`, `MotivoCita`, `TipoConsulta`, `TipoConsultorio` |
| **Importancia** | **ALTA** – puerta de entrada a toda la atención clínica |

### Flujo de Agendamiento
```
1. Médico configura disponibilidad semanal
   └── DisponibilidadMedico (diaSemana, horaInicio, horaFin, duracionSlot)
       └── Puede tener fechaDesde / fechaHasta (vigencia)

2. Recepcionista verifica disponibilidad
   └── Excluir BloqueDisponibilidad en el rango
   └── Calcular slots libres

3. Crear Cita
   └── pacienteId + medicoId + fechaHora + tipoCita
   └── Estado inicial: PENDIENTE

4. Confirmación
   └── Estado: PENDIENTE → CONFIRMADA
   └── Envío de recordatorio WhatsApp (recordatorioWhatsapp = true)

5. Atención
   └── Estado: CONFIRMADA → COMPLETADA
   └── asistencia = true
   └── Disparar creación de Ingreso (módulo facturación)
```

### Relaciones con otros módulos
- → **Módulo 3 (Pacientes):** `Cita.pacienteId`
- → **Módulo 1 (Usuarios):** `Cita.medicoId`
- → **Módulo 12 (Facturación):** `Ingreso.citaId` al completar la cita
- → **Módulo 9 (Odontología):** `Odontograma.citaId` (inferida)
- → **Módulo 10 (CRM):** `Cotizacion.citaId` (inferida)

### Estados de Cita
```
PENDIENTE → CONFIRMADA → COMPLETADA
    │                        │
    └─────> CANCELADA <──────┘
```

---

## MÓDULO 3 – Pacientes

**Objetivo:** Registro maestro demográfico del paciente con información clínica base.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `Paciente` |
| **Tablas secundarias** | `Alergia`, `Medicamento`, `AntecedentesQuirurgicos`, `CampoPaciente` |
| **Importancia** | **CRÍTICA** – toda la información clínica depende de este registro |

### Flujo de Registro
```
Búsqueda por (numeroDocumento + tipoDocumento)
    │ No encontrado
    ▼
Crear Paciente
    ├── Datos demográficos básicos
    ├── Teléfonos (array)
    └── creadoPor → User

Completar perfil clínico:
    ├── Alergia (1..N) → severidad
    ├── Medicamento (activos actuales)
    └── AntecedentesQuirurgicos (historial de cirugías)
```

### Campos dinámicos
`CampoPaciente` permite agregar campos personalizados al formulario sin modificar el esquema.  
Campos marcados como `esPersonalizado = true` son creados por el usuario final.

### Identificación única
El par `(numeroDocumento, tipoDocumento)` es UNIQUE. No puede haber dos pacientes con el mismo documento del mismo tipo.

---

## MÓDULO 4 – Historia Clínica

**Objetivo:** Registro clínico versionado e inmutable con cumplimiento de la normativa colombiana.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `HistoriaClinica`, `Procedimiento` |
| **Tablas secundarias** | `PlantillaTemplate`, `PlantillaProcedimiento`, `ProcedimientoCUPS`, `ChecklistTemplate`, `ChecklistCompletado` |
| **Normativa** | Res. 1995/1999, Ley 2015/2020, Res. 866/2021 |
| **Importancia** | **CRÍTICA** – obligación legal en Colombia |

### Flujo de Historia Clínica
```
Procedimiento (creado por médico)
    │
    ▼
Seleccionar plantilla (PlantillaTemplate por codigoCUPS)
    │ puede haber: PREOPERATORIO, INTRAOPERATORIO, POSTOPERATORIO
    ▼
Crear HistoriaClinica
    ├── contenido: JSON estructurado según seccionesJSON de la plantilla
    ├── version: 1 (incrementa en cada edición)
    ├── hashIntegridad: SHA-256 del contenido
    ├── editadoPor: User actual
    └── firmadoPorMedico: false (abierta)

Completar checklists:
    ChecklistCompletado ──> ChecklistTemplate (por fase)

Firmar HC:
    ├── firmadoPorMedico = true
    ├── fechaFirma = now()
    └── hashIntegridad recalculado → registro inmutable
```

### Tipos de Historia
- `CONSULTA` – Historia de consulta general
- `CIRUGIA` – Historia quirúrgica
- `CONTROL` – Control post-procedimiento
- `URGENCIA` – Atención de urgencia
- `ODONTOLOGIA` – Historia dental (puede vincularse a Odontograma)

### Integridad Legal
| Campo | Propósito legal |
|---|---|
| `hashIntegridad` | No repudio: prueba que el contenido no fue alterado |
| `version` | Trazabilidad de versiones |
| `firmadoPorMedico` | Cierra el registro, impide modificaciones |
| `fechaFirma` | Momento exacto para evidencia legal |
| `editadoPor` | Responsabilidad del profesional |

---

## MÓDULO 5 – Consentimientos Informados

**Objetivo:** Gestión completa de consentimientos con validez legal mediante firma digital.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `Consentimiento` |
| **Tablas secundarias** | `ConsentimientoTemplate` |
| **Importancia** | **CRÍTICA** – obligación legal, defensa ante demandas médicas |

### Flujo de Consentimiento
```
Procedimiento asignado
    │
    ▼
Seleccionar ConsentimientoTemplate por codigoCUPS
    │
    ▼
Generar HTML del consentimiento (contenidoHtml)
    │
    ▼
Paciente firma (modal/tablet/celular):
    ├── firmaDigitalUrl (imagen de la firma)
    ├── selfieUrl (foto de identidad)
    ├── fechaFirma
    ├── ipDispositivo
    ├── navegador
    ├── sistemaOperativo
    └── geolocation (coordenadas GPS)

    ▼
Generar PDF (contenidoPdfUrl)
    │
    ▼
Calcular hashIntegridad
    │
    ▼
firmado = true → consentimiento válido
```

### Evidencia Forense Digital
El sistema captura 6 factores de evidencia: IP, navegador, SO, geolocalización, selfie y firma — suficientes para validez legal en Colombia.

---

## MÓDULO 6 – Fotografía Clínica

**Objetivo:** Gestión de imágenes antes/durante/después del procedimiento para seguimiento visual.

| Tablas | `FotoClinica` |
|---|---|
| **Importancia** | ALTA – documentación visual de resultados |

### Tipos de Foto
| Tipo | Descripción |
|---|---|
| `PRE_OP` | Antes del procedimiento |
| `INTRA_OP` | Durante el procedimiento |
| `POST_OP` | Inmediatamente después |
| `CONTROL` | En seguimiento post-operatorio (`diasPostOperatorio`) |

### Almacenamiento en 3 resoluciones
```
FotoClinica
    ├── urlOriginal    → resolución máxima (archivo original)
    ├── urlComprimida  → web (carga rápida)
    └── urlMiniatura   → listados/grids (thumbnails)
```

### Control de Privacidad
`visibleAlPaciente = false` por defecto. El médico decide explícitamente qué fotos puede ver el paciente.

---

## MÓDULO 7 – Mapa Corporal

**Objetivo:** Evaluación visual y seguimiento de zonas corporales mediante un mapa interactivo.

| Tablas | `MapaCorporal` |
|---|---|
| **Importancia** | MEDIA-ALTA – fundamental en medicina estética |

### Zonas evaluadas (almacenadas en JSON)
| Campo JSON | Descripción |
|---|---|
| `zonasMarcadas` | Áreas marcadas en el mapa visual (coordenadas SVG) |
| `edemaZonas` | Zonas con inflamación/edema |
| `fibrosisZonas` | Zonas con endurecimiento/fibrosis |
| `dolorZonas` | Zonas con dolor referido |

### Nota Técnica
La FK `procedimientoId` usa `ON DELETE SET NULL`, permitiendo que un mapa corporal exista aunque el procedimiento sea eliminado.

---

## MÓDULO 8 – Seguimiento Post-Operatorio y Alertas

**Objetivo:** Control automático del paciente después del procedimiento con detección de complicaciones.

| Tablas | `SeguimientoPostOp`, `Alerta` |
|---|---|
| **Importancia** | ALTA – reduce complicaciones y mejora outcomes |

### Flujo de Seguimiento
```
Procedimiento COMPLETADO
    │
    ▼ (según diasSeguimiento en ProcedimientoCUPS)
SeguimientoPostOp (hitos programados: día 1, 3, 7, 15, 30...)
    │
    ▼ Notificación WhatsApp (notificacionWhatsappEnviada)
    │
    ▼ Paciente responde checklist
    │
    ├── reportarComplicacion = false → completado = true ✓
    │
    └── reportarComplicacion = true
         │
         ▼
        Alerta (severidad: BAJA/MEDIA/ALTA/CRITICA)
             ├── iaDetectada = false (reportada por paciente)
             └── iaDetectada = true (detectada por SARAI IA)
```

### Tipos de Alerta
| Tipo | Descripción |
|---|---|
| `COMPLICACION` | Complicación post-operatoria |
| `SEGUIMIENTO` | Recordatorio de hito |
| `ALERGICA` | Reacción alérgica |
| `IA` | Detectada automáticamente por el sistema |

---

## MÓDULO 9 – Odontología

**Objetivo:** Gestión completa del odontograma según normativa colombiana, con plan de tratamiento integrado a facturación.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `Odontograma`, `OdontoPiezaHallazgo`, `OdontoPlanItem`, `OdontoEvolucion` |
| **Catálogos** | `OdontoHallazgo`, `OdontoEstado`, `OdontoPrioridad`, `OdontoRiesgo` |
| **Puente** | `OdontoHallazgoSugerencia` (hallazgo → cargo CUPS sugerido) |
| **Normativa** | Res. 1995/1999, Ley 2015/2020, Res. 866/2021, Habeas Data |
| **Importancia** | **ALTA** – módulo reciente y completo |

### Flujo Odontológico Completo
```
Paciente → Cita de Odontología
    │
    ▼
Odontograma (tipo: PRIMERA_VEZ)
    │
    ▼ Por cada pieza dental (FDI):
OdontoPiezaHallazgo
    ├── diente: 11..48 (permanente) / 51..85 (temporal)
    ├── superficie: VESTIBULAR / LINGUAL / MESIAL / DISTAL / OCLUSAL / INCISAL
    ├── hallazgoId → OdontoHallazgo (caries, fractura, etc.)
    └── estadoId → OdontoEstado (sano, tratado, ausente...)

    │ Si hallazgo.generaTratamiento = true:
    ▼
OdontoPlanItem (PLANEADO)
    ├── hallazgo → diagnóstico
    ├── cargoId → TarifaCargo (CUPS facturable)
    ├── prioridadId → OdontoPrioridad
    └── precio

    │ Ejecución del tratamiento:
    ▼
OdontoEvolucion
    ├── VALORACION → primer registro
    ├── PLANIFICACION → plan aprobado
    ├── PROCEDIMIENTO → acto clínico ejecutado
    │       └── cuentaItemId → CuentaItem (facturación)
    ├── CONTROL → seguimiento
    └── ALTA → cierre del caso
```

### Numeración FDI
```
PERMANENTES:              TEMPORALES (deciduos):
11 12 13 14 15 16 17 18   51 52 53 54 55
21 22 23 24 25 26 27 28   61 62 63 64 65
──────────────────────   ─────────────────
31 32 33 34 35 36 37 38   71 72 73 74 75
41 42 43 44 45 46 47 48   81 82 83 84 85
```

### Integración con Facturación
`OdontoPlanItem.cargoId → TarifaCargo` proporciona el precio.  
`OdontoPlanItem.cuentaItemId` (relación inferida) vincula el tratamiento ejecutado con el ítem de factura para **evitar facturación duplicada** (`facturado = true`).

---

## MÓDULO 10 – CRM y Cotizaciones

**Objetivo:** Gestión de leads comerciales desde el primer contacto hasta la conversión en paciente y cotización.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `CrmLead`, `Cotizacion` |
| **Importancia** | ALTA – motor comercial de la clínica |

### Pipeline CRM
```
NUEVO_LEAD
    │ Primer contacto
    ▼
CONTACTADO
    │ Interés confirmado
    ▼
AGENDA_CITA (citaId vinculada)
    │ Cita realizada
    ▼
CONVIRTIO → pacienteId se asigna
    │
    ▼
[Paciente activo en el sistema clínico]
```

### Calificación de Leads
| Calificación | Descripción |
|---|---|
| `COLD` | Sin respuesta o interés bajo |
| `WARM` | Interés demostrado, en proceso |
| `HOT` | Listo para agendar cita |

### Cotizaciones
```
Cotizacion
    ├── pacienteId + medicoId
    ├── lineas: JSON → [{servicio, precio, cantidad, subtotal}]
    ├── descuentoPorcentaje / descuentoValor
    ├── total calculado
    ├── vigenciaHasta (expira automáticamente)
    └── estado: GENERADA → ACEPTADA / RECHAZADA
```

**⚠️ Mejora pendiente:** `lineas` como JSON impide consultas SQL sobre servicios individuales. Ver [DB_09_RECOMENDACIONES.md](./DB_09_RECOMENDACIONES.md).

---

## MÓDULO 11 – Tarifas y Catálogo CUPS

**Objetivo:** Parametrización completa de precios con equivalencia al catálogo oficial CUPS Res. 2706/2025.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `CupsCodigo`, `TarifaCargo`, `Tarifario`, `TarifaItem` |
| **Tablas secundarias** | `TarifaGrupo`, `TarifaTipo` |
| **Importancia** | **CRÍTICA** – base de toda la facturación |

### Jerarquía CUPS
```
CupsCodigo (nivel: GRUPO)
    └──< CupsCodigo (nivel: SUBGRUPO)
          └──< CupsCodigo (nivel: CATEGORIA)
                └──< CupsCodigo (nivel: SUBCATEGORIA) ← esFacturable = true
                      └──> TarifaCargo (equivalencia interna)
```

### Estructura de Tarifas
```
TarifaGrupo (CONSULTA / PROCEDIMIENTO / MEDICAMENTO...)
    └──< TarifaTipo (PRIMERA_VEZ / CONTROL / URGENCIA...)
          └──< TarifaCargo (código interno + equivalencia CUPS)
                └──< TarifaItem (precio en tarifario específico)
                      └──> Tarifario (PARTICULAR / EPS / SOAT / PREPAGADA)
```

### Derivación de Tarifarios
```
Tarifario PARTICULAR (base)
    └──< Tarifario EPS (baseId + porcentaje = 80%)
         └──< Tarifario SOAT (porcentaje = 120%)
```
El precio efectivo = precio base × (porcentaje / 100).

---

## MÓDULO 12 – Facturación

**Objetivo:** Ciclo completo desde la admisión hasta la factura electrónica.

| Elemento | Detalle |
|---|---|
| **Tablas principales** | `Ingreso`, `Cuenta`, `CuentaItem`, `Factura` |
| **Importancia** | **ALTA** – ingresos económicos de la clínica |

### Ciclo de Facturación
```
Cita COMPLETADA
    │
    ▼ (trigger al completar)
Ingreso (número autoincrement)
    ├── tipoIngreso: AMBULATORIO / HOSPITALARIO / URGENCIAS
    ├── entidad: EPS o PARTICULAR
    └── estado: ACTIVO

    ▼ (automático)
Cuenta (número autoincrement)
    └── estado: ABIERTA

    ▼ (médico/recepcionista añade servicios)
CuentaItem × N
    ├── cargoId → TarifaCargo (precio del tarifario)
    ├── cantidad
    └── valorTotal = precioUnitario × cantidad

    ▼ (cuando se cierra la cuenta)
Factura (número autoincrement, prefijo "FE")
    ├── subtotal + total
    ├── estado: EMITIDA
    └── Cuenta.estado → FACTURADA

    ▼ (pago recibido)
Factura.estado → PAGADA
```

### Estados
```
Ingreso:   ACTIVO ──────> CERRADO / ANULADO
Cuenta:    ABIERTA ─────> FACTURADA / ANULADA
Factura:   EMITIDA ─────> PAGADA / ANULADA
```

---

## MÓDULO 13 – Configuración General del Sistema

**Objetivo:** Parámetros globales, listas de valores y personalización del sistema.

| Tablas | Descripción |
|---|---|
| `ConfiguracionSistema` | Pares clave/valor JSON (configuración técnica) |
| `ParametroSistema` | Parámetros por grupo/clave (configuración funcional) |
| `ListaValor` | Catálogos tipo lookup (TIPO_DOC, GENERO, ESTADO_CIVIL...) |
| `CampoPaciente` | Campos dinámicos del formulario de registro |
| `TipoConsultorio` | Tipos de sala/consultorio disponibles |
| `Integracion` | Configuración de integraciones externas |

---

## MÓDULO 14 – Configuración Clínica (Consulta Externa)

**Objetivo:** Configurar el comportamiento de cada tipo de consulta en términos clínicos y administrativos.

| Tablas | Descripción |
|---|---|
| `Especialidad` | Especialidades médicas habilitadas |
| `TipoConsulta` | Tipos de consulta (19 campos de configuración) |
| `HCModulo` | Módulos HC con codificación RIPS |
| `Departamento` | Departamentos organizacionales |
| `DepartamentoCargo` | Reglas de cargos por departamento |
| `Cargo` | Catálogo legacy de cargos/servicios |
| `ServicioFacturable` | Servicios con código CUPS y precio |
| `ReglaOperativa` | Reglas operativas departamento/servicio |
| `ConfigServicioConsulta` | Servicios asignados a cada tipo de consulta |
| `Preparacion` | Instrucciones pre-consulta |
| `MotivoCita` | Catálogo de motivos de consulta |

### Flujo de Configuración
```
Especialidad → TipoConsulta ──> HCModulo (para RIPS)
                            ──> Departamento
                            ──< ConfigServicioConsulta ──> ServicioFacturable
                            ──< Preparacion
```

---

## MÓDULO 15 – Auditoría

**Objetivo:** Trazabilidad completa de todas las operaciones del sistema.

| Tablas | `AuditLog` |
|---|---|
| **Cobertura** | Cualquier tabla del sistema puede registrarse |
| **Importancia** | ALTA – cumplimiento normativo y seguridad |

### Información capturada por cada operación
```
AuditLog
    ├── usuarioId → quién
    ├── tablaAfectada → qué tabla
    ├── registroId → qué registro
    ├── tipoOperacion → INSERT / UPDATE / DELETE
    ├── datosAntes (JSON) → estado previo
    ├── datosDespues (JSON) → estado posterior
    ├── ipOrigen → desde dónde
    ├── userAgent → con qué cliente
    ├── razon → por qué
    └── timestamp → cuándo (exacto)
```

**⚠️ Limitación:** La auditoría es manual (llamada desde la aplicación). No existe trigger PostgreSQL que garantice el registro automático de todas las operaciones. Ver [DB_09_RECOMENDACIONES.md](./DB_09_RECOMENDACIONES.md).

---

## Resumen de Módulos

| # | Módulo | Tablas | Importancia |
|---|--------|--------|-------------|
| 1 | Seguridad y Usuarios | 2 | CRÍTICA |
| 2 | Agenda y Disponibilidad | 5 | ALTA |
| 3 | Pacientes | 5 | CRÍTICA |
| 4 | Historia Clínica | 6 | CRÍTICA |
| 5 | Consentimientos | 2 | CRÍTICA |
| 6 | Fotografía Clínica | 1 | ALTA |
| 7 | Mapa Corporal | 1 | MEDIA |
| 8 | Seguimiento Post-Op | 2 | ALTA |
| 9 | Odontología | 9 | ALTA |
| 10 | CRM y Cotizaciones | 2 | ALTA |
| 11 | Tarifas y CUPS | 6 | CRÍTICA |
| 12 | Facturación | 4 | ALTA |
| 13 | Configuración General | 6 | MEDIA |
| 14 | Configuración Clínica | 11 | MEDIA-ALTA |
| 15 | Auditoría | 1 | ALTA |

---

*Anterior: [DB_03_DICCIONARIO_DATOS.md](./DB_03_DICCIONARIO_DATOS.md) | Siguiente: [DB_05_MAPA_DEPENDENCIAS.md](./DB_05_MAPA_DEPENDENCIAS.md)*
