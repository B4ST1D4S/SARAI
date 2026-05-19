# EstetIA - Arrancar todos los servicios
# Uso: .\start-all.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EstetIA - Iniciando todos los servicios  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

# --- Backend ---
Write-Host "[1/3] Backend (puerto 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; npm run dev" -WindowStyle Normal

# --- Frontend ---
Write-Host "[2/3] Frontend (puerto 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev" -WindowStyle Normal

# --- Whisper ---
Write-Host "[3/3] Whisper Service (puerto 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\whisper_service'; .\start.ps1" -WindowStyle Normal

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Servicios iniciados en ventanas nuevas   " -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  -> http://localhost:3001        " -ForegroundColor White
Write-Host "  Frontend -> http://localhost:5173        " -ForegroundColor White
Write-Host "  Whisper  -> http://localhost:8000        " -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
