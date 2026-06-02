# 🎤 GUÍA DIAGNÓSTICO COMPLETO SARAI - 30 ABRIL 2026

## ✅ LO QUE SE CORRIGIÓ EN ESTA SESIÓN

### 1. **Regex Duplicado (BUG CRÍTICO)**
- **Problema**: El regex estaba definido en 2 lugares diferentes con sintaxis incompatible
  - En `onresult`: `/^(sarai|sara[yh]?|...)\b/i`
  - En `procesarComandoRef`: `/^(sarai|sara[yh]?|...)\b\s*/`
  - El primero tenía flag `/i` (innecesario) pero el segundo tenía `\s*` (necesario)
- **Solución**: Centralizado en constante `MATCH_ACTIVACION_SARAI` al inicio del archivo
- **Impacto**: Ahora el reconocimiento es consistente

### 2. **Heartbeat Indicator (LATIDOS)**
- Agregado indicador visual **♥ escuchando** cuando está activo
- Se anima con pulsación (scale 1→1.2→1) cada 1.2 segundos
- Solo visible cuando `escuchandoComandos === true`

### 3. **Ventana Arrastrable**
- Agregados estados `posicion`, `dragging`, `dragOffset`
- Handlers `handleMouseDown` + effects para mousemove/mouseup
- El widget ahora es **totalmente movible** por cualquier parte del header
- Se vuelve `position: fixed` y `z-50` (siempre visible)
- El cursor cambia a "grab" cuando está sobre el header

### 4. **Logs Mejorados en onresult**
- Ahora imprime exactamente qué alternativa eligió del API
- `[SARAI CMD] alternativas reconocidas: [...]`
- `[SARAI CMD] eligiendo: ...`

---

## 🧪 CÓMO HACER UN TEST FUNCIONAL

### PASO 1: Abre la página en Chrome/Edge
```
http://localhost:5174/dashboard
```

### PASO 2: Abre DevTools (F12) y ve a Console
- Deberías ver logs iniciales como:
```
[SARAI] Usando micrófono: Micrófono (Built-in)
[SARAI] Dispositivo de audio: Micrófono (Built-in) ...
```

### PASO 3: Busca el widget SARAI
- Está en la **esquina inferior derecha** (ahora **arrastrable**)
- Si está minimizado, expándelo

### PASO 4: Busca el botón "Activar comandos de voz"
- Haz click
- El widget debe mostrar **♥ escuchando** (con latidos)
- El botón cambia a "Detener comandos de voz"

### PASO 5: Prueba un comando
Di en voz alta: **"SARAI escucha"**

En la consola (F12 → Console) deberías ver:
```
[SARAI CMD] alternativas reconocidas: ['SARAI escucha', 'Sarah escucha', ...]
[SARAI CMD] eligiendo: SARAI escucha
[SARAI CMD] recibido: "SARAI escucha"
[SARAI CMD] activado — cmd extraído: "escucha"
🎤 Iniciando grabación...
```

### PASO 6: Prueba navegación
Di: **"SARAI ir a pacientes"**

Espera a ver:
```
[SARAI CMD] recibido: "SARAI ir a pacientes"
[SARAI CMD] activado — cmd extraído: "ir a pacientes"
→ Pacientes
```

Y la página **debe navegar** a Pacientes

---

## 🔴 SI LOS COMANDOS NO FUNCIONAN

### Síntoma 1: Sin logs [SARAI CMD] en consola
**Causa**: El micrófono no está siendo capturado
**Solución**:
1. Verifica que diste permiso: Candado en URL (https://localhost) → Micrófono → Permitir
2. Recarga la página (F5)
3. Asegúrate de que ninguna otra app usa el micrófono (Teams, Zoom, etc)

### Síntoma 2: Logs con variaciones diferentes a "SARAI"
Ej: `[SARAI CMD] alternativas reconocidas: ['sierra ir a pacientes', ...]`

**Causa**: El API de Chrome transcribe "SARAI" como "sierra", "cayó", "saya", etc (problema de pronunciación/acento)
**Solución**:
- Habla más fuerte y clara
- Acércate más al micrófono
- Prueba sin background noise (apaga TV, cierra ventanas)
- Si persiste, agregar esas variaciones al regex:
  ```javascript
  const MATCH_ACTIVACION_SARAI = /^(sarai|sara[yh]?|sierra|saya|cayó|hey\s+sarai|...)\b\s*/;
  ```

### Síntoma 3: Widget no visible
**Causa**: Puede estar fuera de pantalla o minimizado
**Solución**:
1. Abre DevTools (F12)
2. En Console escribe:
   ```javascript
   // Ver si widget existe
   document.querySelectorAll('div[class*="z-50"]').forEach(el => console.log(el.textContent.slice(0, 50)))
   ```
3. Si lo ves, busca en la pantalla o expande si está minimizado

### Síntoma 4: "Whisper ✗" en widget
**Causa**: Servidor Whisper no está corriendo
**Solución**:
```powershell
cd c:\proyect\EstetIA\whisper_service
.\start.ps1
```
Espera a que veas: `Uvicorn running on http://0.0.0.0:8000`

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] SpeechRecognition disponible (Chrome/Edge)
- [ ] Widget SARAI visible en pantalla
- [ ] Micrófono permitido en navegador
- [ ] Botón "Activar comandos de voz" funciona
- [ ] Aparece "♥ escuchando" con latidos
- [ ] Logs [SARAI CMD] aparecen en console
- [ ] Primeras alternativas incluyen variación cercana a "SARAI"
- [ ] Comandos de navegación funcionan
- [ ] Widget es arrastrable (puedes moverlo por pantalla)
- [ ] Whisper está online (Whisper ✓)

---

## 🎯 PRÓXIMAS PRUEBAS RECOMENDADAS

```bash
# En PowerShell, después de que el frontend esté corriendo:

# 1. Verificar backend
curl http://localhost:3001/api/auth/login -Method POST -Body '{"email":"medico@estegia.com","password":"123456"}' -ContentType 'application/json'

# 2. Verificar Whisper
curl http://localhost:8000/health

# 3. Prueba de comando de voz en backend
$token = "..." # obtener del login arriba
curl http://localhost:3001/api/sarai/procesar-voz -Method POST -Body '{"texto":"historia clinica","contexto":"historia"}' -Headers @{'Authorization'="Bearer $token"} -ContentType 'application/json'
```

---

## 📝 CAMBIOS TÉCNICOS REALIZADOS

| Archivo | Cambio |
|---------|--------|
| `SaraiAssistant.tsx` | Regex centralizado en `MATCH_ACTIVACION_SARAI` |
| `SaraiAssistant.tsx` | Estados `posicion`, `dragging`, `dragOffset` agregados |
| `SaraiAssistant.tsx` | `handleMouseDown` + useEffect para drag handler |
| `SaraiAssistant.tsx` | Widget ahora es `position: fixed z-50` |
| `SaraiAssistant.tsx` | Indicador ♥ escuchando con animación heartbeat |
| `SaraiAssistant.tsx` | Logs mejorados en `onresult` |

### Logs por consola que deberías ver:

```
[SARAI] Usando micrófono: Micrófono (Built-in)
[SARAI] Dispositivo de audio: ...
[SARAI CMD] alternativas reconocidas: [...]
[SARAI CMD] eligiendo: SARAI...
[SARAI CMD] recibido: "..."
[SARAI CMD] activado — cmd extraído: "..."
→ Pacientes  (cuando navega)
```

---

## ⚠️ IMPORTANTE

Si después de todos estos pasos los comandos aún no funcionan:

1. **NO CIERRES NI DESPLIEGUES CAMBIOS**
2. **Captura screenshot de**:
   - Página con widget SARAI
   - Consola (F12) mostrando últimos logs
   - Error messages (si hay)
3. **Reporta el estado exacto** de cada síntoma arriba

Esto ayudará a diagnosticar rápidamente el problema.
