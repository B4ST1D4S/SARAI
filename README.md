# 🏥 ESTEGIA - HISTORIA CLÍNICA ESTÉTICA INTELIGENTE

**Software SaaS Premium para Cirugía y Medicina Estética**

![Status](https://img.shields.io/badge/Status-MVP%20Ready-green)
![License](https://img.shields.io/badge/License-Proprietary-blue)
![Colombia](https://img.shields.io/badge/Compliance-Colombia%20Healthcare-red)

---

## 📋 DESCRIPCIÓN

**EstetIA** es una plataforma web de nivel **PREMIUM** diseñada especialmente para profesionales de la cirugía y medicina estética. Combina:

✅ **Inteligencia Clínica**: Historias dinámicas, plantillas por procedimiento  
✅ **Blindaje Legal**: Consentimiento digital certificado, auditoría completa  
✅ **Experiencia Premium**: UI/UX de clase mundial, antes/después, timeline visual  
✅ **Automatización**: WhatsApp, recordatorios, seguimiento post-op  
✅ **Cumplimiento Legal**: Resolución 1995, 3100, Ley 1581 (Colombia)

---

## 🎯 OBJETIVO PRINCIPAL

**Reducir el tiempo de consulta a menos de 7 minutos SIN perder calidad clínica ni protección legal.**

### Resultados Esperados:
- ⏱️ Ahorro administrativo: **40%**
- 📈 Satisfacción médico: **>95%**
- 👥 Satisfacción paciente: **>90%**
- ⚖️ Cumplimiento legal: **100%**

---

## 🚀 CARACTERÍSTICAS PRINCIPALES

### 1. **Dashboard Inteligente** 📊
- Vista completa del paciente en 10 segundos
- Alertas clínicas en tiempo real
- KPIs de negocio
- Próximos procedimientos

### 2. **Gestión de Pacientes** 👥
- Registro express (<2 minutos)
- Perfil clínico completo
- Historial unificado
- Integración WhatsApp

### 3. **Historia Clínica Dinámica** 📝
- Formularios adaptativos por procedimiento
- Auto-completado inteligente
- Versionamiento y auditoría
- Nunca se borra (cumplimiento legal)

### 4. **Plantillas Inteligentes** 🏥
- **Faciales**: Rinoplastia, Blefaroplastia, Lifting, etc.
- **Corporales**: Liposucción, Abdominoplastia, Mamoplastia
- **No invasivos**: Botox, Ácido hialurónico, Hilos, Plasma
- Riesgos y complicaciones automáticas

### 5. **Módulo Visual PREMIUM** 📸
- Comparador antes/después (slider interactivo)
- Timeline de evolución por días
- Mapa corporal interactivo
- Zoom clínico para detalles
- Marcaje de edema, fibrosis, dolor

### 6. **Consentimiento Informado BLINDADO** ✍️
- Generación automática por procedimiento
- Firma digital con canvas (natural)
- Captura de selfie + validación
- Registro: fecha, hora, IP, geolocalización
- Exportación PDF con marca de agua
- Cumplimiento Resolución 1995

### 7. **Agenda Inteligente** 📅
- Calendario visual tipo sistema médico
- Creación de citas en <30 segundos
- Recordatorios automáticos vía WhatsApp
- Reprogramación inteligente
- Visualización de quirófano

### 8. **Seguimiento Postoperatorio** 🔔
- Automatización por días (Día 1, 3, 7, 15, 30)
- Checklist automático para pacientes
- Subida de fotos con IA
- Detección de alertas visuales
- Notificación inmediata al médico

### 9. **Vista Cirujano (Modo Rápido)** 🏨
- Pantalla única pre-quirófano
- Foto, alergias, medicación, alertas
- Checklist preoperatorio
- Confirmación: consentimiento, ayuno, exámenes

### 10. **Inteligencia Artificial** 🤖
- Dictado clínico por voz (Whisper)
- Transcripción automática
- Resumen de evolución
- Detección de inconsistencias
- Sugerencias clínicas

### 11. **CRM Estético** 💼
- Embudo: Cotización → Agendación → Cirugía → Seguimiento
- Campañas WhatsApp: Cumpleaños, retoques, recordatorios

### 12. **Facturación** 💰
- Abonos y cuotas
- Paquetes de procedimientos
- Estado de cuenta paciente
- Reportes financieros

---

## 🏗️ ARQUITECTURA TÉCNICA

```
┌─────────────────────────────────────────┐
│     FRONTEND (React + TypeScript)        │
│  • Dashboard, Pacientes, HC, Fotos       │
│  • Consentimiento digital                │
│  • Mapas corporales interactivos         │
│  • UI Premium: Tailwind + Framer Motion  │
└────────────────┬────────────────────────┘
                 │ REST API + WebSockets
┌────────────────▼────────────────────────┐
│    BACKEND (Node.js + Express)           │
│  • Autenticación JWT                     │
│  • Gestión de pacientes                  │
│  • Motor de HC adaptativa                │
│  • Generación de documentos              │
│  • IA y análisis visual                  │
│  • Integración WhatsApp                  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▴────────────────────────┐
│           BASES DE DATOS                 │
│  • PostgreSQL: Datos clínicos            │
│  • MongoDB: Documentos                   │
│  • Redis: Cache/Sesiones                 │
│  • S3: Fotos/PDFs                        │
└─────────────────────────────────────────┘
```

### Stack Tecnológico:
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Redux Toolkit
- **Backend**: Node.js + Express + Prisma ORM
- **Bases de Datos**: PostgreSQL + MongoDB + Redis
- **APIs Externas**: OpenAI (IA), Stripe (pagos), Twilio (WhatsApp)
- **DevOps**: Docker, GitHub Actions, Railway/Render

---

## 📁 ESTRUCTURA DEL PROYECTO

```
EstetIA/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/         # UI reutilizables
│   │   ├── modules/            # Módulos funcionales
│   │   ├── pages/              # Rutas principales
│   │   ├── hooks/              # Custom hooks
│   │   ├── store/              # Redux state
│   │   ├── services/           # API calls
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utilidades
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── routes/             # Endpoints
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── services/           # Servicios
│   │   ├── middleware/         # Auth, validation
│   │   ├── utils/              # Helpers
│   │   └── index.ts            # Entry point
│   ├── prisma/
│   │   └── schema.prisma       # DB schema
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # Documentación
│   ├── ARQUITECTURA_SISTEMA.md
│   ├── COMPONENTES_UI.md
│   ├── API_ENDPOINTS.md
│   ├── FLUJOS_CLAVE.md
│   └── INSTALACION_Y_CONFIGURACION.md
│
├── docker-compose.yml           # Dev environment
└── README.md
```

---

## ⚡ INICIO RÁPIDO

### Requisitos:
- Node.js 18+
- PostgreSQL 14+
- Docker (opcional pero recomendado)
- Git

### Instalación (5 minutos):

```bash
# 1. Clonar
git clone https://github.com/tu-org/estegia.git
cd estegia

# 2. Bases de datos (Docker Compose)
docker-compose up -d

# 3. Frontend
cd frontend
npm install
npm run dev

# 4. Backend (nueva terminal)
cd backend
npm install
npm run migrate
npm run dev
```

✅ App lista en: `http://localhost:5173`

**Ver documentación completa en**: [INSTALACION_Y_CONFIGURACION.md](./docs/INSTALACION_Y_CONFIGURACION.md)

---

## 📚 DOCUMENTACIÓN

| Documento | Descripción |
|-----------|-------------|
| [ARQUITECTURA_SISTEMA.md](./docs/ARQUITECTURA_SISTEMA.md) | Diseño técnico, módulos, BD |
| [COMPONENTES_UI.md](./docs/COMPONENTES_UI.md) | Diseño premium, paleta, componentes |
| [API_ENDPOINTS.md](./docs/API_ENDPOINTS.md) | Especificación de endpoints REST |
| [FLUJOS_CLAVE.md](./docs/FLUJOS_CLAVE.md) | Flujos de usuario (onboarding, citas, etc) |
| [INSTALACION_Y_CONFIGURACION.md](./docs/INSTALACION_Y_CONFIGURACION.md) | Setup inicial y deployment |

---

## 🔐 SEGURIDAD Y CUMPLIMIENTO

### Normativa Colombiana Implementada:
✅ **Resolución 1995 de 1999**: Historia clínica trazable, no eliminable  
✅ **Resolución 3100 de 2019**: Control de roles y permisos  
✅ **Ley 1581 de 2012**: Protección de datos personales (HABEAS DATA)  
✅ **Ley 1273 de 2009**: Delitos informáticos (encriptación)  

### Medidas de Seguridad:
- 🔐 JWT + Refresh tokens
- 🔒 Encriptación AES-256 (datos sensibles)
- 📋 Logs de auditoría inmutables
- 🔄 Versionamiento de cambios
- ⏱️ Backups automáticos cada 6h
- 👤 Control de acceso por roles (RBAC)
- 🛡️ CORS y HTTPS obligatorio

---

## 📊 MÓDULOS Y ENDPOINTS CLAVE

### Pacientes
```
POST   /api/pacientes                    Crear paciente (<2 min)
GET    /api/pacientes                    Listar pacientes
GET    /api/pacientes/:id                Detalle paciente
PUT    /api/pacientes/:id                Actualizar paciente
```

### Historia Clínica
```
POST   /api/historia-clinica/:pacienteId  Crear historia
PUT    /api/historia-clinica/:historiaId  Actualizar historia (versionado)
GET    /api/historia-clinica/:pacienteId  Ver historial completo
```

### Consentimiento
```
POST   /api/consentimiento/:procId/generar              Generar template
POST   /api/consentimiento/:consId/firmar               Firmar digital
GET    /api/consentimiento/:consId/pdf                  Descargar PDF
```

### Fotos Clínicas
```
POST   /api/fotos                        Subir foto
GET    /api/fotos/:pacienteId            Listar fotos
POST   /api/fotos/:fotoId/anotaciones    Agregar anotaciones
```

### Seguimiento
```
GET    /api/seguimiento/:procId          Estado actual
POST   /api/seguimiento/:procId/checklist Reportar síntomas
GET    /api/seguimiento/:procId/alertas   Ver alertas generadas
```

**Ver todos los endpoints**: [API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)

---

## 🎯 FLUJOS DE USUARIO

### Flujo 1: Onboarding Paciente (Express)
📍 Entrada: Nuevo paciente  
⏱️ Tiempo: <2 minutos  
✅ Salida: Paciente creado con datos básicos, alergias, medicación

### Flujo 2: Crear Cita con Plantilla
📍 Entrada: Seleccionar paciente y procedimiento  
⏱️ Tiempo: <30 segundos  
✅ Salida: Cita, plantilla, consentimiento, recordatorio WhatsApp

### Flujo 3: Historia Clínica Dinámica
📍 Entrada: Abrir cita  
✨ Auto-completado inteligente  
✅ Salida: Historia versionada, auditable, firmada

### Flujo 4: Consentimiento Digital BLINDADO
📍 Entrada: Paciente accede a modal  
🔐 Firma digital + selfie + datos de auditoría  
✅ Salida: PDF con marca de agua, almacenado seguro

### Flujo 5: Seguimiento Postoperatorio
📍 Entrada: Procedimiento realizado  
🔔 Automatización por días (1, 3, 7, 15, 30)  
✅ Salida: Paciente reporta síntomas, IA detecta alertas

**Ver flujos detallados**: [FLUJOS_CLAVE.md](./docs/FLUJOS_CLAVE.md)

---

## 🎨 DISEÑO UI/UX PREMIUM

### Paleta de Colores:
- **Base**: Azul oscuro elegante (`#020617`)
- **Accent**: Dorado premium (`#d4af37`)
- **Status**: Rojo/Naranja/Verde (clínico)
- **Text**: Blanco sobre oscuro (contraste 4.5:1+)

### Componentes Clave:
- 📇 **Cards**: Premium con línea dorada
- 🎚️ **Sliders**: Antes/después interactivo
- 🗺️ **Mapa corporal**: Clickeable con colorimetría
- ⏳ **Timeline**: Evolución visual por días
- ✍️ **Firma digital**: Canvas natural con presión

**Ver especificación completa**: [COMPONENTES_UI.md](./docs/COMPONENTES_UI.md)

---

## 📈 ROADMAP

### FASE 1: MVP (2-3 meses) ✅
- [x] Arquitectura sistema
- [x] Autenticación y roles
- [x] Gestión de pacientes
- [x] Historia clínica básica
- [x] Plantillas por procedimiento
- [x] Consentimiento digital
- [x] Dashboard básico

### FASE 2: Funciones Premium (2 meses) 🚀
- [ ] Módulo visual avanzado (timeline, maps)
- [ ] Seguimiento postoperatorio con IA
- [ ] Integración WhatsApp completa
- [ ] CRM estético
- [ ] Facturación integrada

### FASE 3: Inteligencia Artificial (2 meses)
- [ ] Dictado clínico por voz
- [ ] Análisis visual automático
- [ ] Alertas predictivas
- [ ] Sugerencias clínicas por protocolo

### FASE 4: Escalabilidad (1 mes)
- [ ] Optimización performance
- [ ] Multi-tenant (múltiples clínicas)
- [ ] Certificaciones (ISO 27001)
- [ ] Auditoría externa

---

## 💡 DIFERENCIAL DEL PRODUCTO

No es un software médico común. EstetIA es:

1. **Un asistente clínico inteligente**
   - Auto-completado de historias
   - Sugerencias basadas en protocolo
   - Detección de inconsistencias

2. **Un blindaje legal automático**
   - Consentimiento certificado
   - Auditoría inmutable
   - Cumplimiento 100% normativa

3. **Un sistema visual de impacto**
   - Antes/después slider
   - Timeline de evolución
   - Mapa corporal interactivo

4. **Un optimizador de tiempo médico**
   - Registro express: <2 min
   - Cita inteligente: <30 seg
   - Ahorro administrativo: 40%

---

## 🔧 DESARROLLO LOCAL

### Variables de Entorno:

**.env (Backend)**
```env
DATABASE_URL="postgresql://user:pass@localhost/estegia"
JWT_SECRET=your-super-secret-key-min-32-chars
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
```

**.env.local (Frontend)**
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### Comandos Útiles:

```bash
# Backend
npm run dev                 # Inicia servidor dev
npm run migrate            # Corre migraciones
npm run generate           # Regenera Prisma client
npm run lint               # Lint TypeScript

# Frontend
npm run dev                # Vite dev server
npm run build              # Build producción
npm run lint               # ESLint

# Docker
docker-compose up          # Inicia BD + Redis
docker-compose down        # Detiene servicios
```

---

## 🤝 CONTRIBUCIÓN

Este es un proyecto propietario. Para colaborar:
1. Crear feature branch: `git checkout -b feature/nombre`
2. Commit cambios: `git commit -m "feat: descripción"`
3. Push: `git push origin feature/nombre`
4. Pull Request con descripción detallada

---

## 📞 SOPORTE

- **Email**: dev@estegia.com
- **Documentación**: `/docs`
- **Issues**: GitHub Issues
- **Slack**: #estegia-dev

---

## 📄 LICENCIA

Propietario. Todos los derechos reservados. © 2024 EstetIA

---

## 🙏 AGRADECIMIENTOS

Diseñado para reducir carga administrativa y elevar estándares de atención en cirugía estética en América Latina.

**Mensaje Final del Producto:**
> "Este sistema reduce el tiempo administrativo en un 40%, protege legalmente al profesional y mejora radicalmente el seguimiento del paciente."

---

**¿Listo para revolucionar tu consulta? 🚀 Comienza con la [Guía de Instalación](./docs/INSTALACION_Y_CONFIGURACION.md)**
