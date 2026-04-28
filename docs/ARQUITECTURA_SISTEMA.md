# ARQUITECTURA: HISTORIA CLÍNICA ESTÉTICA INTELIGENTE

## 📋 VISIÓN GENERAL

**EstetIA** es una plataforma SaaS de nivel **PREMIUM** diseñada específicamente para cirugía estética, medicina estética y futuras integraciones con odontología.

**Objetivo Principal**: Reducir tiempo de consulta a <7 minutos SIN perder calidad clínica ni cumplimiento legal.

---

## 🏗️ ARQUITECTURA TÉCNICA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND WEB (React)                  │
│   • Dashboard Inteligente                               │
│   • Gestión de Pacientes                                │
│   • Historia Clínica Dinámica                           │
│   • Módulo Visual (Before/After, Timeline)              │
│   • Agenda Inteligente                                  │
│   • Firma Digital                                       │
└────────────────┬────────────────────────────────────────┘
                 │ (REST API + WebSockets)
┌────────────────▼────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│   • Autenticación y autorización (JWT)                   │
│   • Gestión de pacientes y contactos                     │
│   • Motor de historia clínica adaptativa                 │
│   • Sistema de plantillas por procedimiento              │
│   • Generación de documentos (consentimiento)            │
│   • Inteligencia artificial (IA)                         │
│   • Integración WhatsApp                                 │
│   • Facturación                                          │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                    BASE DE DATOS                         │
│   • PostgreSQL (datos clínicos)                          │
│   • MongoDB (documentos, historiales)                    │
│   • Redis (cache, sesiones)                             │
│   • S3 (fotos, documentos)                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 STACK TECNOLÓGICO

### Frontend
- **React 18+** + TypeScript
- **Tailwind CSS** + Shadcn UI (componentes premium)
- **Redux Toolkit** (estado global)
- **React Query** (sincronización de datos)
- **Framer Motion** (animaciones)
- **Socket.io** (comunicación en tiempo real)

### Backend
- **Node.js 18+**
- **Express.js**
- **TypeScript**
- **Prisma ORM** (manejo de BD)
- **JWT** (autenticación)
- **Bull Queue** (tareas programadas)
- **Socket.io** (WebSockets)

### Base de Datos
- **PostgreSQL 14+** (datos transaccionales)
- **MongoDB** (documentos, historiales)
- **Redis** (cache, sesiones)
- **AWS S3** (almacenamiento de archivos)

---

## 🎯 MÓDULOS PRINCIPALES

### 1. **Dashboard Inteligente**
```
Vista única del paciente en 10 segundos:
├── Datos demográficos + foto actual
├── Alertas clínicas (riesgo, complicaciones)
├── Próximos controles
├── Estado actual (pre/post/seguimiento)
├── KPIs clínicos
└── Últimas anotaciones
```

### 2. **Gestión de Pacientes**
```
├── Registro express (<2 minutos)
│   ├── Datos básicos
│   ├── Contacto + WhatsApp
│   ├── Alergias críticas
│   └── Medicación actual
├── Perfil clínico completo
├── Historial unificado
└── Integración WhatsApp
```

### 3. **Historia Clínica Dinámica**
```
├── Formularios adaptativos por procedimiento
├── Anamnesis inteligente (auto-completado)
├── Control de campos requeridos dinámicos
├── Versionamiento (nunca se borra)
├── Auditoría completa (quién, qué, cuándo)
└── Exportación a PDF
```

### 4. **Plantillas por Procedimiento** (CORE)
```
FACIALES:
├── Rinoplastia
├── Blefaroplastia
├── Lifting
├── Implantes faciales
└── Liposucción facial

CORPORALES:
├── Liposucción
├── Abdominoplastia
├── Mamoplastia
├── Levantamiento glúteos
└── Aplicación de implantes

NO INVASIVOS:
├── Botox
├── Ácido hialurónico
├── Hilos tensores
└── Plasma rico en plaquetas

Cada plantilla incluye:
├── Checklist clínico pre-operatorio
├── Riesgos automáticos por procedimiento
├── Complicaciones esperadas
├── Consentimiento prellenado
├── Postoperatorio automatizado por días
└── Medicación recomendada
```

### 5. **Módulo Visual PREMIUM**
```
├── Comparador antes/después (slider)
├── Timeline clínico (progreso visual)
├── Almacenamiento HD de fotos
├── Zoom clínico para detalles
├── Mapa corporal interactivo
│   ├── Marcar zonas intervenidas
│   ├── Indicar edema, fibrosis, dolor
│   ├── Colorimetría (rojo/naranja/verde)
│   └── Anotaciones clínicas
└── Histograma de evolución
```

### 6. **Consentimiento Informado BLINDADO**
```
├── Generación automática por procedimiento
├── Firma digital paciente + médico (Canvas)
├── Captura de selfie + validación facial
├── Registro de:
│   ├── Fecha/hora exacta
│   ├── IP del dispositivo
│   ├── Geolocalización
│   └── Navegador/SO
├── Exportación PDF con marca de agua
├── Almacenamiento en blockchain (opcional)
└── Consentimiento en video (futuro)
```

### 7. **Agenda Inteligente**
```
├── Calendario visual (tipo calendario médico)
├── Creación rápida de citas (<30 segundos)
├── Recordatorios automáticos vía WhatsApp
├── Sincronización Google Calendar
├── Reprogramación inteligente
├── Visualización de ocupación quirófano
└── Generación de listados quirúrgicos
```

### 8. **Seguimiento Postoperatorio Automático**
```
EJEMPLO LIPOSUCCIÓN:
├── DÍA 1: Evaluación de dolor, drenaje
├── DÍA 3: Solicitud de fotos
├── DÍA 7: Control clínico presencial/virtual
├── DÍA 15: Control de faja
├── DÍA 30: Evaluación de resultados
└── MESES 3,6,12: Seguimiento a largo plazo

FUNCIONES:
├── Paciente sube fotos automáticamente
├── Reporta síntomas vía checklist
├── IA detecta alertas visuales
├── Notificación inmediata al médico
├── Generación de reportes automáticos
└── Sugerencias de ajuste de tratamiento
```

### 9. **Vista Cirujano (MODO RÁPIDO)**
```
Pantalla única de pre-quirófano:
├── Foto actual del paciente
├── Última cirugía realizada
├── Alergias (DESTACADAS)
├── Medicación actual
├── Alertas críticas
├── Estado de pagos
├── Consentimiento firmado ✓
├── Ayuno confirmado ✓
├── Exámenes listos ✓
└── Checklist preoperatorio
```

### 10. **Inteligencia Artificial**
```
├── Dictado clínico por voz (Whisper API)
├── Transcripción a texto automática
├── Resumen automático de evolución
├── Detección de inconsistencias
├── Sugerencias clínicas basadas en protocolo
├── Análisis visual (antes/después)
│   ├── Detección de cambios
│   ├── Medición de simetría
│   └── Alertas de complicaciones visuales
└── Predicción de resultados
```

### 11. **CRM Estético**
```
EMBUDO DE VENTAS:
├── Cotización
├── Agendamiento
├── Realización
└── Seguimiento

CAMPAÑAS AUTOMÁTICAS:
├── Recordatorio de cumpleaños
├── Oferta de retoques
├── Encuesta de satisfacción
├── Seguimiento post-operatorio
└── Invitación a tratamientos complementarios
```

### 12. **Facturación**
```
├── Gestión de abonos
├── Planes de pago (cuotas)
├── Paquetes de procedimientos
├── Estado de cuenta del paciente
├── Reportes financieros
├── Integración con pagos (Stripe, Wompi)
└── Recibos automáticos por email
```

---

## 🔐 CUMPLIMIENTO LEGAL Y SEGURIDAD

### Normativa Colombiana
- ✅ **Resolución 1995 de 1999**: Historia Clínica completa y trazable
- ✅ **Resolución 3100 de 2019**: Habilitación en salud (roles, permisos)
- ✅ **Ley 1581 de 2012**: Protección de datos personales (HABEAS DATA)
- ✅ **Ley 1273 de 2009**: Delitos informáticos (encriptación)

### Medidas de Seguridad
```
├── Autenticación multi-factor (MFA)
├── Encriptación AES-256 en tránsito (HTTPS)
├── Encriptación de datos sensibles en BD
├── Logs de auditoría completos (no editables)
├── Versionamiento de cambios
├── No eliminación de historia clínica (soft delete)
├── Backup automático cada 6 horas
├── Recuperación ante desastres (DR)
├── Control de acceso basado en roles (RBAC)
└── Certificación ISO 27001 (objetivo)
```

### Roles y Permisos
```
SUPER ADMIN
├── Gestión de usuarios
├── Configuración de clínica
└── Reportes globales

MÉDICO/CIRUJANO
├── Ver/crear historia clínica
├── Acceder a pacientes asignados
├── Crear consentimiento
├── Ver facturación propia
└── Acceso a plantillas

AUXILIAR CLÍNICO
├── Registro de pacientes
├── Carga de fotos
├── Seguimiento postoperatorio
└── Recordatorios a pacientes

RECEPCIONISTA
├── Gestión de citas
├── Contacto con pacientes
├── Cobros básicos
└── Reporte de asistencia

PACIENTE
├── Ver su propia historia
├── Reportar síntomas
├── Subir fotos de seguimiento
├── Firmar consentimiento
└── Ver facturación
```

---

## 🎨 DISEÑO UX/UI

### Principios de Diseño
- **Elegancia Premium**: Oscuro elegante + acentos dorados
- **Minimalismo Funcional**: Menos clics, máxima claridad
- **Responsive**: Funciona en desktop, tablet, móvil
- **Accesibilidad**: WCAG 2.1 AA
- **Performance**: <2s load time

### Componentes Clave
```
LAYOUT BASE:
├── Header (logo + usuario + notificaciones)
├── Sidebar (navegación principal minimalista)
├── Content Area (dinámica según módulo)
└── Footer (ayuda, soporte)

COMPONENTES REUTILIZABLES:
├── Card (paciente, procedimiento, control)
├── Modal (citas, consentimiento, fotos)
├── Timeline (evolución clínica)
├── Slider (antes/después)
├── DataTable (pacientes, citas, facturación)
├── Chart (KPIs, evolución)
├── Badge (alertas, estados)
├── Toast (notificaciones)
├── Dialog (confirmaciones)
└── Skeleton (carga)
```

---

## 📊 ESTRUCTURA DE BASE DE DATOS

### Tablas Principales

```sql
-- USUARIOS Y AUTENTICACIÓN
users
├── id (UUID)
├── email
├── password_hash
├── nombre
├── apellido
├── rol (ENUM: SUPER_ADMIN, MEDICO, AUXILIAR, RECEPCIONISTA, PACIENTE)
├── especialidad (para médicos)
├── telefono
├── activo
└── created_at, updated_at

-- PACIENTES (CORE)
pacientes
├── id (UUID)
├── numero_documento
├── tipo_documento (CC, CE, PS, etc.)
├── nombre_completo
├── fecha_nacimiento
├── genero
├── telefonos
├── email
├── direccion
├── ciudad
├── alergias (JSON array)
├── medicacion_actual (JSON)
├── antecedentes_quirurgicos (JSON)
├── antecedentes_medicos (JSON)
├── foto_perfil_url
├── estado (ACTIVO, INACTIVO, FALLECIDO)
└── created_at, updated_at, created_by

-- PROCEDIMIENTOS / CIRUGÍAS
procedimientos
├── id (UUID)
├── paciente_id (FK)
├── medico_id (FK)
├── tipo_procedimiento (ENUM)
├── nombre_procedimiento
├── descripcion
├── fecha_programada
├── fecha_realizada
├── duracion_estimada
├── duracion_real
├── estado (PENDIENTE, EN_CURSO, COMPLETADO, CANCELADO)
├── notas_preoperatorio
├── notas_operatorio
├── complicaciones
├── resultado_visual_esperado
├── resultado_visual_actual
├── medicacion_prescrita (JSON)
├── restricciones_post (JSON)
└── created_at, updated_at

-- HISTORIA CLÍNICA DINÁMICA
historia_clinica
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── tipo_historia (ENUM: ANAMNESIS, EXAMEN_FISICO, DIAGNOSTICO, PLAN, SEGUIMIENTO)
├── contenido (JSON - campos dinámicos)
├── version
├── editado_por (FK users)
├── fecha_creacion
├── fecha_ultima_edicion
├── firmado_por_medico
├── fecha_firma
└── hash_integridad (para auditoría)

-- PLANTILLAS POR PROCEDIMIENTO
plantillas_procedimiento
├── id (UUID)
├── codigo_cups
├── nombre_procedimiento
├── categoria (FACIAL, CORPORAL, NO_INVASIVO)
├── descripcion
├── campos_obligatorios (JSON)
├── campos_opcionales (JSON)
├── riesgos_por_defecto (JSON array)
├── complicaciones_esperadas (JSON array)
├── medicacion_recomendada (JSON)
├── postoperatorio_por_dias (JSON)
├── consentimiento_template (HTML)
└── created_at, updated_at

-- CONSENTIMIENTOS INFORMADOS
consentimientos
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── plantilla_id (FK)
├── contenido_html
├── contenido_pdf_url
├── firma_digital_canvas_url
├── selfie_url
├── fecha_firma
├── ip_dispositivo
├── navegador
├── sistema_operativo
├── geolocation (JSON)
├── firmado
├── hash_integridad
└── created_at

-- FOTOS CLÍNICAS
fotos_clinicas
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── tipo (ANTES, DESPUES, SEGUIMIENTO)
├── dias_post_operatorio (para seguimiento)
├── url_original
├── url_comprimida
├── url_miniatura
├── metadatos (fecha, hora, dispositivo)
├── anotaciones (JSON - marcas clínicas)
├── visible_al_paciente (booleano)
├── fecha_captura
└── created_at

-- MAPA CORPORAL INTERACTIVO
mapa_corporal
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── fecha_evaluacion
├── zonas_marcadas (JSON GeoJSON)
├── edema_zonas (JSON)
├── fibrosis_zonas (JSON)
├── dolor_zonas (JSON)
├── color_indicator (RGB)
├── anotaciones_clinicas
└── evaluado_por (FK users)

-- SEGUIMIENTO POSTOPERATORIO
seguimiento_post_op
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── dia_post_op
├── fecha_prevista
├── fecha_completada
├── tipo_seguimiento (CHECKLIST, FOTOS, CONTROL, EVALUACION)
├── checklist_preguntas (JSON)
├── checklist_respuestas (JSON)
├── reportar_complicacion (booleano)
├── descripcion_complicacion
├── alertas_generadas (JSON array)
├── completado
├── notificacion_enviada_whatsapp
└── created_at

-- CITAS / AGENDA
citas
├── id (UUID)
├── paciente_id (FK)
├── medico_id (FK)
├── tipo_cita (CONSULTA, PREOPERATORIO, POSTOPERATORIO, CONTROL)
├── fecha_hora
├── duracion_minutos
├── estado (PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA)
├── motivo
├── notas
├── recordatorio_whatsapp_enviado
├── asistencia (booleano nullable)
├── sala_quirofano_id (nullable)
└── created_at, updated_at

-- TRANSACCIONES / FACTURACIÓN
transacciones
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── tipo (CARGO, PAGO, ABONO)
├── concepto
├── monto
├── moneda (COP, USD)
├── metodo_pago (EFECTIVO, TARJETA, TRANSFER, OTRO)
├── referencia_pago
├── estado (PENDIENTE, COMPLETADO, FALLIDO)
├── recibo_url
├── creado_por (FK users)
└── created_at

-- ALERTAS CLÍNICAS
alertas
├── id (UUID)
├── paciente_id (FK)
├── procedimiento_id (FK)
├── tipo_alerta (RIESGO, COMPLICACION, CONTROL_PENDIENTE, MEDICACION)
├── severidad (CRITICA, ALTA, MEDIA, BAJA)
├── descripcion
├── accion_recomendada
├── IA_detectada (booleano)
├── resuelta
├── fecha_resolucion
└── created_at

-- LOGS DE AUDITORÍA
audit_logs
├── id (UUID)
├── usuario_id (FK)
├── tabla_afectada
├── registro_id
├── tipo_operacion (CREATE, UPDATE, DELETE, VIEW)
├── datos_antes (JSON)
├── datos_despues (JSON)
├── ip_origen
├── user_agent
├── razon (texto)
└── timestamp

-- INTEGRACIONES EXTERNAS
integraciones
├── id (UUID)
├── clini_id (FK)
├── tipo (WHATSAPP, GOOGLE_CALENDAR, STRIPE, OTRO)
├── credenciales_encriptadas
├── activa
├── fecha_ultima_sincronizacion
└── created_at, updated_at
```

---

## 🔄 FLUJOS CLAVE

### Flujo 1: Registro Rápido de Paciente (<2 min)
```
1. Click "Nuevo Paciente"
2. Escaneo documento (OCR o manual rápido)
3. Datos básicos: nombre, teléfono, WhatsApp
4. Alergias críticas
5. Medicación actual (autocomplete)
6. Foto perfil (opcional)
7. Guardar → Listo en <2 minutos
```

### Flujo 2: Creación de Cita con Plantilla
```
1. Click "Nueva Cita"
2. Seleccionar paciente
3. Seleccionar procedimiento (autocomplete)
4. Cargar plantilla automáticamente
5. Sistema sugiere fecha/médico/sala
6. Confirmación automática vía WhatsApp
7. Recordatorio 24h antes
```

### Flujo 3: Historia Clínica Dinámica
```
1. Abrir cita/procedimiento
2. Sistema carga plantilla correspondiente
3. Mostrar solo campos necesarios
4. Auto-completado desde datos previos
5. Validación de campos obligatorios
6. Guardado incremental (cada 30s)
7. Versionamiento automático
```

### Flujo 4: Consentimiento Digital BLINDADO
```
1. Sistema genera consentimiento desde plantilla
2. Mostrar en modal elegante
3. Paciente lee y scrollea hasta el final
4. Click "Acepto"
5. Firma digital con canvas (natural)
6. Selfie con cámara (validación facial)
7. Registro: fecha, hora, IP, geolocalización
8. PDF con marca de agua
9. Almacenamiento seguro
10. Notificación al médico
```

### Flujo 5: Seguimiento Postoperatorio
```
DÍA 1 (auto):
- Sistema envía WhatsApp: "¿Cómo te sientes?"
- Checklist rápido (dolor, drenaje, medicación)
- Si hay alerta → Notifica médico

DÍA 3:
- "Envía fotos de tu evolución"
- IA analiza imágenes
- Detecta complicaciones visuales

DÍA 7:
- Cita de control programada automáticamente
- Checklist postoperatorio

DÍA 15, 30:
- Seguimiento automático
- Timeline visual de progreso
```

---

## 💾 PERSISTENCIA Y VERSIONAMIENTO

### Control de Cambios
```
Cada registro en historia_clinica tiene:
├── version (número incremental)
├── hash_integridad (SHA-256)
├── editado_por (quién)
├── fecha_edicion (cuándo)
└── cambios_anteriores (JSON immutable)

Política: NUNCA SE BORRA
- Soft delete con flag
- Historial completo auditable
- Cumplimiento Resolución 1995
```

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### FASE 1: MVP (2-3 meses)
- Dashboard básico
- Gestión de pacientes
- Historia clínica dinámica
- Plantillas faciales
- Consentimiento digital
- Agenda simple

### FASE 2: Funciones Premium (2 meses)
- Módulo visual (antes/después, timeline)
- Mapa corporal interactivo
- Seguimiento postoperatorio
- Integración WhatsApp básica
- CRM estético

### FASE 3: Inteligencia Artificial (2 meses)
- Dictado por voz
- Análisis visual automático
- Alertas inteligentes
- Sugerencias clínicas

### FASE 4: Escalabilidad (1 mes)
- Optimización de performance
- Multi-tenant (clínicas múltiples)
- Migración de datos
- Certificaciones y auditoría

---

## 📈 KPIs DE ÉXITO

```
✅ Tiempo de consulta: <7 minutos
✅ Tiempo de registro: <2 minutos
✅ Satisfacción médico: >95%
✅ Satisfacción paciente: >90%
✅ Reducción administrativa: 40%
✅ Uptime: 99.9%
✅ Response time: <500ms
✅ Cumplimiento legal: 100%
```

---

Documento continúa en especificaciones técnicas...
