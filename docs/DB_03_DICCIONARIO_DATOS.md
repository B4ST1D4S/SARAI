# CAPÍTULO 3 – Diccionario de Datos
**Sistema:** SARAI | **Fecha:** 2026-07-06 | **Tablas documentadas:** 61

---

## Convenciones

| Símbolo | Significado |
|---------|-------------|
| PK | Primary Key |
| FK | Foreign Key |
| UQ | UNIQUE constraint |
| NN | NOT NULL |
| DEF | Valor por defecto |
| ⚠️ | FK inferida, sin constraint formal |

---

## `User` — Usuarios del Sistema

**Descripción:** Tabla maestra de usuarios. Representa médicos, auxiliares, recepcionistas, super-admins y pacientes con acceso al sistema.

| Campo | Tipo PG | NN | PK | FK | UQ | Defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|---|---|
| `id` | TEXT | ✓ | ✓ | | | cuid() | Identificador único CUID | `cld2x...` |
| `email` | TEXT | | | | ✓ | | Correo electrónico de acceso | `medico@clinica.com` |
| `password` | TEXT | ✓ | | | | | Hash bcrypt de la contraseña | `$2b$10$...` |
| `nombre` | TEXT | ✓ | | | | | Nombre del usuario | `Carlos` |
| `apellido` | TEXT | ✓ | | | | | Apellido del usuario | `Ramírez` |
| `rol` | Role | ✓ | | | | `RECEPCIONISTA` | Rol en el sistema | `MEDICO` |
| `especialidad` | TEXT | | | | | | Especialidad (texto libre) | `Cirugía Plástica` |
| `numeroDocumento` | TEXT | | | | | | Número de identificación | `12345678` |
| `telefono` | TEXT | | | | | | Teléfono de contacto | `3001234567` |
| `activo` | BOOLEAN | ✓ | | | | `true` | Estado del usuario | `true` |
| `username` | TEXT | | | | ✓ | | Nombre de usuario alternativo | `doc.ramirez` |
| `firmaBase64` | TEXT | | | | | | Firma digital en base64 | `data:image/png;base64,...` |
| `registroMedico` | TEXT | | | | | | Número registro médico | `RM-12345` |
| `registroProfesional` | TEXT | | | | | | Registro profesional | `RP-98765` |
| `tipoDocumento` | TEXT | | | | | | Tipo de documento | `CC` |
| `createdAt` | TIMESTAMP | ✓ | | | | now() | Fecha de creación | |
| `updatedAt` | TIMESTAMP | ✓ | | | | now() | Última actualización | |

**Índices:** `rol`, `email`  
**Enum Role:** `SUPER_ADMIN | MEDICO | AUXILIAR | RECEPCIONISTA | PACIENTE`

---

## `Especialidad` — Especialidades Médicas

| Campo | Tipo | NN | UQ | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `codigo` | TEXT | ✓ | ✓ | | Código único de especialidad |
| `nombre` | TEXT | ✓ | ✓ | | Nombre de la especialidad |
| `descripcion` | TEXT | | | | Descripción |
| `aplicaAnestesia` | BOOLEAN | ✓ | | `false` | Si aplica anestesia |
| `aplicaPediatria` | BOOLEAN | ✓ | | `false` | |
| `aplicaCirugia` | BOOLEAN | ✓ | | `false` | |
| `aplicaInstrumentacion` | BOOLEAN | ✓ | | `false` | |
| `aplicaMedicoFamiliar` | BOOLEAN | ✓ | | `false` | |
| `estado` | BOOLEAN | ✓ | | `true` | Habilitada |

**Índices:** `estado`

---

## `Paciente` — Registro Maestro de Paciente

**Descripción:** Núcleo del sistema clínico. Toda la información clínica depende de este registro.

| Campo | Tipo | NN | PK | FK | UQ | Defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|---|---|
| `id` | TEXT | ✓ | ✓ | | | cuid() | ID único | |
| `numeroDocumento` | TEXT | ✓ | | | Compuesto | | Número de documento | `1234567890` |
| `tipoDocumento` | TEXT | ✓ | | | Compuesto | | CC, CE, TI, PA, RC, NIT | `CC` |
| `nombreCompleto` | TEXT | ✓ | | | | | Nombre completo | `Ana María García` |
| `fechaNacimiento` | TIMESTAMP | ✓ | | | | | | `1990-05-15` |
| `genero` | TEXT | ✓ | | | | | M / F / NB | `F` |
| `telefonos` | TEXT[] | ✓ | | | | | Array de teléfonos | `["3001234567"]` |
| `email` | TEXT | | | | | | Correo electrónico | |
| `whatsapp` | TEXT | | | | | | WhatsApp de contacto | |
| `direccion` | TEXT | | | | | | Dirección residencia | |
| `ciudad` | TEXT | | | | | | Ciudad | `Bogotá` |
| `fotoPerfil` | TEXT | | | | | | URL de foto | |
| `estado` | TEXT | ✓ | | | | `ACTIVO` | ACTIVO / INACTIVO | |
| `creadoPor` | TEXT | | | User.id | | | FK al usuario creador | |
| `createdAt` | TIMESTAMP | ✓ | | | | now() | | |
| `updatedAt` | TIMESTAMP | ✓ | | | | now() | | |

**UNIQUE compuesto:** `(numeroDocumento, tipoDocumento)`  
**Índices:** `nombreCompleto`, `estado`

---

## `Alergia` — Alergias del Paciente

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id (Cascade) | Paciente dueño |
| `nombre` | TEXT | ✓ | | Nombre de la alergia |
| `severidad` | TEXT | ✓ | | LEVE / MODERADA / SEVERA |
| `reaccion` | TEXT | | | Descripción de la reacción |

**Índices:** `pacienteId`

---

## `Medicamento` — Medicación Activa

| Campo | Tipo | NN | FK | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `pacienteId` | TEXT | | Paciente.id (Cascade) | | |
| `nombre` | TEXT | ✓ | | | Nombre del medicamento |
| `dosis` | TEXT | ✓ | | | Dosis prescrita |
| `frecuencia` | TEXT | ✓ | | | Cada cuánto se toma |
| `indicacion` | TEXT | ✓ | | | Indicación terapéutica |
| `activo` | BOOLEAN | ✓ | | `true` | Si sigue en uso |

**Índices:** `pacienteId`

---

## `AntecedentesQuirurgicos` — Historial de Cirugías

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id (Cascade) | |
| `procedimiento` | TEXT | ✓ | | Nombre del procedimiento previo |
| `fecha` | TIMESTAMP | ✓ | | Fecha de la cirugía |
| `complicaciones` | TEXT | | | Complicaciones presentadas |
| `cirujano` | TEXT | | | Nombre del cirujano |

---

## `Procedimiento` — Acto Clínico

**Descripción:** Tabla central del módulo clínico. Cualquier procedimiento estético, quirúrgico o terapéutico pasa por aquí.

| Campo | Tipo | NN | FK | UQ | Defecto | Descripción |
|---|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | | cuid() | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | | | |
| `medicoId` | TEXT | ✓ | User.id | | | Médico responsable |
| `tipoProcedimiento` | TEXT | ✓ | | | | ESTETICO / QUIRURGICO / TERAPEUTICO |
| `nombreProcedimiento` | TEXT | ✓ | | | | Nombre descriptivo |
| `descripcion` | TEXT | | | | | Descripción detallada |
| `fechaProgramada` | TIMESTAMP | ✓ | | | | Fecha planificada |
| `fechaRealizada` | TIMESTAMP | | | | | Fecha real de ejecución |
| `duracionEstimada` | INT | ✓ | | | | Minutos estimados |
| `duracionReal` | INT | | | | | Minutos reales |
| `estado` | TEXT | ✓ | | | `PENDIENTE` | PENDIENTE / EN_PROCESO / COMPLETADO / CANCELADO |
| `notasPreoperatorio` | TEXT | | | | | Notas pre-operatorias |
| `notasOperatorio` | TEXT | | | | | Notas durante el acto |
| `complicaciones` | TEXT[] | ✓ | | | | Array de complicaciones ocurridas |
| `resultadoVisualEsperado` | TEXT | | | | | Resultado esperado |
| `resultadoVisualActual` | TEXT | | | | | Resultado real obtenido |
| `codigoCUPS` | TEXT | | ProcedimientoCUPS.codigoCUPS | | | Código CUPS del procedimiento |
| `createdAt` | TIMESTAMP | ✓ | | | now() | |
| `updatedAt` | TIMESTAMP | ✓ | | | now() | |

**Índices:** `pacienteId`, `medicoId`, `codigoCUPS`, `estado`, `fechaProgramada`

---

## `HistoriaClinica` — Historia Clínica Versionada

**Descripción:** Registro legal e inmutable de la historia clínica. Incluye hash de integridad para no repudio.

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | |
| `procedimientoId` | TEXT | | Procedimiento.id | HC vinculada a un procedimiento |
| `tipoHistoria` | TEXT | ✓ | | CONSULTA / CIRUGIA / CONTROL / URGENCIA |
| `contenido` | JSON | ✓ | | Contenido clínico estructurado |
| `version` | INT | ✓ | | Versión del registro (inicia en 1) |
| `editadoPor` | TEXT | ✓ | User.id | Último usuario editor |
| `fechaCreacion` | TIMESTAMP | ✓ | | Fecha de creación |
| `fechaUltimaEdicion` | TIMESTAMP | ✓ | | Última modificación |
| `firmadoPorMedico` | BOOLEAN | ✓ | | `false` → registro abierto; `true` → cerrado |
| `fechaFirma` | TIMESTAMP | | | Momento exacto de la firma |
| `hashIntegridad` | TEXT | ✓ | | SHA-256 del contenido para no repudio |
| `plantillaId` | TEXT | | PlantillaTemplate.id | Plantilla utilizada |

**Índices:** `pacienteId`, `procedimientoId`, `plantillaId`, `tipoHistoria`, `fechaCreacion`  
**Normativa:** Resolución 1995/1999, Ley 2015/2020

---

## `PlantillaProcedimiento` — Plantillas Legacy de HC

**Descripción:** Plantillas autónomas de contenido para HC. Tabla anterior al modelo `ProcedimientoCUPS + PlantillaTemplate`. Actualmente aislada.

| Campo | Tipo | NN | UQ | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `codigoCups` | TEXT | ✓ | ✓ | Código CUPS (sin FK formal — ⚠️ relación inferida) |
| `nombreProcedimiento` | TEXT | ✓ | | Nombre |
| `categoria` | TEXT | ✓ | | Categoría clínica |
| `descripcion` | TEXT | | | |
| `camposObligatorios` | JSON | ✓ | | Campos requeridos en la HC |
| `camposOpcionales` | JSON | ✓ | | Campos opcionales |
| `riesgosAuto` | TEXT[] | ✓ | | Riesgos autogenerados |
| `complicacionesEsperadas` | TEXT[] | ✓ | | |
| `medicacionRecomendada` | JSON | ✓ | | |
| `postoperatorioPorDias` | JSON | ✓ | | Protocolo día a día post-op |
| `consentimientoTemplate` | TEXT | ✓ | | HTML del consentimiento |

**⚠️ Nota:** Tabla sin FK. Posiblemente obsoleta. Ver `PlantillaTemplate` como reemplazo.

---

## `Consentimiento` — Consentimiento Informado

**Descripción:** Registro legal del consentimiento con evidencia digital completa.

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | |
| `procedimientoId` | TEXT | ✓ | Procedimiento.id | |
| `plantillaId` | TEXT | ✓ | ⚠️ ConsentimientoTemplate | ID de la plantilla usada |
| `contenidoHtml` | TEXT | ✓ | | HTML completo del consentimiento |
| `contenidoPdfUrl` | TEXT | | | URL del PDF generado |
| `firmaDigitalUrl` | TEXT | | | URL de la imagen de firma |
| `selfieUrl` | TEXT | | | Selfie de validación de identidad |
| `fechaFirma` | TIMESTAMP | | | Momento exacto de firma |
| `ipDispositivo` | TEXT | | | IP del firmante |
| `navegador` | TEXT | | | Navegador utilizado |
| `sistemaOperativo` | TEXT | | | SO del dispositivo |
| `geolocation` | JSON | | | Coordenadas GPS al momento de firmar |
| `firmado` | BOOLEAN | ✓ | | `false` = pendiente / `true` = firmado |
| `hashIntegridad` | TEXT | ✓ | | SHA-256 del contenido |
| `createdAt` | TIMESTAMP | ✓ | | |
| `updatedAt` | TIMESTAMP | ✓ | | |

**Índices:** `pacienteId`, `procedimientoId`, `firmado`

---

## `FotoClinica` — Fotografías Clínicas

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | |
| `procedimientoId` | TEXT | | Procedimiento.id | Opcional |
| `tipo` | TEXT | ✓ | | PRE_OP / INTRA_OP / POST_OP / CONTROL |
| `diasPostOperatorio` | INT | | | Día del seguimiento (ej. 1, 7, 30) |
| `urlOriginal` | TEXT | ✓ | | URL foto tamaño original |
| `urlComprimida` | TEXT | ✓ | | Versión comprimida para carga rápida |
| `urlMiniatura` | TEXT | ✓ | | Miniatura para listados |
| `metadatos` | JSON | | | EXIF, dimensiones, etc. |
| `anotaciones` | JSON | | | Anotaciones clínicas sobre la foto |
| `visibleAlPaciente` | BOOLEAN | ✓ | | Control de privacidad |
| `fechaCaptura` | TIMESTAMP | ✓ | | Momento real de captura |

**Índices:** `pacienteId`, `procedimientoId`, `tipo`

---

## `MapaCorporal` — Evaluación de Zonas Corporales

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | |
| `procedimientoId` | TEXT | | Procedimiento.id (SET NULL) | Opcional — si se elimina el proc., queda NULL |
| `fechaEvaluacion` | TIMESTAMP | ✓ | | |
| `zonasMarcadas` | JSON | ✓ | | Coordenadas/zonas marcadas en el mapa visual |
| `edemaZonas` | JSON | ✓ | | Zonas con edema |
| `fibrosisZonas` | JSON | ✓ | | Zonas con fibrosis |
| `dolorZonas` | JSON | ✓ | | Zonas con dolor referido |
| `colorIndicator` | TEXT | | | Color del indicador visual (hex) |
| `anotacionesClinics` | TEXT | | | Notas clínicas adicionales |
| `evaluadoPor` | TEXT | ✓ | ⚠️ User.id | Médico evaluador |

**Nota:** La FK `procedimientoId` usa `ON DELETE SET NULL` (modificado por alter-mapa-corporal.sql)

---

## `SeguimientoPostOp` — Seguimiento Post-Operatorio

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | |
| `procedimientoId` | TEXT | ✓ | Procedimiento.id | |
| `diaPostOp` | INT | ✓ | | Día del seguimiento (1, 3, 7, 15, 30...) |
| `fechaPrevista` | TIMESTAMP | ✓ | | Fecha programada para el hito |
| `fechaCompletada` | TIMESTAMP | | | Cuando se completó |
| `tipoSeguimiento` | TEXT | ✓ | | PRESENCIAL / WHATSAPP / EMAIL / LLAMADA |
| `checklistPreguntas` | JSON | ✓ | | Preguntas del checklist |
| `checklistRespuestas` | JSON | | | Respuestas capturadas |
| `reportarComplicacion` | BOOLEAN | ✓ | | Si el paciente reportó algo |
| `descripcionComplicacion` | TEXT | | | Detalle de la complicación |
| `alertasGeneradas` | JSON[] | ✓ | | Alertas automáticas creadas |
| `completado` | BOOLEAN | ✓ | | `false` = pendiente |
| `notificacionWhatsappEnviada` | BOOLEAN | ✓ | | Control de envío |

**Índices:** `pacienteId`, `procedimientoId`, `diaPostOp`, `completado`

---

## `Alerta` — Alertas Clínicas

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | |
| `procedimientoId` | TEXT | | Procedimiento.id | Opcional |
| `tipoAlerta` | TEXT | ✓ | | COMPLICACION / SEGUIMIENTO / ALERGICA / IA |
| `severidad` | TEXT | ✓ | | BAJA / MEDIA / ALTA / CRITICA |
| `descripcion` | TEXT | ✓ | | Descripción del evento |
| `accionRecomendada` | TEXT | ✓ | | Qué hacer ante la alerta |
| `iaDetectada` | BOOLEAN | ✓ | | `true` = detectada automáticamente por IA |
| `resuelta` | BOOLEAN | ✓ | | Estado de resolución |
| `fechaResolucion` | TIMESTAMP | | | Cuándo se resolvió |

**Índices:** `pacienteId`, `severidad`, `resuelta`

---

## `Cita` — Agenda de Citas

| Campo | Tipo | NN | FK | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | | |
| `medicoId` | TEXT | ✓ | User.id | | |
| `tipoCita` | TEXT | ✓ | | | CONSULTA / CONTROL / CIRUGIA / PROCEDIMIENTO |
| `entidadSalud` | TEXT | | | | EPS / aseguradora / PARTICULAR |
| `fechaHora` | TIMESTAMP | ✓ | | | Fecha y hora de la cita |
| `duracionMinutos` | INT | ✓ | | 60 | Duración estimada |
| `estado` | TEXT | ✓ | | `PENDIENTE` | PENDIENTE / CONFIRMADA / COMPLETADA / CANCELADA |
| `motivo` | TEXT | | | | Motivo de la consulta |
| `notas` | TEXT | | | | Observaciones adicionales |
| `recordatorioWhatsapp` | BOOLEAN | ✓ | | false | Si se envía recordatorio |
| `asistencia` | BOOLEAN | | | | Si el paciente asistió (null = no confirmado) |
| `salaQuirofanoId` | TEXT | | ⚠️ TipoConsultorio | | Sala asignada |

**Índices:** `pacienteId`, `medicoId`, `fechaHora`, `estado`

---

## `Transaccion` — Movimientos Económicos

| Campo | Tipo | NN | FK | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | | |
| `procedimientoId` | TEXT | | ⚠️ Procedimiento.id | | Procedimiento relacionado |
| `tipo` | TEXT | ✓ | | | PAGO / ANTICIPO / REEMBOLSO / AJUSTE |
| `concepto` | TEXT | ✓ | | | Descripción del movimiento |
| `monto` | FLOAT | ✓ | | | Valor del movimiento |
| `moneda` | TEXT | ✓ | | `COP` | Divisa |
| `metodoPago` | TEXT | ✓ | | | EFECTIVO / TARJETA / TRANSFERENCIA / DATAFONO |
| `referenciaPago` | TEXT | | | | Número de transacción externa |
| `estado` | TEXT | ✓ | | `PENDIENTE` | PENDIENTE / PROCESADO / FALLIDO |
| `reciboUrl` | TEXT | | | | URL del recibo |
| `creadoPor` | TEXT | ✓ | ⚠️ User.id | | Usuario que registró |

---

## `AuditLog` — Bitácora de Auditoría

| Campo | Tipo | NN | FK | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK |
| `usuarioId` | TEXT | ✓ | User.id | Usuario que ejecutó la operación |
| `tablaAfectada` | TEXT | ✓ | | Nombre de la tabla |
| `registroId` | TEXT | ✓ | | ID del registro modificado |
| `tipoOperacion` | TEXT | ✓ | | INSERT / UPDATE / DELETE / SELECT |
| `datosAntes` | JSON | | | Snapshot del estado anterior |
| `datosDespues` | JSON | | | Snapshot del estado posterior |
| `ipOrigen` | TEXT | | | IP del solicitante |
| `userAgent` | TEXT | | | Navegador/cliente HTTP |
| `razon` | TEXT | | | Justificación de la operación |
| `timestamp` | TIMESTAMP | ✓ | | Momento exacto |

**Índices:** `usuarioId`, `tablaAfectada`, `timestamp`

---

## `ProcedimientoCUPS` — Catálogo Clínico CUPS

| Campo | Tipo | NN | UQ | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `codigoCUPS` | TEXT | ✓ | ✓ | | Código CUPS — clave de enlace con plantillas |
| `nombre` | TEXT | ✓ | | | Nombre del procedimiento |
| `descripcion` | TEXT | | | | |
| `tipoCategoria` | TEXT | ✓ | | | Clasificación clínica interna |
| `riesgoNivel` | TEXT | ✓ | | | BAJO / MEDIO / ALTO |
| `diasSeguimiento` | INT | ✓ | | 30 | Días recomendados de seguimiento |
| `datosAdicionales` | JSON | | | | Metadatos extra del procedimiento |
| `activo` | BOOLEAN | ✓ | | true | |

**Índices:** `codigoCUPS`, `tipoCategoria`, `activo`

---

## `PlantillaTemplate` — Plantillas de HC

| Campo | Tipo | NN | FK | UQ | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | | PK |
| `codigoCUPS` | TEXT | ✓ | ProcedimientoCUPS.codigoCUPS (Cascade) | Compuesto | |
| `nombre` | TEXT | ✓ | | | Nombre de la plantilla |
| `tipo` | TEXT | ✓ | | Compuesto | PREOPERATORIO / INTRAOPERATORIO / POSTOPERATORIO |
| `seccionesJSON` | JSON | ✓ | | | Estructura de secciones del formulario |
| `requiereSignatura` | BOOLEAN | ✓ | | false | |
| `requiereFoto` | BOOLEAN | ✓ | | false | |
| `requiereMapaCorporal` | BOOLEAN | ✓ | | false | |
| `ordenVisualizacion` | INT | ✓ | | 1 | Orden en la UI |
| `activa` | BOOLEAN | ✓ | | true | |
| `creadoPor` | TEXT | | ⚠️ User | | |
| `actualizadoPor` | TEXT | | ⚠️ User | | |

**UNIQUE compuesto:** `(codigoCUPS, tipo)`

---

## `ChecklistTemplate` / `ConsentimientoTemplate`

| Tabla | Campos clave | FK | UNIQUE | Descripción |
|---|---|---|---|---|
| `ChecklistTemplate` | `codigoCUPS`, `fase` (PRE_OP/INTRA_OP/POST_OP), `itemsJSON`, `alertasAutomaticasJSON` | ProcedimientoCUPS (Cascade) | `(codigoCUPS, fase)` | Plantilla de checklist por fase |
| `ConsentimientoTemplate` | `codigoCUPS`, `titulo`, `seccionesJSON`, `riesgosJSON`, `recomendacionesJSON` | ProcedimientoCUPS (Cascade) | `codigoCUPS` (1:1) | Plantilla de consentimiento |

---

## `ConfiguracionSistema` / `ParametroSistema` / `ListaValor`

| Tabla | Descripción | Clave | Valor |
|---|---|---|---|
| `ConfiguracionSistema` | Configuración global JSON | `clave` TEXT UNIQUE | `valor` JSON |
| `ParametroSistema` | Parámetros por grupo/clave | `(grupo, clave)` UNIQUE | `valor` TEXT |
| `ListaValor` | Catálogos tipo lookup | `(grupo, valor)` UNIQUE | `etiqueta` TEXT |

---

## `DisponibilidadMedico` — Horarios del Médico

| Campo | Tipo | NN | FK | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `medicoId` | TEXT | ✓ | User.id (Cascade) | | |
| `diaSemana` | INT | ✓ | | | 0=Dom, 1=Lun, ... 6=Sáb |
| `horaInicio` | TEXT | ✓ | | | Formato HH:MM |
| `horaFin` | TEXT | ✓ | | | Formato HH:MM |
| `duracionSlot` | INT | ✓ | | 60 | Minutos por slot de cita |
| `sede` | TEXT | | | `Principal` | Sede física |
| `tipoAtencion` | TEXT | | | `CONSULTA` | CONSULTA / CIRUGIA / PROCEDIMIENTO |
| `consultorio` | TEXT | | | | Consultorio específico |
| `activo` | BOOLEAN | ✓ | | true | |
| `fechaDesde` | TIMESTAMP | | | | Vigencia del horario |
| `fechaHasta` | TIMESTAMP | | | | Expiración del horario |

---

## `Cotizacion` — Cotizaciones

| Campo | Tipo | NN | FK | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `pacienteId` | TEXT | ✓ | Paciente.id | | |
| `medicoId` | TEXT | ✓ | User.id | | |
| `citaId` | TEXT | | ⚠️ Cita.id | | Cita relacionada |
| `descripcionServicio` | TEXT | ✓ | | | Descripción general |
| `lineas` | JSON | ✓ | | | Array de líneas: `[{servicio, precio, cantidad}]` |
| `subtotal` | FLOAT | ✓ | | | |
| `descuentoPorcentaje` | FLOAT | ✓ | | 0 | % de descuento |
| `descuentoValor` | FLOAT | ✓ | | 0 | Valor absoluto de descuento |
| `total` | FLOAT | ✓ | | | |
| `notasAdicionales` | TEXT | | | | |
| `vigenciaHasta` | TIMESTAMP | ✓ | | | Expiración de la cotización |
| `estado` | TEXT | ✓ | | `GENERADA` | GENERADA / ACEPTADA / RECHAZADA |
| `aceptadaEn` | TIMESTAMP | | | | |
| `rechazadaEn` | TIMESTAMP | | | | |

---

## `CrmLead` — Leads Comerciales

| Campo | Tipo | NN | FK | Defecto | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | cuid() | PK |
| `nombre` | TEXT | ✓ | | | Nombre del prospecto |
| `telefono` | TEXT | | | | |
| `email` | TEXT | | | | |
| `procedimientos` | TEXT[] | ✓ | | | Procedimientos de interés |
| `etapa` | TEXT | ✓ | | `NUEVO_LEAD` | Pipeline: NUEVO_LEAD / CONTACTADO / AGENDA_CITA / CONVIRTIO |
| `calificacion` | TEXT | ✓ | | `COLD` | COLD / WARM / HOT |
| `valorEstimado` | FLOAT | ✓ | | 0 | Valor potencial en COP |
| `origen` | TEXT | | | | INSTAGRAM / REFERIDO / WEB / LLAMADA |
| `notas` | TEXT | | | | |
| `tags` | TEXT[] | ✓ | | | Etiquetas |
| `pacienteId` | TEXT | | Paciente.id | | Se llena al convertir el lead |
| `creadoPor` | TEXT | | User.id | | |
| `proximoContacto` | TIMESTAMP | | | | Fecha de próximo seguimiento |
| `ultimaInteraccion` | TIMESTAMP | | | | |

---

## `CupsCodigo` — Catálogo Oficial CUPS Res. 2706/2025

**Descripción:** Catálogo jerárquico oficial de procedimientos en salud de Colombia.

| Campo | Tipo | NN | UQ | Descripción |
|---|---|---|---|---|
| `id` | TEXT | ✓ | | PK CUID |
| `codigo` | TEXT | ✓ | ✓ | Código sin separadores: `"010101"` |
| `codigoFormato` | TEXT | ✓ | | Con separadores: `"01.0.1.01"` |
| `nivel` | CupsNivel | ✓ | | GRUPO / SUBGRUPO / CATEGORIA / SUBCATEGORIA |
| `descripcion` | TEXT | ✓ | | Nombre del procedimiento |
| `seccion` | TEXT | ✓ | | `"00"` quirúrgicos / `"01"` no quirúrgicos |
| `capitulo` | TEXT | ✓ | | `"01"` hasta `"24"` |
| `grupo` | TEXT | ✓ | | 2 caracteres |
| `subgrupo` | TEXT | | | 1 carácter |
| `categoria` | TEXT | | | 1 carácter |
| `subcategoria` | TEXT | | | 2 caracteres — nivel facturable |
| `parentId` | TEXT | | | Auto-relación FK → CupsCodigo.id (Cascade) |
| `incluye` | TEXT | | | Nota "incluye" de la lista tabular |
| `excluye` | TEXT | | | Nota "excluye" |
| `nota` | TEXT | | | Notas adicionales |
| `esFacturable` | BOOLEAN | ✓ | | Solo `true` en nivel SUBCATEGORIA |
| `activo` | BOOLEAN | ✓ | | |
| `version` | TEXT | ✓ | | `"Resolución 2706 de 2025"` |

**Índices:** `nivel`, `seccion`, `capitulo`, `grupo`, `parentId`, `esFacturable`, `activo`

---

## `TarifaGrupo` / `TarifaTipo` / `TarifaCargo` / `Tarifario` / `TarifaItem`

### `TarifaGrupo`
| Campo | Descripción |
|---|---|
| `id` | PK CUID |
| `codigo` | UNIQUE — código del grupo (ej. CONSULTA, PROCEDIMIENTO) |
| `nombre` | Nombre visible |
| `activo` | Estado |

### `TarifaTipo`
| Campo | Descripción |
|---|---|
| `id` | PK CUID |
| `grupoId` | FK → TarifaGrupo.id (Cascade) |
| `codigo` | UNIQUE dentro del grupo |
| `nombre` | Nombre visible |
| `activo` | Estado |

**UNIQUE:** `(grupoId, codigo)`

### `TarifaCargo`
| Campo | Tipo | NN | FK | UQ | Descripción |
|---|---|---|---|---|---|
| `id` | TEXT | ✓ | | | PK CUID |
| `codigo` | TEXT | ✓ | | ✓ | Código interno único de la clínica |
| `descripcion` | TEXT | ✓ | | | Nombre del cargo |
| `cupsCodigoId` | TEXT | | CupsCodigo.id | | Equivalencia con CUPS oficial |
| `cupsCodigoStr` | TEXT | | | | Código CUPS sin puntos para búsqueda |
| `grupoId` | TEXT | | TarifaGrupo.id | | |
| `tipoId` | TEXT | | TarifaTipo.id | | |
| `nivel` | TEXT | | | | Nivel de complejidad |
| `tipoUnidad` | TEXT | | | | Unidad de medida |
| `conceptoRips` | TEXT | | | | Para reporte RIPS |
| `activo` | BOOLEAN | ✓ | | | |

### `Tarifario`
| Campo | Descripción |
|---|---|
| `id` / `codigo` UNIQUE | PK / código único |
| `tipo` | PARTICULAR / EPS / SOAT / PREPAGADA |
| `baseId` | FK auto-relacional → Tarifario.id (derivación) |
| `porcentaje` | % aplicado sobre el tarifario base |
| `vigenciaDesde` / `vigenciaHasta` | Período de vigencia |

### `TarifaItem`
| Campo | Descripción |
|---|---|
| `tarifarioId` | FK → Tarifario.id (Cascade) |
| `cargoId` | FK → TarifaCargo.id (Cascade) |
| `precio` | Precio del cargo en este tarifario |

**UNIQUE:** `(tarifarioId, cargoId)`

---

## `Ingreso` / `Cuenta` / `CuentaItem` / `Factura`

### `Ingreso` — Admisión del Paciente
| Campo | Tipo | Descripción |
|---|---|---|
| `numero` | INT autoincrement | Número visible de ingreso |
| `pacienteId` | FK → Paciente | |
| `citaId` | FK → Cita (origen) | |
| `medicoId` | FK → User | |
| `tipoIngreso` | TEXT | AMBULATORIO / HOSPITALARIO / URGENCIAS |
| `entidad` | TEXT | EPS/aseguradora responsable |
| `estado` | TEXT | ACTIVO / CERRADO / ANULADO |
| `fechaIngreso` | TIMESTAMP | |
| `fechaEgreso` | TIMESTAMP | Cuando se cerró |

### `Cuenta` — Documento de Cargos
| Campo | Descripción |
|---|---|
| `numero` | INT autoincrement |
| `ingresoId` | FK → Ingreso (Cascade) |
| `estado` | ABIERTA → FACTURADA / ANULADA |

### `CuentaItem` — Línea de Cargo
| Campo | Descripción |
|---|---|
| `cuentaId` | FK → Cuenta (Cascade) |
| `cargoId` | FK → TarifaCargo (nullable) |
| `codigo` | Snapshot del código al momento |
| `descripcion` | Texto del servicio |
| `departamento` | ASISTENCIAL / LABORATORIO / IMAGENOLOGIA |
| `cantidad` | Float (puede ser fraccionario) |
| `precioUnitario` | Precio por unidad |
| `valorTotal` | `cantidad × precioUnitario` |

### `Factura` — Factura Electrónica
| Campo | Descripción |
|---|---|
| `numero` | INT autoincrement |
| `prefijo` | `"FE"` (Factura Electrónica) |
| `cuentaId` | FK → Cuenta (UNIQUE — relación 1:1) |
| `pacienteId` | FK → Paciente |
| `subtotal` | Sin impuestos |
| `total` | Total final |
| `estado` | EMITIDA → PAGADA / ANULADA |
| `fecha` | Fecha de emisión |

---

## Módulo Odontología

### `OdontoHallazgo` — Catálogo de Hallazgos
| Campo | Descripción |
|---|---|
| `codigo` UNIQUE | Código del hallazgo |
| `nombre` | Nombre (caries, fractura, ausente, corona...) |
| `color` | Hex para representación visual |
| `icono` | Nombre de icono Lucide |
| `generaTratamiento` | Si genera automáticamente ítem en el plan |
| `prioridadDefault` | Código de OdontoPrioridad sugerida |
| `categoria` | PATOLOGIA / RESTAURACION / PROTESIS / ENDODONCIA / PERIODONCIA |

### `OdontoEstado` / `OdontoPrioridad` / `OdontoRiesgo`
Catálogos con: `codigo` UNIQUE, `nombre`, `color` (hex), `orden`, `activo`.

- **OdontoPrioridad** añade: `nivel` (INT — mayor = más urgente)
- **OdontoRiesgo** se usa en `Odontograma.riesgoId`

### `Odontograma` — Odontograma del Paciente
| Campo | Descripción |
|---|---|
| `pacienteId` | FK → Paciente (Cascade) |
| `medicoId` | FK → User |
| `historiaClinicaId` | ⚠️ Inferida → HistoriaClinica |
| `citaId` | ⚠️ Inferida → Cita |
| `tipo` | PRIMERA_VEZ / TRATAMIENTO |
| `denticion` | PERMANENTE / TEMPORAL / MIXTA |
| `estado` | EN_PROCESO / FINALIZADO / ARCHIVADO |
| `hallazgosGenerales` | JSON: higiene oral, periodontal, oclusión, ATM |
| `estetica` | JSON: sonrisa, color, alineación |
| `resumenIA` | Resumen generado/asistido por SARAI |
| `riesgoId` | FK → OdontoRiesgo |
| `firmado` | Firma del odontólogo |
| `hashIntegridad` | SHA del registro |

### `OdontoPiezaHallazgo` — Hallazgo por Pieza
| Campo | Descripción |
|---|---|
| `odontogramaId` | FK → Odontograma (Cascade) |
| `diente` | Numeración FDI: 11–48 permanente / 51–85 temporal |
| `superficie` | VESTIBULAR / LINGUAL / PALATINA / MESIAL / DISTAL / OCLUSAL / INCISAL / NULL (pieza completa) |
| `hallazgoId` | FK → OdontoHallazgo |
| `estadoId` | FK → OdontoEstado (opcional) |
| `colorOverride` | Color personalizado para este hallazgo específico |

### `OdontoPlanItem` — Plan de Tratamiento
| Campo | Descripción |
|---|---|
| `odontogramaId` | FK → Odontograma (Cascade) |
| `pacienteId` | FK → Paciente (Cascade) |
| `diente` / `superficie` | Pieza/superficie afectada |
| `hallazgoId` | FK → OdontoHallazgo |
| `diagnostico` | Diagnóstico del ítem |
| `cargoId` | FK → TarifaCargo (integración facturación) |
| `codigoCups` | Código CUPS snapshot |
| `descripcionProcedimiento` | Texto del procedimiento |
| `prioridadId` | FK → OdontoPrioridad |
| `estadoTratamiento` | PLANEADO / AGENDADO / EN_TRATAMIENTO / FINALIZADO / SUSPENDIDO / CANCELADO |
| `medicoId` | ⚠️ Inferida → User |
| `precio` | Precio del tratamiento |
| `facturado` | BOOLEAN — previene facturación duplicada |
| `cuentaItemId` | ⚠️ Inferida → CuentaItem (integración facturación) |
| `orden` | Orden de ejecución |

### `OdontoEvolucion` — Línea de Tiempo
| Campo | Descripción |
|---|---|
| `odontogramaId` | FK → Odontograma (Cascade) |
| `pacienteId` | FK → Paciente (Cascade) |
| `planItemId` | ⚠️ Inferida → OdontoPlanItem |
| `medicoId` | ⚠️ Inferida → User |
| `tipo` | VALORACION / PLANIFICACION / PROCEDIMIENTO / CONTROL / ALTA / NOTA |
| `descripcion` | Texto de la evolución |
| `fecha` | Fecha del evento |

---

## `Cargo` / `Departamento` / `DepartamentoCargo`

### `Cargo` — Catálogo Legacy de Cargos
| Campo | Descripción |
|---|---|
| `codigo` UNIQUE | Código interno |
| `tipo` | CONSULTA / PROCEDIMIENTO / MEDICAMENTO / INSUMO |
| `valor` | Precio base |
| `aplicaIva` / `tasaIva` | Configuración de IVA |
| `aplicaPYP` | Aplica a Promoción y Prevención |

### `Departamento` — Departamentos
| Campo | Descripción |
|---|---|
| `codigo` UNIQUE | Código del departamento |
| `nombre` | ASISTENCIAL / LABORATORIO / IMAGENOLOGIA / FARMACIA... |

### `DepartamentoCargo` — Tabla Puente
UNIQUE `(departamentoId, cargoId)`. Contiene 9 flags booleanos de reglas de negocio:
`permiteSeleccion`, `manejaInsumos`, `cumplimientoAutomatico`, `tomadoAutomatico`, `interfaceExterno`, `generaOrden`, `liquidaHonorarios`, `cumplimientoParcial`, `manejaCentroCosto`

---

## `TipoConsulta` — Tipo de Consulta Médica

**Descripción:** 19 campos que definen completamente cómo se comporta un tipo de consulta.

| Grupo | Campos |
|---|---|
| **Identificación** | `id`, `nombre`, `descripcion`, `clasificacion` |
| **Relaciones** | `especialidadId`, `departamentoId`, `hcModuloId` |
| **Agenda** | `permiteAgendamiento`, `controlaTiempoCita`, `duracionMinutos` |
| **Clínico** | `abreHistoriaClinica`, `manejaAnestesia`, `manejaProtocolos`, `esPsicologia` |
| **Facturación** | `requiereCaja`, `permiteCargosAdicionales`, `bodegaId` |
| **Especial** | `esProgramaPYP` (Promoción y Prevención) |

---

*Anterior: [DB_02_MODELO_ER.md](./DB_02_MODELO_ER.md) | Siguiente: [DB_04_ARQUITECTURA_MODULOS.md](./DB_04_ARQUITECTURA_MODULOS.md)*
