# 🚀 GUÍA RÁPIDA DE INSTALACIÓN - ESTEGIA

## ⚠️ PROBLEMA: Docker no está instalado

### ✅ SOLUCIÓN RECOMENDADA: Instalar Docker Desktop (5 minutos)

```powershell
# 1. Descargar Docker Desktop
#    https://www.docker.com/products/docker-desktop
#    
#    Elige: "Docker Desktop for Windows"
#    Descarga e instala normalmente
#    Reinicia tu PC cuando termine

# 2. Verifica que Docker está instalado:
docker --version
docker compose version

# 3. Luego vuelve a esta carpeta y ejecuta:
cd C:\proyect\EstetIA
docker compose up -d

# 4. Espera a que terminen las 3 imágenes (postgres, mongo, redis)
docker compose logs -f

# 5. Cuando veas "ready to accept connections", presiona Ctrl+C

# 6. Verifica que está corriendo:
docker compose ps
```

---

## 🔧 ALTERNATIVA: Sin Docker (Instalación Manual)

Si NO quieres instalar Docker:

### PASO 1: Instalar PostgreSQL
```powershell
# Opción A: Con Chocolatey (recomendado)
choco install postgresql14

# Opción B: Descargar manualmente
#    https://www.postgresql.org/download/windows/
```

**Después de instalar PostgreSQL:**
```powershell
# Abre PowerShell como administrador y ejecuta:
$env:PGPASSWORD="postgres"
psql -U postgres -h localhost

# En la terminal de psql:
CREATE USER estegia_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE estegia OWNER estegia_user;
GRANT ALL PRIVILEGES ON DATABASE estegia TO estegia_user;
\q
```

### PASO 2: Instalar MongoDB
```powershell
# Opción A: Con Chocolatey
choco install mongodb-community

# Opción B: Descargar desde
#    https://www.mongodb.com/try/download/community

# Después, inicia el servicio:
net start MongoDB
```

### PASO 3: Instalar Redis
```powershell
# Opción A: Instalar con WSL (más fácil)
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server

# Opción B: Descargar Windows port
#    https://github.com/microsoftarchive/redis/releases

# O usar una alternativa de Windows:
choco install memurai  # versión de Windows de Redis
```

---

## 📋 SETUP DEL PROYECTO

### Backend Setup:
```powershell
cd C:\proyect\EstetIA\backend

# Copiar .env
copy ..\.env.example .env

# Instalar dependencias
npm install

# Crear migraciones
npm run migrate

# Generar Prisma client
npm run generate

# Iniciar servidor
npm run dev
# Debe mostrar: "Server running on http://localhost:3001"
```

### Frontend Setup (NUEVA TERMINAL):
```powershell
cd C:\proyect\EstetIA\frontend

# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
# Debe mostrar: "VITE v5.0.0  ready in XXX ms"
# Y un link como: "http://localhost:5173"
```

---

## ✅ VERIFICACIÓN

### Verificar que todo está corriendo:

```powershell
# Terminal 1: Backend debe estar corriendo
# Terminal 2: Frontend debe estar corriendo
# Terminal 3: Verifica las BDs

# PostgreSQL:
psql -U estegia_user -d estegia -h localhost
\q

# MongoDB:
mongosh

# Redis:
redis-cli ping
# Debe responder: PONG
```

---

## 🎯 RESULTADO ESPERADO

Si todo está correcto, deberías ver:

**Backend Console:**
```
[info] Server running on http://localhost:3001
[info] Connected to PostgreSQL
[info] Connected to MongoDB
[info] Connected to Redis
```

**Frontend Console:**
```
VITE v5.0.0  ready in 345 ms

➜  Local:   http://localhost:5173/
```

**Browser:**
- Abre http://localhost:5173
- Deberías ver la app cargando (con skeleton loaders)

---

## 🆘 TROUBLESHOOTING

### Error: "docker: command not found"
→ Docker no está instalado. Ve a https://www.docker.com/products/docker-desktop

### Error: "npm: command not found"
→ Node.js no está instalado. Descarga desde https://nodejs.org/

### Error: "psql: command not found"
→ PostgreSQL no está en PATH. Añade `C:\Program Files\PostgreSQL\14\bin` a PATH

### Error: "Connection refused" en Backend
→ Las BDs (PostgreSQL, MongoDB, Redis) no están corriendo
→ Inicia los servicios manualmente

### Error: "EADDRINUSE" en puerto 3001
→ Ya hay algo corriendo en ese puerto
→ Cambia PORT en .env del backend

---

## 🎬 PRÓXIMOS PASOS

Después de que todo esté corriendo:

1. Abre http://localhost:5173 en el navegador
2. Deberías ver un login
3. (Temporalmente sin autenticación para testing)
4. Puedes explorar la estructura de la app

---

## 📞 DUDAS FRECUENTES

**P: ¿Necesito Docker obligatoriamente?**
R: No. Puedes instalar PostgreSQL, MongoDB y Redis manualmente en Windows.

**P: ¿Qué versión de Node?**
R: 18+ (verifica con `node --version`)

**P: ¿Qué puerto usa cada cosa?**
R: 
- Frontend: 5173
- Backend: 3001
- PostgreSQL: 5432
- MongoDB: 27017
- Redis: 6379

**P: ¿Necesito todas las BDs?**
R: Sí, para desarrollo local necesitas PostgreSQL + MongoDB + Redis

---

Elige la opción (Docker o Manual) y déjame saber cualquier error 🚀
