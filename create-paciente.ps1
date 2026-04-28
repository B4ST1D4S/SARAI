#!/usr/bin/env pwsh

# Login
$loginBody = @{
    email = "medico@estegia.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginRes = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody `
        -UseBasicParsing
    
    $loginData = $loginRes.Content | ConvertFrom-Json
    $token = $loginData.token
    
    Write-Host "✅ Token obtenido: $token" -ForegroundColor Green
    
    # Crear paciente
    $createBody = @{
        numeroDocumento = "3001234567"
        tipoDocumento = "CC"
        nombreCompleto = "Juan Pérez"
        fechaNacimiento = "1990-01-15"
        genero = "M"
        telefonos = @("3101234567")
        email = "juan@example.com"
        ciudad = "Bogotá"
        direccion = "Cra 7 #125-30"
        creadoPor = "medico@estegia.com"
    } | ConvertTo-Json
    
    $createRes = Invoke-WebRequest -Uri "http://localhost:3001/api/pacientes" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $createBody `
        -UseBasicParsing
    
    Write-Host "✅ Paciente creado exitosamente" -ForegroundColor Green
    $pacienteData = $createRes.Content | ConvertFrom-Json
    Write-Host "ID: $($pacienteData.id)" -ForegroundColor Cyan
    Write-Host "Nombre: $($pacienteData.nombreCompleto)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
