# 🚀 DOCKER NO ESTÁ INSTALADO - SOLUCIÓN RÁPIDA

Veo que recibiste este error:
```
docker : El término 'docker' no se reconoce como nombre de un cmdlet
```

## ✅ SOLUCIÓN EN 2 OPCIONES

### OPCIÓN A: Instalar Docker (Recomendado - 10 minutos)

1. **Descargar Docker Desktop para Windows:**
   - Ve a: https://www.docker.com/products/docker-desktop
   - Click en "Download for Windows"
   - Ejecuta el instalador

2. **Durante la instalación:**
   - Selecciona "WSL 2 backend" (mejor opción)
   - Deja las opciones por defecto

3. **Después de instalar:**
   - Reinicia tu Windows
   - Abre una terminal PowerShell nueva
   - Verifica: `docker --version`

4. **Luego:**
   ```powershell
   cd C:\proyect\EstetIA
   docker compose up -d
   ```

### OPCIÓN B: Setup Manual (SIN Docker - 20 minutos)

Si prefieres NO instalar Docker, instala todo localmente:

1. **PostgreSQL:**
   ```powershell
   choco install postgresql14
   # O descarga desde: https://www.postgresql.org/download/windows/
   ```

2. **MongoDB:**
   ```powershell
   choco install mongodb-community
   # O descarga desde: https://www.mongodb.com/try/download/community
   ```

3. **Redis (en WSL):**
   ```powershell
   wsl
   sudo apt-get update
   sudo apt-get install redis-server
   redis-server
   ```

4. **Actualiza el archivo `.env` en la carpeta backend:**
   ```env
   DATABASE_URL="postgresql://estegia_user:secure_password_123@localhost:5432/estegia"
   MONGODB_URL="mongodb://localhost:27017/estegia"
   REDIS_URL="redis://localhost:6379"
   ```

---

## 🎯 DESPUÉS DE ELEGIR UNA OPCIÓN

Una vez tengas las BDs corriendo (Docker O manual), ejecuta:

```powershell
cd C:\proyect\EstetIA

# Script automático (RECOMENDADO)
.\setup.ps1
# Elige opción "1" para instalación automática

# O manualmente:
cd backend
npm install
npm run migrate
npm run generate
npm run dev

# En otra terminal:
cd frontend
npm install
npm run dev
```

---

## 📞 ¿NECESITAS AYUDA?

Ver el archivo: **[QUICK_START.md](./QUICK_START.md)** para guía detallada.

---

**¿Qué opción eliges? Docker (A) o Manual (B)?**
