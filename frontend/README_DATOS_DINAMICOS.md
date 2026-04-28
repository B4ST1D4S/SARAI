# 📊 ARQUITECTURA DE DATOS - EstetIA Premium

## 🎯 Sistema de Datos Dinámicos

Todos los módulos funcionan con un **servicio de datos centralizado** (`mockData.ts`) que simula un backend real.

### ✅ Páginas Actualizadas (Datos Dinámicos)
- ✅ **AgendaProfesionalPage** - Citas dinámicas
- ✅ **FollowUpPage** - Seguimiento post-operatorio dinámico
- ✅ **CRMPage** - Leads dinámicos
- ✅ **FacturacionPage** - Facturas dinámicas
- ✅ **DashboardPage** - Intenta API real, fallback a mock

---

## 🔄 Cómo Funciona

### 1. Inicialización
```typescript
import { initializeMockData } from '../services/mockData';

// En cualquier página
useEffect(() => {
  initializeMockData(); // Crea datos iniciales
  const citas = citasService.getAll();
}, []);
```

### 2. Operaciones CRUD
```typescript
// CREAR
citasService.create({
  pacienteNombre: "Paciente",
  fecha: "2026-04-17",
  hora: "09:00",
  duracion: 45,
  procedimiento: "Liposucción",
  estado: "PENDIENTE",
  notas: "Notas"
});

// LEER
const todasLasCitas = citasService.getAll();
const citasHoy = citasService.getByFecha("2026-04-17");

// ACTUALIZAR
citasService.update(id, { estado: "CONFIRMADA" });

// ELIMINAR
citasService.delete(id);
```

### 3. Servicios Disponibles
- `pacientesService` - Gestión de pacientes
- `citasService` - Gestión de citas
- `facturasService` - Gestión de facturas
- `followUpService` - Seguimiento post-op
- `leadsService` - Gestión de leads CRM

---

## 💾 Migración a Backend Real (Producción)

### Paso 1: Reemplazar Servicio Mock
```typescript
// Cambiar imports de:
import { citasService } from '../services/mockData';

// A:
import { createCita, getCitas, updateCita } from '../services/api';
```

### Paso 2: Actualizar Llamadas
```typescript
// Mock (sync):
setCitas(citasService.getAll());

// API Real (async):
const response = await getCitas(token);
if (!response.error) {
  setCitas(response.data);
}
```

### Paso 3: Endpoints Requeridos (Backend)
```
POST   /api/citas           - Crear cita
GET    /api/citas          - Listar citas
GET    /api/citas?fecha=X  - Citas por fecha
PUT    /api/citas/:id      - Actualizar cita
DELETE /api/citas/:id      - Eliminar cita

Similar para: facturas, leads, followups
```

---

## 🎨 Estilo Premium - Ya Implementado

### Características Visuales
- ✅ **Dark Theme Premium** - Slate-900 con acentos oro
- ✅ **Animaciones Suaves** - Framer Motion en todas las cards
- ✅ **Gradientes Modernos** - from-color to-darker-color
- ✅ **Bordes Translúcidos** - border-opacity-30
- ✅ **Hover Effects** - scale + border color changes
- ✅ **Icons Claros** - Lucide React icons con colores por tipo
- ✅ **Responsive Design** - Grid que se adapta a pantalla
- ✅ **Motion Animations** - Initial → Animate en elementos

### Paleta de Colores
```
Primary:    Yellow-600   (Acentos, botones principales)
Success:    Emerald-500  (Estados positivos, confirmados)
Warning:    Yellow-500   (Pendiente, en espera)
Error:      Red-500      (Alertas, cancelado)
Info:       Blue-500     (Información, completado)
Secondary:  Purple-500   (Alternativas, pacientes)
Dark BG:    Slate-900    (Fondo principal)
Cards:      Slate-800    (Contenedores)
Border:     Slate-600    (Separadores)
Text:       White/Gray   (Textos según contraste)
```

---

## 🚀 Estado Actual

### ✅ Módulos Completamente Funcionales
1. Agenda Profesional (CRUD dinámico)
2. Vista Cirujano (Datos estáticos, premium)
3. Follow-up (CRUD dinámico)
4. CRM (CRUD dinámico)
5. Facturación (CRUD dinámico)
6. Plantillas (Estático, pero premium)
7. Mapa Corporal (Interactivo)
8. Consentimiento (Estático, premium)
9. Fotos (UI premium)
10. Historia Clínica (Conecta a API)
11. Pacientes (Conecta a API)
12. Dashboard (Conecta a API)

---

## 📝 Próximos Pasos

Para usar con Backend Real:
1. Backend enviando datos correctamente
2. Reemplazar servicios mock con llamadas API
3. Agregar manejo de errores
4. Agregar loading states
5. Agregar persistencia en servidor

Para Mejorar UI Aún Más:
1. Agregar animations más complejas
2. Agregar transiciones entre páginas
3. Agregar sonidos de notificación
4. Agregar modo dark/light
5. Agregar temas personalizables
