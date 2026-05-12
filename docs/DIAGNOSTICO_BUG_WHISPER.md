# 🐛 DIAGNÓSTICO Y FIX - BUG WHISPER PARPADEANTE

## PROBLEMA IDENTIFICADO

### Root Cause 1: Health Check Sin Validación
```javascript
// ❌ ACTUAL (línea ~164)
useEffect(() => {
  const HEALTH_URL = WHISPER_URL.replace('/transcribir', '/health');
  const check = () => {
    fetch(HEALTH_URL, { signal: AbortSignal.timeout(4000) })
      .then(r => r.ok ? setWhisperStatus('online') : setWhisperStatus('offline'))
      .catch(() => setWhisperStatus('offline'));  // ← No diferencia entre timeout y error
  };
  check();
  const interval = setInterval(check, whisperStatus === 'online' ? 30000 : 8000);
  return () => clearInterval(interval);
}, [whisperStatus]);
```

**PROBLEMAS:**
1. ❌ No hay reintentos exponenciales
2. ❌ No valida si el endpoint existe realmente
3. ❌ Trata "timeout" y "error" igual
4. ❌ Loop infinito si la URL está mal
5. ❌ No hay feedback visual claro en el estado 'checking'

### Root Cause 2: Sin Validación Pre-grabación
```javascript
// ❌ Inicia grabación sin validar Whisper primero
const iniciarGrabacion = useCallback(() => {
  setEst('grabando');  // ← Asume que Whisper está OK
  // ... getUserMedia ...
}, []);
```

### Root Cause 3: Micrófono Detectado Pero Inactivo
```javascript
// ❌ No valida si el micrófono tiene entrada realmente
const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
// Sin verificar si hay audio real siendo capturado
```

---

## 🔧 SOLUCIÓN - CHANGES A IMPLEMENTAR

### CHANGE 1: Health Check Mejorado con Reintentos
```typescript
// ✅ Agregar antes de useEffect
const HEALTH_CHECK_ATTEMPTS = 3;
const HEALTH_CHECK_TIMEOUT = 3000; // 3s max
const HEALTH_CHECK_INTERVAL_OFFLINE = 8000; // 8s si offline
const HEALTH_CHECK_INTERVAL_ONLINE = 45000; // 45s si online
```

### CHANGE 2: Validación Pre-grabación
Antes de llamar `getUserMedia()`:
- ✅ Verificar que Whisper está `online`
- ✅ Verificar que browser soporta getUserMedia
- ✅ Verificar permisos de micrófono

### CHANGE 3: Detección de Micrófono Inactivo
Después de `getUserMedia()`:
- ✅ Verificar que hay audio realmente siendo capturado
- ✅ Timeout automático si no hay audio en 3 segundos
- ✅ Mensaje claro: "Micrófono no está capturando audio"

---

## 📋 TESTS A REALIZAR

### Test 1: Whisper Offline
**Comando**: Apagar servicio Whisper
**Esperado**: 
- ✅ Estado cambia a `offline` después de 3s
- ✅ Botón grabar DESHABILITADO
- ✅ Mensaje: "Esperando conexión a Whisper..."
- ✅ Reintentos cada 8 segundos

### Test 2: Micrófono No Conectado
**Comando**: Desconectar micrófono físico
**Esperado**:
- ✅ Error claro: "No se encontró micrófono"
- ✅ Sugerencia: "Conecta micrófono e intenta de nuevo"
- ✅ No se queda parpadeando

### Test 3: Micrófono Silenciado
**Comando**: Muteado en Windows Settings
**Esperado**:
- ✅ Se detecta en el primer segundo
- ✅ Mensaje: "Micrófono silenciado - sube volumen"
- ✅ Auto-fix disponible

### Test 4: Micrófono Bloqueado
**Comando**: Denegar permiso en navegador
**Esperado**:
- ✅ Error claro: "Micrófono bloqueado"
- ✅ Instrucción: Click candado → Permitir → Recargar

### Test 5: Audio Muy Bajo
**Comando**: Hablar muy bajito
**Esperado**:
- ✅ Se captura pero con advertencia
- ✅ Mensaje: "Micrófono muy bajo, sube volumen"
- ✅ Procesa de todas formas a Whisper

### Test 6: Sin Audio en 3 segundos
**Comando**: Iniciar grabación y quedarse en silencio
**Esperado**:
- ✅ Timeout automático
- ✅ Error: "No hay audio detectado"
- ✅ Opción para reintentar

---

## 🎯 INDICADORES VISUALES CORRECTOS

```
Estado          Color    Animación              Texto
─────────────────────────────────────────────────────────
checking        Azul     Pulsing suave          ⏳ Conectando
online          Verde    Constante              ✅ Listo
offline         Rojo     Parpadeo error         ❌ Desconectado
grabando        Rojo     Barras animadas        🎤 Grabando
transcribiendo  Púrpura  Spinner                ⚙️ Procesando
error           Rojo     Flash (1s)             ⚠️ Error
```

---

## 📊 ESTADÍSTICAS DE DISPONIBILIDAD

Después del fix, esperamos:
- **Disponibilidad Whisper**: 99.5%
- **Tiempo detección de error**: <3 segundos
- **Falsos positivos**: <1%

---

## ✅ VERIFICACIÓN POST-FIX

Después de aplicar cambios:
1. Iniciar Whisper service
2. Abrir navegador
3. Verificar que estado pasa: checking → online
4. Apagar Whisper
5. Verificar que estado pasa: online → offline
6. Intentar grabar (debe estar deshabilitado)
7. Reiniciar Whisper
8. Verificar que vuelve automáticamente a online
9. Grabar y transcribir exitosamente
