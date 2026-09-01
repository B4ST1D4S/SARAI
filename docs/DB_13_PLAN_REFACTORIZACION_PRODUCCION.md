# DB_13 – Plan de Refactorización para Producción de SARAI

**Sistema:** SARAI  
**Fecha:** 2026-08-27  
**Objetivo:** convertir la arquitectura actual en una solución robusta para producción, priorizando seguridad, integridad de datos, performance y mantenibilidad.

---

## 1. Visión general

SARAI ya tiene una base sólida y bien estructurada. El sistema está diseñado con una lógica de dominio clara, roles y permisos robustos, trazabilidad clínica y soporte multiempresa/multisede.

El problema principal no es que “falta funcionalidad”, sino que la arquitectura necesita endurecerse para operar en producción con datos clínicos sensibles, alta concurrencia, auditoría prolongada, archivos críticos y reglas de negocio complejas.

La estrategia recomendada es refactorizar por módulos priorizados, no “romper” la estructura, sino reforzarla en capas.

---

## 2. Prioridad de intervención

### Prioridad 0 – Bloqueantes de producción

1. Secretos y configuración segura
2. Validación de estado y enumeraciones
3. Protección de archivos y documentos clínicos
4. Retención y limpieza de auditoría
5. Caching de permisos y acceso

### Prioridad 1 – Críticos para estabilidad

6. Normalización de JSON crítico
7. Transacciones en flujos clínicos complejos
8. Validación y consistencia de datos en procesos de atención
9. Test de integración clave del negocio

### Prioridad 2 – Mejora operativa

10. Monitoreo de performance y query plan
11. Archivos y reportes por módulos
12. Mantenimiento de migraciones y rollout seguro

---

## 3. Plan por módulos

## Módulo 1 – Seguridad y autenticación

**Archivos base relevantes:**
- `backend/src/middleware/auth.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/controllers/iamController.ts`

### Estado actual

- IAM completo
- perfiles, roles, grupos, permisos directos
- permisos temporales y delegaciones
- algoritmo de precedencia bien definido

### Problemas

- JWT tiene fallback inseguro
- permisos resueltos con varias consultas por request
- falta cache de permisos para producción
- no hay separación clara de secretos por ambiente

### Refactorización recomendada

1. Eliminar fallback inseguro en JWT y refresh secret
2. Validar presencia de variables de entorno al arrancar
3. Usar secret manager externo
4. Implementar Redis para permisos efectivos
5. Revisar lógica de resolución para reducir consultas redundantes
6. Añadir pruebas para intercambio de token, refresh y expiración

### Resultado esperado

- acceso seguro y predecible
- mejor latencia en endpoints protegidos
- cumplimiento mínimo para producción

---

## Módulo 2 – Datos de usuarios, empresas y sedes

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`
- `backend/src/controllers/iamController.ts`

### Estado actual

- estructura multiempresa y multisede bien planteada
- relación clara de `User` ↔ `Empresa` / `Sede` / `Perfil`

### Problemas

- muchos campos todavía basados en String sin validación estricta
- riesgo de inconsistencia si se crean usuarios sin validación de empresa/sede/rol

### Refactorización recomendada

1. Definir enums para `rol`, `estado`, `tipoDocumento`, etc.
2. Agregar validaciones en backend para combinación empresa/sede/rol
3. Garantizar que todos los usuarios activos tengan empresa y sede válidas
4. Revisar si `empresaId`, `perfilId`, `sedeId` deben ser obligatorios en ciertos perfiles

### Resultado esperado

- integridad del modelo de identidad mejorada
- menor posibilidad de datos incoherentes

---

## Módulo 3 – Pacientes y flujo clínico base

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`

### Estado actual

- `Paciente` es una entidad central muy bien modelada
- relaciones con alergias, medicamentos, antecedentes, citas, historia clínica, fotos, consentimientos, seguimientos

### Problemas

- el paciente es la entidad clave y puede convertirse en un “agujero” si se permite demasiada flexibilidad sin validación
- algunos campos en arrays y JSON no están normalizados

### Refactorización recomendada

1. Normalizar teléfonos y contactos en tabla separada si se requieren búsquedas
2. Revisar campos `telefonos` como `String[]` y evaluar si deben estar en tabla de contacto
3. Validar `estado` del paciente con enum
4. Garantizar transacciones para creación con datos clínicos complementarios

### Resultado esperado

- paciente más estable y consistente
- mejor búsqueda, tratamiento y trazabilidad

---

## Módulo 4 – Procedimientos y atención clínica

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`

### Estado actual

- `Procedimiento` está bien modelado y conectado a paciente, médico, historia clínica, consentimientos, alertas y seguimiento

### Problemas

- estados de procedimiento como strings abiertos
- flujos críticos sin transacción explícita
- riesgo de inconsistencia si falla la creación de HC o checklist

### Refactorización recomendada

1. Definir enum para `estado` de procedimiento
2. Usar transacciones para crear procedimiento + historial + consentimientos + checklists
3. Validar `codigoCUPS` y relaciones con `ProcedimientoCUPS`
4. Añadir validación de duraciones y fechas

### Resultado esperado

- flujo clínico más estable y seguro
- menos errores de consistencia entre registros

---

## Módulo 5 – Historia clínica y consentimiento

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`

### Estado actual

- este es un punto fuerte del sistema
- existe versionado, firma, hash de integridad y trazabilidad

### Problemas

- `contenido` y otros campos JSON pueden volverse difíciles de consultar y validar
- la lógica de “inmutabilidad” no siempre está reforzada de forma produccional
- el procedimiento de firma podría ser frágil si no hay validación transaccional

### Refactorización recomendada

1. Mantener hash de integridad, pero reforzar validación automática al guardar
2. Establecer política: cada edición genera nueva versión y firma nueva
3. Mover datos altamente consultados a esquema estructurado
4. Añadir tests de integridad para el hash y versión
5. Definir una regla de “solo lectura una vez firmada” salvo roles específicos

### Resultado esperado

- evidencia clínica más robusta
- menor riesgo legal y operativo
- mejor trazabilidad y auditoría

---

## Módulo 6 – Agenda y disponibilidad

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`

### Estado actual

- `Cita`, `DisponibilidadMedico` y `BloqueDisponibilidad` son una buena base

### Problemas

- los estados de cita y la validación del tiempo pueden ser frágiles si no hay checks estrictos
- riesgo de citas duplicadas o conflicto de horarios si la lógica de disponibilidad no está bien protegida

### Refactorización recomendada

1. Definir enum para estados de cita
2. Crear validaciones de horario en la capa de negocio y en DB
3. Aplicar transacciones para reservo de horario y creación de cita
4. Revisar posibles casos de conflicto de agenda por médico + fecha + horario
5. Añadir pruebas de conflicto de citas y disponibilidad

### Resultado esperado

- agenda más confiable
- menos errores de disponibilidad y duplicidad

---

## Módulo 7 – Facturación, contratos y pagos

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`

### Estado actual

- existe un modelo sólido para cotizaciones, cuentas, facturas y transacciones

### Problemas

- flujo de pagos y facturación exige consistencia transaccional muy estricta
- si una operación de facturación falla, podría quedar un valor sin cobertura

### Refactorización recomendada

1. Centralizar validaciones de monto, moneda, estado y referencia de pago
2. Envolver operaciones de facturación en transacciones
3. Definir enum para `tipo`, `estado`, `metodoPago`
4. Guardar pagos con idempotencia por referencia de pago
5. Definir retención mínima de recibos y transacciones

### Resultado esperado

- menos inconsistencias contables
- mejor trazabilidad financiera y control

---

## Módulo 8 – Plantillas, catálogo y configuración

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`

### Estado actual

- plantillas, checklist, consentimientos, procedimientos CUPs y configuración del sistema están presentes

### Problemas

- demasiada lógica en “JSON plantilla”
- datos estructurados que pueden crecer sin control

### Refactorización recomendada

1. Separar plantillas de contenido clínico y metadatos
2. Crear esquema más rígido para secciones y campos obligatorios
3. Validar sintaxis y estructura de plantillas antes de activarlas
4. Añadir auditoría de cambios de plantillas

### Resultado esperado

- menor riesgo de plantillas corruptas
- mejor mantenimiento y parcheo de templates

---

## Módulo 9 – Auditoría y trazabilidad

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`
- `backend/src/controllers/iamController.ts`

### Estado actual

- `AuditLog` y `EventoSeguridad` son un punto muy bueno

### Problemas

- sin política de retención
- sin política de archivado
- volumen potencial alto si cada operación se registra

### Refactorización recomendada

1. Definir retención por tiempo y por tipo de evento
2. Archivar eventos antiguos a almacenamiento frío
3. Añadir índices compuestos por tabla y fecha
4. Separar eventos de seguridad, auditoría y logs operativos

### Resultado esperado

- auditoría escalable y mantenible
- mejor desempeño y menor costo operativo

---

## Módulo 10 – Archivos y almacenamiento clínico

**Archivos base relevantes:**
- `backend/prisma/schema.prisma`
- `.env.example`

### Estado actual

- se usan URLs a documentos y media, con almacenamiento en S3 configurado en variables de entorno

### Problemas

- no está claro si se usa signed URLs
- no hay política documentada de privacidad y acceso
- riesgo de exposición de archivos sensibles

### Refactorización recomendada

1. Definir storage seguro de archivos con signed URLs
2. Registrar cada acceso a archivos médicos en auditoría
3. Restringir acceso por paciente/procedimiento/rol
4. Encriptar en reposo y en tránsito

### Resultado esperado

- archivos seguros y auditables
- reducción del riesgo clínico y legal

---

## 4. Secuencia recomendada de implementación

### Fase 1 – Seguridad y base sólida

- secretos y env validation
- enums y constraints
- cache de permisos
- almacenamiento seguro de archivos

### Fase 2 – Integridad clínica

- transacciones críticas
- validación de historias y consentimientos
- tests de integridad
- normalización de JSON crítico

### Fase 3 – Performance y operación

- retención de auditoría
- índices compuestos
- monitoreo de queries lentas
- plan de backup y recuperación

### Fase 4 – Escalabilidad y madurez

- particiones por fecha
- archivado de logs y evidencias
- métricas operativas
- gobierno de datos

---

## 5. Matriz de prioridad por módulo

| Módulo | Riesgo | Prioridad | Impacto | Acción principal |
|---|---|---:|---:|---|
| Seguridad y autenticación | Crítico | P0 | Alto | secret manager, cache permisos, fallbacks seguros |
| Usuarios / empresa / sede | Alto | P0 | Alto | enums, validación y consistencia |
| Pacientes | Alto | P1 | Alto | normalización y transacciones |
| Procedimientos | Alto | P1 | Alto | estados enum + transacciones |
| Historia clínica | Crítico | P0 | Muy alto | hash, firmas, validación e integridad |
| Agenda | Alto | P1 | Alto | conflicto de horarios y validaciones |
| Facturación | Crítico | P0 | Alto | transacciones, idempotencia, estados |
| Plantillas | Medio | P1 | Medio | normalización y validación |
| Auditoría | Alto | P0 | Alto | retención y ordenación |
| Archivos clínicos | Crítico | P0 | Muy alto | signed URLs y cifrado |

---

## 6. Recomendación final

SARAI tiene una sólida base arquitectónica, pero necesita reforzarse en producción en estas cinco líneas de trabajo:

1. Seguridad de mismos y acceso
2. Integridad de flujos clínicos y financieros
3. Validación de tipos, estados y dominio
4. Reducción de JSON libre donde hay estructura real
5. Auditoría, archivos y políticas operativas

Con esa estrategia, la arquitectura actual podría evolucionar de “buen sistema funcional” a “sistema empresarial robusto, seguro y escalable”.

---

## 7. Resultado esperado

Al terminar la refactorización por prioridades:

- la base de datos será más estable
- la autoridad de permisos será más rápida y segura
- las historias clínicas tendrán mayor legalidad técnica
- las facturaciones y operaciones críticas serán más consistentes
- el sistema estará listo para crecer sin romper la arquitectura

---

## 8. Archivos base para ejecutar la refactorización

- `backend/prisma/schema.prisma`
- `backend/src/controllers/iamController.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/utils/jwt.ts`
- `docs/DB_11_ARQUITECTURA_BASE_DATOS_SARAI.md`
- `docs/DB_12_DIAGNOSTICO_ARQUITECTURA_PRODUCCION.md`
