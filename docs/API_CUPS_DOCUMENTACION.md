# 📚 API CUPS - Documentación Completa

## 🎯 Resumen Ejecutivo

La API CUPS proporciona una arquitectura **100% parametrizable** para:
- ✅ Gestionar procedimientos quirúrgicos por código CUPS
- ✅ Cargar plantillas de historias clínicas dinámicamente
- ✅ Crear checklists automáticos por fases (pre/intra/post)
- ✅ Generar consentimientos informados con riesgos específicos
- ✅ Automatizar alertas y seguimiento postoperatorio

**TODO es configurable desde la BD, NADA está hardcodeado.**

---

## 🔌 ENDPOINTS DISPONIBLES

### 1️⃣ PROCEDIMIENTOS CUPS

#### Obtener todos los procedimientos activos
```bash
GET /api/cups/procedimientos
```

**Respuesta:**
```json
[
  {
    "id": "cmo78meto0000lfi0jqqqlfs8",
    "codigoCUPS": "020306",
    "nombre": "Rinoplastia",
    "descripcion": "Cirugía correctiva de la nariz",
    "tipoCategoria": "Facial",
    "riesgoNivel": "Medio",
    "diasSeguimiento": 30,
    "datosAdicionales": {
      "duracionPromedio": "2-3 horas",
      "anestesia": "General",
      "hospitalizacion": "Ambulatoria"
    },
    "activo": true,
    "plantillas": [...],
    "checklistTemplates": [...],
    "consentimientosTemplate": [...]
  }
]
```

#### Obtener procedimiento específico por CUPS
```bash
GET /api/cups/procedimientos/:cups

Ejemplo:
GET /api/cups/procedimientos/020306
```

#### Crear nuevo procedimiento (ADMIN)
```bash
POST /api/cups/procedimientos
Authorization: Bearer <token>

Body:
{
  "codigoCUPS": "020400",
  "nombre": "Nuevo Procedimiento",
  "descripcion": "Descripción...",
  "tipoCategoria": "Facial",
  "riesgoNivel": "Bajo",
  "diasSeguimiento": 30,
  "datosAdicionales": {
    "duracionPromedio": "45 minutos",
    "anestesia": "Local"
  }
}
```

#### Actualizar procedimiento (ADMIN)
```bash
PUT /api/cups/procedimientos/:cups
Authorization: Bearer <token>
```

#### Desactivar procedimiento (ADMIN)
```bash
DELETE /api/cups/procedimientos/:cups
Authorization: Bearer <token>
```

---

### 2️⃣ PLANTILLAS

#### Obtener plantillas por CUPS (con filtro opcional)
```bash
GET /api/cups/plantillas?cups=020306&tipo=historia-clinica

Query params:
- cups (requerido): Código CUPS
- tipo (opcional): "historia-clinica", "evaluacion", "seguimiento", etc
```

**Respuesta:**
```json
[
  {
    "id": "cmo78mevg0002lfi0nxm0fktw",
    "codigoCUPS": "020306",
    "nombre": "Historia Clínica - Rinoplastia",
    "tipo": "historia-clinica",
    "seccionesJSON": [
      {
        "id": "anamnesis",
        "nombre": "Anamnesis",
        "campos": [
          {
            "id": "motivo",
            "label": "Motivo de consulta",
            "tipo": "textarea",
            "requerido": true
          },
          ...
        ]
      },
      ...
    ],
    "requiereSignatura": true,
    "requiereFoto": true,
    "requiereMapaCorporal": false,
    "ordenVisualizacion": 1,
    "activa": true
  }
]
```

#### Obtener plantilla por ID
```bash
GET /api/cups/plantillas/:id
```

#### Crear plantilla (ADMIN)
```bash
POST /api/cups/plantillas
Authorization: Bearer <token>

Body:
{
  "codigoCUPS": "020306",
  "nombre": "Historia Clínica - Rinoplastia",
  "tipo": "historia-clinica",
  "descripcion": "Plantilla para rinoplastia",
  "seccionesJSON": [
    {
      "id": "anamnesis",
      "nombre": "Anamnesis",
      "campos": [
        {
          "id": "motivo",
          "label": "Motivo de consulta",
          "tipo": "textarea",
          "requerido": true
        }
      ]
    }
  ],
  "requiereSignatura": true,
  "requiereFoto": true,
  "requiereMapaCorporal": false,
  "ordenVisualizacion": 1
}
```

#### Actualizar plantilla (ADMIN)
```bash
PUT /api/cups/plantillas/:id
Authorization: Bearer <token>
```

#### Desactivar plantilla (ADMIN)
```bash
DELETE /api/cups/plantillas/:id
Authorization: Bearer <token>
```

---

### 3️⃣ CHECKLISTS

#### Obtener checklists por CUPS (con filtro opcional)
```bash
GET /api/cups/checklists?cups=020306&fase=pre-operatorio

Query params:
- cups (requerido): Código CUPS
- fase (opcional): "pre-operatorio", "intra-operatorio", "post-operatorio"
```

**Respuesta:**
```json
[
  {
    "id": "cmo78mew60004lfi04zk7gs81",
    "codigoCUPS": "020306",
    "fase": "pre-operatorio",
    "nombre": "Checklist Pre-operatorio - Rinoplastia",
    "itemsJSON": [
      {
        "id": "consentimiento",
        "label": "Consentimiento firmado",
        "requerido": true,
        "orden": 1
      },
      {
        "id": "anestesia",
        "label": "Evaluación anestesiológica",
        "requerido": true,
        "orden": 2
      }
    ],
    "alertasAutomaticasJSON": [
      {
        "dia": -1,
        "mensaje": "Confirmar asistencia a cirugía",
        "tipo": "info"
      }
    ],
    "activo": true
  }
]
```

#### Crear checklist (ADMIN)
```bash
POST /api/cups/checklists
Authorization: Bearer <token>

Body:
{
  "codigoCUPS": "020306",
  "fase": "pre-operatorio",
  "nombre": "Checklist Pre-operatorio",
  "itemsJSON": [
    {
      "id": "consentimiento",
      "label": "Consentimiento firmado",
      "requerido": true,
      "orden": 1
    }
  ],
  "alertasAutomaticasJSON": [
    {
      "dia": -1,
      "mensaje": "Confirmar asistencia",
      "tipo": "info"
    }
  ]
}
```

#### Actualizar checklist (ADMIN)
```bash
PUT /api/cups/checklists/:id
Authorization: Bearer <token>
```

---

### 4️⃣ CONSENTIMIENTOS

#### Obtener consentimiento por CUPS
```bash
GET /api/cups/consentimientos/:cups

Ejemplo:
GET /api/cups/consentimientos/020306
```

**Respuesta:**
```json
{
  "id": "cmo78mexx0008lfi0zaquir8e",
  "codigoCUPS": "020306",
  "titulo": "Consentimiento Informado - Rinoplastia",
  "seccionesJSON": [
    {
      "id": "introduccion",
      "titulo": "Introducción",
      "contenido": "He sido informado(a) sobre el procedimiento...",
      "requerido": true
    }
  ],
  "riesgosJSON": [
    {
      "riesgo": "Sangrado excesivo",
      "probabilidad": "Baja",
      "severidad": "Alta",
      "descripcion": "Puede requerir transfusión"
    }
  ],
  "recomendacionesJSON": [
    {
      "tipo": "pre",
      "texto": "Suspender anticoagulantes 1 semana antes"
    },
    {
      "tipo": "post",
      "texto": "Reposo 3-4 semanas"
    }
  ],
  "activo": true
}
```

#### Crear consentimiento (ADMIN)
```bash
POST /api/cups/consentimientos
Authorization: Bearer <token>

Body:
{
  "codigoCUPS": "020306",
  "titulo": "Consentimiento Informado - Rinoplastia",
  "seccionesJSON": [...],
  "riesgosJSON": [...],
  "recomendacionesJSON": [...]
}
```

#### Actualizar consentimiento (ADMIN)
```bash
PUT /api/cups/consentimientos/:cups
Authorization: Bearer <token>
```

---

## 🔐 AUTENTICACIÓN

Todos los endpoints **POST, PUT, DELETE** requieren:

```bash
Authorization: Bearer <token>

Header: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Para obtener token, usar:
```bash
POST /api/auth/login

Body:
{
  "email": "admin@example.com",
  "password": "password123"
}
```

---

## 📊 ESTRUCTURA DE DATOS

### Tipos de Campos en Plantillas
```json
{
  "id": "unique_field_id",
  "label": "Etiqueta visible",
  "tipo": "text|textarea|number|select|checkbox|date|radio",
  "opciones": ["Opción 1", "Opción 2"],  // Solo para select/checkbox/radio
  "requerido": true|false,
  "placeholder": "Texto de ayuda"
}
```

### Tipos de Alertas Automáticas
```json
{
  "dia": -1,  // -1 = día anterior, 1 = día 1 post-op, 7 = semana 1, etc
  "mensaje": "Texto del mensaje",
  "tipo": "info|warning|critical"
}
```

---

## 💡 CASOS DE USO PRÁCTICOS

### Caso 1: Crear nueva plantilla de Historia Clínica
```bash
POST /api/cups/plantillas

{
  "codigoCUPS": "020306",
  "nombre": "Historia Clínica Completa - Rinoplastia",
  "tipo": "historia-clinica",
  "seccionesJSON": [
    {
      "id": "anamnesis",
      "nombre": "Anamnesis",
      "campos": [
        {
          "id": "fumador",
          "label": "¿Es fumador?",
          "tipo": "select",
          "opciones": ["No", "Ocasional", "Regular"],
          "requerido": true
        },
        {
          "id": "medicamentos",
          "label": "Medicamentos que toma actualmente",
          "tipo": "textarea",
          "requerido": false
        }
      ]
    },
    {
      "id": "examen-fisico",
      "nombre": "Examen Físico",
      "campos": [
        {
          "id": "dorso-nasal",
          "label": "Dorso nasal",
          "tipo": "text",
          "requerido": true
        }
      ]
    }
  ],
  "requiereSignatura": true,
  "requiereFoto": true
}
```

### Caso 2: Agregar checklist de seguimiento Día 3
```bash
PUT /api/cups/checklists/cmo78mex30006lfi0de4jte8t

{
  "alertasAutomaticasJSON": [
    {
      "dia": 1,
      "mensaje": "¿Cómo te sientes? ¿Dolor intenso?",
      "tipo": "info"
    },
    {
      "dia": 3,
      "mensaje": "Sube foto de cómo va la inflamación",
      "tipo": "info"  // NUEVA ALERTA
    },
    {
      "dia": 7,
      "mensaje": "Cita de control, revisar curación",
      "tipo": "warning"
    }
  ]
}
```

### Caso 3: Agregar nuevo riesgo a consentimiento
```bash
PUT /api/cups/consentimientos/020306

{
  "riesgosJSON": [
    {
      "riesgo": "Sangrado excesivo",
      "probabilidad": "Baja",
      "severidad": "Alta",
      "descripcion": "Puede requerir transfusión"
    },
    {
      "riesgo": "Asimetría residual",  // NUEVO
      "probabilidad": "Baja",
      "severidad": "Media",
      "descripcion": "Requiere retoque quirúrgico"
    }
  ]
}
```

---

## ⚙️ CONFIGURACIÓN DEL SISTEMA

Endpoint para leer/escribir configuraciones globales:
```bash
GET /api/configuracion/:clave
PUT /api/configuracion/:clave
```

Configuraciones predefinidas:
```json
{
  "dias_seguimiento_default": { "dias": 30 },
  "whatsapp_enabled": { "enabled": true },
  "email_notificaciones": { "enabled": true }
}
```

---

## 🧪 TESTING CON CURL

### Obtener todos los procedimientos
```bash
curl -X GET http://localhost:3001/api/cups/procedimientos
```

### Obtener plantillas de Rinoplastia
```bash
curl -X GET "http://localhost:3001/api/cups/plantillas?cups=020306"
```

### Obtener checklists pre-operatorio
```bash
curl -X GET "http://localhost:3001/api/cups/checklists?cups=020306&fase=pre-operatorio"
```

### Obtener consentimiento completo
```bash
curl -X GET http://localhost:3001/api/cups/consentimientos/020306
```

---

## 📈 PROCEDIMIENTOS ACTUALES (Seed Data)

| CUPS | Nombre | Categoría | Riesgo | Seguimiento |
|------|--------|-----------|--------|------------|
| 020306 | Rinoplastia | Facial | Medio | 30 días |
| 020203 | Liposucción | Corporal | Medio | 30 días |
| 020405 | Botox | No-invasivo | Bajo | 14 días |
| 020404 | Ácido Hialurónico | No-invasivo | Bajo | 14 días |

---

## 🔄 FLUJO DE INTEGRACIÓN EN FRONTEND

1. **Obtener CUPS disponibles** → `GET /api/cups/procedimientos`
2. **Usuario selecciona procedimiento** → Obtener detalles completos
3. **Cargar plantilla dinámicamente** → `GET /api/cups/plantillas?cups=XXX`
4. **Renderizar formulario con secciones** → Mapear `seccionesJSON`
5. **Al guardar** → POST a `/api/historia-clinica` con datos del formulario
6. **Cargar consentimiento** → `GET /api/cups/consentimientos/:cups`
7. **Mostrar checklists** → `GET /api/cups/checklists?cups=XXX`
8. **Automatizar alertas** → Usar `alertasAutomaticasJSON` para programar notificaciones

---

## 🎓 PRÓXIMOS PASOS

1. ✅ Integración en Frontend → ComponenteSelectorProcedimiento
2. ⏳ Renderizador dinámico de plantillas → ComponentePlantillaDinámica
3. ⏳ Modal de consentimiento → ComponenteConsentimientoInformado
4. ⏳ Sistema de alertas automáticas → ServicioAlertas
5. ⏳ Dashboard de seguimiento postoperatorio → SeguimientoDashboard

