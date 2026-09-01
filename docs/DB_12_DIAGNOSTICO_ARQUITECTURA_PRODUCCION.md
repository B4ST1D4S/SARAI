# DB_12 – Diagnóstico de Arquitectura de SARAI para Producción

**Sistema:** SARAI  
**Fecha:** 2026-08-27  
**Fuente principal:** `backend/prisma/schema.prisma`, `backend/src/controllers/iamController.ts`, `backend/src/middleware/auth.ts`, `backend/src/utils/jwt.ts`  
**Objetivo:** revisar la arquitectura actual y definir recomendaciones concretas para un IHC robusto, escalable y listo para producción.

---

## 1. Resumen ejecutivo

SARAI ya tiene una base sólida. La arquitectura actual demuestra una intención clara de construir un sistema clínico robusto con:

- identidad y acceso bien definidos
- modelo clínico completo
- auditoría y trazabilidad
- soporte multiempresa/multisede
- plantillas, tarifas, facturación y agenda integradas

Sin embargo, aun no está del todo preparado para producción de alto riesgo si no se endurecen ciertos puntos críticos relacionados con:

- seguridad de secretos
- datos clínicos sensibles
- permisos y escalabilidad
- validación de estados y enumeraciones
- uso intensivo de JSON
- retención de auditoría
- gestión de archivos clínicos
- consistencia transaccional de procesos críticos

Es decir, la arquitectura tiene una base muy buena; lo que falta es convertirla en una arquitectura operativa sólida y de confianza empresarial.

---

## 2. Lo que está bien hecho

### 2.1 Modelo de datos bien segmentado

La base está organizada por dominios funcionales:

- `User`, `Empresa`, `Sede`, `Perfil`, `IamRol`, `Grupo`
- `Paciente`, `Procedimiento`, `HistoriaClinica`, `Consentimiento`
- `Cita`, `DisponibilidadMedico`, `BloqueDisponibilidad`
- `Cotizacion`, `Ingreso`, `Factura`, `Transaccion`
- `AuditLog`, `EventoSeguridad`, `PoliticaSeguridad`

Eso es una buena señal, porque evita que el sistema se convierta en una sola tabla gigante.

### 2.2 Seguridad más robusta que la media

La estructura de permisos está bien pensada:

- perfiles
- roles IAM
- grupos
- permisos directos por usuario
- permisos por recurso
- temporales
- delegaciones temporales
- efecto DENEGAR / PERMITIR

Esto es uno de los puntos más fuertes del proyecto.

### 2.3 Auditoría clínica y operativa

Se tienen varios mecanismos importantes:

- `AuditLog`
- `hashIntegridad` en HC y consentimientos
- `version` en historia clínica
- `fechaFirma`
- `editadoPor`
- `datosAntes` y `datosDespues` en auditoría

Esto da una base sólida para trazabilidad y cumplimiento.

### 2.4 Soporte multiempresa / multisede

La estructura tiene una intención clara para operar más de una organización y multiple sedes. Esto es un excelente punto de arquitectura para crecimiento.

---

## 3. Fallas de arquitectura detectadas

## 3.1 Uso excesivo de JSON

Hay varios modelos con campos de tipo `Json` o JSON-like, por ejemplo:

- `HistoriaClinica.contenido`
- `ChecklistTemplate.itemsJSON`
- `PlantillaTemplate.seccionesJSON`
- `Consentimiento.geolocation`
- `MapaCorporal.zonasMarcadas`
- `SeguimientoPostOp.checklistPreguntas`
- `ConfiguracionSistema.valor`

### Problema

El uso de JSON aporta flexibilidad, pero para producción puede crear:

- consultas lentas
- poca validación estructural
- dificultad para reportes analíticos
- más riesgo de inconsistencias en los datos

### Recomendación

- Usar JSON solo para información semiestructurada o muy variante.
- Normalizar estructuras que se consultan con frecuencia.
- Cuando un campo clave se usa mucho para filtros o reportes, moverlo a tabla normal.
- Si se mantiene JSON, usar `JSONB` y, cuando aplique, índices GIN.

---

## 3.2 Estados y tipos almacenados como texto libre

Se observan muchos campos como:

- `estado`
- `tipoCita`
- `tipoHistoria`
- `severidad`
- `rol`
- `genero`
- `tipoDocumento`

### Problema

Cuando un estado se guarda como `String`, el motor de la base no fuerza validación. Eso permite:

- valores inconsistentes
- typos
- regresiones funcionales
- errores difíciles de depurar

### Recomendación

- Usar enums de Prisma o `CHECK` constraints en PostgreSQL.
- Definir una lista cerrada de estados por dominio.
- Validar desde backend y base de datos.

Ejemplo ideal:

```prisma
enum EstadoCita {
  PENDIENTE
  CONFIRMADA
  COMPLETADA
  CANCELADA
}
```

---

## 3.3 Secretos por defecto en producción

En [backend/src/utils/jwt.ts](../backend/src/utils/jwt.ts) hay lógica como:

```ts
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_muy_seguro_aqui_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_secreto_refresh_aqui_2024';
```

### Problema

Esto reduce la seguridad de producción porque si la variable no existe, la aplicación arranca con fallback inseguro.

### Recomendación

- Lanzar error si `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, y otros secrets críticos no están configurados.
- Usar AWS Secrets Manager, Vault o equivalente.
- Rotar secretos en intervalos definidos.
- Separar secretos por ambiente (`dev`, `stage`, `prod`).

---

## 3.4 Permisos resueltos por consulta repetida

La lógica en [backend/src/controllers/iamController.ts](../backend/src/controllers/iamController.ts) hace varias consultas para validar:

- permiso directo del usuario
- permisos del perfil
- permisos de rol
- permisos de grupo
- delegaciones temporales
- validación por recursos

### Problema

Si cada request hace estas consultas en cada endpoint sensible, podría generarse:

- latencia
- carga innecesaria en PostgreSQL
- problemas de escalabilidad en picos de uso

### Recomendación

- Caching de permisos efectivos por usuario y recurso.
- Usar Redis para permisos resueltos por TTL corto.
- Precalcular permisos efectivos por empresa/sede/usuario.
- Reducir las consultas por usuario a un solo lookup de permisos efectivos cuando sea posible.

---

## 3.5 Auditoría sin política de retención

`AuditLog` almacena:

- `datosAntes`
- `datosDespues`
- `usuarioId`
- `tablaAfectada`
- `registroId`
- `timestamp`
- `ipOrigen`
- `userAgent`

### Problema

Si se registra cada cambio de forma indiscriminada, la tabla puede crecer sin control.

### Recomendación

- Definir política de retención por antigüedad.
- Archivar registros antiguos fuera de la tabla principal.
- Usar particiones por fecha si la tabla crece de forma importante.
- Establecer una política de purga explícita y documentada.

---

## 3.6 Archivos clínicos y datos sensibles no están protegidos por una capa de almacenamiento segura

Esta arquitectura guarda URLs a archivos:

- `contenidoPdfUrl`
- `firmaDigitalUrl`
- `selfieUrl`
- `urlOriginal`
- `urlComprimida`
- `urlMiniatura`

### Problema

Si los archivos se exponen sin control de acceso, puede haber:

- fuga de datos clínicos
- acceso no autorizado
- riesgo de integridad del paciente

### Recomendación

- Usar almacenamiento seguro tipo S3 / Azure Blob / GCS.
- Generar URLs firmadas (signed URLs) temporales.
- Cifrar archivos en reposo.
- Controlar permisos por perfil + paciente + procedimiento.
- No publicar URLs públicas sin validación.

---

## 3.7 Estructura fuerte, pero con riesgo en transacciones críticas

Hay flujos de negocio complejos donde se concatenan varios pasos:

- crear paciente
- crear procedimiento
- crear historia clínica
- crear consentimiento
- crear factura / ingreso
- actualizar seguimiento

### Problema

Si una parte falla, puede quedar un flujo a medias.

### Recomendación

- Encapsular procesos críticos en transacciones de base de datos.
- Registrar como step-by-step con rollback explícito.
- Crear validaciones de dominio antes de guardar todo.
- Hacer pruebas de integración para flujos clínicos clave.

---

## 3.8 Documentación técnica y reglas de negocio no están totalmente acopladas

El esquema está muy bien, pero algunas reglas de negocio están en código y no en base de datos.

### Problema

Esto genera:

- inconsistencias entre backend y DB
- errores de validación por entorno
- más trabajo de mantenimiento

### Recomendación

- Centralizar reglas críticas del negocio en modelo de dominio y validaciones.
- Usar enums y constraints en base de datos para lo que no debe permitirse.
- Mantener el backend con validación adicional, pero la DB debe ser la capa final de seguridad.

---

## 4. Diagnóstico por dominio

### 4.1 Dominio de seguridad

Puntaje: fuerte, pero requiere endurecimiento en producción.

Fortalezas:

- IAM completo
- perfiles, roles, grupos
- permisos temporales
- delegación temporal
- auditoría

Riesgos:

- permisos resueltos con muchas consultas
- secretos con fallback inseguro
- falta de cache

### 4.2 Dominio clínico

Puntaje: bien construido y pensado para IHC.

Fortalezas:

- paciente + procedimiento + historia clínica + consentimiento
- versión y hash de integridad
- fotos y evolución clínica
- checklists y seguimiento postoperatorio

Riesgos:

- demasiado JSON para datos estructurados
- especialmente en historias y plantillas
- necesidad de validación más estricta

### 4.3 Dominio de negocio / facturación

Puntaje: bueno para negocio médico.

Fortalezas:

- facturas, transacciones, cotizaciones, contratos
- gestión de empresas y beneficiarios

Riesgos:

- transacciones complejas sin encapsulación suficiente
- validación de estados y pagos no siempre centralizada

### 4.4 Dominio de auditoría / trazabilidad

Puntaje: sólido.

Fortalezas:

- historial de cambios
- trazabilidad del usuario
- firmas e integridad

Riesgos:

- crecimiento sin retención
- almacenamiento sin política definida

---

## 5. Recomendaciones concretas para producción

### Prioridad crítica

1. Fijar secretos obligatorios en entorno productivo
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `REDIS_URL`, claves S3, Stripe, Twilio, SMTP
   - No usar fallbacks inseguros

2. Aplicar cifrado en reposo y en tránsito
   - PostgreSQL TLS
   - S3/KMS o equivalente
   - archivos sensibles cifrados

3. Definir retención y purga de `AuditLog`
   - período de retención
   - archivado
   - limpieza automática

4. Implementar cache de permisos efectivos
   - Redis
   - TTL corto
   - invalidación en cambios de permisos

5. Validar todos los estados con enums / restricciones
   - evitar texto libre

### Prioridad alta

6. Reducir el uso de JSON libre donde hay estructura fuerte
   - mover a tablas normalizadas lo que se consulta y filtra bastante

7. Encapsular flujos clínicos críticos en transacciones
   - paciente + procedimiento + historia + consentimiento + facturación

8. Proteger URLs y archivos con signed URLs
   - mínimo privilegio y acceso granular por rol

9. Añadir pruebas de integración de flujos complejos
   - paciente nuevo
   - procedimiento
   - historia clínica
   - consentimiento firmado
   - facturación

### Prioridad media

10. Definir modelos por dominio y política de datos
   - qué va a PostgreSQL, qué va a Redis, qué va a blob storage

11. Monitorear performance del esquema
   - query plan
   - índices faltantes
   - consultas lentas

12. Medir crecimiento real del volumen de auditoría y archivos
   - documentar costos y capacidad

---

## 6. Recomendación final de arquitectura

La arquitectura de SARAI está muy bien orientada para ser un sistema clínico serio y robusto. Tiene la base técnica y funcional adecuada para un IHC empresarial.

Pero para que sea realmente una solución de producción, se recomienda fortalecer estas 5 áreas:

1. seguridad de secretos y archivos
2. validación de dominio con enums / constraints
3. control de permisos y cache
4. normalización de JSON crítico y versiones clínicas
5. política de auditoría y retención

Si estas 5 áreas se corrigen, la base de datos de SARAI pasa de ser una arquitectura muy buena a una arquitectura de producción sólida, segura y escalable.

---

## 7. Conclusión

SARAI no está mal hecho; está bien pensado. La principal diferencia entre “prototipo funcional” y “producto robusto” no es si hay muchas tablas, sino si la arquitectura soporta:

- seguridad real
- trazabilidad fuerte
- integridad de datos
- validación estricta
- performance bajo carga
- respaldo y seguridad de documentos

La recomendación general es: mantener la arquitectura actual, pero endurecerla con validaciones, control de secretos, caché de permisos, retención de auditoría y mayor normalización de entidades críticas.

---

## 8. Archivos relevantes para revisión

- `backend/prisma/schema.prisma`
- `backend/src/controllers/iamController.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/utils/jwt.ts`
- `docs/DB_11_ARQUITECTURA_BASE_DATOS_SARAI.md`
