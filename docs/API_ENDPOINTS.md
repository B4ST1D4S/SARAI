# ESPECIFICACIÓN DE API ENDPOINTS

## 🔐 AUTENTICACIÓN

### POST /api/auth/register
```json
Request:
{
  "email": "doctor@clinic.com",
  "password": "SecurePass123!",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "MEDICO",
  "especialidad": "Cirugía Plástica",
  "telefono": "3012345678"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-123",
    "email": "doctor@clinic.com",
    "rol": "MEDICO",
    "nombre": "Juan"
  }
}
```

### POST /api/auth/login
```json
Request:
{
  "email": "doctor@clinic.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### POST /api/auth/refresh
```json
Request:
{
  "token": "expired_token"
}

Response (200):
{
  "success": true,
  "token": "new_valid_token"
}
```

### POST /api/auth/logout
```json
Response (200):
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

## 👥 PACIENTES

### GET /api/pacientes
**Parámetros Query:**
- `page`: número de página
- `limit`: registros por página
- `search`: búsqueda por nombre/documento
- `estado`: filtrar por estado

```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid-456",
      "numeroDocumento": "1234567890",
      "nombreCompleto": "María González",
      "edad": 32,
      "telefonos": ["3001234567"],
      "alergias": [
        {
          "nombre": "Penicilina",
          "severidad": "CRITICA"
        }
      ],
      "proximoControl": "2024-04-20",
      "estado": "ACTIVO"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

### POST /api/pacientes
**Crear nuevo paciente (<2 minutos)**

```json
Request:
{
  "numeroDocumento": "1234567890",
  "tipoDocumento": "CC",
  "nombreCompleto": "María González",
  "fechaNacimiento": "1992-05-15",
  "genero": "F",
  "telefonos": ["3001234567"],
  "email": "maria@email.com",
  "whatsapp": "3001234567",
  "alergias": [
    {
      "nombre": "Penicilina",
      "severidad": "CRITICA"
    }
  ],
  "medicacionActual": [
    {
      "nombre": "Ibuprofeno",
      "dosis": "400mg",
      "frecuencia": "cada 8h"
    }
  ]
}

Response (201):
{
  "success": true,
  "paciente": { ... }
}
```

### GET /api/pacientes/:pacienteId
```json
Response (200):
{
  "success": true,
  "paciente": {
    "id": "uuid-456",
    "nombreCompleto": "María González",
    "procedimientosHistoricos": [ ... ],
    "alertasActuales": [ ... ],
    "proximasCitas": [ ... ],
    "fotoPerfil": "https://..."
  }
}
```

### PUT /api/pacientes/:pacienteId
```json
Request:
{
  "nombreCompleto": "María González Updated",
  "telefonos": ["3001234567", "3019876543"],
  "medicacionActual": [ ... ]
}

Response (200):
{
  "success": true,
  "paciente": { ... }
}
```

---

## 📋 HISTORIA CLÍNICA

### GET /api/historia-clinica/:pacienteId
```json
Response (200):
{
  "success": true,
  "historias": [
    {
      "id": "uuid-789",
      "tipoHistoria": "ANAMNESIS",
      "fecha": "2024-04-15",
      "versión": 2,
      "editadoPor": "Dr. Juan Pérez",
      "contenido": {
        "quejaActual": "Desea rinoplastia",
        "duracionQuejaActual": "2 años",
        "traumaPrevi": false
      }
    }
  ]
}
```

### POST /api/historia-clinica/:pacienteId
```json
Request:
{
  "procedimientoId": "proc-123",
  "tipoHistoria": "ANAMNESIS",
  "contenido": {
    "quejaActual": "Desea rinoplastia",
    "duracionQuejaActual": "2 años",
    "antecedentes": {
      "asma": false,
      "diabetes": false,
      "hipertension": false
    }
  }
}

Response (201):
{
  "success": true,
  "historia": { ... }
}
```

### PUT /api/historia-clinica/:historiaId
```json
Request:
{
  "contenido": {
    ...cambios...
  }
}

Response (200):
{
  "success": true,
  "historia": {
    ...
    "version": 3,
    "fechaUltimaEdicion": "2024-04-15T14:30:00Z"
  }
}
```

---

## 🏥 PROCEDIMIENTOS

### GET /api/procedimientos?estado=PENDIENTE
```json
Response (200):
{
  "success": true,
  "procedimientos": [
    {
      "id": "proc-123",
      "paciente": {
        "nombreCompleto": "María González",
        "fotoPerfil": "..."
      },
      "tipoProcedimiento": "RINOPLASTIA",
      "fechaProgramada": "2024-04-20T10:00:00Z",
      "medico": "Dr. Juan Pérez",
      "estado": "PENDIENTE"
    }
  ]
}
```

### POST /api/procedimientos
```json
Request:
{
  "pacienteId": "pac-456",
  "medicoId": "med-789",
  "tipoProcedimiento": "RINOPLASTIA",
  "nombreProcedimiento": "Rinoplastia completa",
  "fechaProgramada": "2024-04-20T10:00:00Z",
  "duracionEstimada": 120
}

Response (201):
{
  "success": true,
  "procedimiento": { ... },
  "consentimientoTemplate": "HTML del consentimiento"
}
```

### GET /api/procedimientos/:procedimientoId/plantilla
```json
Response (200):
{
  "success": true,
  "plantilla": {
    "camposObligatorios": [ ... ],
    "riesgosAuto": [ "Asimetría residual", "Edema prolongado" ],
    "postoperatorioPorDias": [ ... ]
  }
}
```

---

## ✍️ CONSENTIMIENTO INFORMADO

### POST /api/consentimiento/:procedimientoId/generar
```json
Request:
{
  "plantillaId": "plant-123"
}

Response (201):
{
  "success": true,
  "consentimiento": {
    "id": "cons-456",
    "contenidoHtml": "<div>...",
    "status": "PENDIENTE_FIRMA"
  }
}
```

### POST /api/consentimiento/:consentimientoId/firmar
**Firma digital + selfie**

```json
Request:
{
  "firmaDigitalBase64": "data:image/png;base64,...",
  "selfieBase64": "data:image/png;base64,...",
  "ipDispositivo": "192.168.1.1",
  "navegador": "Chrome/120",
  "sistemaOperativo": "Windows 10"
}

Response (200):
{
  "success": true,
  "consentimiento": {
    "firmado": true,
    "fechaFirma": "2024-04-15T14:30:00Z",
    "pdfUrl": "https://s3.../consent_123.pdf"
  }
}
```

### GET /api/consentimiento/:consentimientoId/pdf
**Descargar PDF**

```
Response (200):
[PDF Binary Data]
```

---

## 📸 FOTOS CLÍNICAS

### POST /api/fotos
**Upload de fotos**

```
Content-Type: multipart/form-data

Campos:
- pacienteId: uuid
- procedimientoId: uuid
- tipo: ANTES|DESPUES|SEGUIMIENTO
- diasPostOperatorio: number (opcional)
- file: File

Response (201):
{
  "success": true,
  "foto": {
    "id": "foto-789",
    "urlOriginal": "https://s3.../original_123.jpg",
    "urlComprimida": "https://s3.../compressed_123.jpg",
    "urlMiniatura": "https://s3.../thumb_123.jpg"
  }
}
```

### GET /api/fotos/:pacienteId?procedimientoId=proc-123
```json
Response (200):
{
  "success": true,
  "fotos": [
    {
      "id": "foto-789",
      "tipo": "ANTES",
      "fechaCaptura": "2024-04-10",
      "urlMiniatura": "https://..."
    }
  ]
}
```

### POST /api/fotos/:fotoId/anotaciones
**Agregar anotaciones clínicas**

```json
Request:
{
  "anotaciones": [
    {
      "x": 45,
      "y": 60,
      "texto": "Asimetría dorsal",
      "tipo": "NORMAL"
    }
  ]
}

Response (200):
{
  "success": true
}
```

---

## 🗺️ MAPA CORPORAL

### POST /api/mapa-corporal/:procedimientoId
```json
Request:
{
  "zonasMarcadas": [
    {
      "nombre": "abdomen",
      "edema": "moderado",
      "dolor": 7,
      "fibrosis": false,
      "anotacion": "Inflamación normal post-op"
    }
  ]
}

Response (201):
{
  "success": true,
  "mapaCorporal": { ... }
}
```

### GET /api/mapa-corporal/:procedimientoId/historial
```json
Response (200):
{
  "success": true,
  "historial": [
    {
      "fecha": "2024-04-15",
      "zonas": [ ... ]
    },
    {
      "fecha": "2024-04-20",
      "zonas": [ ... ]
    }
  ]
}
```

---

## 📅 AGENDA / CITAS

### GET /api/citas?fecha=2024-04-15
```json
Response (200):
{
  "success": true,
  "citas": [
    {
      "id": "cita-123",
      "paciente": {
        "nombreCompleto": "María González",
        "fotoPerfil": "..."
      },
      "fechaHora": "2024-04-15T10:00:00Z",
      "duracion": 60,
      "medico": "Dr. Juan Pérez",
      "tipo": "PREOPERATORIO",
      "estado": "CONFIRMADA"
    }
  ]
}
```

### POST /api/citas
**Crear cita rápida**

```json
Request:
{
  "pacienteId": "pac-456",
  "medicoId": "med-789",
  "tipoCita": "PREOPERATORIO",
  "fechaHora": "2024-04-20T10:00:00Z",
  "duracionMinutos": 60,
  "motivo": "Valoración preoperatoria"
}

Response (201):
{
  "success": true,
  "cita": { ... },
  "mensajeWhatsApp": "Cita confirmada para el 20/4 a las 10:00 AM"
}
```

### POST /api/citas/:citaId/confirmar-whatsapp
```json
Response (200):
{
  "success": true,
  "mensaje": "Recordatorio enviado a 300..."
}
```

---

## 📊 SEGUIMIENTO POSTOPERATORIO

### GET /api/seguimiento/:procedimientoId
```json
Response (200):
{
  "success": true,
  "seguimiento": {
    "procedimientoId": "proc-123",
    "proximas": [
      {
        "diaPostOp": 3,
        "fechaPrevista": "2024-04-23",
        "tipoSeguimiento": "FOTOS",
        "completado": false
      },
      {
        "diaPostOp": 7,
        "fechaPrevista": "2024-04-27",
        "tipoSeguimiento": "CONTROL",
        "completado": false
      }
    ]
  }
}
```

### POST /api/seguimiento/:procedimientoId/checklist
**Paciente reporta síntomas**

```json
Request:
{
  "diaPostOp": 3,
  "respuestas": {
    "dolor_escala": 5,
    "drenaje_normal": true,
    "hematoma": false,
    "infeccion_signos": false
  },
  "fotos": ["foto-id-1", "foto-id-2"]
}

Response (201):
{
  "success": true,
  "alertasGeneradas": [
    {
      "tipo": "INFO",
      "mensaje": "Dolor dentro de lo esperado"
    }
  ],
  "requiereAtencionMedica": false
}
```

### GET /api/seguimiento/:procedimientoId/alertas
```json
Response (200):
{
  "success": true,
  "alertas": [
    {
      "id": "alert-123",
      "severidad": "ALTA",
      "tipo": "COMPLICACION",
      "descripcion": "Edema que progresa",
      "accion": "Requiere evaluación médica",
      "detectadaPor": "IA"
    }
  ]
}
```

---

## 💰 FACTURACIÓN

### GET /api/transacciones/:pacienteId
```json
Response (200):
{
  "success": true,
  "transacciones": [
    {
      "id": "trans-123",
      "concepto": "Rinoplastia",
      "monto": 5000000,
      "moneda": "COP",
      "tipo": "CARGO",
      "fecha": "2024-04-10",
      "estado": "PENDIENTE"
    }
  ],
  "resumen": {
    "totalCargos": 5000000,
    "totalPagos": 2000000,
    "saldo": 3000000
  }
}
```

### POST /api/transacciones
```json
Request:
{
  "pacienteId": "pac-456",
  "procedimientoId": "proc-123",
  "tipo": "PAGO",
  "concepto": "Abono Rinoplastia",
  "monto": 2000000,
  "moneda": "COP",
  "metodoPago": "TARJETA",
  "referenciaPago": "TXN123456"
}

Response (201):
{
  "success": true,
  "transaccion": { ... },
  "reciboUrl": "https://..."
}
```

---

## 🚨 ALERTAS

### GET /api/alertas?severidad=CRITICA
```json
Response (200):
{
  "success": true,
  "alertas": [
    {
      "id": "alert-123",
      "paciente": {
        "nombreCompleto": "María González",
        "id": "pac-456"
      },
      "tipo": "COMPLICACION",
      "severidad": "CRITICA",
      "descripcion": "Signos de infección post-op",
      "accionRecomendada": "Contactar inmediatamente",
      "iaDetectada": true,
      "createdAt": "2024-04-15T14:30:00Z"
    }
  ]
}
```

### POST /api/alertas/:alertaId/resolver
```json
Request:
{
  "notas": "Se evaluó paciente, infección descartada"
}

Response (200):
{
  "success": true
}
```

---

## 📈 DASHBOARD

### GET /api/dashboard
```json
Response (200):
{
  "success": true,
  "stats": {
    "pacientesActivos": 45,
    "citasHoy": 8,
    "procedimientosProximos": 12,
    "pacientesEnSeguimiento": 23,
    "alertasCriticas": 2,
    "ingresosMes": 45000000
  },
  "pacientesResumen": [
    {
      "id": "pac-456",
      "nombreCompleto": "María González",
      "procedimientoActual": "RINOPLASTIA",
      "estado": "POST_OP",
      "diaPostOp": 3,
      "alertas": [
        {
          "tipo": "NORMAL",
          "mensaje": "Evolución dentro de lo esperado"
        }
      ],
      "proximoControl": "2024-04-20"
    }
  ]
}
```

---

## 🔍 BÚSQUEDA INTELIGENTE

### GET /api/buscar?q=rinoplastia
```json
Response (200):
{
  "success": true,
  "resultados": {
    "pacientes": [ ... ],
    "procedimientos": [ ... ],
    "citas": [ ... ]
  }
}
```

---

## ⚙️ ERRORES ESTÁNDAR

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email requerido",
    "details": [
      {
        "field": "email",
        "message": "Formato inválido"
      }
    ]
  }
}
```

### Códigos de Error
```
200 OK
201 CREATED
400 BAD_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
500 INTERNAL_SERVER_ERROR
503 SERVICE_UNAVAILABLE
```

---

Especificación de API continúa...
