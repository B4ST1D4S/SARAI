Write-Host "TEST DE PERSISTENCIA - MAPA CORPORAL" -ForegroundColor Cyan

$backendUrl = "http://localhost:3001"

try {
    $loginRes = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"medico@estegia.com","password":"123456"}' `
        -UseBasicParsing

    $token = ($loginRes.Content | ConvertFrom-Json).accessToken
    Write-Host "Token obtenido" -ForegroundColor Green
    
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    
    Write-Host "Buscando o creando paciente..." -ForegroundColor Yellow
    try {
        $pacRes = Invoke-WebRequest -Uri "$backendUrl/api/pacientes/search?documento=3001234567&tipo=CC" `
            -Method GET -Headers $headers -UseBasicParsing
        
        $pacId = ($pacRes.Content | ConvertFrom-Json).id
    } catch {
        Write-Host "Creando paciente..." -ForegroundColor Yellow
        $createPacBody = '{"numeroDocumento":"3001234567","tipoDocumento":"CC","nombreCompleto":"Juan Perez Test","email":"juan@test.com","telefono":"3001234567","ciudad":"Medellin"}'
        
        $createRes = Invoke-WebRequest -Uri "$backendUrl/api/pacientes" -Method POST `
            -Headers $headers -Body $createPacBody -UseBasicParsing
        
        $pacId = ($createRes.Content | ConvertFrom-Json).id
    }
    
    Write-Host "Paciente: $pacId" -ForegroundColor Green
    
    Write-Host "Creando procedimiento..." -ForegroundColor Yellow
    $procBody = '{"nombre":"Aumento Mamario Test","descripcion":"Test","pacienteId":"' + $pacId + '","tiposIncluidos":["IMPLANTE_MAMARIO"]}'
    
    $procRes = Invoke-WebRequest -Uri "$backendUrl/api/procedimientos" -Method POST `
        -Headers $headers -Body $procBody -UseBasicParsing
    
    $procId = ($procRes.Content | ConvertFrom-Json).id
    Write-Host "Procedimiento: $procId" -ForegroundColor Green
    
    Write-Host "Probando API mapa corporal..." -ForegroundColor Yellow
    
    $mapBody = '{"pacienteId":"' + $pacId + '","procedimientoId":"' + $procId + '","zonasMarcadas":[{"id":"m1","tipo":"IMPLANTE_MAMARIO","posicionX":150,"posicionY":200,"intensidad":5,"zona":"Mama Izquierda","vista":"FRONTAL","fecha":"2026-05-23T03:00:00Z","nota":"test"}],"evaluadoPor":"user-1"}'
    
    $saveRes = Invoke-WebRequest -Uri "$backendUrl/api/mapa-corporal" -Method POST `
        -Headers $headers -Body $mapBody -UseBasicParsing
    
    $mapId = ($saveRes.Content | ConvertFrom-Json).id
    Write-Host "Mapa guardado: $mapId" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
    
    $getRes = Invoke-WebRequest -Uri "$backendUrl/api/mapa-corporal/procedimiento/$procId/$pacId" `
        -Method GET -Headers $headers -UseBasicParsing
    
    $loaded = $getRes.Content | ConvertFrom-Json
    $count = $loaded.zonasMarcadas.Count
    
    if ($count -eq 1) {
        Write-Host "PERSISTENCIA VERIFICADA: Marca se cargo correctamente" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Se esperaba 1 marca, se cargaron $count" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
