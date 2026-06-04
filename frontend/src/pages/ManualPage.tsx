/**
 * ManualPage.tsx
 * Manual de Usuario Interactivo — SARAI EstetIA
 * Diseño profesional, anti-dummie, visual e interactivo
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, ChevronDown, Search,
  Users, Calendar, FileText, Activity, DollarSign,
  Settings, BarChart2, Camera, MessageSquare, Printer,
  CheckCircle, AlertTriangle, Info, Zap, Star,
  Stethoscope, User, Shield, Clock, Target, TrendingUp,
  UserCheck, ClipboardList, MapPin, Heart, Phone,
  LayoutGrid, Building2, BookMarked, HelpCircle, ArrowRight,
  Play, Pause, SkipForward, MousePointer, Keyboard,
  Eye, Edit2, Plus, Trash2, Download, Upload, Save,
  Mic, Volume2, X,
} from 'lucide-react';

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface Paso {
  numero: number;
  titulo: string;
  descripcion: string;
  tipo?: 'normal' | 'warning' | 'tip' | 'success';
}

interface Atajo {
  tecla: string;
  accion: string;
}

interface Modulo {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: React.ReactNode;
  color: string;
  colorBg: string;
  colorBorder: string;
  descripcion: string;
  pasos: Paso[];
  atajos?: Atajo[];
  tips?: string[];
  roles?: string[];
  comandosVoz?: string[];
}

// ─── Datos de Módulos ──────────────────────────────────────────────────────
const MODULOS: Modulo[] = [
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    subtitulo: 'Panel Principal',
    icono: <BarChart2 size={22} />,
    color: 'text-cyan-400',
    colorBg: 'bg-cyan-500/10',
    colorBorder: 'border-cyan-500/30',
    descripcion: 'Vista general del sistema con métricas en tiempo real: pacientes del día, citas pendientes, ingresos y alertas del sistema.',
    roles: ['Administrador', 'Médico', 'Recepcionista'],
    comandosVoz: ['"Sarai dashboard"', '"Sarai inicio"', '"Sarai panel"'],
    pasos: [
      { numero: 1, titulo: 'Acceder al Dashboard', descripcion: 'Al iniciar sesión, el sistema te redirige automáticamente al Dashboard. Desde aquí puedes ver las estadísticas del día.', tipo: 'normal' },
      { numero: 2, titulo: 'Leer las métricas', descripcion: 'Las tarjetas superiores muestran: Pacientes hoy, Citas programadas, HC abiertas e Ingresos del mes. Los datos se actualizan cada vez que ingresas.', tipo: 'normal' },
      { numero: 3, titulo: 'Navegar desde las tarjetas', descripcion: 'Haz clic en cualquier tarjeta para ir directamente al módulo correspondiente (ej: clic en "Citas" → va a Agenda).', tipo: 'tip' },
      { numero: 4, titulo: 'Alertas del sistema', descripcion: 'Si hay alertas pendientes (citas sin confirmar, HC sin completar), aparecen como banners de advertencia en la parte inferior.', tipo: 'warning' },
    ],
    tips: [
      'El Dashboard no muestra datos históricos — solo el día actual.',
      'Si los números aparecen en 0, verifica que el backend esté conectado.',
    ],
  },
  {
    id: 'pacientes',
    titulo: 'Pacientes',
    subtitulo: 'Gestión del Directorio',
    icono: <Users size={22} />,
    color: 'text-blue-400',
    colorBg: 'bg-blue-500/10',
    colorBorder: 'border-blue-500/30',
    descripcion: 'Módulo central para crear, buscar, editar y gestionar el directorio completo de pacientes. Soporta carga masiva desde Excel.',
    roles: ['Administrador', 'Recepcionista', 'Médico'],
    comandosVoz: ['"Sarai pacientes"', '"Sarai lista pacientes"'],
    pasos: [
      { numero: 1, titulo: 'Buscar un paciente', descripcion: 'Usa la barra de búsqueda en la parte superior. Puedes buscar por nombre, apellido, número de documento o correo electrónico. La búsqueda es en tiempo real.', tipo: 'normal' },
      { numero: 2, titulo: 'Crear paciente nuevo', descripcion: 'Haz clic en el botón "+" o "Nuevo Paciente" (esquina superior derecha). Se abre un formulario con 3 secciones: Datos Personales, Contacto y Datos Médicos.', tipo: 'normal' },
      { numero: 3, titulo: 'Campos obligatorios', descripcion: 'Son obligatorios: Tipo de documento, Número de documento, Nombre completo y Fecha de nacimiento. Los demás son opcionales pero recomendados.', tipo: 'warning' },
      { numero: 4, titulo: 'Guardar el paciente', descripcion: 'Haz clic en "Guardar". El sistema asigna automáticamente un ID único. El paciente queda disponible en Agenda, Historia Clínica y Cotizaciones.', tipo: 'success' },
      { numero: 5, titulo: 'Carga masiva desde Excel', descripcion: 'Haz clic en "Importar" (ícono de subida). Descarga la plantilla Excel, llénala y súbela. El sistema valida cada fila y reporta errores por fila.', tipo: 'tip' },
      { numero: 6, titulo: 'Eliminar paciente', descripcion: 'Haz clic en el ícono de papelera. El sistema pide confirmación antes de eliminar. NOTA: Si el paciente tiene Historia Clínica activa, no se puede eliminar.', tipo: 'warning' },
    ],
    tips: [
      'El número de documento es único — no puedes registrar dos pacientes con el mismo documento.',
      'Al guardar el paciente desde Agenda, también queda registrado en este módulo.',
      'Usa la carga masiva para migrar pacientes desde otro sistema.',
    ],
  },
  {
    id: 'agenda',
    titulo: 'Agenda',
    subtitulo: 'Programación de Citas',
    icono: <Calendar size={22} />,
    color: 'text-violet-400',
    colorBg: 'bg-violet-500/10',
    colorBorder: 'border-violet-500/30',
    descripcion: 'Calendario interactivo para agendar, visualizar y gestionar citas médicas. Vista mensual, semanal y diaria con búsqueda de pacientes integrada.',
    roles: ['Recepcionista', 'Médico', 'Administrador'],
    comandosVoz: ['"Sarai agenda"', '"Sarai citas"', '"Sarai agenda paciente"'],
    atajos: [
      { tecla: '← →', accion: 'Navegar entre días/semanas' },
      { tecla: 'Hoy', accion: 'Botón para ir a la fecha actual' },
    ],
    pasos: [
      { numero: 1, titulo: 'Seleccionar el día', descripcion: 'Haz clic en cualquier día del calendario para ver las citas de ese día en el panel derecho. Los días con citas tienen un punto de color.', tipo: 'normal' },
      { numero: 2, titulo: 'Buscar paciente para cita', descripcion: 'En el buscador lateral escribe el nombre o documento del paciente. Si existe, aparece en la lista. Si no existe, puedes crearlo desde ahí mismo.', tipo: 'normal' },
      { numero: 3, titulo: 'Agendar la cita (Wizard)', descripcion: 'Selecciona el paciente y haz clic en "Agendar Cita". Se abre un asistente de 4 pasos: (1) Especialidad, (2) Médico, (3) Fecha y hora disponible, (4) Confirmación.', tipo: 'normal' },
      { numero: 4, titulo: 'Paso 1: Especialidad y tipo', descripcion: 'Selecciona la especialidad médica y el tipo de consulta. Solo aparecen las especialidades configuradas en el módulo Admin.', tipo: 'normal' },
      { numero: 5, titulo: 'Paso 2: Médico disponible', descripcion: 'El sistema filtra automáticamente los médicos con disponibilidad para la especialidad elegida. Elige el médico de preferencia.', tipo: 'normal' },
      { numero: 6, titulo: 'Paso 3: Fecha y hora', descripcion: 'Se muestra el calendario del médico con los horarios disponibles (en verde). Los ocupados aparecen en gris. Selecciona día y hora.', tipo: 'normal' },
      { numero: 7, titulo: 'Confirmar cita', descripcion: 'Revisa el resumen y haz clic en "Confirmar". La cita queda en estado CONFIRMADA y aparece en el calendario con el color del estado.', tipo: 'success' },
    ],
    tips: [
      'Los colores de las citas: Azul = Confirmada, Amarillo = Pendiente, Verde = Atendida, Rojo = Cancelada.',
      'Para reprogramar, haz clic en la cita y usa el botón de edición.',
      'Si el médico no tiene disponibilidad configurada, no aparece en el wizard.',
    ],
  },
  {
    id: 'admision',
    titulo: 'Admisión',
    subtitulo: 'Cola de Espera',
    icono: <UserCheck size={22} />,
    color: 'text-emerald-400',
    colorBg: 'bg-emerald-500/10',
    colorBorder: 'border-emerald-500/30',
    descripcion: 'Registro de llegada del paciente a la clínica. Cambia el estado de CONFIRMADA a EN_SALA y gestiona la cola de espera del día.',
    roles: ['Recepcionista', 'Admisionista'],
    comandosVoz: ['"Sarai admision"', '"Sarai admitir"'],
    pasos: [
      { numero: 1, titulo: 'Ver citas del día', descripcion: 'Al entrar al módulo, se cargan automáticamente todas las citas CONFIRMADAS del día actual, ordenadas por hora.', tipo: 'normal' },
      { numero: 2, titulo: 'Registrar llegada del paciente', descripcion: 'Cuando el paciente llega, busca su cita en la lista y haz clic en "Registrar Llegada" (ícono de check verde). El estado cambia a EN_SALA.', tipo: 'normal' },
      { numero: 3, titulo: 'Cola de espera', descripcion: 'Los pacientes EN_SALA aparecen en la sección de cola de espera con el tiempo de espera en tiempo real (se actualiza cada minuto).', tipo: 'normal' },
      { numero: 4, titulo: 'Buscar cita por paciente', descripcion: 'Usa la barra de búsqueda para encontrar rápidamente a un paciente por nombre o documento.', tipo: 'tip' },
      { numero: 5, titulo: 'Alertas de espera prolongada', descripcion: 'Si un paciente lleva más de 30 minutos en sala, el sistema resalta su tarjeta en amarillo como alerta.', tipo: 'warning' },
    ],
    tips: [
      'Este módulo es exclusivo para recepción — no requiere acceso a Historia Clínica.',
      'El médico ve la cola desde su Vista de Profesional (AgendaProfesional).',
    ],
  },
  {
    id: 'historia-clinica',
    titulo: 'Historia Clínica',
    subtitulo: '12 Secciones · Resolución 1995/1999',
    icono: <FileText size={22} />,
    color: 'text-rose-400',
    colorBg: 'bg-rose-500/10',
    colorBorder: 'border-rose-500/30',
    descripcion: 'Historia clínica completa conforme a la Resolución 1995/1999 de Colombia. 12 secciones de anamnesis + 4 secciones de órdenes médicas con dictado por voz (SARAI).',
    roles: ['Médico'],
    comandosVoz: ['"Sarai historia"', '"Sarai nueva historia" — abre HC nueva directamente', '"Sarai [sección]" — ej: "Sarai signos vitales"'],
    atajos: [
      { tecla: 'Ctrl + S', accion: 'Guardar borrador' },
      { tecla: 'Tab', accion: 'Siguiente campo' },
    ],
    pasos: [
      { numero: 1, titulo: 'Abrir una Historia Clínica', descripcion: 'Desde la Vista del Profesional, haz clic en el nombre del paciente EN_SALA. Se abre la HC del paciente. Si ya tiene historial, aparecen las consultas anteriores en el panel izquierdo.', tipo: 'normal' },
      { numero: 2, titulo: 'Crear nueva consulta', descripcion: 'Haz clic en "+ Nueva Consulta". Se crea una HC nueva para la visita actual. Verás las 12 secciones numeradas en el índice lateral.', tipo: 'normal' },
      { numero: 3, titulo: 'Secciones de la HC', descripcion: 'Las secciones son: (1) Datos de la consulta, (2) Motivo de consulta, (3) Enfermedad actual, (4) Revisión por sistemas, (5) Antecedentes, (6) Examen físico, (7) Signos vitales, (8) Paraclínicos, (9) Diagnóstico, (10) Plan, (11) Prescripción, (12) Notas.', tipo: 'normal' },
      { numero: 4, titulo: 'Usar dictado por voz (SARAI)', descripcion: 'Haz clic en el ícono de micrófono en cualquier campo de texto. Habla claramente y SARAI transcribe automáticamente usando Whisper. Requiere servicio Whisper activo.', tipo: 'tip' },
      { numero: 5, titulo: 'Agregar diagnósticos (APIO)', descripcion: 'En la sección de Diagnóstico, busca por código CIE-10 o nombre. Puedes agregar diagnóstico Principal, Relacionado, Complicación o Antecedente.', tipo: 'normal' },
      { numero: 6, titulo: 'Órdenes médicas', descripcion: 'Las 4 secciones de órdenes son: Procedimientos Quirúrgicos (CUPS), Medicamentos, Paraclínicos e Interconsultas. Cada una tiene búsqueda por código o nombre.', tipo: 'normal' },
      { numero: 7, titulo: 'Guardar e imprimir', descripcion: 'Haz clic en "Guardar" para guardar la HC. Luego desde Central de Impresión puedes generar el PDF oficial de la historia clínica.', tipo: 'success' },
      { numero: 8, titulo: 'Entregar historia clínica', descripcion: 'Usa el módulo de Entrega de HC para registrar la fecha y responsable de entrega al paciente.', tipo: 'normal' },
    ],
    tips: [
      'La HC se guarda automáticamente como borrador cada 2 minutos si hay cambios.',
      'No puedes eliminar una HC una vez guardada — solo marcarla como anulada.',
      'Los diagnósticos APIO están codificados en CIE-10. Búscalos por código (ej: J06.9) o nombre.',
    ],
  },
  {
    id: 'mapa-corporal',
    titulo: 'Mapa Corporal',
    subtitulo: 'Marcas 3D Interactivas',
    icono: <Activity size={22} />,
    color: 'text-orange-400',
    colorBg: 'bg-orange-500/10',
    colorBorder: 'border-orange-500/30',
    descripcion: 'Herramienta visual para marcar procedimientos, áreas tratadas y hallazgos en un modelo corporal con 4 vistas (frontal, posterior, lateral).',
    roles: ['Médico'],
    comandosVoz: ['"Sarai mapa corporal"', '"Sarai mapa"'],
    pasos: [
      { numero: 1, titulo: 'Seleccionar paciente', descripcion: 'Busca el paciente en la barra superior. Una vez seleccionado, se cargan sus marcas anteriores automáticamente.', tipo: 'normal' },
      { numero: 2, titulo: 'Elegir tipo de marca', descripcion: 'En el panel izquierdo elige el tipo: Liposucción, Implante Mamario, Lifting Facial, Rinoplastia, Abdominoplastia, Cicatriz, Hematoma, Edema, Fibrosis, Dolor o Área Tratada.', tipo: 'normal' },
      { numero: 3, titulo: 'Hacer clic en el cuerpo', descripcion: 'Haz clic en la zona del cuerpo donde quieres registrar la marca. Aparece un punto de color según el tipo seleccionado.', tipo: 'normal' },
      { numero: 4, titulo: 'Cambiar de vista', descripcion: 'Usa los botones de vista: Frontal, Posterior, Lateral Izq, Lateral Der. Cada vista tiene su propio lienzo independiente.', tipo: 'normal' },
      { numero: 5, titulo: 'Ajustar intensidad', descripcion: 'Al hacer clic, puedes ajustar la intensidad de la marca (1-10) y agregar una nota descriptiva.', tipo: 'tip' },
      { numero: 6, titulo: 'Guardar mapa', descripcion: 'Haz clic en "Guardar". Las marcas quedan asociadas a la historia clínica del paciente y fecha de la consulta.', tipo: 'success' },
    ],
    tips: [
      'Puedes hacer zoom en el modelo usando la rueda del mouse.',
      'Las marcas anteriores aparecen en tono más opaco para diferenciarse de las actuales.',
    ],
  },
  {
    id: 'cotizaciones',
    titulo: 'Cotizaciones',
    subtitulo: 'Presupuestos y Propuestas',
    icono: <DollarSign size={22} />,
    color: 'text-yellow-400',
    colorBg: 'bg-yellow-500/10',
    colorBorder: 'border-yellow-500/30',
    descripcion: 'Generador de cotizaciones profesionales para procedimientos estéticos. Incluye términos y condiciones, descuentos, firma digital e impresión en PDF.',
    roles: ['Recepcionista', 'Asesor Comercial', 'Médico'],
    comandosVoz: ['"Sarai cotizaciones"', '"Sarai presupuesto"', '"Sarai cotizar"'],
    pasos: [
      { numero: 1, titulo: 'Nueva cotización', descripcion: 'Haz clic en "+ Nueva Cotización". Busca el paciente o crea uno nuevo desde el buscador integrado.', tipo: 'normal' },
      { numero: 2, titulo: 'Agregar procedimientos', descripcion: 'En la sección de ítems, selecciona los procedimientos desde el catálogo. El precio unitario se carga automáticamente desde la parametrización.', tipo: 'normal' },
      { numero: 3, titulo: 'Aplicar descuentos', descripcion: 'Puedes aplicar descuento por porcentaje o valor fijo en cada ítem o sobre el total. El sistema recalcula automáticamente.', tipo: 'tip' },
      { numero: 4, titulo: 'Revisar términos', descripcion: 'Los términos y condiciones se incluyen automáticamente. Incluyen política de pagos, anticipo requerido (30%) y política de cancelación.', tipo: 'normal' },
      { numero: 5, titulo: 'Enviar o imprimir', descripcion: 'Haz clic en "Imprimir" para generar el PDF. También puedes cambiar el estado a ENVIADA, ACEPTADA o RECHAZADA para seguimiento.', tipo: 'success' },
    ],
    tips: [
      'Las cotizaciones ACEPTADAS se pueden convertir directamente en una cita.',
      'Los precios base se configuran en Admin → Servicios Facturables.',
    ],
  },
  {
    id: 'crm',
    titulo: 'CRM',
    subtitulo: 'Gestión de Leads y Pacientes Potenciales',
    icono: <Target size={22} />,
    color: 'text-pink-400',
    colorBg: 'bg-pink-500/10',
    colorBorder: 'border-pink-500/30',
    descripcion: 'Sistema Kanban de gestión de prospectos y leads. Arrastra tarjetas entre etapas del embudo de ventas para seguimiento comercial.',
    roles: ['Asesor Comercial', 'Recepcionista', 'Administrador'],
    comandosVoz: ['"Sarai crm"', '"Sarai gestion de relaciones"'],
    pasos: [
      { numero: 1, titulo: 'Entender el Kanban', descripcion: 'El tablero tiene columnas que representan etapas: Nuevo Lead → Contactado → Cita Agendada → Cotización Enviada → Convertido → Perdido.', tipo: 'normal' },
      { numero: 2, titulo: 'Crear nuevo lead', descripcion: 'Haz clic en "+ Lead" en la columna "Nuevo". Ingresa nombre, teléfono, procedimiento de interés y fuente (Instagram, Referido, Web, etc.).', tipo: 'normal' },
      { numero: 3, titulo: 'Mover entre etapas (Drag & Drop)', descripcion: 'Arrastra la tarjeta del lead y suéltala en la columna de la etapa correcta. El sistema guarda el cambio automáticamente.', tipo: 'tip' },
      { numero: 4, titulo: 'Ver métricas del embudo', descripcion: 'En la parte superior hay métricas: Total leads, Tasa de conversión, Leads esta semana. Se actualizan en tiempo real.', tipo: 'normal' },
      { numero: 5, titulo: 'Convertir lead en paciente', descripcion: 'Desde la tarjeta del lead, haz clic en "Agendar Cita". Se abre el wizard de citas y al confirmar, el lead se marca como CONVERTIDO.', tipo: 'success' },
    ],
    tips: [
      'Los leads "calientes" tienen un ícono de llama — son los que mostraron interés recientemente.',
      'Usa los filtros de fuente para analizar qué canal genera más leads.',
    ],
  },
  {
    id: 'config-agenda',
    titulo: 'Config. Agenda',
    subtitulo: 'Disponibilidad del Profesional',
    icono: <Clock size={22} />,
    color: 'text-teal-400',
    colorBg: 'bg-teal-500/10',
    colorBorder: 'border-teal-500/30',
    descripcion: 'Configuración de la disponibilidad horaria de cada médico. Define días hábiles, franjas horarias, descansos y bloqueos por día especial.',
    roles: ['Administrador', 'Médico'],
    comandosVoz: ['"Sarai configurar agenda"', '"Sarai config agenda"'],
    pasos: [
      { numero: 1, titulo: 'Seleccionar profesional', descripcion: 'Usa el buscador de profesionales en la parte superior. Puedes buscar por nombre, especialidad o número de documento.', tipo: 'normal' },
      { numero: 2, titulo: 'Elegir vista del calendario', descripcion: 'El calendario tiene 3 vistas: Mes (ver disponibilidad general), Semana (ver bloques de la semana) y Día (ver horarios del día).', tipo: 'normal' },
      { numero: 3, titulo: 'Agregar franja horaria', descripcion: 'Haz clic en "+ Agregar Horario" y define: Días de la semana, Hora inicio, Hora fin y Duración de cada cita (ej: 30 min). Guarda con el botón de check.', tipo: 'normal' },
      { numero: 4, titulo: 'Bloquear un día', descripcion: 'Para bloquear un día específico (festivo, vacaciones), haz clic en el día en el calendario y selecciona "Bloquear día". Agrega el motivo.', tipo: 'warning' },
      { numero: 5, titulo: 'Fecha de vigencia', descripcion: 'Puedes definir una fecha hasta cuándo aplica la disponibilidad. Útil para médicos por contrato o rotativos.', tipo: 'tip' },
    ],
    tips: [
      'Si no configuras disponibilidad, el médico NO aparecerá en el wizard de citas.',
      'Puedes copiar la disponibilidad de un médico a otro usando el botón de duplicar.',
    ],
  },
  {
    id: 'central-impresion',
    titulo: 'Central de Impresión',
    subtitulo: 'PDFs Oficiales',
    icono: <Printer size={22} />,
    color: 'text-slate-400',
    colorBg: 'bg-slate-500/10',
    colorBorder: 'border-slate-500/30',
    descripcion: 'Generación e impresión de documentos oficiales: Historia Clínica completa, Órdenes Médicas y Fórmulas. Búsqueda por paciente y consulta.',
    roles: ['Médico', 'Recepcionista', 'Administrador'],
    comandosVoz: ['"Sarai central impresion"', '"Sarai impresion"', '"Sarai ir a impresion"'],
    pasos: [
      { numero: 1, titulo: 'Buscar paciente', descripcion: 'En la barra de búsqueda escribe el nombre o documento del paciente. Aparece una lista con sus consultas registradas.', tipo: 'normal' },
      { numero: 2, titulo: 'Seleccionar consulta', descripcion: 'Elige la consulta que deseas imprimir de la lista. Se muestra un resumen con fecha, médico y diagnósticos.', tipo: 'normal' },
      { numero: 3, titulo: 'Imprimir Historia Clínica', descripcion: 'Haz clic en "Imprimir HC". Se abre una nueva ventana con el HTML de la HC lista para impresión con las 12 secciones completas.', tipo: 'normal' },
      { numero: 4, titulo: 'Imprimir Órdenes Médicas', descripcion: 'Haz clic en "Imprimir Órdenes". Se genera un documento separado solo con los procedimientos, medicamentos e interconsultas.', tipo: 'normal' },
      { numero: 5, titulo: 'Guardar como PDF', descripcion: 'En el diálogo de impresión del navegador, selecciona "Guardar como PDF" en lugar de una impresora física.', tipo: 'tip' },
    ],
    tips: [
      'El formato de la HC cumple con los estándares de la Resolución 1995/1999.',
      'Para mejor calidad de PDF, usa Chrome o Edge con orientación "Vertical" y márgenes "Mínimos".',
    ],
  },
  {
    id: 'admin',
    titulo: 'Administración',
    subtitulo: 'Parametrización del Sistema',
    icono: <Settings size={22} />,
    color: 'text-indigo-400',
    colorBg: 'bg-indigo-500/10',
    colorBorder: 'border-indigo-500/30',
    descripcion: 'Centro de configuración del sistema. Define especialidades, tipos de consulta, departamentos, cargos, servicios facturables y preparaciones.',
    roles: ['Administrador'],
    comandosVoz: ['"Sarai admin"', '"Sarai administracion"', '"Sarai sistema"', '"Sarai parametrizacion"'],
    pasos: [
      { numero: 1, titulo: 'Especialidades', descripcion: 'Ve a Admin → Especialidades. Crea las especialidades médicas de la clínica (ej: Cirugía Plástica, Dermatología). Define nombre, código y descripción.', tipo: 'normal' },
      { numero: 2, titulo: 'Tipos de Consulta', descripcion: 'Ve a Admin → Tipos de Consulta. Crea los tipos asociados a cada especialidad (ej: Consulta Inicial, Control, Valoración Pre-quirúrgica). Define duración y precio.', tipo: 'normal' },
      { numero: 3, titulo: 'Departamentos y Cargos', descripcion: 'Configura la estructura organizacional. Los departamentos (Medicina, Enfermería, Administrativo) y cargos se usan para la creación de usuarios.', tipo: 'normal' },
      { numero: 4, titulo: 'Servicios Facturables', descripcion: 'Define el catálogo de procedimientos con sus precios base (ej: Liposucción $8.500.000). Estos precios se cargan automáticamente en Cotizaciones.', tipo: 'normal' },
      { numero: 5, titulo: 'Preparaciones', descripcion: 'Configura las instrucciones de preparación previa para cada tipo de consulta. Se envían automáticamente al confirmar una cita.', tipo: 'tip' },
    ],
    tips: [
      'IMPORTANTE: Primero crea las Especialidades, luego los Tipos de Consulta (dependen de ellas).',
      'Los cambios en precios no afectan cotizaciones ya creadas.',
      'Solo el rol Administrador puede acceder a este módulo.',
    ],
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    subtitulo: 'Gestión de Accesos',
    icono: <Shield size={22} />,
    color: 'text-purple-400',
    colorBg: 'bg-purple-500/10',
    colorBorder: 'border-purple-500/30',
    descripcion: 'Creación y gestión de cuentas de usuario del sistema. Asignación de roles, departamentos y control de acceso.',
    roles: ['Administrador'],
    comandosVoz: ['"Sarai usuarios"', '"Sarai usuario"', '"Sarai gestion usuarios"'],
    pasos: [
      { numero: 1, titulo: 'Crear usuario', descripcion: 'Haz clic en "+ Nuevo Usuario". Completa: Nombre, Correo (será el usuario de acceso), Contraseña inicial, Rol y Departamento.', tipo: 'normal' },
      { numero: 2, titulo: 'Roles disponibles', descripcion: 'Los roles son: ADMIN (acceso total), MEDICO (HC y agenda propia), RECEPCION (agenda y admisión), ENFERMERA (seguimiento) y ASESOR (CRM y cotizaciones).', tipo: 'normal' },
      { numero: 3, titulo: 'Cambiar contraseña', descripcion: 'Selecciona el usuario y haz clic en "Cambiar contraseña". El usuario debe cambiarla en su primer ingreso.', tipo: 'warning' },
      { numero: 4, titulo: 'Desactivar usuario', descripcion: 'Puedes desactivar un usuario sin eliminarlo. El usuario no podrá iniciar sesión pero su historial queda intacto.', tipo: 'tip' },
    ],
    tips: [
      'El correo electrónico es el nombre de usuario — debe ser único.',
      'Si un médico es también usuario, asegúrate de que su perfil de médico esté creado en Especialidades.',
    ],
  },
  {
    id: 'sarai',
    titulo: 'SARAI IA',
    subtitulo: 'Asistente de Inteligencia Artificial',
    icono: <MessageSquare size={22} />,
    color: 'text-cyan-300',
    colorBg: 'bg-cyan-500/10',
    colorBorder: 'border-cyan-500/30',
    descripcion: 'Asistente de IA integrado en el sistema. Responde preguntas médicas, resume historias clínicas, sugiere diagnósticos diferenciales y permite dictado por voz.',
    roles: ['Médico', 'Administrador'],
    comandosVoz: ['"Sarai activar comandos" — activa el modo voz completo', '"Sarai desactivar" — apaga el modo voz'],
    pasos: [
      { numero: 1, titulo: 'Abrir el asistente', descripcion: 'Haz clic en el ícono de onda ECG en la esquina inferior derecha. Se abre el panel flotante del asistente desde cualquier pantalla del sistema.', tipo: 'normal' },
      { numero: 2, titulo: 'Escribir una consulta', descripcion: 'Escribe tu pregunta en el campo de texto. Ejemplos: "¿Cuál es la dosis de tramadol en adultos?", "Diagnóstico diferencial para dolor en epigastrio", "Resume los síntomas de este paciente".', tipo: 'normal' },
      { numero: 3, titulo: 'Hablar con SARAI', descripcion: 'Con el modo comandos activo, di "Sarai grabar", habla tu consulta y di "Sarai parar". SARAI transcribe con Whisper y procesa la respuesta con IA.', tipo: 'tip' },
      { numero: 4, titulo: 'Activar comandos de voz', descripcion: 'Haz clic en el micrófono. La primera vez el navegador pedirá permiso para acceder al micrófono — haz clic en "Permitir" (esto siempre requiere clic manual, no se puede hacer por voz). Luego di "activar comandos" y el sistema queda en modo voz completo.', tipo: 'warning' },
      { numero: 5, titulo: 'Contexto del paciente activo', descripcion: 'Si tienes una Historia Clínica abierta, SARAI puede referirse a los datos de ese paciente. Ej: "¿Qué analgésico recomiendas dado el diagnóstico actual?"', tipo: 'normal' },
    ],
    tips: [
      'Las respuestas de SARAI son orientativas — siempre valida con tu criterio clínico.',
      'SARAI requiere conexión a OpenAI (GPT). Si no responde, verifica las variables de entorno.',
      'El dictado por voz requiere el servicio Whisper activo. Ver sección "Dictado Whisper" en este manual.',
    ],
  },
  // ── MÓDULOS ADICIONALES ────────────────────────────────────────────────────
  {
    id: 'visual-clinico',
    titulo: 'Visual Clínico',
    subtitulo: 'Fotos por Fase del Tratamiento',
    icono: <Camera size={22} />,
    color: 'text-fuchsia-400',
    colorBg: 'bg-fuchsia-500/10',
    colorBorder: 'border-fuchsia-500/30',
    descripcion: 'Registro fotográfico organizado por fases: Antes, Durante, Después, Seguimiento, Mantenimiento y Reintervención. Permite comparar fotos entre fases con análisis automático de resultados.',
    roles: ['Médico'],
    comandosVoz: ['"Sarai visual clinico"', '"Sarai fotos"', '"Sarai foto"', '"Sarai galeria"'],
    pasos: [
      { numero: 1, titulo: 'Buscar el paciente', descripcion: 'Escribe el nombre o documento del paciente en la barra superior. Al seleccionarlo, se cargan automáticamente todas sus fotos anteriores organizadas por fase.', tipo: 'normal' },
      { numero: 2, titulo: 'Elegir la fase', descripcion: 'Selecciona la fase: Antes (fotos previas al procedimiento), Durante (fotos intraoperatorias), Después (resultado inmediato), Seguimiento, Mantenimiento o Reintervención.', tipo: 'normal' },
      { numero: 3, titulo: 'Elegir la región corporal', descripcion: 'Selecciona la zona del cuerpo (ej: Abdomen, Rostro, Senos, Piernas). Esto organiza las fotos por área para que las comparaciones sean más claras.', tipo: 'normal' },
      { numero: 4, titulo: 'Subir o tomar la foto', descripcion: 'Haz clic en "+ Agregar foto". Puedes subir una imagen desde tu dispositivo o tomar la foto con la cámara. Agrega una nota si quieres describir algo específico.', tipo: 'normal' },
      { numero: 5, titulo: 'Comparar entre fases', descripcion: 'Haz clic en "Comparar" para ver dos fotos de fases distintas lado a lado. El sistema calcula automáticamente un puntaje de mejora basado en los cambios visuales.', tipo: 'tip' },
      { numero: 6, titulo: 'Las fotos se guardan automáticamente', descripcion: 'Al subir la foto queda guardada de inmediato. Queda vinculada al paciente, la fecha y el procedimiento — no necesitas hacer clic en "Guardar" adicional.', tipo: 'success' },
    ],
    tips: [
      'Toma siempre las fotos en la misma posición (frontal, lateral) para que las comparaciones sean precisas.',
      'Puedes ver todas las fotos de un paciente en línea de tiempo haciendo clic en "Vista cronológica".',
    ],
  },
  {
    id: 'agenda-profesional',
    titulo: 'Agenda Profesional',
    subtitulo: 'Vista Diaria del Médico',
    icono: <Stethoscope size={22} />,
    color: 'text-sky-400',
    colorBg: 'bg-sky-500/10',
    colorBorder: 'border-sky-500/30',
    descripcion: 'Vista personal del médico para gestionar sus pacientes del día. Desde aquí ve quién está en sala, abre historias clínicas y cambia el estado de cada cita.',
    roles: ['Médico'],
    comandosVoz: ['"Sarai agenda profesional"', '"Sarai agenda medico"', '"Sarai agenda del médico"'],
    pasos: [
      { numero: 1, titulo: 'Carga automática del día', descripcion: 'Al abrir la Agenda Profesional, el sistema carga todos los pacientes citados hoy para el médico logueado, ordenados por hora. No necesitas buscar ni filtrar.', tipo: 'normal' },
      { numero: 2, titulo: 'Ver quién está en sala', descripcion: 'Los pacientes que ya llegaron (registrados en Admisión) aparecen con el estado "En Sala" resaltado en color. Estos son los que están listos para ser atendidos.', tipo: 'normal' },
      { numero: 3, titulo: 'Abrir la Historia Clínica', descripcion: 'Haz clic en el nombre del paciente o en el botón "Atender". El sistema abre directamente la Historia Clínica de ese paciente para la consulta actual.', tipo: 'normal' },
      { numero: 4, titulo: 'Cambiar el estado de la cita', descripcion: 'Después de atender al paciente, cambia el estado a "Completada" con el botón correspondiente. También puedes marcar "Cancelada" o "No asistió".', tipo: 'normal' },
      { numero: 5, titulo: 'Pestañas del paciente', descripcion: 'Desde la tarjeta del paciente accede a 5 pestañas: Visión General, Fotos Clínicas, Consentimientos Firmados, Controles Programados y Facturación.', tipo: 'tip' },
    ],
    tips: [
      'Al marcar una cita como "Completada", la Historia Clínica queda cerrada automáticamente.',
      'Puedes crear una nueva cita desde este módulo con el botón "+  Cita" en la parte superior.',
    ],
  },
  {
    id: 'quirofano',
    titulo: 'Quirófano',
    subtitulo: 'Vista Integrada del Cirujano',
    icono: <Building2 size={22} />,
    color: 'text-red-400',
    colorBg: 'bg-red-500/10',
    colorBorder: 'border-red-500/30',
    descripcion: 'Interfaz completa para el cirujano durante y después del procedimiento. Centraliza fotos, consentimientos, agenda de controles y facturación en una sola pantalla.',
    roles: ['Médico'],
    comandosVoz: ['"Sarai quirofano"', '"Sarai cirujano"', '"Sarai vista cirujano"'],
    pasos: [
      { numero: 1, titulo: 'Seleccionar el paciente del día', descripcion: 'El módulo carga los pacientes programados para hoy. Haz clic en el paciente que vas a atender. Verás su nombre, edad, documento y los procedimientos planificados.', tipo: 'normal' },
      { numero: 2, titulo: 'Pestaña: Visión General', descripcion: 'Muestra el resumen del paciente: diagnósticos previos, procedimientos planificados, alergias y medicamentos. Es el punto de partida antes de comenzar.', tipo: 'normal' },
      { numero: 3, titulo: 'Pestaña: Fotos Clínicas', descripcion: 'Accede a las fotos del paciente organizadas por fase. Puedes agregar fotos del procedimiento directamente desde esta pestaña.', tipo: 'normal' },
      { numero: 4, titulo: 'Pestaña: Consentimientos', descripcion: 'Verifica que los consentimientos estén firmados ANTES de iniciar el procedimiento. Si falta alguno, puedes enviarlo a firma desde aquí.', tipo: 'warning' },
      { numero: 5, titulo: 'Pestaña: Controles', descripcion: 'Programa los controles post-operatorios: Día 1, 3, 7, 15 y 30. Define las tareas de seguimiento para cada cita. Estas citas se crean en la agenda automáticamente.', tipo: 'normal' },
      { numero: 6, titulo: 'Pestaña: Facturación', descripcion: 'Registra los servicios realizados y genera la factura directamente desde el quirófano, sin necesidad de ir a otro módulo.', tipo: 'tip' },
    ],
    tips: [
      'Usa esta vista como el punto de control central en el día quirúrgico.',
      'Las plantillas rápidas en la esquina inferior derecha aceleran el llenado de protocolos repetitivos.',
    ],
  },
  {
    id: 'followup',
    titulo: 'Follow-up',
    subtitulo: 'Control Post-operatorio',
    icono: <Heart size={22} />,
    color: 'text-pink-400',
    colorBg: 'bg-pink-500/10',
    colorBorder: 'border-pink-500/30',
    descripcion: 'Seguimiento automático de pacientes operados. Muestra alertas por síntomas reportados, días de control pendientes y estado de recuperación en tiempo real.',
    roles: ['Médico', 'Enfermera'],
    comandosVoz: ['"Sarai seguimiento"', '"Sarai control"', '"Sarai follow up"'],
    pasos: [
      { numero: 1, titulo: 'Lista de pacientes en seguimiento', descripcion: 'Al abrir el módulo aparecen todos los pacientes en fase post-operatoria. Cada uno muestra: nombre, procedimiento, días desde la cirugía y estado actual.', tipo: 'normal' },
      { numero: 2, titulo: 'Leer los colores de estado', descripcion: 'Verde = recuperación normal. Amarillo = requiere atención (síntomas leves reportados). Rojo = alerta (síntomas que necesitan revisión urgente).', tipo: 'normal' },
      { numero: 3, titulo: 'Ver el detalle de un paciente', descripcion: 'Haz clic en el paciente para ver: síntomas que reportó, fotos del estado actual, tareas de control pendientes e historial de controles anteriores.', tipo: 'normal' },
      { numero: 4, titulo: 'Completar un control del día', descripcion: 'Cuando realizas el control programado (ej: Día 7), marca las tareas como completadas y agrega tus observaciones. El estado del paciente se actualiza solo.', tipo: 'normal' },
      { numero: 5, titulo: 'Los controles se crean solos', descripcion: 'El sistema crea automáticamente los controles en los días 1, 3, 7, 15 y 30 post-operatorio. No necesitas crearlos manualmente — solo completarlos cuando llegue el día.', tipo: 'tip' },
    ],
    tips: [
      'Los pacientes en rojo deben atenderse antes que los demás.',
      'Puedes adjuntar fotos del estado del paciente directamente desde cada control.',
      'Las alertas se generan automáticamente cuando el paciente reporta síntomas como fiebre, dolor intenso o secreción.',
    ],
  },
  {
    id: 'consentimiento',
    titulo: 'Consentimiento',
    subtitulo: 'Consentimientos Informados Digitales',
    icono: <ClipboardList size={22} />,
    color: 'text-amber-400',
    colorBg: 'bg-amber-500/10',
    colorBorder: 'border-amber-500/30',
    descripcion: 'Generación y firma digital de consentimientos informados por procedimiento. Incluye riesgos específicos para cada tipo de cirugía y firma en pantalla con tinta digital.',
    roles: ['Médico', 'Recepcionista'],
    comandosVoz: ['"Sarai consentimiento"', '"Sarai consentimientos"'],
    pasos: [
      { numero: 1, titulo: 'Seleccionar el procedimiento', descripcion: 'Elige el procedimiento en el selector superior: Liposucción, Abdominoplastia, Mamoplastia, Rinoplastia, Blefaroplastia o Botox. El consentimiento con sus riesgos específicos se carga automáticamente.', tipo: 'normal' },
      { numero: 2, titulo: 'Revisar los riesgos con el paciente', descripcion: 'Lee junto al paciente la lista de riesgos del procedimiento elegido. Cada riesgo aparece claramente descrito en el documento.', tipo: 'normal' },
      { numero: 3, titulo: 'Capturar la firma digital', descripcion: 'El paciente firma directamente en la pantalla con el dedo o el mouse en el recuadro de firma (borde dorado). La firma queda registrada en el documento.', tipo: 'normal' },
      { numero: 4, titulo: 'Guardar e imprimir', descripcion: 'Haz clic en "Guardar". El consentimiento queda vinculado al paciente con fecha, hora y procedimiento. Imprime una copia para el archivo físico si es necesario.', tipo: 'success' },
    ],
    tips: [
      'Guarda el consentimiento ANTES de iniciar el procedimiento — es un requisito legal.',
      'Puedes verificar consentimientos firmados desde el módulo Quirófano en la pestaña "Consentimientos".',
      'Si el paciente no puede firmar digitalmente, imprime el documento y escanea la firma física.',
    ],
  },
  {
    id: 'facturacion',
    titulo: 'Facturación',
    subtitulo: 'Cobros, Pagos y Cuotas',
    icono: <TrendingUp size={22} />,
    color: 'text-green-400',
    colorBg: 'bg-green-500/10',
    colorBorder: 'border-green-500/30',
    descripcion: 'Gestión de facturas, pagos y planes de cuotas. Muestra en tiempo real lo que ya se cobró y lo que está pendiente de cobro.',
    roles: ['Administrador', 'Recepcionista'],
    comandosVoz: ['"Sarai facturacion"', '"Sarai facturas"', '"Sarai factura"'],
    pasos: [
      { numero: 1, titulo: 'Ver el resumen de cobros', descripcion: 'En la parte superior hay dos cifras clave: Ingresos Pagados (lo que ya entró a caja) y Pendiente de Cobro (lo que falta por pagar). Se actualizan en tiempo real.', tipo: 'normal' },
      { numero: 2, titulo: 'Estados de las facturas', descripcion: 'La lista muestra las facturas con su estado: PAGADA (verde), PARCIAL (amarillo — tiene cuotas pendientes) o PENDIENTE (rojo). Haz clic en una factura para ver el detalle.', tipo: 'normal' },
      { numero: 3, titulo: 'Crear una factura nueva', descripcion: 'Haz clic en "+ Nueva Factura". Busca el paciente, selecciona los servicios prestados y define si el pago es de una sola vez o en cuotas.', tipo: 'normal' },
      { numero: 4, titulo: 'Registrar el pago de una cuota', descripcion: 'Abre la factura → en la sección de cuotas haz clic en "Registrar Pago" junto a la cuota que se pagó. El estado de la factura se actualiza automáticamente.', tipo: 'tip' },
    ],
    tips: [
      'Una factura PARCIAL tiene plan de cuotas con pagos aún pendientes.',
      'La factura se marca PAGADA automáticamente cuando se registra el pago de la última cuota.',
    ],
  },
  {
    id: 'plantillas',
    titulo: 'Plantillas',
    subtitulo: 'Contenido Clínico Reutilizable',
    icono: <BookMarked size={22} />,
    color: 'text-indigo-400',
    colorBg: 'bg-indigo-500/10',
    colorBorder: 'border-indigo-500/30',
    descripcion: 'Banco de plantillas clínicas por procedimiento. Cada plantilla incluye: riesgos, checklist prequirúrgico, programa de controles post-op y contenido base de Historia Clínica.',
    roles: ['Médico', 'Administrador'],
    comandosVoz: ['"Sarai plantillas"', '"Sarai plantilla"'],
    pasos: [
      { numero: 1, titulo: 'Buscar una plantilla', descripcion: 'Busca por nombre del procedimiento o filtra por categoría: Facial, Corporal o No Invasivo. Las plantillas aparecen como tarjetas con descripción.', tipo: 'normal' },
      { numero: 2, titulo: 'Ver el contenido', descripcion: 'Haz clic en la plantilla para abrirla. Verás: lista de riesgos, checklist de preparación prequirúrgica, programa de controles post-op y texto base para la historia clínica.', tipo: 'normal' },
      { numero: 3, titulo: 'Usar la plantilla en una consulta', descripcion: 'Haz clic en "Usar esta plantilla". El contenido se copia automáticamente a la Historia Clínica del paciente activo. Puedes editarlo antes de guardar.', tipo: 'tip' },
      { numero: 4, titulo: 'Crear una plantilla nueva', descripcion: 'Haz clic en "+ Nueva Plantilla". Escribe el nombre, categoría y agrega el contenido de cada sección. Al guardar queda disponible para todos los médicos.', tipo: 'normal' },
      { numero: 5, titulo: 'Editar una plantilla existente', descripcion: 'Abre la plantilla → haz clic en "Editar" → modifica lo que necesites → guarda. Los cambios aplican solo a usos futuros, no afectan historias ya guardadas.', tipo: 'normal' },
    ],
    tips: [
      'Las plantillas ahorran tiempo: evitas escribir lo mismo en cada consulta del mismo procedimiento.',
      'Crea plantillas por cirujano o por tipo de procedimiento para mayor personalización.',
    ],
  },
  // ── COMANDOS DE VOZ ────────────────────────────────────────────────────────
  {
    id: 'comandos-voz',
    titulo: 'Comandos de Voz',
    subtitulo: 'Navegar el Sistema Manos Libres',
    icono: <Mic size={22} />,
    color: 'text-lime-400',
    colorBg: 'bg-lime-500/10',
    colorBorder: 'border-lime-500/30',
    descripcion: 'Controla todo el sistema con tu voz. Di "Sarai" seguido del comando para navegar, grabar, abrir módulos y realizar acciones sin tocar el teclado ni el mouse.',
    roles: ['Todos los roles'],
    comandosVoz: [
      '"Sarai activar comandos" — inicia el modo voz',
      '"Sarai [módulo]" — navega directo (ej: "Sarai agenda")',
      '"Sarai grabar" — inicia dictado Whisper',
      '"Sarai parar" — detiene y transcribe',
      '"Sarai imprimir" — imprime el documento activo',
      '"Sarai nueva historia" — abre HC nueva directamente',
      '"Sarai desactivar" — apaga el modo voz',
    ],
    pasos: [
      { numero: 1, titulo: 'Haz clic en el micrófono', descripcion: 'Haz clic en el ícono de micrófono (esquina inferior derecha). La primera vez, el navegador muestra una ventana pidiendo permiso para usar el micrófono — debes hacer clic en "Permitir". Este paso siempre es manual: el navegador no puede conceder permisos de micrófono por voz (política de privacidad del navegador).', tipo: 'warning' },
      { numero: 2, titulo: 'Di "activar comandos"', descripcion: 'Una vez el navegador haya dado permiso al micrófono, di en voz alta: "Sarai activar comandos". El ícono parpadea en verde: el modo voz está activo. A partir de aquí todo lo demás se controla por voz.', tipo: 'normal' },
      { numero: 3, titulo: 'Entiende los colores del ícono', descripcion: '🔴 ROJO: servicio Whisper no disponible (dictado desactivado). 🔵 AZUL: Whisper activo y listo para dictar. 🟣 MORADO/ÍNDIGO: modo comandos de voz activo (escuchando). 🔴 ROJO parpadeando con "REC": grabando audio para transcripción. El badge pequeño (esquina inferior derecha del ícono) también indica: ✓ azul = Whisper online · ✕ rojo = Whisper offline.', tipo: 'tip' },
      { numero: 4, titulo: 'Navegar a cualquier módulo', descripcion: 'Di "Sarai" + el nombre del módulo. Ejemplos: "Sarai pacientes", "Sarai agenda", "Sarai cotizaciones", "Sarai quirofano", "Sarai manual". El sistema navega de inmediato.', tipo: 'tip' },
      { numero: 4, titulo: 'Prefijos opcionales', descripcion: 'Antes del módulo puedes decir: "ir a", "abrir", "mostrar", "ve a". Ejemplo: "Sarai ir a pacientes" o "Sarai abrir la agenda" — funcionan igual que sin prefijo.', tipo: 'normal' },
      { numero: 5, titulo: 'Grabar dictado (Whisper)', descripcion: 'Di "Sarai grabar" para iniciar la grabación de audio. Habla con normalidad. Di "Sarai parar" cuando termines. El texto aparece automáticamente en el campo activo.', tipo: 'normal' },
      { numero: 6, titulo: 'Navegar secciones de Historia Clínica', descripcion: 'Dentro del formulario de HC di el nombre de la sección: "Sarai motivo de consulta", "Sarai signos vitales", "Sarai diagnóstico y plan", "Sarai antecedentes". El formulario va a esa sección.', tipo: 'normal' },
      { numero: 7, titulo: 'Imprimir con voz', descripcion: 'Di "Sarai imprimir" para abrir el diálogo de impresión del documento actual. Funciona desde Historia Clínica y Central de Impresión.', tipo: 'normal' },
      { numero: 8, titulo: 'Apagar el modo voz', descripcion: 'Di "Sarai desactivar" o "Sarai apagar comandos". El ícono deja de parpadear. Puedes reactivarlo cuando quieras repitiendo el proceso desde el paso 1.', tipo: 'warning' },
    ],
    tips: [
      'El sistema acepta variantes del nombre: Sara, Saray, Sarah, Sarahi, Zarai — no es necesario pronunciar exactamente "Sarai".',
      'También puedes decir "Hey Sarai...", "Oye Sarai..." antes del comando.',
      'Si el micrófono no responde: en Chrome haz clic en el candado (🔒) junto a la URL → Micrófono → Permitir → recarga la página (F5).',
      'Sin micrófono: abre el campo de texto del asistente, escribe el comando (ej: "sarai ir a pacientes") y presiona Enter — funciona igual.',
    ],
  },
  // ── DICTADO WHISPER ────────────────────────────────────────────────────────
  {
    id: 'whisper',
    titulo: 'Dictado Whisper',
    subtitulo: 'Transcripción Automática de Voz a Texto',
    icono: <Volume2 size={22} />,
    color: 'text-violet-300',
    colorBg: 'bg-violet-500/10',
    colorBorder: 'border-violet-500/30',
    descripcion: 'Servicio de IA que convierte tu voz en texto. Úsalo para dictar la Historia Clínica, notas clínicas y consultas sin necesidad de escribir. Funciona de forma local sin enviar audio a internet.',
    roles: ['Médico', 'Todos los roles'],
    comandosVoz: ['"Sarai grabar" — inicia grabación', '"Sarai parar" — detiene y transcribe'],
    pasos: [
      { numero: 1, titulo: '¿Para qué sirve Whisper?', descripcion: 'Whisper convierte lo que dices en texto escrito con alta precisión. En SARAI se usa principalmente para dictar la Historia Clínica, notas y consultas a la IA — sin necesidad de escribir.', tipo: 'normal' },
      { numero: 2, titulo: 'Dictar en un campo de texto', descripcion: 'Dentro de cualquier campo de texto en la Historia Clínica (ej: "Motivo de consulta"), haz clic en el ícono de micrófono del campo. Habla con fluidez. Al pausar, el texto transcrito aparece automáticamente.', tipo: 'normal' },
      { numero: 3, titulo: 'Dictar con comando de voz', descripcion: 'Con el modo comandos activo, di "Sarai grabar". El sistema inicia la grabación. Habla todo lo que necesitas dictar. Di "Sarai parar" cuando termines. El texto aparece en el campo activo.', tipo: 'tip' },
      { numero: 4, titulo: 'Consejos para mejor transcripción', descripcion: 'Habla a velocidad normal y con claridad. Puedes mencionar signos de puntuación (di "coma", "punto", "nueva línea"). Evita ruido de fondo. Habla a 20-30 cm del micrófono.', tipo: 'normal' },
      { numero: 5, titulo: 'Si Whisper no está disponible', descripcion: 'Si aparece el aviso "Servicio no disponible", el servidor Whisper no está activo en este momento. Puedes continuar usando el teclado normalmente — ningún otro módulo se ve afectado.', tipo: 'warning' },
    ],
    tips: [
      'Whisper reconoce el acento colombiano y otros dialectos del español automáticamente.',
      'El modelo usado es "medium" — reconoce términos médicos como códigos CIE-10, nombres de medicamentos y procedimientos.',
      'Si transcribe mal una palabra técnica, edítala manualmente en el campo — es más rápido que repetirla.',
      'Whisper funciona localmente en el servidor — tu audio NO se envía a internet (mayor privacidad).',
    ],
  },
];

// ─── Componente Badge de Rol ──────────────────────────────────────────────
function RolBadge({ rol }: { rol: string }) {
  const colores: Record<string, string> = {
    'Administrador': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Médico': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Recepcionista': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Admisionista': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'Asesor Comercial': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Enfermera': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colores[rol] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {rol}
    </span>
  );
}

// ─── Componente Paso ─────────────────────────────────────────────────────
function PasoItem({ paso }: { paso: Paso }) {
  const config = {
    normal:  { bg: 'bg-slate-800/60', border: 'border-slate-700/50', icon: null, iconBg: 'bg-cyan-500' },
    tip:     { bg: 'bg-cyan-500/5',   border: 'border-cyan-500/30',  icon: <Zap size={12} />, iconBg: 'bg-cyan-500' },
    warning: { bg: 'bg-amber-500/5',  border: 'border-amber-500/30', icon: <AlertTriangle size={12} />, iconBg: 'bg-amber-500' },
    success: { bg: 'bg-emerald-500/5',border: 'border-emerald-500/30',icon: <CheckCircle size={12} />, iconBg: 'bg-emerald-500' },
  }[paso.tipo || 'normal'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: paso.numero * 0.05 }}
      className={`flex gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${config.iconBg} flex items-center justify-center text-white text-xs font-bold`}>
        {config.icon || paso.numero}
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-0.5">{paso.titulo}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{paso.descripcion}</p>
      </div>
    </motion.div>
  );
}

// ─── Componente Panel de Módulo ──────────────────────────────────────────
function ModuloPanel({ modulo }: { modulo: Modulo }) {
  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className={`p-5 rounded-xl border ${modulo.colorBg} ${modulo.colorBorder}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${modulo.colorBg} border ${modulo.colorBorder} flex items-center justify-center ${modulo.color} flex-shrink-0`}>
            {modulo.icono}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{modulo.titulo}</h2>
            <p className={`text-sm font-medium ${modulo.color} mb-2`}>{modulo.subtitulo}</p>
            <p className="text-sm text-slate-400 leading-relaxed">{modulo.descripcion}</p>
          </div>
        </div>
        {modulo.roles && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 mr-1">Acceso:</span>
            {modulo.roles.map(r => <RolBadge key={r} rol={r} />)}
          </div>
        )}
      </div>

      {/* Atajos de teclado */}
      {modulo.atajos && modulo.atajos.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atajos de teclado</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {modulo.atajos.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <kbd className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded border border-slate-600 font-mono">{a.tecla}</kbd>
                <span className="text-xs text-slate-400">{a.accion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pasos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Play size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paso a paso</span>
        </div>
        <div className="space-y-2">
          {modulo.pasos.map(p => <PasoItem key={p.numero} paso={p} />)}
        </div>
      </div>

      {/* Tips */}
      {modulo.tips && modulo.tips.length > 0 && (
        <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Consejos pro</span>
          </div>
          <ul className="space-y-2">
            {modulo.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <ChevronRight size={12} className="text-violet-400 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comandos de Voz */}
      {modulo.comandosVoz && modulo.comandosVoz.length > 0 && (
        <div className="p-4 rounded-xl border border-lime-500/20 bg-lime-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Mic size={14} className="text-lime-400" />
            <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">Comandos de voz</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {modulo.comandosVoz.map((cmd, i) => (
              <code key={i} className="px-2 py-1 text-xs bg-slate-800 text-lime-300 rounded border border-lime-500/30 font-mono">
                {cmd}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────
export default function ManualPage() {
  const [moduloActivo, setModuloActivo] = useState<string>('dashboard');
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const contenidoRef = useRef<HTMLDivElement>(null);

  const modulosFiltrados = MODULOS.filter(m =>
    busqueda === '' ||
    m.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.pasos.some(p => p.titulo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const moduloActual = MODULOS.find(m => m.id === moduloActivo) || MODULOS[0];

  const handleSeleccionar = (id: string) => {
    setModuloActivo(id);
    contenidoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth < 768) setMenuAbierto(false);
  };

  return (
    <div className="flex h-full bg-slate-950 text-white overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuAbierto && (
          <>
            {/* Backdrop oscuro en móvil */}
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMenuAbierto(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-[85vw] max-w-[300px] md:w-72 flex-shrink-0 border-r border-slate-800 bg-slate-900 md:bg-slate-900/80 backdrop-blur flex flex-col"
            >
            {/* Header sidebar */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-white">Manual de Usuario</h1>
                  <p className="text-xs text-slate-500">SARAI EstetIA v2.0</p>
                </div>
                {/* Botón cerrar — solo móvil */}
                <button
                  onClick={() => setMenuAbierto(false)}
                  className="md:hidden flex-shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Buscador */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Lista de módulos */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {modulosFiltrados.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Sin resultados para "{busqueda}"</p>
              ) : (
                modulosFiltrados.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSeleccionar(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-left transition-all group
                      ${moduloActivo === m.id
                        ? `${m.colorBg} border ${m.colorBorder} ${m.color}`
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                  >
                    <span className={`flex-shrink-0 ${moduloActivo === m.id ? m.color : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {m.icono}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{m.titulo}</p>
                      <p className="text-[10px] opacity-60 truncate">{m.subtitulo}</p>
                    </div>
                    {moduloActivo === m.id && (
                      <ChevronRight size={12} className={m.color} />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer del sidebar */}
            <div className="p-3 border-t border-slate-800 space-y-2">
              {/* Hint cerrar — solo móvil */}
              <p className="md:hidden text-center text-[10px] text-slate-600">
                Toca fuera o ✕ para cerrar
              </p>
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle size={12} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400">¿Necesitas ayuda?</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Usa SARAI IA (ícono inferior derecho) para consultas específicas del sistema.
                </p>
              </div>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Contenido principal ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <LayoutGrid size={16} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
            <BookMarked size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline">Manual</span>
            <ChevronRight size={12} className="hidden sm:inline" />
            <span className={`font-medium truncate ${moduloActual.color}`}>{moduloActual.titulo}</span>
          </div>

          {/* Navegación rápida */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => {
                const idx = MODULOS.findIndex(m => m.id === moduloActivo);
                if (idx > 0) handleSeleccionar(MODULOS[idx - 1].id);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
              title="Módulo anterior"
            >
              <ChevronDown size={14} className="rotate-90" />
            </button>
            <button
              onClick={() => {
                const idx = MODULOS.findIndex(m => m.id === moduloActivo);
                if (idx < MODULOS.length - 1) handleSeleccionar(MODULOS[idx + 1].id);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
              title="Módulo siguiente"
            >
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div ref={contenidoRef} className="flex-1 overflow-y-auto p-3 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={moduloActivo}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <ModuloPanel modulo={moduloActual} />

              {/* Navegación entre módulos */}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
                {(() => {
                  const idx = MODULOS.findIndex(m => m.id === moduloActivo);
                  const prev = idx > 0 ? MODULOS[idx - 1] : null;
                  const next = idx < MODULOS.length - 1 ? MODULOS[idx + 1] : null;
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => handleSeleccionar(prev.id)}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                          <ChevronRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                          <div className="text-left">
                            <p className="text-[10px] text-slate-600">Anterior</p>
                            <p className="text-xs font-medium">{prev.titulo}</p>
                          </div>
                        </button>
                      ) : <div />}
                      {next && (
                        <button onClick={() => handleSeleccionar(next.id)}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-600">Siguiente</p>
                            <p className="text-xs font-medium">{next.titulo}</p>
                          </div>
                          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
