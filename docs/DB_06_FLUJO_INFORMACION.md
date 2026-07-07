# CAPÍTULO 6 – Flujo de Información
**Sistema:** SARAI | **Fecha:** 2026-07-06

---

## Flujo 1 – Captación Comercial (CRM)

```
┌─────────────────────────────────────────────────────────────┐
│  CAPTACIÓN DE LEAD                                          │
│                                                             │
│  1. CrmLead creado (etapa: NUEVO_LEAD, calificacion: COLD)  │
│     ├── origen: INSTAGRAM / REFERIDO / WEB / LLAMADA       │
│     ├── procedimientos: [] (intereses)                      │
│     └── valorEstimado: 0                                    │
│                                                             │
│  2. Primer contacto → etapa: CONTACTADO                     │
│     └── calificacion: COLD → WARM                           │
│                                                             │
│  3. Se agenda cita → etapa: AGENDA_CITA                     │
│     ├── proximoContacto: fecha de la cita                   │
│     └── calificacion: WARM → HOT                            │
│                                                             │
│  4. Cotización enviada (Cotizacion)                         │
│     ├── lineas: [{servicio, precio, cantidad}]              │
│     ├── total calculado                                     │
│     └── vigenciaHasta: fecha límite                         │
│                                                             │
│  5. Paciente acepta → Cotizacion.estado: ACEPTADA           │
│     └── CrmLead.etapa: CONVIRTIO                            │
│         └── CrmLead.pacienteId ← Paciente.id asignado       │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 2 – Registro y Búsqueda de Paciente

```
┌─────────────────────────────────────────────────────────────┐
│  REGISTRO DE PACIENTE                                       │
│                                                             │
│  Buscar por (numeroDocumento + tipoDocumento)               │
│      │                                                      │
│      ├── ENCONTRADO → cargar perfil existente               │
│      │                                                      │
│      └── NO ENCONTRADO → crear nuevo registro               │
│              │                                              │
│              ▼                                              │
│          Paciente (estado: ACTIVO)                          │
│              ├── datos demográficos                         │
│              ├── telefonos[] (array)                        │
│              └── creadoPor → User actual                    │
│                                                             │
│  Complementar perfil clínico:                               │
│      ├── Alergia (1..N) → nombre + severidad                │
│      ├── Medicamento (1..N) → activos actuales              │
│      └── AntecedentesQuirurgicos (1..N) → historial         │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 3 – Agenda y Gestión de Cita

```
┌─────────────────────────────────────────────────────────────┐
│  AGENDAMIENTO                                               │
│                                                             │
│  PRE-CONDICIONES:                                           │
│  DisponibilidadMedico (diaSemana, horaInicio, horaFin)      │
│  BloqueDisponibilidad (fechaInicio, fechaFin)               │
│                                                             │
│  1. Recepcionista selecciona médico + fecha/hora            │
│     └── Sistema valida disponibilidad y bloqueos            │
│                                                             │
│  2. Crear Cita                                              │
│     ├── pacienteId + medicoId + fechaHora                   │
│     ├── tipoCita + entidadSalud                             │
│     └── estado: PENDIENTE                                   │
│                                                             │
│  3. Recordatorio automático                                 │
│     └── recordatorioWhatsapp = true → enviar WhatsApp       │
│                                                             │
│  4. Paciente confirma                                       │
│     └── estado: PENDIENTE → CONFIRMADA                      │
│                                                             │
│  5. Día de la cita                                          │
│     ├── asistencia = true                                   │
│     └── estado: CONFIRMADA → COMPLETADA                     │
│                │                                            │
│                ▼ (dispara automáticamente)                  │
│           [FLUJO 4: Facturación]                            │
│           [FLUJO 5: Acto Clínico]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 4 – Ciclo de Facturación

```
┌─────────────────────────────────────────────────────────────┐
│  FACTURACIÓN                                                │
│                                                             │
│  Cita COMPLETADA                                            │
│      │                                                      │
│      ▼                                                      │
│  Ingreso (número autoincrement)                             │
│      ├── tipoIngreso: AMBULATORIO / HOSPITALARIO / URGENCIAS│
│      ├── entidad: EPS / PARTICULAR                          │
│      └── estado: ACTIVO                                     │
│      │                                                      │
│      ▼                                                      │
│  Cuenta (número autoincrement)                              │
│      └── estado: ABIERTA                                    │
│      │                                                      │
│      ▼ (médico/recepcionista añade servicios)               │
│  CuentaItem × N                                             │
│      ├── cargoId → TarifaCargo (tarifa del convenio)        │
│      ├── descripcion (snapshot del servicio)                │
│      ├── cantidad × precioUnitario                          │
│      └── valorTotal acumulado                               │
│      │                                                      │
│      ▼ (cerrar cuenta)                                      │
│  Factura (prefijo "FE", número autoincrement)               │
│      ├── subtotal + total                                   │
│      ├── estado: EMITIDA                                    │
│      └── Cuenta.estado → FACTURADA                          │
│      │                                                      │
│      ▼ (recibir pago)                                       │
│  Factura.estado → PAGADA                                    │
│                                                             │
│  TRANSACCION (registro auxiliar de pagos)                   │
│      ├── tipo: PAGO / ANTICIPO / REEMBOLSO                  │
│      ├── metodoPago: EFECTIVO / TARJETA / TRANSFERENCIA     │
│      └── referenciaPago: número externo                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 5 – Acto Clínico con Historia

```
┌─────────────────────────────────────────────────────────────────┐
│  PROCEDIMIENTO CLÍNICO                                          │
│                                                                 │
│  Médico crea Procedimiento                                      │
│      ├── pacienteId + medicoId                                  │
│      ├── tipoProcedimiento + nombreProcedimiento                │
│      ├── codigoCUPS → ProcedimientoCUPS                         │
│      ├── fechaProgramada + duracionEstimada                     │
│      └── estado: PENDIENTE                                      │
│                                                                 │
│  ── ETAPA PRE-OPERATORIA ──                                     │
│                                                                 │
│  Consentimiento Informado                                       │
│      ├── seleccionar ConsentimientoTemplate (por codigoCUPS)    │
│      ├── generar HTML del consentimiento                        │
│      ├── paciente firma (firma + selfie + GPS + IP)             │
│      ├── generar PDF + hashIntegridad                           │
│      └── firmado = true                                         │
│                                                                 │
│  HistoriaClinica PREOPERATORIA                                  │
│      ├── seleccionar PlantillaTemplate (tipo: PREOPERATORIO)    │
│      ├── llenar contenido JSON (secciones de la plantilla)      │
│      ├── version = 1, hashIntegridad calculado                  │
│      └── firmadoPorMedico = false (abierta)                     │
│                                                                 │
│  ChecklistCompletado (fase: PRE_OP)                             │
│      └── respuestasJSON según ChecklistTemplate                 │
│                                                                 │
│  FotoClinica (tipo: PRE_OP)                                     │
│      └── urlOriginal + urlComprimida + urlMiniatura             │
│                                                                 │
│  MapaCorporal                                                   │
│      └── zonasMarcadas / edemaZonas / fibrosisZonas             │
│                                                                 │
│  ── ACTO QUIRÚRGICO/PROCEDIMIENTO ──                            │
│                                                                 │
│  Procedimiento.estado → EN_PROCESO                              │
│                                                                 │
│  HistoriaClinica INTRAOPERATORIA                                │
│      ├── PlantillaTemplate tipo: INTRAOPERATORIO                │
│      └── notasOperatorio                                        │
│                                                                 │
│  ChecklistCompletado (fase: INTRA_OP)                           │
│                                                                 │
│  ── POST-OPERATORIO ──                                          │
│                                                                 │
│  Procedimiento.estado → COMPLETADO                              │
│      ├── fechaRealizada = now()                                 │
│      └── duracionReal                                           │
│                                                                 │
│  HistoriaClinica POSTOPERATORIA                                 │
│      ├── PlantillaTemplate tipo: POSTOPERATORIO                 │
│      ├── firmadoPorMedico = true                                │
│      └── hashIntegridad final → registro inmutable              │
│                                                                 │
│  FotoClinica (tipo: POST_OP)                                    │
│                                                                 │
│  SeguimientoPostOp (hitos automáticos)                          │
│      └── día 1, 3, 7, 15, 30 según diasSeguimiento del CUPS    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo 6 – Seguimiento Post-Operatorio

```
┌─────────────────────────────────────────────────────────────┐
│  SEGUIMIENTO POST-OP                                        │
│                                                             │
│  SeguimientoPostOp programado (día 1)                       │
│      │                                                      │
│      ▼ Recordatorio WhatsApp                                │
│  notificacionWhatsappEnviada = true                         │
│      │                                                      │
│      ▼ Paciente responde checklist                          │
│  checklistRespuestas completado                             │
│      │                                                      │
│      ├── Sin novedad:                                       │
│      │       └── completado = true ✓                        │
│      │                                                      │
│      └── Con complicación:                                  │
│              ├── reportarComplicacion = true                │
│              └── Alerta creada:                             │
│                      ├── tipoAlerta: COMPLICACION           │
│                      ├── severidad: ALTA / CRITICA          │
│                      ├── iaDetectada: false (reportada)     │
│                      └── accionRecomendada: protocolo       │
│                                                             │
│  SARAI IA analiza respuestas:                               │
│      └── Alerta automática (iaDetectada = true)             │
│          si detecta patrones de riesgo                      │
│                                                             │
│  Alerta resuelta:                                           │
│      ├── resuelta = true                                    │
│      └── fechaResolucion = now()                            │
│                                                             │
│  FotoClinica de control (tipo: CONTROL)                     │
│      └── diasPostOperatorio = día del seguimiento           │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 7 – Odontología Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  ODONTOLOGÍA                                                    │
│                                                                 │
│  Paciente → Cita odontológica                                   │
│      │                                                          │
│      ▼                                                          │
│  Odontograma (tipo: PRIMERA_VEZ)                                │
│      ├── denticion: PERMANENTE / TEMPORAL / MIXTA               │
│      ├── estado: EN_PROCESO                                     │
│      └── riesgoId → OdontoRiesgo (Bajo/Moderado/Alto)           │
│      │                                                          │
│      ▼ Exploración por pieza dental:                            │
│  OdontoPiezaHallazgo × N                                        │
│      ├── diente: 11..48 (FDI)                                   │
│      ├── superficie: VESTIBULAR/LINGUAL/MESIAL/DISTAL/OCLUSAL   │
│      ├── hallazgoId → OdontoHallazgo (caries, fractura...)      │
│      └── estadoId → OdontoEstado (sano, tratado, ausente...)    │
│                                                                 │
│      ▼ Si hallazgo.generaTratamiento = true:                    │
│  OdontoPlanItem (estadoTratamiento: PLANEADO)                   │
│      ├── diagnostico                                            │
│      ├── cargoId → TarifaCargo (procedimiento CUPS)             │
│      ├── prioridadId → OdontoPrioridad                          │
│      └── precio                                                 │
│                                                                 │
│  OdontoEvolucion: VALORACION                                    │
│                                                                 │
│  ── PLAN APROBADO ──                                            │
│  OdontoEvolucion: PLANIFICACION                                 │
│  OdontoPlanItem.estadoTratamiento → AGENDADO                    │
│                                                                 │
│  ── EJECUCIÓN ──                                                │
│  OdontoPlanItem.estadoTratamiento → EN_TRATAMIENTO              │
│  OdontoEvolucion: PROCEDIMIENTO                                 │
│      └── cuentaItemId → CuentaItem (integración facturación)    │
│          └── facturado = true (evita duplicación)               │
│                                                                 │
│  ── CONTROL ──                                                  │
│  OdontoEvolucion: CONTROL                                       │
│  Odontograma (tipo: TRATAMIENTO) → seguimiento                  │
│                                                                 │
│  ── ALTA ──                                                     │
│  OdontoEvolucion: ALTA                                          │
│  OdontoPlanItem.estadoTratamiento → FINALIZADO                  │
│  Odontograma.estado → FINALIZADO                                │
│      ├── firmado = true                                         │
│      └── hashIntegridad calculado                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo 8 – Tarifas y Precios

```
┌─────────────────────────────────────────────────────────────┐
│  PARAMETRIZACIÓN DE TARIFAS                                 │
│                                                             │
│  1. Catálogo CUPS oficial cargado                           │
│     CupsCodigo (árbol GRUPO → SUBCATEGORÍA)                 │
│     └── Solo SUBCATEGORÍA son facturables                   │
│                                                             │
│  2. Crear TarifaCargo (cargo interno)                       │
│     ├── codigo interno único de la clínica                  │
│     ├── cupsCodigoId → CupsCodigo (equivalencia)            │
│     └── grupoId + tipoId (clasificación)                    │
│                                                             │
│  3. Crear Tarifario PARTICULAR (base)                       │
│     └── baseId = null (es el tarifario raíz)                │
│                                                             │
│  4. Crear TarifaItem (precio en tarifario)                  │
│     ├── tarifarioId → Tarifario PARTICULAR                  │
│     ├── cargoId → TarifaCargo                               │
│     └── precio: 150000 COP                                  │
│                                                             │
│  5. Derivar Tarifario EPS                                   │
│     ├── baseId → Tarifario PARTICULAR                       │
│     └── porcentaje = 80 (precio = 150000 × 0.80 = 120000)  │
│                                                             │
│  6. Al facturar:                                            │
│     CuentaItem.cargoId → TarifaCargo                        │
│     └── precio según el Tarifario del convenio del paciente │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 9 – Auditoría de Operaciones

```
┌─────────────────────────────────────────────────────────────┐
│  AUDITORÍA                                                  │
│                                                             │
│  Cualquier operación sensible en el sistema                 │
│      │                                                      │
│      ▼ (llamada desde la aplicación — manual)               │
│  AuditLog                                                   │
│      ├── usuarioId → quién realizó la acción                │
│      ├── tablaAfectada → nombre de la tabla                 │
│      ├── registroId → ID del registro                       │
│      ├── tipoOperacion → INSERT / UPDATE / DELETE           │
│      ├── datosAntes → JSON snapshot previo                  │
│      ├── datosDespues → JSON snapshot posterior             │
│      ├── ipOrigen → IP del cliente                          │
│      ├── userAgent → navegador/app                          │
│      ├── razon → justificación (opcional)                   │
│      └── timestamp → momento exacto                         │
│                                                             │
│  Consultas de auditoría:                                    │
│      ├── ¿Quién modificó este registro?                     │
│      │   SELECT * FROM AuditLog WHERE registroId = 'X'      │
│      ├── ¿Qué hizo este usuario?                            │
│      │   SELECT * FROM AuditLog WHERE usuarioId = 'Y'       │
│      └── ¿Cambios en las últimas 24h?                       │
│          SELECT * FROM AuditLog WHERE timestamp > now()-24h │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 10 – Configuración de Tipo de Consulta

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN CLÍNICA                                      │
│                                                             │
│  Especialidad (ej: Cirugía Plástica)                        │
│      └──< TipoConsulta (ej: Primera Consulta Cirugía)       │
│              ├── departamentoId → Departamento              │
│              ├── hcModuloId → HCModulo (para RIPS)          │
│              ├── duracionMinutos: 30                        │
│              ├── abreHistoriaClinica: true                  │
│              ├── requiereCaja: true                         │
│              └── manejaAnestesia: true                      │
│              │                                              │
│              └──< ConfigServicioConsulta                    │
│                      ├── servicioId → ServicioFacturable    │
│                      │   (esPrincipal: true)                │
│                      └── generaAutomatico: true             │
│                                                             │
│  Preparaciones para el paciente:                            │
│  Preparacion ──> TipoConsulta                               │
│      └── "Traer exámenes recientes", "Ayuno 8h"...          │
│                                                             │
│  Al crear Cita con este TipoConsulta:                       │
│      ├── duracionMinutos aplicado automáticamente           │
│      ├── Si requiereCaja → generar Ingreso automático       │
│      └── Preparaciones mostradas al paciente                │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumen de Flujos por Módulo

| # | Flujo | Tablas involucradas | Disparador |
|---|-------|---------------------|------------|
| 1 | Captación CRM | CrmLead, Cotizacion, Paciente | Primer contacto |
| 2 | Registro Paciente | Paciente, Alergia, Medicamento, Antecedentes | Manual |
| 3 | Agendamiento | Cita, Disponibilidad, BloqueDisponibilidad | Solicitud de cita |
| 4 | Facturación | Ingreso, Cuenta, CuentaItem, Factura | Cita completada |
| 5 | Acto Clínico | Procedimiento, HistoriaClinica, Consentimiento, Foto, Mapa | Cita confirmada |
| 6 | Seguimiento Post-Op | SeguimientoPostOp, Alerta, FotoClinica | Procedimiento completado |
| 7 | Odontología | Odontograma, OdontoPiezaHallazgo, OdontoPlanItem, OdontoEvolucion | Cita odontológica |
| 8 | Tarifas | CupsCodigo, TarifaCargo, Tarifario, TarifaItem | Configuración inicial |
| 9 | Auditoría | AuditLog | Cualquier operación |
| 10 | Config. Consulta | TipoConsulta, Especialidad, ServicioFacturable | Configuración |

---

*Anterior: [DB_05_MAPA_DEPENDENCIAS.md](./DB_05_MAPA_DEPENDENCIAS.md) | Siguiente: [DB_07_INTEGRIDAD_REFERENCIAL.md](./DB_07_INTEGRIDAD_REFERENCIAL.md)*
