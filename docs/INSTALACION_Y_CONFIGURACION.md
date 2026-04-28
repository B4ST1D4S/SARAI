# GUÍA DE INSTALACIÓN Y CONFIGURACIÓN

## 🚀 INICIO RÁPIDO (5 minutos)

### 1. Clonar repositorio
```bash
git clone https://github.com/tu-org/estegia.git
cd estegia
```

### 2. Configurar variables de entorno

#### Frontend `.env.local`
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

#### Backend `.env`
```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/estegia"
MONGODB_URL="mongodb://localhost:27017/estegia"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# APIs Externas
STRIPE_SECRET_KEY=sk_test_...
TWILIO_AUTH_TOKEN=...  // Para SMS/WhatsApp
OPENAI_API_KEY=sk-...

# Almacenamiento
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=estegia-files
AWS_REGION=us-east-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@estegia.com
SMTP_PASS=...

# App
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### 3. Instalar dependencias

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 4. Configurar base de datos

```bash
# Crear base de datos PostgreSQL
createdb estegia

# Ejecutar migraciones
cd backend
npm run migrate

# Generar Prisma client
npm run generate
```

### 5. Iniciar desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server en http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App en http://localhost:5173
```

---

## 🐘 PostgreSQL Setup

### Instalación (Windows)
```bash
# Usando chocolatey
choco install postgresql

# O descargar desde: https://www.postgresql.org/download/windows/
```

### Crear usuario y base de datos
```bash
psql -U postgres

CREATE USER estegia_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE estegia OWNER estegia_user;
GRANT ALL PRIVILEGES ON DATABASE estegia TO estegia_user;

\q
```

### Verificar conexión
```bash
psql -h localhost -U estegia_user -d estegia
```

---

## 🗂️ MongoDB Setup

### Docker Compose (Recomendado)
```bash
# Crear docker-compose.yml en la raíz
version: '3.8'
services:
  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db

  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: estegia_user
      POSTGRES_PASSWORD: secure_password_123
      POSTGRES_DB: estegia
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## 🔧 Estructura de Carpetas

```
estegia/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # UI componentes reutilizables
│   │   │   ├── layout/      # Header, Sidebar, Footer
│   │   │   └── medical/     # Mapa corporal, Before/After, etc
│   │   ├── modules/         # Módulos por funcionalidad
│   │   │   ├── dashboard/
│   │   │   ├── pacientes/
│   │   │   ├── historia-clinica/
│   │   │   ├── procedimientos/
│   │   │   ├── consentimiento/
│   │   │   ├── agenda/
│   │   │   └── seguimiento/
│   │   ├── pages/           # Rutas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Redux state
│   │   ├── services/        # API calls
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers
│   │   ├── styles/          # CSS globales
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── pacientes.ts
│   │   │   ├── historia-clinica.ts
│   │   │   ├── procedimientos.ts
│   │   │   ├── consentimiento.ts
│   │   │   ├── fotos.ts
│   │   │   ├── citas.ts
│   │   │   ├── seguimiento.ts
│   │   │   ├── facturacion.ts
│   │   │   └── dashboard.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/          # Prisma schemas
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # DB schema
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── ARQUITECTURA_SISTEMA.md
│   ├── COMPONENTES_UI.md
│   ├── API_ENDPOINTS.md
│   ├── FLUJOS_CLAVE.md
│   └── SEGURIDAD_CUMPLIMIENTO.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📦 Dependencias Clave

### Frontend
- **React 18**: Framework UI
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Redux Toolkit**: State management
- **React Query**: Data fetching & caching
- **Framer Motion**: Animaciones
- **Socket.io Client**: Real-time updates

### Backend
- **Express.js**: Web framework
- **Prisma**: ORM
- **PostgreSQL**: Base de datos relacional
- **MongoDB**: Documentos y historiales
- **Redis**: Cache y sesiones
- **Socket.io**: WebSockets
- **Bull Queue**: Tareas en background
- **OpenAI**: IA para dictado y análisis
- **Sharp**: Compresión de imágenes
- **PDFKit**: Generación de PDFs

---

## 🔐 Seguridad - Checklist Pre-Producción

### JWT y Autenticación
- [ ] JWT_SECRET: Al menos 32 caracteres aleatorios
- [ ] Tokens con expiración corta (15 min access, 30 días refresh)
- [ ] MFA habilitado para cuentas de médicos
- [ ] Password hash con bcryptjs (10+ rounds)

### Base de Datos
- [ ] Encriptación en tránsito (SSL)
- [ ] Encriptación de datos sensibles en reposo
- [ ] Backups automáticos cada 6 horas
- [ ] Logs de auditoría completos (no editables)

### APIs Externas
- [ ] Rate limiting (100 requests/min por IP)
- [ ] CORS configurado correctamente
- [ ] HTTPS obligatorio en producción
- [ ] Validación y sanitización de inputs

### Datos Médicos
- [ ] HIPAA compliance (si aplica)
- [ ] PII (Personally Identifiable Information) encriptada
- [ ] Acceso restringido por rol
- [ ] Logs de acceso a datos sensibles

---

## 📊 Performance Optimization

### Frontend
```typescript
// Lazy loading de módulos
const Dashboard = React.lazy(() => import('./modules/dashboard'));
const Pacientes = React.lazy(() => import('./modules/pacientes'));

// Code splitting automático con Vite
```

### Backend
```typescript
// Caching con Redis
await redis.set(`paciente:${id}`, JSON.stringify(data), 'EX', 3600);

// Paginación eficiente
const users = await prisma.pacientes.findMany({
  take: 10,
  skip: (page - 1) * 10,
});

// Índices en BD
CREATE INDEX idx_paciente_documento ON pacientes(numero_documento);
CREATE INDEX idx_historia_fecha ON historia_clinica(created_at DESC);
```

---

## 🚀 Deployment

### Frontend - Vercel
```bash
cd frontend
npm install -g vercel
vercel

# Environment variables en Vercel dashboard
```

### Backend - Railway / Render
```bash
# Railway
railway up

# Render
# Conectar GitHub repo y configurar en dashboard
```

### Base de Datos - AWS RDS
```bash
# Crear instancia PostgreSQL
# Actualizar connection string en .env
```

---

## 📝 Próximos Pasos

1. **Completar Prisma Schema** (datos types actualizados)
2. **Implementar Auth middleware**
3. **Crear servicios de API** (axios + React Query)
4. **Desarrollar Dashboard principal**
5. **Sistema de pacientes (CRUD)**
6. **Historia clínica dinámica**
7. **Consentimiento digital**
8. **Integración WhatsApp**
9. **Sistema de IA**
10. **Testing y QA**

---

## 💬 Soporte

- Documentación: `/docs`
- Issues: GitHub Issues
- Slack: #estegia-dev
- Email: dev@estegia.com

---

¡Listo para desarrollar! 🎉
