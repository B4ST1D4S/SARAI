# ⌨️ Atajos de Teclado — EstetIA

> **Combinación:** `Alt` + letra indicada  
> **Requisito:** El foco no debe estar dentro de un campo de texto (input / textarea)  
> **Compatibilidad:** Sarai activa (grabando / escuchando voz) **bloquea automáticamente** los atajos para evitar conflictos

---

## 🏥 CLÍNICA

| Atajo | Módulo | Letra desde |
|-------|--------|-------------|
| `Alt + D` | Dashboard | **D**ashboard |
| `Alt + P` | Pacientes | **P**acientes |
| `Alt + H` | Historia Clínica | **H**istoria |
| `Alt + V` | Visual Clínico | **V**isual |
| `Alt + O` | Odontograma | **O**dontograma |
| `Alt + M` | Mapa Corporal | **M**apa |

---

## 📅 AGENDA

| Atajo | Módulo | Letra desde |
|-------|--------|-------------|
| `Alt + A` | Agenda Paciente | **A**genda |
| `Alt + N` | Admisión | admisió**N** |
| `Alt + G` | Agenda Profesional | a**G**enda |
| `Alt + C` | Config Agenda | **C**onfig |
| `Alt + Q` | Quirofano | **Q**uirofano |
| `Alt + W` | Follow-up | follo**W**-up |

---

## 💼 GESTIÓN

| Atajo | Módulo | Letra desde |
|-------|--------|-------------|
| `Alt + S` | Consentimiento | con**S**entimiento |
| `Alt + T` | Cotizaciones | co**T**izaciones |
| `Alt + R` | CRM | c**R**m |
| `Alt + F` | Facturación | **F**acturación |
| `Alt + L` | Plantillas | p**L**antillas |
| `Alt + I` | Central Impresión | **I**mpresión |

---

## ⚙️ ADMINISTRACIÓN

| Atajo | Módulo | Letra desde |
|-------|--------|-------------|
| `Alt + Z` | Parametrización | parametri**Z**ación |
| `Alt + U` | Usuarios | **U**suarios |

---

## 🔒 Reglas de bloqueo

Los atajos **no se activan** en los siguientes casos:

| Condición | Estado |
|-----------|--------|
| Foco en `<input>` / `<textarea>` / `<select>` | ❌ Bloqueado |
| Sarai en estado `grabando` | ❌ Bloqueado |
| Sarai en estado `transcribiendo` | ❌ Bloqueado |
| Sarai en estado `procesando` | ❌ Bloqueado |
| Sarai con modo de comandos de voz activo | ❌ Bloqueado |
| Cualquier otro caso | ✅ Activo |

---

## 💡 Confirmación visual

Al ejecutar un atajo aparece un **toast dorado** en la parte inferior de la pantalla durante 1.8 segundos con el nombre del módulo al que se navegó.

---

## 🛠️ Implementación técnica

| Archivo | Rol |
|---------|-----|
| `frontend/src/App.tsx` | `useEffect` global con `window.addEventListener('keydown', ...)` — mapea `sym` de `NAV_SECTIONS` |
| `frontend/src/components/SaraiAssistant.tsx` | Expone `data-sarai-estado` y `data-sarai-escuchando` en el `<div>` raíz para que el handler los consulte |

```ts
// Lógica del handler (App.tsx)
if (e.altKey && !e.ctrlKey && !e.metaKey) {
  // 1. No disparar en inputs
  // 2. No disparar si Sarai está grabando/escuchando
  // 3. Navegar al módulo correspondiente
}
```

---

*Última actualización: 01 de Julio de 2026*
