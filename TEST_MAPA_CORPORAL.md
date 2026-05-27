# 🧪 PRUEBAS DE PERSISTENCIA - MAPA CORPORAL

## Estado: ✅ BACKEND VERIFICADO - READY FOR MANUAL TESTING

**Fecha:** 23 de mayo de 2026  
**Verificado:** Backend (REST API) funcionando correctamente

---

## ✅ VERIFICACIONES COMPLETADAS

### 1. **Backend Status**
- ✅ Server respondiendo en puerto 3001
- ✅ Autenticación funciona (login con username: medico@estegia.com)
- ✅ Endpoints de mapa corporal registrados
- ✅ Base de datos PostgreSQL conectada

### 2. **Endpoints Verificados**
```
✅ POST   /api/mapa-corporal                              → Guardar/actualizar
✅ GET    /api/mapa-corporal/procedimiento/:procId/:pacId → Obtener específico
✅ GET    /api/mapa-corporal/paciente/:pacId             → Obtener todos
✅ PUT    /api/mapa-corporal/:id                         → Actualizar
✅ DELETE /api/mapa-corporal/:id                         → Eliminar
```

### 3. **Validaciones Verificadas**
- ✅ Requiere autenticación (Bearer token)
- ✅ Valida pacienteId requerido
- ✅ Valida procedimientoId requerido
- ✅ Valida zonasMarcadas array
- ✅ Respeta constrains de clave foránea

---

## 🧪 PRUEBAS MANUALES NECESARIAS

### PRUEBA 1: Persistencia Básica (Guardar → Recargar → Verificar)

**Prerequisitos:**
- ✅ Backend en http://localhost:3001
- ✅ Frontend en http://localhost:5174
- ✅ Usuario logueado: medico@estegia.com / 123456

**Pasos:**

1. **Entrar a Mapa Corporal**
   - [ ] Seleccionar un paciente
   - [ ] Seleccionar procedimiento (Aumento Mamario)
   - [ ] Verificar sin errores en consola (F12)

2. **Registrar 2 marcas**
   - [ ] Click en MAMA IZQUIERDA en vista FRONTAL
   - [ ] Esperar "✅ Cambios guardados" (verde)
   - [ ] Click en MAMA DERECHA en vista FRONTAL
   - [ ] Esperar "✅ Cambios guardados" nuevamente

3. **Verificar panel izquierdo**
   - [ ] Debe mostrar "REGISTROS (2)"
   - [ ] Ambas marcas enumeradas con procedimiento y zona

4. **Recargar página** (F5)
   - [ ] Esperar carga completa
   - [ ] **CRÍTICO**: ¿Aparecen las 2 marcas sin hacer nada?
   - [ ] ¿En LAS MISMAS posiciones?

**Resultado esperado:** ✅ PASA si ambas marcas persisten automáticamente

---

### PRUEBA 2: Cambio de Procedimiento

**Prerequisitos:** PRUEBA 1 completada con 2 marcas guardadas

**Pasos:**

1. **Cambiar procedimiento**
   - [ ] Click dropdown en "Aumento Mamario"
   - [ ] Seleccionar "Liposucción"
   - [ ] Esperar 2 segundos

2. **Verificar aislamiento**
   - [ ] ¿Desaparecen las 2 marcas de senos?
   - [ ] ¿Panel muestra "REGISTROS (0)"?

3. **Volver a Aumento Mamario**
   - [ ] Click dropdown
   - [ ] Seleccionar "Aumento Mamario"
   - [ ] Esperar 2 segundos

4. **Verificar persistencia por procedimiento**
   - [ ] ¿Reaparecen las 2 marcas ORIGINALES?
   - [ ] ¿EN LAS MISMAS POSICIONES?

**Resultado esperado:** ✅ PASA si los datos se aíslan y recuperan por procedimiento

---

### PRUEBA 3: Cierre Completo de Navegador

**Prerequisitos:** PRUEBA 2 completada

**Pasos:**

1. **Estado actual**
   - [ ] "Aumento Mamario" con 2 marcas guardadas

2. **CERRAR NAVEGADOR COMPLETAMENTE**
   - [ ] No pestaña, el NAVEGADOR COMPLETO
   - [ ] Esperar 10 segundos

3. **Reabrira navegador**
   - [ ] Chrome/Firefox/Edge → http://localhost:5174
   - [ ] Hacer LOGIN (medico@estegia.com / 123456)
   - [ ] Seleccionar MISMO paciente
   - [ ] Entrar a Mapa Corporal

4. **Verificar persistencia en BD**
   - [ ] ¿Se cargan las 2 marcas automáticamente?
   - [ ] ¿Dice "✅ Cambios guardados"?

**Resultado esperado:** ✅ PASA si datos persisten después de browser restart

---

### PRUEBA 4: Panel Izquierdo Funcional

**Pasos:**

1. **Verificar lista de marcas**
   - [ ] ¿Están todas las marcas enumeradas?
   - [ ] ¿Cada una muestra: procedimiento + zona + intensidad?

2. **Eliminar una marca**
   - [ ] Click botón ✕ en primera marca
   - [ ] Marca desaparece del cuerpo
   - [ ] Contador cambia "REGISTROS (2)" → "REGISTROS (1)"

3. **Recargar página** (F5)
   - [ ] ¿Permanece solo 1 marca?
   - [ ] ¿LA MARCA CORRECTA se eliminó?

**Resultado esperado:** ✅ PASA si eliminación persiste

---

### PRUEBA 5: Modal de Duplicados

**Pasos:**

1. **Marcar MISMA zona dos veces**
   - [ ] Click en MAMA IZQUIERDA (marca 1)
   - [ ] Esperar "✅ Cambios guardados"
   - [ ] Click OTRA VEZ en MAMA IZQUIERDA (intento 2)

2. **Modal debe aparecer**
   - [ ] Con 3 opciones:
     - [ ] Cancelar (no hacer nada)
     - [ ] Eliminar anterior (borrar marca 1)
     - [ ] Reemplazar por otro procedimiento

3. **Probar opción: Cancelar**
   - [ ] Click "Cancelar"
   - [ ] Modal cierra sin cambios
   - [ ] Sigue habiendo 1 marca en MAMA IZQUIERDA

4. **Probar opción: Eliminar**
   - [ ] Click en botón "Eliminar anterior"
   - [ ] Marca anterior se borra
   - [ ] Nueva marca se agrega
   - [ ] Panel muestra 1 marca (la nueva)

**Resultado esperado:** ✅ PASA si modal funciona correctamente

---

## 📊 CHECKLIST DE CONSOLA (F12 → Console)

Después de cada prueba verificar:

- [ ] ¿NO hay errores rojos?
- [ ] ¿NO hay mensajes de "Faltan datos"?
- [ ] ¿Hay logs "✅ Cambios guardados automáticamente"?
- [ ] ¿Hay logs "✅ Mapa cargado: X marcas"?

---

## 📝 TEMPLATE DE REPORTE

### ✅ PRUEBA X PASÓ

```
Pasos completados: [1, 2, 3, 4]
Resultado: [PASÓ / FALLÓ]
Detalles: [Cualquier observación]
Logs: [Pantalla de consola si hay errores]
```

### ❌ PRUEBA X FALLÓ

```
Paso donde falló: [número]
Error observable: [descripción]
Logs en consola: [copiar error de F12]
Pasos para reproducir: [...]
```

---

## ⏱️ TIEMPO ESTIMADO TOTAL

- Prueba 1: 3 minutos
- Prueba 2: 2 minutos
- Prueba 3: 5 minutos (incluye browser restart)
- Prueba 4: 2 minutos
- Prueba 5: 3 minutos

**TOTAL: ~15 minutos**

---

## 🚀 SIGUIENTE PASO

**Una vez pasen TODAS 5 pruebas:**
1. Revisar UI compacta (3 columnas, sin scroll)
2. Testear vistas 360° (Frontal, Posterior, Lateral)
3. Verificar que intensidad funciona (1-10)
4. Validar colores de procedimientos
5. Listo para producción ✅

---

**NOTA IMPORTANTE:**
El backend está completamente verificado. Estas pruebas son del **frontend** (React) para confirmar que carga y persiste correctamente en el cliente.
