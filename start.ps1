# EstetIA - Arrancar todos los servicios
# Uso: .\start.ps1

$root = $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EstetIA - Iniciando todos los servicios  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:3001"
Write-Host "  Frontend -> http://localhost:5173"
Write-Host "  Whisper  -> http://localhost:8000"
Write-Host "  Presiona Ctrl+C para detener todo"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Matar procesos node previos para liberar puertos
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$pathBackend  = "$root\backend"
$pathFrontend = "$root\frontend"
$pathWhisper  = "$root\whisper_service"

$job1 = Start-Job -Name "Backend" -ArgumentList $pathBackend -ScriptBlock {
    param($p); Set-Location $p; npm run dev 2>&1
}
$job2 = Start-Job -Name "Frontend" -ArgumentList $pathFrontend -ScriptBlock {
    param($p); Set-Location $p; npm run dev 2>&1
}
$pythonExe = "C:\Users\SOPORTE\AppData\Local\Programs\Python\Python313\python.exe"
$job3 = Start-Job -Name "Whisper" -ArgumentList $pathWhisper, $pythonExe -ScriptBlock {
    param($p, $py); Set-Location $p; & $py main.py 2>&1
}
$jobs = @($job1, $job2, $job3)

$colors = @{
    "Backend"  = "Cyan"
    "Frontend" = "Yellow"
    "Whisper"  = "Green"
}

Write-Host "[OK] Los 3 servicios arrancaron en segundo plano" -ForegroundColor Green
Write-Host ""

try {
    while ($true) {
        foreach ($job in $jobs) {
            $lines = Receive-Job -Job $job
            foreach ($line in $lines) {
                if ($line) {
                    $color = $colors[$job.Name]
                    Write-Host "[$($job.Name.ToUpper())] $line" -ForegroundColor $color
                }
            }
        }
        Start-Sleep -Milliseconds 300
    }
} finally {
    Write-Host ""
    Write-Host "Deteniendo servicios..." -ForegroundColor Red
    $jobs | Stop-Job
    $jobs | Remove-Job -Force
    Write-Host "Servicios detenidos." -ForegroundColor Red
}
