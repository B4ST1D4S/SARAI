# FLUJOS CLAVE DEL SISTEMA

## 🔄 FLUJO 1: ONBOARDING DE PACIENTE (Express <2 minutos)

```
┌─────────────────────────────────────────┐
│ 1. INICIO                               │
│ Click "Nuevo Paciente"                  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│ 2. ESCANEO DE DOCUMENTO                 │
│ ┌──────────────────────────────────┐   │
│ │ Opción A: Cámara (OCR)          │   │
│ │ Opción B: Ingreso manual         │   │
│ └──────────────────────────────────┘   │
│                                         │
│ Campos: Tipo doc, No. doc               │
│ Tiempo: 30 seg                          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│ 3. DATOS BÁSICOS                        │
│ • Nombre completo (pre-llenado)        │
│ • Teléfono principal                    │
│ • WhatsApp                              │
│ • Email                                 │
│ Tiempo: 30 seg                          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│ 4. ALERGIAS CRÍTICAS                    │
│ ┌──────────────────────────────────┐   │
│ │ Multi-select autocomplete         │   │
│ │ "Penicilina", "Iodo", etc.       │   │
│ │ MARCADOS EN ROJO si críticas      │   │
│ └──────────────────────────────────┘   │
│ Tiempo: 20 seg                          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│ 5. MEDICACIÓN ACTUAL                    │
│ ┌──────────────────────────────────┐   │
│ │ Autocomplete inteligente          │   │
│ │ "Ibuprofeno 400mg c/8h"          │   │
│ │ Botón "Agregar más"              │   │
│ └──────────────────────────────────┘   │
│ Tiempo: 30 seg                          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│ 6. FOTO PERFIL (Opcional)               │
│ • Cámara o upload                       │
│ • Compresión automática                │
│ Tiempo: 30 seg                          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│ 7. RESUMEN Y GUARDAR                    │
│ ┌──────────────────────────────────┐   │
│ │ ✓ Revisión de datos              │   │
│ │ ✓ Botón "Crear Paciente"         │   │
│ │ ✓ Notificación: "Listo!"         │   │
│ └──────────────────────────────────┘   │
│ Tiempo: 10 seg                          │
└─────────────┬───────────────────────────┘
              │
        ✅ TOTAL: <2 MIN ✅
```

**Respuesta del Sistema:**
- Validación en tiempo real
- Auto-completado de campos comunes
- Guardado incremental (cada campo es auto-save)
- Notificación de éxito con ID del paciente

---

## 🏥 FLUJO 2: CREACIÓN DE CITA CON PLANTILLA AUTOMÁTICA

```
┌──────────────────────────────────────────┐
│ 1. CLICK "NUEVA CITA"                    │
│ Abre modal elegante                      │
└──────────┬───────────────────────────────┘
           │
┌──────────▼───────────────────────────────┐
│ 2. SELECCIONAR PACIENTE                  │
│ ┌───────────────────────────────────┐   │
│ │ Búsqueda autocomplete             │   │
│ │ Tipo: "María" → muestra foto      │   │
│ │ Últimos pacientes como sugerencias│   │
│ └───────────────────────────────────┘   │
│ (Tiempo: 5-10 seg)                      │
└──────────┬───────────────────────────────┘
           │
┌──────────▼───────────────────────────────┐
│ 3. SELECCIONAR PROCEDIMIENTO             │
│ ┌───────────────────────────────────┐   │
│ │ Dropdown: FACIALES, CORPORALES,   │   │
│ │ NO INVASIVOS                      │   │
│ │ Ej: "Rinoplastia"                 │   │
│ │                                   │   │
│ │ → Sistema carga plantilla         │   │
│ │   automáticamente                 │   │
│ └───────────────────────────────────┘   │
│ (Tiempo: 5 seg)                         │
└──────────┬───────────────────────────────┘
           │
┌──────────▼───────────────────────────────┐
│ 4. SUGERENCIAS INTELIGENTES              │
│ ┌───────────────────────────────────┐   │
│ │ 🤖 IA sugiere:                    │   │
│ │  • Mejor fecha: Viernes 14:00     │   │
│ │  • Médico disponible: Dr. Pérez   │   │
│ │  • Sala: Quirófano 2              │   │
│ │  • Duración: 120 minutos          │   │
│ └───────────────────────────────────┘   │
│ (Usuario puede aceptar o cambiar)       │
└──────────┬───────────────────────────────┘
           │
┌──────────▼───────────────────────────────┐
│ 5. CONFIRMACIÓN                          │
│ ┌───────────────────────────────────┐   │
│ │ ✓ Datos confirmados               │   │
│ │ ✓ Botón verde "Crear cita"        │   │
│ └───────────────────────────────────┘   │
└──────────┬───────────────────────────────┘
           │
┌──────────▼───────────────────────────────┐
│ 6. GENERACIÓN AUTOMÁTICA                 │
│ • Cita creada en BD                     │
│ • Plantilla cargada                     │
│ • Consentimiento template preparado     │
│ • Mensaje WhatsApp enviado al paciente  │
│   "Tu cita está confirmada para..."     │
└──────────┬───────────────────────────────┘
           │
        ✅ CITA LISTA EN <30 SEG ✅
```

**Automáticamente:**
- Recordatorio 24h antes
- Confirmación automática vía WhatsApp
- Descarga de plantilla
- Estado actualizado en paciente

---

## 📝 FLUJO 3: HISTORIA CLÍNICA DINÁMICA (Adaptive)

```
┌─────────────────────────────────────────────┐
│ 1. ABRIR CITA/PROCEDIMIENTO                 │
│ Médico accede a cita programada             │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│ 2. CARGAR PLANTILLA AUTOMÁTICA              │
│ Sistema detecta tipo de procedimiento       │
│ Descarga plantilla correspondiente          │
│                                             │
│ Ejemplo: Rinoplastia                        │
│ ├── Anamnesis                               │
│ │   ├── ¿Cuándo comenzó la preocupación?   │
│ │   ├── ¿Ha tenido traumatismo nasal?      │
│ │   ├── ¿Problemas respiratorios?          │
│ │   └── ¿Procedimientos previos?           │
│ ├── Examen Físico                           │
│ │   ├── Simetría                            │
│ │   ├── Dorso                               │
│ │   ├── Punta                               │
│ │   └── Asa                                 │
│ ├── Diagnóstico                             │
│ └── Plan Quirúrgico                         │
│     ├── Técnica                             │
│     ├── Riesgos                             │
│     └── Medicación                          │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│ 3. AUTO-COMPLETADO INTELIGENTE              │
│ Sistema pre-llena datos conocidos:          │
│ • Alergias: [pre-llenadas]                  │
│ • Medicación: [pre-llenada]                 │
│ • Procedimientos previos: [pre-llenados]    │
│ • Riesgos detectados: [marcados]            │
│                                             │
│ → Médico solo llena campos nuevos           │
│ → Reducción de 60% de tiempo de entrada     │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│ 4. VALIDACIÓN EN TIEMPO REAL                │
│ • Campo requerido: highlight rojo           │
│ • Inconsistencia: advertencia amarilla      │
│ • IA sugiere: "¿Olvidó alergia crítica?"   │
│ • Green check cuando está completo          │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│ 5. GUARDADO INCREMENTAL (Autosave)          │
│ • Cada campo se guarda cada 30 segundos     │
│ • Versioning automático                     │
│ • Sin pérdida de datos                      │
│ • Usuario ve: "Guardado ✓"                  │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│ 6. FIRMA DIGITAL                            │
│ • Médico firma con tableta                  │
│ • Timestamp automático                      │
│ • Hash para integridad                      │
│ • Versión FINAL marcada                     │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│ 7. AUDITORÍA COMPLETA                       │
│ Registro inmutable:                         │
│ • Quién editó (usuario ID)                  │
│ • Qué cambió (antes vs. después)            │
│ • Cuándo (timestamp)                        │
│ • Desde dónde (IP)                          │
│ • Firma digital                             │
│                                             │
│ ⚖️ Cumple Resolución 1995 ✓                 │
└─────────┬───────────────────────────────────┘
          │
✅ HISTORIA LISTA PARA CONSENTIMIENTO ✅
```

**Características Clave:**
- Nunca se borra (soft delete con versionamiento)
- Búsqueda en historial de cambios
- Exportación a PDF con firma
- Control de acceso por rol

---

## ✍️ FLUJO 4: CONSENTIMIENTO INFORMADO BLINDADO

```
┌──────────────────────────────────────────────┐
│ 1. GENERACIÓN AUTOMÁTICA                     │
│ Sistema carga template para:                 │
│ Rinoplastia → Especificaciones clínicas     │
│                                              │
│ Template incluye:                            │
│ • Descripción del procedimiento              │
│ • Riesgos específicos (detectados por IA)   │
│ • Complicaciones posibles                    │
│ • Restricciones postoperatorias              │
│ • Declaración de consentimiento              │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│ 2. PRESENTACIÓN EN MODAL ELEGANTE            │
│ ┌────────────────────────────────────────┐  │
│ │ CONSENTIMIENTO INFORMADO               │  │
│ │                                        │  │
│ │ [Contenido HTML responsivo]            │  │
│ │ • Texto grande y legible               │  │
│ │ • Énfasis en riesgos (rojo)            │  │
│ │ • Scroll tracker (% leído)             │  │
│ │                                        │  │
│ │ [Paciente debe scrollear hasta fin]    │  │
│ │ [Botón "Acepto" deshabilitado]         │  │
│ └────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│ 3. VERIFICACIÓN DE LECTURA                   │
│ Sistema valida:                              │
│ ✓ ¿Leyó hasta el final?                      │
│ ✓ ¿Pasó tiempo mínimo? (2 minutos)           │
│ ✓ ¿Revisó riesgos? (clickeó links)           │
│                                              │
│ Una vez verificado:                          │
│ → Botón "Acepto" se activa (verde)           │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│ 4. FIRMA DIGITAL CON CANVAS                  │
│ ┌────────────────────────────────────────┐  │
│ │ FIRME AQUÍ                             │  │
│ │ ┌──────────────────────────────────┐  │  │
│ │ │                                  │  │  │
│ │ │  [Lienzo de firma natural]       │  │  │
│ │ │                                  │  │  │
│ │ └──────────────────────────────────┘  │  │
│ │ [Botones: Limpiar] [Aceptar]          │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ • Firma natural (pressure-sensitive)         │
│ • Guardada como imagen PNG                   │
│ • Hash SHA-256 para integridad               │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│ 5. CAPTURA DE SELFIE (Validación)            │
│ ┌────────────────────────────────────────┐  │
│ │ TOMA UNA SELFIE                        │  │
│ │ Confirma identidad del paciente        │  │
│ │ [Cámara activa]                        │  │
│ │ [Foto tomada y comprimida]             │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Metadatos capturados:                        │
│ • Timestamp exacto                           │
│ • IP del dispositivo                         │
│ • Geolocalización (si permisos)              │
│ • Navegador y SO                             │
│ • User Agent                                 │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│ 6. GENERACIÓN Y ALMACENAMIENTO               │
│ Sistema crea:                                │
│ ✓ PDF con marca de agua                      │
│ ✓ Código QR de verificación                  │
│ ✓ Registro de auditoría                      │
│ ✓ Criptografía de datos sensibles            │
│                                              │
│ Almacenamiento:                              │
│ • BD: Consentimiento record                  │
│ • S3: PDF, firma, selfie                     │
│ • Logs: Auditoría completa                   │
│ • Blockchain: Hash (futuro)                  │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│ 7. CONFIRMACIÓN FINAL                        │
│ ┌────────────────────────────────────────┐  │
│ │ ✅ CONSENTIMIENTO FIRMADO EXITOSAMENTE│  │
│ │                                        │  │
│ │ Detalles:                              │  │
│ │ • Fecha: 15 abril 2024 14:35:22        │  │
│ │ • IP: 192.168.1.45                     │  │
│ │ • Dispositivo: iPhone 14 Pro            │  │
│ │ • PDF: Disponible para descargar        │  │
│ │                                        │  │
│ │ [Botón: Descargar PDF]                 │  │
│ │ [Botón: Enviar por email]              │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Notificación al médico:                      │
│ "Consentimiento firmado: María González"     │
└──────────┬───────────────────────────────────┘
           │
        ✅ CONSENTIMIENTO LEGAL ✅
        ✅ TOTALMENTE RASTREABLE ✅
        ✅ CUMPLIMIENTO CERTIFICADO ✅
```

**Seguridad:**
- Hash SHA-256 de integridad
- Encriptación AES-256
- No puede ser modificado post-firma
- Acceso auditado (quién, cuándo, desde dónde)

---

## 📱 FLUJO 5: SEGUIMIENTO POSTOPERATORIO AUTOMÁTICO (Liposucción)

```
DÍA 1 (Automático)
┌─────────────────────────────────────┐
│ 01:00 AM - Cirugía termina          │
│ Sistema crea seguimiento automático  │
│                                     │
│ 08:00 AM - WhatsApp automático       │
│ "Hola María! ¿Cómo te sientes?      │
│ Responde aquí →"                    │
│                                     │
│ Respuesta: "Dolor leve, todo bien"  │
│                                     │
│ Checklist automático enviado:       │
│ ☐ ¿Dolor? (1-10) → Responde: 4     │
│ ☐ ¿Drenaje normal? → Responde: Sí  │
│ ☐ ¿Medicación tomada? → Responde: Sí│
│ ☐ ¿Ayuno completado? → Responde: Sí │
│                                     │
│ ✅ Status: Normal                    │
│ ✅ Notificación al médico: "OK"      │
│ (Sin alertas)                       │
└─────────────────────────────────────┘

DÍA 3
┌─────────────────────────────────────┐
│ WhatsApp: "Envía fotos de tu        │
│ evolución"                          │
│                                     │
│ Paciente sube:                      │
│ • Foto frontal abdomen              │
│ • Foto lateral derecho              │
│ • Foto lateral izquierdo            │
│                                     │
│ IA analiza imágenes:                │
│ 🤖 Detecta:                         │
│ • Edema: MODERADO (normal)          │
│ • Hematomas: LEVES                  │
│ • Simetría: ACEPTABLE               │
│ • Sin signos de complicaciones      │
│                                     │
│ ✅ Status: Normal                    │
│ 📊 Timeline visual creada            │
│    "Antes" vs "Día 3 post-op"       │
└─────────────────────────────────────┘

DÍA 7
┌─────────────────────────────────────┐
│ Cita de control programada          │
│ Automáticamente en agenda           │
│ Recordatorio 24h antes              │
│                                     │
│ Médico accede a:                    │
│ • Todas las fotos (timeline)        │
│ • Responses del checklist           │
│ • Mapa corporal (edema zones)       │
│ • Alertas generadas (si hay)        │
│                                     │
│ Control presencial/virtual:         │
│ ✓ Examen físico                     │
│ ✓ Revisión de evolución visual      │
│ ✓ Evaluación de riesgos             │
│ ✓ Próximos pasos                    │
└─────────────────────────────────────┘

DÍA 15
┌─────────────────────────────────────┐
│ Control de faja:                    │
│ WhatsApp: "¿Cómo va con la faja?   │
│ ¿Molestias?"                        │
│                                     │
│ Respuesta: "Incómoda pero OK"       │
│                                     │
│ IA sugiere: "Normal a los 15 días.  │
│ Continuar 2 semanas más"            │
│                                     │
│ Próximo seguimiento: Día 30         │
└─────────────────────────────────────┘

DÍA 30
┌─────────────────────────────────────┐
│ EVALUACIÓN COMPLETA                 │
│                                     │
│ Sistema agrupa:                     │
│ • Timeline de fotos (30 días)       │
│ • Evolución del edema               │
│ • Simetría alcanzada                │
│ • Satisfacción del paciente         │
│                                     │
│ Reporte automático generado:        │
│ "Evolución exitosa. Resultado      │
│  esperado alcanzado. Seguimiento   │
│  cada 3 meses a partir de ahora"   │
│                                     │
│ Paciente recibe: PDF completo       │
│ Médico: Notificación de finalización │
└─────────────────────────────────────┘
```

---

## 🔔 FLUJO 6: SISTEMA DE ALERTAS INTELIGENTE

```
ESCENARIOS DE ALERTA:

1. ALERTA CRÍTICA (Roja)
   └─ Signos de infección post-op
      • Temperatura > 38.5°C
      • Enrojecimiento extremo
      • Pus en sitio quirúrgico
      
      ACCIÓN:
      ✓ Notificación inmediata al médico
      ✓ Llamada telefónica si no responde en 5 min
      ✓ Sugerencia: "Contacte paciente inmediatamente"
      ✓ Link a "Protocolo de Complicaciones"

2. ALERTA ALTA (Naranja)
   └─ Edema que progresa anormalmente
      • Aumenta en vez de disminuir
      • Asimétricamente
      
      ACCIÓN:
      ✓ Notificación al médico
      ✓ Sugerencia: "Evaluación telefónica recomendada"
      ✓ Opción: "Adelantar cita de control"

3. ALERTA MEDIA (Amarilla)
   └─ Dolor persistente > 7/10
      • Después del día 3
      
      ACCIÓN:
      ✓ Notificación al auxiliar clínico
      ✓ Sugerencia: "Revisar medicación"

4. ALERTA INFORMATIVA (Azul)
   └─ Recordatorios:
      • "Control pendiente en 3 días"
      • "Medicación vence hoy"
      • "Cambio de apósito recomendado"
```

---

Flujos continúan en documentación adicional...
