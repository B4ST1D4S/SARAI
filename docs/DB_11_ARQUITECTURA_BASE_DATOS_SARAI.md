# DB_11 – Arquitectura de Base de Datos de SARAI

**Sistema:** SARAI  
**Motor:** PostgreSQL  
**ORM:** Prisma  
**Fuente principal:** `backend/prisma/schema.prisma`  
**Fecha de análisis:** 2026-08-27

---

## 1. Visión general

SARAI está implementado como un sistema de información clínico-empresarial con base de datos relacional en PostgreSQL. La arquitectura está organizada por dominios funcionales y la mayoría de las tablas están conectadas por llaves foráneas (`*_Id`) y relaciones explícitas definidas con Prisma.

La estructura sigue un patrón moderno de diseño de datos:

- `User` como núcleo de identidad y acceso
- `Paciente` como entidad central del flujo clínico
- `Procedimiento` como eje de atención médica
- `HistoriaClinica`, `Consentimiento`, `FotoClinica`, `MapaCorporal` y `SeguimientoPostOp` como base de documentación clínica
- `Cita`, `DisponibilidadMedico` y `BloqueDisponibilidad` para agenda
- `Cotizacion`, `Ingreso`, `Cuenta`, `Factura` para negocio y facturación
- `Perfil`, `IamRol`, `Grupo`, `PermisoRecurso`, `DelegacionTemporal` para seguridad y autorización
- `AuditLog` y `EventoSeguridad` para trazabilidad y auditoría

---

## 2. Convención de nombres utilizada

SARAI usa una convención consistente de nombres en Prisma:

- Los modelos se escriben en `PascalCase`: `User`, `Paciente`, `HistoriaClinica`, `Procedimiento`
- Los campos se escriben en `camelCase`: `numeroDocumento`, `fechaNacimiento`, `createdAt`, `empresaId`
- Las llaves foráneas siguen la convención `nombreEntidadId`: `pacienteId`, `medicoId`, `procedimientoId`, `empresaId`, `sedeId`
- Las relaciones con múltiples conexiones hacia la misma tabla usan alias con `@relation(...)` para evitar ambigüedad

Ejemplo:

```prisma
model User {
  id String @id @default(cuid())
  email String? @unique
  password String
  nombre String
  apellido String
  rol Role @default(RECEPCIONISTA)
  empresaId String?
  sedeId String?
  citasAsignadas Cita[]
}
```

Esto significa que:

- `empresaId` apunta a la empresa de ese usuario
- `citasAsignadas` es una relación inversa a la tabla `Cita`
- `Role` es un enum que define el tipo de rol del usuario

---

## 3. Arquitectura lógica por capas

### 3.1 Capa de identidad y acceso

Tablas clave:

- `User`
- `Empresa`
- `Sede`
- `Perfil`
- `IamRol`
- `Grupo`
- `GrupoUsuario`
- `UsuarioIamRol`
- `PerfilIamRol`
- `RecursoSistema`
- `PermisoRecurso`
- `DelegacionTemporal`
- `MfaConfig`
- `SesionActiva`
- `DispositivoAutorizado`
- `PoliticaSeguridad`
- `EventoSeguridad`

Objetivo:

- Autenticar usuarios
- Controlar permisos por empresa, sede, perfil y rol
- Resolver permisos con reglas de prioridad
- Soportar MFA, sesiones activas, delegación temporal y auditoría de seguridad

La lógica de autorización está implementada en `backend/src/controllers/iamController.ts` con algoritmo de precedencia de permisos.

### 3.2 Capa clínica central

Tablas clave:

- `Paciente`
- `Procedimiento`
- `HistoriaClinica`
- `Consentimiento`
- `FotoClinica`
- `MapaCorporal`
- `SeguimientoPostOp`
- `Alerta`
- `ChecklistCompletado`
- `ChecklistTemplate`
- `PlantillaTemplate`
- `ConsentimientoTemplate`
- `ProcedimientoCUPS`

Objetivo:

- Registrar pacientes y su información base
- Crear procedimientos clínicos
- Mantener historia clínica y evolución del caso
- Generar consentimientos informados con firma y trazabilidad
- Guardar fotos clínicas, mapas corporales y seguimiento postoperatorio
- Activar alertas y checklist de seguridad

### 3.3 Capa de agenda y atención

Tablas clave:

- `Cita`
- `DisponibilidadMedico`
- `BloqueDisponibilidad`
- `MotivoCita`
- `TipoConsulta`
- `TipoConsultorio`
- `Preparacion`
- `ReglaOperativa`

Objetivo:

- Administrar agenda de médicos y disponibilidad
- Crear citas por paciente y médico
- Bloquear horarios o tiempos no disponibles
- Programar atención y controlar flujo clínico

### 3.4 Capa financiera y comercial

Tablas clave:

- `Cotizacion`
- `Ingreso`
- `Cuenta`
- `CuentaItem`
- `Factura`
- `Transaccion`
- `TarifaGrupo`
- `TarifaTipo`
- `TarifaCargo`
- `Tarifario`
- `TarifaItem`
- `Contrato`
- `ContratoTarifa`
- `ContratoExcepcion`
- `ContratoPaquete`
- `ContratoPaqueteItem`
- `ContratoBeneficiario`
- `EmpresaContratante`

Objetivo:

- Generar cotizaciones clínicas
- Registrar ingresos y pagos
- Facturar servicios médicos
- Gestionar contratos, tarifas y paquetes con empresas y beneficiarios

### 3.5 Capa de configuración, catálogo y plantillas

Tablas clave:

- `Especialidad`
- `Departamento`
- `Cargo`
- `DepartamentoCargo`
- `ServicioFacturable`
- `ListaValor`
- `ParametroSistema`
- `ConfiguracionSistema`
- `ConfigServicioConsulta`
- `CupsCodigo`
- `TarifaGrupo`
- `PlantillaProcedimiento`
- `PlantillaTemplate`
- `ChecklistTemplate`
- `ConsentimientoTemplate`

Objetivo:

- Permitir personalización del sistema
- Configurar especialidades, tipos de consulta, servicios y tarifas
- Definir protocolos, CUPs, templates y checklist de procedimientos

### 3.6 Capa de auditoría y trazabilidad

Tablas clave:

- `AuditLog`
- `AuditAcceso`
- `AuditCambio`
- `EventoSeguridad`
- `ConfiguracionSistema`

Objetivo:

- Guardar cambios importantes sobre registros
- Trazar quién hizo qué y cuándo
- Registrar eventos de seguridad y accesos del sistema

---

## 4. Tablas centrales y su rol en la arquitectura

### 4.1 `User`

Es la tabla de identidad del sistema.

Campos relevantes:

- `id`
- `email`
- `password`
- `nombre`
- `apellido`
- `rol`
- `empresaId`
- `perfilId`
- `sedeId`
- `activo`
- `createdAt`
- `updatedAt`

Relaciones principales:

- Un usuario puede pertenecer a una `Empresa`
- Un usuario puede pertenecer a una `Sede`
- Un usuario puede tener un `Perfil`
- Un usuario puede tener muchos `Cita`
- Un usuario puede tener muchos `AuditLog`
- Un usuario puede generar o editar historias clínicas

### 4.2 `Paciente`

Es la entidad principal del flujo clínico.

Campos relevantes:

- `id`
- `numeroDocumento`
- `tipoDocumento`
- `nombreCompleto`
- `fechaNacimiento`
- `genero`
- `telefonos`
- `email`
- `whatsapp`
- `direccion`
- `estado`
- `creadoPor`

Relaciones principales:

- Tiene muchas `Alergia`
- Tiene muchas `Medicamento`
- Tiene muchos `AntecedentesQuirurgicos`
- Tiene muchas `Cita`
- Tiene muchas `HistoriaClinica`
- Tiene muchas `Consentimiento`
- Tiene muchas `FotoClinica`
- Tiene muchos `MapaCorporal`
- Tiene muchos `SeguimientoPostOp`
- Tiene muchas `Transaccion`

La clave natural del paciente es la combinación:

```text
(numeroDocumento, tipoDocumento)
```

y esa combinación está marcada como `@unique`.

### 4.3 `Procedimiento`

Es la entidad clínica que describe el tratamiento o intervención ejecutada o programada.

Campos relevantes:

- `pacienteId`
- `medicoId`
- `tipoProcedimiento`
- `nombreProcedimiento`
- `fechaProgramada`
- `fechaRealizada`
- `duracionEstimada`
- `estado`
- `codigoCUPS`

Relaciones principales:

- Un procedimiento pertenece a un `Paciente`
- Un procedimiento es asignado a un `User` médico
- Tiene muchas `HistoriaClinica`
- Tiene muchos `Consentimiento`
- Tiene muchos `FotoClinica`
- Tiene muchos `SeguimientoPostOp`
- Tiene muchas `Alerta`
- Tiene muchos `ChecklistCompletado`

### 4.4 `HistoriaClinica`

Es el registro clínico principal y una de las entidades más críticas del sistema.

Campos relevantes:

- `pacienteId`
- `procedimientoId`
- `tipoHistoria`
- `contenido` (JSON)
- `version`
- `editadoPor`
- `fechaCreacion`
- `fechaUltimaEdicion`
- `firmadoPorMedico`
- `fechaFirma`
- `hashIntegridad`
- `plantillaId`

Esto permite:

- guardar contenido clínico dinámico en formato JSON
- registrar múltiples versiones de la historia
- verificar integridad del documento clínico
- vincular la historia a un procedimiento y a una plantilla

### 4.5 `Consentimiento`

Se encarga de documentar la aceptación del procedimiento por parte del paciente.

Campos relevantes:

- `pacienteId`
- `procedimientoId`
- `plantillaId`
- `contenidoHtml`
- `contenidoPdfUrl`
- `firmaDigitalUrl`
- `selfieUrl`
- `fechaFirma`
- `firmado`
- `hashIntegridad`
- `geolocation`

Esto da soporte a una firma informada con evidencias legales y trazabilidad.

### 4.6 `Cita`

Es la entidad de programación.

Campos relevantes:

- `pacienteId`
- `medicoId`
- `tipoCita`
- `fechaHora`
- `duracionMinutos`
- `estado`
- `motivo`
- `notas`
- `recordatorioWhatsapp`
- `asistencia`

Relaciones principales:

- Muchos pacientes tienen muchas citas
- Cada cita pertenece a un médico
- Cada cita puede generar ingresos o registros de facturación

### 4.7 `AuditLog`

Es la tabla de auditoría central.

Campos relevantes:

- `usuarioId`
- `tablaAfectada`
- `registroId`
- `tipoOperacion`
- `datosAntes`
- `datosDespues`
- `ipOrigen`
- `userAgent`
- `timestamp`

Esto permite rastrear:

- quién modificó qué
- antes y después de cada cambio
- desde qué IP y navegador
- motivo o información relacionada

---

## 5. Relaciones de negocio más importantes

### 5.1 Usuario → Empresa / Sede / Perfil

```text
User ──> Empresa
User ──> Sede
User ──> Perfil
```

Esto permite segmentar acceso por organización y centro médico.

### 5.2 Paciente → Procedimiento → Historia Clínica

```text
Paciente ──> Procedimiento ──> HistoriaClinica
      │                           │
      ├── Consentimiento          ├── ChecklistCompletado
      ├── FotoClinica            ├── Alerta
      ├── MapaCorporal           ├── SeguimientoPostOp
      └── Transaccion
```

Esto representa la base del flujo clínico del paciente.

### 5.3 Seguridad / permisos

```text
User ──> UsuarioIamRol ──> IamRol
User ──> GrupoUsuario ──> Grupo
User ──> PermisoRecurso
Perfil ──> PermisoRecurso
IamRol ──> PermisoRecurso
Grupo ──> PermisoRecurso
RecursoSistema ──> PermisoRecurso
```

Esto permite resolver permisos por perfil, rol, grupo y acceso directo.

### 5.4 Agenda / flujo de atención

```text
Medico (User) ──> DisponibilidadMedico ──> BloqueDisponibilidad
      │
      └──> Cita ──> Paciente
```

### 5.5 Facturación y negocio

```text
Paciente ──> Cita ──> Ingreso ──> Factura
                 │
                 └──> Cotizacion
```

---

## 6. Tipos de relaciones dentro de Prisma

La base de datos usa varios tipos de asociaciones:

### 6.1 Uno a muchos

Ejemplo:

- `Paciente` tiene muchos `Cita`
- `Paciente` tiene muchas `HistoriaClinica`
- `User` tiene muchas `AuditLog`

### 6.2 Muchos a muchos a través de tablas puente

Ejemplo:

- `UsuarioIamRol`
- `PerfilIamRol`
- `GrupoUsuario`

Estas tablas permiten conectar entidades muchas a muchas sin mezclar todo en una sola tabla.

### 6.3 Uno a uno opcional

Ejemplo:

- `User` puede tener `MfaConfig?`
- `User` puede tener `SesionActiva[]`

### 6.4 Dependencias con cascada y soft-delete implícito

En varios modelos se usa `onDelete: Cascade` o relaciones directas con registros dependientes. Eso significa que si el registro principal se borra, los hijos pueden borrarse también, lo cual es útil para mantener integridad referencial.

---

## 7. Entidades especializadas y módulos menos visibles

Además de las tablas centrales, SARAI tiene entidades muy específicas para módulos avanzados, por ejemplo:

- `Odontograma`, `OdontoPlanItem`, `OdontoEvolucion`, `OdontoHallazgo`
- `ProgramaEspecial`, `InscripcionPrograma`
- `HistoriaClinicaRenal`, `AccesoVascular`, `MaquinaDialisis`, `SesionHemodialisis`, `LaboratorioRenal`
- `TamizajePE`, `ConfiguracionPE`, `TurnoHD`, `ResultadoSerologico`

Esto indica que el sistema no solo cubre estética/consulta general; también cuenta con módulos especializados, probablemente para áreas de programa especial o medicina renal.

---

## 8. Fortalezas de la arquitectura actual

1. Separación clara por dominios
   - Seguridad, pacientes, clínica, agenda, facturación, auditoría

2. Modelo robusto y escalable
   - Prisma + PostgreSQL ofrece buena estructura relacional con migraciones

3. Soporte multiempresa y multisede
   - `empresaId` y `sedeId` están presentes en varios modelos

4. Alta trazabilidad clínica
   - `HistoriaClinica`, `Consentimiento`, `AuditLog`, `hashIntegridad`

5. Seguridad avanzada
   - IAM robusto, permisos temporales, delegación temporal, roles, grupos y perfiles

6. Flexibilidad mediante JSON
   - `contenido`, `seccionesJSON`, `itemsJSON`, `geolocation`, etc.

---

## 9. Riesgos y observaciones de arquitectura

Aunque la estructura es muy sólida, hay varios puntos que merece revisar en producción:

### 9.1 Uso intensivo de JSON

Muchos campos hoy están como `Json`, por ejemplo:

- `HistoriaClinica.contenido`
- `PlantillaTemplate.seccionesJSON`
- `ChecklistTemplate.itemsJSON`
- `Consentimiento.geolocation`

Esto da flexibilidad, pero puede afectar:

- consultas analíticas complejas
- validación estricta de datos
- performance en reportes y búsquedas

### 9.2 Muchos campos tipo `String` usados como estado o tipo

Por ejemplo:

- `estado`
- `tipoCita`
- `tipoHistoria`
- `severidad`

Estos deberían preferiblemente manejarse con `enum` o validación en base de datos para evitar inconsistencias.

### 9.3 Auditoría potencialmente voluminosa

`AuditLog` puede crecer rápidamente si se registra cada cambio sin política de retención o archivado.

### 9.4 Permisos en tiempo real

La resolución de permisos podría requerir optimización si se ejecuta en cada request con muchas joins y consultas. Se recomienda cacheo o permisos efectivos precomputados.

### 9.5 Archivos y documentos

Se está usando almacenamiento por URL (`firmaDigitalUrl`, `selfieUrl`, `contenidoPdfUrl`, `urlOriginal`, `urlComprimida`), lo cual es correcto, pero debería reforzarse con:

- signed URLs
- almacenamiento seguro (S3 o equivalente)
- cifrado
- política de acceso por rol y paciente

---

## 10. Conclusión

La base de datos de SARAI está bien estructurada como un sistema clínico empresarial, con una sólida separación de dominios y una arquitectura orientada a la seguridad, trazabilidad y atención médica.

La base actual tiene estas cualidades principales:

- Multiempresa y multisede
- Control de acceso por perfiles, roles y grupos
- Paciente como centro del flujo clínico
- Historia clínica y consentimientos con trazabilidad
- Agenda y facturación integradas
- Auditoría y seguridad bien pensadas

La principal recomendación es mantener la arquitectura y reforzar los puntos de administración de datos: validación de enums, mejor control de JSON, política de retención de auditoría, cifrado de archivos y optimización de permisos.

---

## 11. Archivos relevantes del proyecto

- `backend/prisma/schema.prisma` — definición completa del modelo de datos
- `backend/src/controllers/iamController.ts` — lógica de permisos y autorización
- `backend/src/middleware/auth.ts` — middleware de autenticación
- `backend/src/utils/jwt.ts` — generación y validación de tokens

---

## 12. Resumen ejecutivo en una línea

SARAI está diseñado como una base de datos relacional clínica y empresarial robusta, con `User` y `Paciente` como ejes principales, `Procedimiento` como centro de atención, `HistoriaClinica` y `Consentimiento` como evidencia clínica, y `PermisoRecurso` + `AuditLog` como pilares de seguridad y trazabilidad.
