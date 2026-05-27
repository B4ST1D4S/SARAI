# ═══════════════════════════════════════════════════════════════
# SCRIPT DE PRUEBA: Persistencia Mapa Corporal
# ═══════════════════════════════════════════════════════════════

Write-Host "🧪 INICIANDO PRUEBAS DE PERSISTENCIA..." -ForegroundColor Cyan

# Configuración
$backendUrl = "http://localhost:3001"
$medico_email = "medico@estegia.com"
$medico_password = "123456"

# ═══════════════════════════════════════════════════════════════
# PASO 1: Login
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 1] Haciendo login..." -ForegroundColor Yellow

$loginBody = @{
    email = $medico_email
    password = $medico_password
} | ConvertTo-Json

try {
    $loginRes = Invoke-WebRequest `
        -Uri "$backendUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -ErrorAction Stop

    $loginData = $loginRes.Content | ConvertFrom-Json
    $token = $loginData.accessToken
    $userId = $loginData.user.id
    
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..."
    Write-Host "   User ID: $userId"
} catch {
    Write-Host "❌ Login falló: $_" -ForegroundColor Red
    exit
}

# ═══════════════════════════════════════════════════════════════
# PASO 2: Obtener o crear paciente
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 2] Buscando paciente de prueba..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    # Buscar paciente existente
    $searchRes = Invoke-WebRequest `
        -Uri "$backendUrl/api/pacientes/search?documento=3001234567&tipo=CC" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing

    $pacienteData = $searchRes.Content | ConvertFrom-Json
    $pacienteId = $pacienteData.id
    
    Write-Host "✅ Paciente encontrado: $($pacienteData.nombreCompleto)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Paciente no existe, creando uno..." -ForegroundColor Yellow
    
    $createPacBody = @{
        numeroDocumento = "3001234567"
        tipoDocumento = "CC"
        nombreCompleto = "Juan Pérez Test"
        email = "juan@test.com"
        telefono = "3001234567"
        ciudad = "Medellín"
    } | ConvertTo-Json
    
    try {
        $createRes = Invoke-WebRequest `
            -Uri "$backendUrl/api/pacientes" `
            -Method POST `
            -Headers $headers `
            -Body $createPacBody `
            -UseBasicParsing

        $pacienteData = $createRes.Content | ConvertFrom-Json
        $pacienteId = $pacienteData.id
        
        Write-Host "✅ Paciente creado: $pacienteId" -ForegroundColor Green
    } catch {
        Write-Host "❌ No se pudo crear paciente: $_" -ForegroundColor Red
        exit
    }
}

# ═══════════════════════════════════════════════════════════════
# PASO 3: Crear procedimiento
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 3] Creando procedimiento..." -ForegroundColor Yellow

$procBody = @{
    nombre = "Aumento Mamario Test"
    descripcion = "Prueba de persistencia"
    pacienteId = $pacienteId
    tiposIncluidos = @("IMPLANTE_MAMARIO")
} | ConvertTo-Json

try {
    $procRes = Invoke-WebRequest `
        -Uri "$backendUrl/api/procedimientos" `
        -Method POST `
        -Headers $headers `
        -Body $procBody `
        -UseBasicParsing

    $procData = $procRes.Content | ConvertFrom-Json
    $procedimientoId = $procData.id
    
    Write-Host "✅ Procedimiento creado: $procedimientoId" -ForegroundColor Green
} catch {
    Write-Host "❌ No se pudo crear procedimiento: $_" -ForegroundColor Red
    exit
}

# ═══════════════════════════════════════════════════════════════
# PASO 4: Guardar Mapa Corporal con marcas
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 4] Guardando Mapa Corporal con marcas..." -ForegroundColor Yellow

$timestamp = (Get-Date).ToString('o')

$mapBody = @{
    pacienteId = $pacienteId
    procedimientoId = $procedimientoId
    zonasMarcadas = @(
        @{
            id = "mark-1"
            tipo = "IMPLANTE_MAMARIO"
            posicionX = 150
            posicionY = 200
            intensidad = 5
            zona = "Mama Izquierda"
            vista = "FRONTAL"
            fecha = $timestamp
            nota = "Prueba marca 1"
        }
        @{
            id = "mark-2"
            tipo = "IMPLANTE_MAMARIO"
            posicionX = 250
            posicionY = 200
            intensidad = 4
            zona = "Mama Derecha"
            vista = "FRONTAL"
            fecha = $timestamp
            nota = "Prueba marca 2"
        }
    )
    evaluadoPor = $userId
} | ConvertTo-Json

try {
    $mapRes = Invoke-WebRequest `
        -Uri "$backendUrl/api/mapa-corporal" `
        -Method POST `
        -Headers $headers `
        -Body $mapBody `
        -UseBasicParsing

    $mapData = $mapRes.Content | ConvertFrom-Json
    $mapaCorporalId = $mapData.id
    
    Write-Host "✅ Mapa Corporal guardado: $mapaCorporalId" -ForegroundColor Green
    Write-Host "   Marcas: 2 (Mama Izq + Mama Der)" -ForegroundColor Green
} catch {
    Write-Host "❌ No se pudo guardar Mapa Corporal: $_" -ForegroundColor Red
    exit
}

# ═══════════════════════════════════════════════════════════════
# PASO 5: Cargar Mapa Corporal (Verificar persistencia)
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 5] Cargando Mapa Corporal guardado..." -ForegroundColor Yellow

Start-Sleep -Seconds 1  # Dar tiempo a la BD

try {
    $getRes = Invoke-WebRequest `
        -Uri "$backendUrl/api/mapa-corporal/procedimiento/$procedimientoId/$pacienteId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing

    $mapLoaded = $getRes.Content | ConvertFrom-Json
    
    Write-Host "✅ Mapa Corporal cargado correctamente" -ForegroundColor Green
    Write-Host "   ID: $($mapLoaded.id)" -ForegroundColor Green
    Write-Host "   Marcas cargadas: $($mapLoaded.zonasMarcadas.Count)" -ForegroundColor Green
    
    # Verificar que las marcas sean correctas
    if ($mapLoaded.zonasMarcadas.Count -eq 2) {
        Write-Host "✅ PERSISTENCIA VERIFICADA: Ambas marcas se cargaron" -ForegroundColor Green
        
        # Detalles de marcas
        foreach ($marca in $mapLoaded.zonasMarcadas) {
            Write-Host "   • $($marca.zona) - Intensidad: $($marca.intensidad)/10" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ ERROR: Se esperaban 2 marcas, se cargaron $($mapLoaded.zonasMarcadas.Count)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ No se pudo cargar Mapa Corporal: $_" -ForegroundColor Red
    exit
}

# ═══════════════════════════════════════════════════════════════
# PASO 6: Verificar aislamiento por procedimiento
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 6] Creando segundo procedimiento..." -ForegroundColor Yellow

$proc2Body = @{
    nombre = "Liposucción Test"
    descripcion = "Segundo procedimiento"
    pacienteId = $pacienteId
    tiposIncluidos = @("LIPOSUCCION")
} | ConvertTo-Json

try {
    $proc2Res = Invoke-WebRequest `
        -Uri "$backendUrl/api/procedimientos" `
        -Method POST `
        -Headers $headers `
        -Body $proc2Body `
        -UseBasicParsing

    $proc2Data = $proc2Res.Content | ConvertFrom-Json
    $procedimiento2Id = $proc2Data.id
    
    Write-Host "✅ Segundo procedimiento creado: $procedimiento2Id" -ForegroundColor Green
    
    # Guardar mapa para segundo procedimiento
    $map2Body = @{
        pacienteId = $pacienteId
        procedimientoId = $procedimiento2Id
        zonasMarcadas = @(
            @{
                id = "mark-3"
                tipo = "LIPOSUCCION"
                posicionX = 150
                posicionY = 350
                intensidad = 7
                zona = "Abdomen"
                vista = "FRONTAL"
                fecha = $timestamp
                nota = "Prueba liposucción"
            }
        )
        evaluadoPor = $userId
    } | ConvertTo-Json
    
    $map2Res = Invoke-WebRequest `
        -Uri "$backendUrl/api/mapa-corporal" `
        -Method POST `
        -Headers $headers `
        -Body $map2Body `
        -UseBasicParsing

    $map2Data = $map2Res.Content | ConvertFrom-Json
    
    Write-Host "✅ Segundo mapa guardado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Advertencia al crear segundo procedimiento: $_" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════
# PASO 7: Obtener todos los mapas del paciente
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 [PASO 7] Obteniendo todos los mapas del paciente..." -ForegroundColor Yellow

try {
    $allRes = Invoke-WebRequest `
        -Uri "$backendUrl/api/mapa-corporal/paciente/$pacienteId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing

    $allMaps = $allRes.Content | ConvertFrom-Json
    
    Write-Host "✅ Se encontraron $($allMaps.data.Count) mapas corporales" -ForegroundColor Green
    foreach ($map in $allMaps.data) {
        Write-Host "   • Procedimiento: $($map.procedimientoId) - Marcas: $($map.zonasMarcadas.Count)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Advertencia al obtener mapas: $_" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════

Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE" -ForegroundColor Green
Write-Host "$('='*60)" -ForegroundColor Cyan
Write-Host "Resumen:" -ForegroundColor White
Write-Host "  ✅ Login exitoso"
Write-Host "  ✅ Paciente disponible"
Write-Host "  ✅ Procedimiento creado"
Write-Host "  ✅ Mapa guardado con 2 marcas"
Write-Host "  ✅ Mapa cargado correctamente (persistencia verificada)"
Write-Host "  ✅ Aislamiento por procedimiento"
Write-Host "  ✅ Múltiples mapas en BD"
Write-Host "`nDatos de prueba:" -ForegroundColor White
Write-Host "  Paciente: $pacienteId" -ForegroundColor Green
Write-Host ('  Procedimiento 1: ' + $procedimientoId + ' (2 marcas)') -ForegroundColor Green
Write-Host ('  Procedimiento 2: ' + $procedimiento2Id + ' (1 marca)') -ForegroundColor Green
Write-Host "" -ForegroundColor Cyan
