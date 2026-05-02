# SARAI Whisper Service - Script de inicio para Windows
# Ejecutar: .\start.ps1

$venvPath = "$PSScriptRoot\.venv"
$pythonExe = "$venvPath\Scripts\python.exe"
$uvicornExe = "$venvPath\Scripts\uvicorn.exe"

# Crear virtualenv si no existe
if (-not (Test-Path $pythonExe)) {
    Write-Host "Creando entorno virtual..." -ForegroundColor Cyan
    $pyCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "py" }
    & $pyCmd -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Python no encontrado. Instala Python 3.10+ desde https://www.python.org" -ForegroundColor Red
        exit 1
    }
}

# Instalar dependencias si no están instaladas
$fasterWhisper = "$venvPath\Lib\site-packages\faster_whisper"
if (-not (Test-Path $fasterWhisper)) {
    Write-Host "Instalando dependencias (primera vez ~2min)..." -ForegroundColor Cyan
    & $pythonExe -m pip install --upgrade pip -q
    & $pythonExe -m pip install -r "$PSScriptRoot\requirements.txt"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR al instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  SARAI Whisper Service" -ForegroundColor Green
Write-Host "  http://localhost:8000" -ForegroundColor Green
Write-Host "  Modelo: small (descarga ~500MB primera vez)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot
& $uvicornExe main:app --host 0.0.0.0 --port 8000
