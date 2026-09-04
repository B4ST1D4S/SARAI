# SARAI - Script de inicio para Windows
# Ejecutar: .\start.ps1

$rootStart = Join-Path $PSScriptRoot "..\start.ps1"
if (Test-Path $rootStart) {
    & powershell.exe -ExecutionPolicy Bypass -File $rootStart
    exit $LASTEXITCODE
}

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

# Limpiar variables SSL conflictivas de XAMPP
$env:REQUESTS_CA_BUNDLE = ""
$env:CURL_CA_BUNDLE = ""

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

$env:SSL_CERT_FILE = & $pythonExe -c "import certifi; print(certifi.where())"
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $env:SSL_CERT_FILE)) {
    Write-Host "ERROR: No se pudo localizar el almacén de certificados de Python" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  SARAI Whisper Service" -ForegroundColor Green
Write-Host "  http://localhost:8000" -ForegroundColor Green
Write-Host "  Modelo: $($(if ($env:WHISPER_MODEL) { $env:WHISPER_MODEL } else { 'medium' }))" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot
& $uvicornExe main:app --host 0.0.0.0 --port 8000
