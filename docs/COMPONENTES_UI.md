# ESPECIFICACIÓN DE COMPONENTES UI - DISEÑO PREMIUM

## 🎨 PALETA DE COLORES

```
PRIMARY (Azul Oscuro Premium):
- bg-slate-950: #020617 (background principal)
- bg-slate-900: #0f172a (cards, modales)
- bg-slate-800: #1e293b (hover, accents)

ACCENT (Dorado Elegante):
- gold-500: #d4af37 (botones principales, highlights)
- gold-400: #f4c430 (hover)
- gold-600: #b8860b (active)

STATUS (Clínico):
- alert-red: #ef4444 (crítico, riesgo alto)
- alert-orange: #f97316 (alerta, riesgo medio)
- success-green: #22c55e (completado, normal)
- info-blue: #3b82f6 (información)

TEXT:
- text-white: #ffffff (primario)
- text-slate-300: #cbd5e1 (secundario)
- text-slate-400: #94a3b8 (terciario)

BORDERS:
- border-slate-700: #334155 (separadores)
- border-slate-800: #1e293b (énfasis)
```

---

## 🎭 COMPONENTES REUTILIZABLES

### 1. CARD PREMIUM
```typescript
<Card className="premium">
  - Header (opcional con icono)
  - Body (contenido flexible)
  - Footer (botones, acciones)
  - Decoración: línea dorada superior
  - Shadow: elegante, no pesado
  - Hover: sutil cambio de color + elevación
</Card>
```

### 2. HEADER CLÍNICO
```typescript
<Header>
  ├── Logo (EstetIA)
  ├── Búsqueda rápida (pacientes, procedimientos)
  ├── Notificaciones (campana con contador)
  ├── Usuario (avatar + dropdown)
  └── Logout
</Header>
```

### 3. SIDEBAR MINIMALISTA
```typescript
<Sidebar>
  ├── Dashboard
  ├── Pacientes
  ├── Citas / Agenda
  ├── Historia Clínica
  ├── Procedimientos
  ├── Seguimiento
  ├── Consentimiento
  ├── Facturación
  ├── CRM
  ├── Reportes
  └── Configuración
  
Estado activo: línea dorada a la izquierda
Icono + texto
Colapsable en móvil
```

### 4. PATIENT CARD (Dashboard)
```typescript
<PatientCard>
  ├── Foto perfil circular (grande)
  ├── Nombre + edad
  ├── Procedimiento actual
  ├── Próximo control (fecha)
  ├── Estado (post-op día 3, etc.)
  ├── Alertas (badges rojos/naranjas)
  ├── Últimos datos vitales (opcional)
  └── Click → Abre vista detallada
  
Color de borde: según estado
├── Verde: post-op normal
├── Naranja: requiere atención
└── Rojo: crítico
```

### 5. MODAL ELEGANTE
```typescript
<Modal>
  ├── Overlay (semi-transparente oscuro)
  ├── Dialog (centrado, max-width 600px)
  ├── Close button (X arriba a la derecha)
  ├── Header (título + descripción)
  ├── Body (contenido scrolleable)
  ├── Footer (botones: Cancelar, Aceptar)
  └── Animación: fade-in + scale suave
  
Entrada: scale(0.95) → scale(1)
Salida: scale(1) → scale(0.95)
```

### 6. TIMELINE CLÍNICO
```typescript
<Timeline>
  Ejemplo: Evolución postoperatoria
  
  DÍA 1 ───────────────
      ✓ Dolor leve
      ✓ Drenaje normal
      ✓ Medicación OK
      
  DÍA 3 ───────────────
      ✓ Fotos subidas
      ⚠ Edema moderado
      ✓ Sin complicaciones
      
  DÍA 7 ───────────────
      ✓ Control realizado
      ✓ Resultado esperado
      
  Elemento actual: highlight dorado
  Completados: verde + checkmark
  Pendientes: gris
  Alertas: rojo/naranja
```

### 7. SLIDER ANTES/DESPUÉS
```typescript
<BeforeAfterSlider>
  ├── Imagen antes (izquierda)
  ├── Imagen después (derecha)
  ├── Separador con handle (deslizable)
  ├── Labels: "Antes" | "Después"
  ├── Zoom interactivo
  ├── Botones de navegación (si hay múltiples)
  └── Información de fecha
  
Interacción: mouse drag o touch swipe
Smooth scroll
Marca antes/después clara
```

### 8. MAPA CORPORAL INTERACTIVO
```typescript
<BodyMap interactive>
  ├── Imagen base (cuerpo vista frontal/trasera)
  ├── Zonas clickeables (SVG overlay)
  ├── Colorimetría:
  │   ├── Verde: normal
  │   ├── Naranja: edema leve
  │   ├── Rojo: edema intenso
  │   └── Morado: hematoma
  ├── Tooltip al hover: "glúteo derecho"
  ├── Click → abre panel de anotación
  ├── Anotación clínica (texto + foto)
  └── Historial de cambios
```

### 9. DATA TABLE MÉDICA
```typescript
<MedicalDataTable>
  ├── Encabezados sticky
  ├── Filas alternadas (subtle striping)
  ├── Inline actions (ver, editar, descargar)
  ├── Ordenamiento por columnas
  ├── Filtros avanzados (desplegable)
  ├── Paginación (10, 25, 50 registros)
  ├── Export a CSV/PDF
  ├── Búsqueda rápida
  └── Responsive: scrolleable horizontal en móvil
  
Estilos:
├── Header: fondo slate-900, texto dorado
├── Filas: alternancia slate-950/slate-900
├── Hover: background slate-800
└── Selección: checkbox con check dorado
```

### 10. BADGE DE ESTADO
```typescript
<Badge status>
  Estados clínicos:
  ├── PRE-OP: azul
  ├── POST-OP DÍA 1-3: naranja
  ├── POST-OP DÍA 4-7: amarillo
  ├── CONTROL PENDIENTE: rojo
  ├── COMPLETADO: verde
  └── ALERTA: rojo con icono de exclamación
  
Formato: pequeño, redondeado
Texto: blanco
Font-size: 12px
```

### 11. FIRMA DIGITAL CANVAS
```typescript
<SignatureCanvas>
  ├── Lienzo blanco (fondo limpio)
  ├── Instrucción: "Firma aquí"
  ├── Firma natural (pressure-sensitive si posible)
  ├── Botones:
  │   ├── Limpiar
  │   ├── Aceptar
  │   └── Cancelar
  ├── Captura automática en imagen
  └── Hash para integridad
  
Estilo: elegante, natural
Grosor de línea: 2-3px
Color: azul oscuro o negro
```

### 12. TOAST / NOTIFICACIÓN
```typescript
<Toast>
  Posición: arriba derecha
  Duración: 4 segundos
  
  Tipos:
  ├── Success (verde): "Paciente guardado ✓"
  ├── Error (rojo): "Error al guardar"
  ├── Warning (naranja): "Cambios sin guardar"
  └── Info (azul): "Cita confirmada"
  
  Animación: slide-in desde derecha
  Sonido: opcional
```

### 13. SKELETON LOADING
```typescript
<Skeleton>
  Mientras carga:
  ├── Card skeleton (rectángulos grises animados)
  ├── Text skeleton (líneas)
  ├── Image skeleton (cuadrado gris)
  ├── Table skeleton (filas y columnas)
  
  Animación: pulse suave
  Color: slate-800 → slate-700 → slate-800
```

### 14. DROPDOWN INTELIGENTE
```typescript
<IntelligentDropdown>
  ├── Input con búsqueda
  ├── Lista desplegable (max-height: 300px, scroll)
  ├── Autocomplete (busca mientras escribes)
  ├── Selección rápida (teclado + mouse)
  ├── Mostrar: últimos usados, favoritos
  └── Vacio: "No encontrado"
  
Ejemplo: seleccionar procedimiento
- Escribe "rino" → muestra "Rinoplastia"
- Enter o click → selecciona
```

### 15. DIALOG CONFIRMACIÓN
```typescript
<ConfirmDialog>
  ├── Icono (exclamación, pregunta)
  ├── Título (¿Estás seguro?)
  ├── Descripción (contexto)
  ├── Botones:
  │   ├── Cancelar (gris)
  │   └── Confirmar (rojo si es destructivo)
  └── Animación: fade + scale
  
Ej: "¿Eliminar esta cita?"
    "¿Confirmar cirugía?"
```

---

## 📐 LAYOUT PRINCIPAL

### DESKTOP (1920px+)
```
┌─────────────────────────────────────────┐
│           HEADER (h-16)                 │
├──────────┬──────────────────────────────┤
│          │                              │
│ SIDEBAR  │   MAIN CONTENT AREA          │
│ (w-64)   │   (responsive grid)          │
│          │                              │
│          │   ├─ Cards: 1-3 por fila     │
│          │   ├─ Tablas: full width      │
│          │   └─ Modales: centrados      │
│          │                              │
└──────────┴──────────────────────────────┘
```

### TABLET (768px - 1024px)
```
Sidebar colapsable (hamburger menu)
Cards: 2 por fila
Tablas: scrolleable horizontal
```

### MÓVIL (< 768px)
```
Header con hamburger
Sidebar: drawer (overlay)
Cards: full width
Tablas: cards view (apiladas)
Modales: full screen
```

---

## 🎬 ANIMACIONES Y TRANSICIONES

### Entrada de Componentes
```css
fade-in: opacity 0.3s ease-in
slide-up: translateY(20px) → translateY(0), 0.4s
scale-up: scale(0.95) → scale(1), 0.3s
bounce-in: más energético, 0.5s
```

### Hover y Interacción
```css
Card hover:
  - Shadow más pronunciado
  - Translatey(-2px)
  - Duración: 0.2s

Botón hover:
  - Background color change
  - Text glow (gold)
  - Duración: 0.15s
```

### Transición de Página
```css
Exit actual: fade-out 0.2s
Enter nueva: fade-in 0.3s
Smooth scroll: 0.5s
```

---

## ♿ ACCESIBILIDAD

```
├── WCAG 2.1 AA compliance
├── Contraste mínimo 4.5:1 (texto)
├── Tamaño mínimo de botón: 44x44px
├── Focus visible: outline dorado
├── Labels en inputs
├── ARIA labels en elementos clínicos
├── Navegación con teclado (Tab, Enter, Escape)
├── Screen reader friendly
└── Colores no solo para indicar estado
```

---

## 🎯 PRINCIPIOS DE DISEÑO APLICADOS

### 1. **Gestalt - Proximidad**
- Agrupar elementos relacionados
- Espaciado consistente

### 2. **Jerarquía Visual**
- Tamaño: elementos importantes más grandes
- Color: dorado para CTA
- Contraste: texto blanco sobre oscuro

### 3. **Minimalism**
- Menos es más
- Espacios en blanco generosos
- Sin clutter

### 4. **Consistency**
- Mismo sistema de colores
- Mismo tamaño de padding
- Mismos estilos de botones

### 5. **Feedback Inmediato**
- Transiciones suaves
- Toasts de confirmación
- Loading states claros

---

## 📱 RESPONSIVE BREAKPOINTS

```typescript
Tailwind breakpoints:
- xs: <640px (móvil pequeño)
- sm: 640px (móvil)
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px (desktop grande)
- 2xl: 1536px (desktop extra)

Uso:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Móvil: 1 columna
  Tablet: 2 columnas
  Desktop: 3 columnas
</div>
```

---

Especificación de componentes continúa en código...
