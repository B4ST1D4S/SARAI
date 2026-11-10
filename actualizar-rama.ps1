# SARAI - Actualizar la rama y la base de datos
# Uso (desde la raiz del proyecto): .\actualizar-rama.ps1
#
# Hace, en orden:
#   1. git pull de la rama actual
#   2. npm install en his-core y frontend (dependencias nuevas, p. ej. argon2 0.44.0)
#   3. npm run migrate:tenants en his-core (aplica solo las migraciones que falten)
#
# Opciones:
#   -SinPull          No hace git pull (si ya bajaste los cambios)
#   -SinMigraciones   No corre las migraciones de base de datos

param(
    [switch]$SinPull,
    [switch]$SinMigraciones
)

# 'Continue' a proposito: en PowerShell 5.1 'Stop' convierte los avisos que npm
# escribe en stderr en errores fatales. Los fallos se detectan con $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot

function Paso($texto) {
    Write-Host ""
    Write-Host "==> $texto" -ForegroundColor Cyan
}

function Fallo($texto) {
    Write-Host ""
    Write-Host "[ERROR] $texto" -ForegroundColor Red
    exit 1
}

# 0. Requisitos
if (-not (Test-Path "$root\his-core\.env")) {
    Fallo "Falta his-core\.env. Copie his-core\.env.example a his-core\.env y complete las credenciales de la base de datos maestra (pidalas al equipo)."
}

# 1. Bajar cambios
if (-not $SinPull) {
    Paso "Bajando cambios de la rama actual (git pull)"
    Set-Location $root
    git pull
    if ($LASTEXITCODE -ne 0) { Fallo "git pull fallo. Resuelva los conflictos o guarde sus cambios (git stash) y vuelva a intentar." }
}

# 2. Dependencias
Paso "Instalando dependencias de his-core"
Set-Location "$root\his-core"
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Fallo "npm install fallo en his-core." }

Paso "Instalando dependencias del frontend"
Set-Location "$root\frontend"
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Fallo "npm install fallo en frontend. Si el error menciona package-lock.json, detenga el frontend (npm run dev) y vuelva a intentar." }

# 3. Migraciones
if (-not $SinMigraciones) {
    Paso "Aplicando migraciones de base de datos en los tenants"
    Set-Location "$root\his-core"
    npm run migrate:tenants
    if ($LASTEXITCODE -ne 0) { Fallo "Las migraciones fallaron. Revise el detalle por institucion en la tabla de arriba y las credenciales de his-core\.env." }
}

Set-Location $root
Write-Host ""
Write-Host "[OK] Rama actualizada. Para arrancar todo: .\start.ps1" -ForegroundColor Green
