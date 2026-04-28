# Script para automatizar instalación en Windows
# Usar: .\setup.ps1

Write-Host "🚀 ESTEGIA - Setup Automático para Windows" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

# Verificar si estamos en el directorio correcto
if (-not (Test-Path ".\frontend\package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde c:\proyect\EstetIA" -ForegroundColor Red
    exit 1
}

# Menú de opciones
Write-Host "`nElige una opción:`n" -ForegroundColor Yellow
Write-Host "1. Instalar TODO (Docker + Node modules)" -ForegroundColor Cyan
Write-Host "2. Solo instalar Node modules (necesitas BDs)" -ForegroundColor Cyan
Write-Host "3. Iniciar servidores (dev)" -ForegroundColor Cyan
Write-Host "4. Verificar instalación" -ForegroundColor Cyan
Write-Host "`n"

$choice = Read-Host "Opción (1-4)"

switch($choice) {
    "1" {
        Write-Host "`n📦 Instalando dependencias del frontend..." -ForegroundColor Green
        cd frontend
        npm install
        cd ..
        
        Write-Host "`n📦 Instalando dependencias del backend..." -ForegroundColor Green
        cd backend
        npm install
        Write-Host "`n🔄 Generando Prisma client..." -ForegroundColor Green
        npm run generate
        cd ..
        
        Write-Host "`n🐳 Iniciando Docker Compose..." -ForegroundColor Green
        docker compose up -d
        
        if ($?) {
            Write-Host "`n✅ Setup completado exitosamente!" -ForegroundColor Green
            Write-Host "`nPróximo: Ejecuta este script nuevamente y elige opción 3 para iniciar los servidores" -ForegroundColor Cyan
        } else {
            Write-Host "`n⚠️  Docker no está disponible. Instálalo desde https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host "`n📦 Instalando dependencias del frontend..." -ForegroundColor Green
        cd frontend
        npm install
        cd ..
        
        Write-Host "`n📦 Instalando dependencias del backend..." -ForegroundColor Green
        cd backend
        npm install
        Write-Host "`n🔄 Generando Prisma client..." -ForegroundColor Green
        npm run generate
        cd ..
        
        Write-Host "`n⚠️  Recuerda: Debes tener PostgreSQL, MongoDB y Redis corriendo localmente" -ForegroundColor Yellow
        Write-Host "`nVer: QUICK_START.md para instalación manual" -ForegroundColor Cyan
    }
    
    "3" {
        Write-Host "`n🚀 Iniciando servidores de desarrollo..." -ForegroundColor Green
        Write-Host "`nAbriré dos terminales (Backend y Frontend)..." -ForegroundColor Cyan
        
        # Backend
        Write-Host "`n🔧 Iniciando Backend en puerto 3001..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
        
        Start-Sleep -Seconds 3
        
        # Frontend
        Write-Host "`n🎨 Iniciando Frontend en puerto 5173..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"
        
        Write-Host "`n✅ Servidores iniciados!" -ForegroundColor Green
        Write-Host "`nFrontend: http://localhost:5173" -ForegroundColor Cyan
        Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host "`n🔍 Verificando instalación..." -ForegroundColor Green
        
        # Node
        Write-Host "`n📌 Node.js: " -ForegroundColor Yellow -NoNewline
        if (Get-Command node -ErrorAction SilentlyContinue) {
            $nodeVersion = node --version
            Write-Host "✅ $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ No instalado. Descarga desde https://nodejs.org/" -ForegroundColor Red
        }
        
        # npm
        Write-Host "📌 npm: " -ForegroundColor Yellow -NoNewline
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            $npmVersion = npm --version
            Write-Host "✅ $npmVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ No instalado" -ForegroundColor Red
        }
        
        # Docker
        Write-Host "📌 Docker: " -ForegroundColor Yellow -NoNewline
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            $dockerVersion = docker --version
            Write-Host "✅ $dockerVersion" -ForegroundColor Green
            
            Write-Host "📌 Docker Compose: " -ForegroundColor Yellow -NoNewline
            if (Get-Command docker -ErrorAction SilentlyContinue) {
                $composeVersion = docker compose version
                Write-Host "✅ $composeVersion" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Disponible pero podría necesitar actualización" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ No instalado. Descarga desde https://www.docker.com/products/docker-desktop" -ForegroundColor Red
        }
        
        # PostgreSQL
        Write-Host "📌 PostgreSQL: " -ForegroundColor Yellow -NoNewline
        if (Get-Command psql -ErrorAction SilentlyContinue) {
            Write-Host "✅ Instalado" -ForegroundColor Green
        } else {
            Write-Host "❌ No encontrado en PATH. Ver QUICK_START.md" -ForegroundColor Red
        }
        
        # MongoDB
        Write-Host "📌 MongoDB: " -ForegroundColor Yellow -NoNewline
        if (Get-Command mongosh -ErrorAction SilentlyContinue) {
            Write-Host "✅ Instalado" -ForegroundColor Green
        } else {
            Write-Host "❌ No encontrado. Ver QUICK_START.md" -ForegroundColor Red
        }
        
        # Redis
        Write-Host "📌 Redis: " -ForegroundColor Yellow -NoNewline
        if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
            Write-Host "✅ Instalado" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No encontrado (pero puede estar en Docker)" -ForegroundColor Yellow
        }
        
        # Carpetas
        Write-Host "`n📂 Estructura de carpetas:" -ForegroundColor Yellow
        $folders = @("frontend", "backend", "docs")
        foreach ($folder in $folders) {
            if (Test-Path $folder) {
                Write-Host "   ✅ ./$folder" -ForegroundColor Green
            } else {
                Write-Host "   ❌ ./$folder" -ForegroundColor Red
            }
        }
        
        Write-Host "`n📋 Ficheros principales:" -ForegroundColor Yellow
        $files = @("README.md", ".env.example", "docker-compose.yml", "QUICK_START.md")
        foreach ($file in $files) {
            if (Test-Path $file) {
                Write-Host "   ✅ ./$file" -ForegroundColor Green
            } else {
                Write-Host "   ❌ ./$file" -ForegroundColor Red
            }
        }
    }
    
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
    }
}

Write-Host "`n✅ Listo!" -ForegroundColor Green
