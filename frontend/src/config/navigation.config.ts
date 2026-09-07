import { 
  Stethoscope, 
  Smile, 
  Sparkles, 
  Receipt, 
  ShieldCheck, 
  Calendar, 
  Users, 
  FileText, 
  Camera, 
  Activity,
  DollarSign,
  FileCheck,
  UserCog,
  Sliders
} from 'lucide-react';

export interface SubmoduleItem {
  id: string;             // El ID de página que ya usa App.tsx ('pacientes', 'historia', etc.)
  label: string;
  icon: any;
  iamResource?: string;  // Código para canDo(recurso, 'VER')
  badge?: string;
}

export interface MacroModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  accentColor: string;   // Color de realce para el ícono
  submodules: SubmoduleItem[];
}

export const MACRO_MODULES: MacroModule[] = [
  {
    id: 'asistencial',
    title: 'Consulta Externa & Agenda',
    description: 'Atención ambulatoria, agenda médica, historias clínicas y triaje.',
    icon: Stethoscope,
    accentColor: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
    submodules: [
      { id: 'dashboard', label: 'Panel General', icon: Activity, iamResource: 'DASHBOARD' },
      { id: 'agenda', label: 'Agenda de Citas', icon: Calendar, iamResource: 'AGENDA.CITAS' },
      { id: 'agendaProfesional', label: 'Mi Agenda Médica', icon: Calendar, iamResource: 'AGENDA.PROFESIONAL' },
      { id: 'admision', label: 'Admisión y Triaje', icon: Users, iamResource: 'AGENDA.ADMISION' },
      { id: 'pacientes', label: 'Directorio Pacientes', icon: Users, iamResource: 'CLINICA.PACIENTES' },
      { id: 'historia', label: 'Historia Clínica', icon: FileText, iamResource: 'CLINICA.HISTORIA' },
      { id: 'followup', label: 'Seguimiento', icon: Activity },
    ],
  },
  {
    id: 'odontologia',
    title: 'Salud Oral & Odontología',
    description: 'Odontograma interactivo FDI, superficies, periodoncia y presupuestos.',
    icon: Smile,
    accentColor: 'from-sky-500/20 to-teal-500/20 text-teal-400 border-teal-500/30',
    submodules: [
      { id: 'odontograma', label: 'Odontograma Interactivo', icon: Smile, iamResource: 'CLINICA.ODONTOGRAMA' },
      { id: 'pacientes', label: 'Pacientes Dentales', icon: Users, iamResource: 'CLINICA.PACIENTES' },
      { id: 'cotizaciones', label: 'Planes de Tratamiento', icon: DollarSign, iamResource: 'GESTION.COTIZACIONES' },
    ],
  },
  {
    id: 'estetica',
    title: 'Medicina Estética & Cirugía',
    description: 'Mapa corporal 3D/SVG, evolución fotográfica y tiempos quirúrgicos.',
    icon: Sparkles,
    accentColor: 'from-purple-500/20 to-pink-500/20 text-pink-400 border-pink-500/30',
    submodules: [
      { id: 'mapa-corporal', label: 'Mapa Anatómico / SVG', icon: Sparkles, iamResource: 'CLINICA.MAPA' },
      { id: 'fotos', label: 'Registro Fotográfico', icon: Camera, iamResource: 'CLINICA.VISUAL' },
      { id: 'vista-cirujano', label: 'Quirófano / Cirujano', icon: Activity, iamResource: 'AGENDA.CIRUGIA' },
      { id: 'consentimiento', label: 'Consentimientos', icon: FileCheck },
    ],
  },
  {
    id: 'facturacion',
    title: 'Facturación & FEV-RIPS',
    description: 'Validación Res. 2275, CUV, cuentas médicas y facturación electrónica.',
    icon: Receipt,
    accentColor: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    submodules: [
      { id: 'facturacion', label: 'Cuentas e Ingresos', icon: Receipt, iamResource: 'GESTION.FACTURACION' },
      { id: 'cotizaciones', label: 'Cotizaciones', icon: DollarSign, iamResource: 'GESTION.COTIZACIONES' },
      { id: 'contratacion', label: 'Contratación & Convenios', icon: FileCheck },
      { id: 'impresion', label: 'Central de Impresión', icon: FileText, iamResource: 'GESTION.IMPRESION' },
    ],
  },
  {
    id: 'administracion',
    title: 'Configuración & Seguridad',
    description: 'Gestión de usuarios, roles IAM, plantillas y auditoría.',
    icon: ShieldCheck,
    accentColor: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
    submodules: [
      { id: 'admin', label: 'Parametrización General', icon: Sliders, iamResource: 'ADMIN.PARAMETRIZACION' },
      { id: 'usuarios', label: 'Usuarios del Sistema', icon: UserCog, iamResource: 'ADMIN.USUARIOS' },
      { id: 'seguridad', label: 'Seguridad & Permisos IAM', icon: ShieldCheck, iamResource: 'SEGURIDAD' },
      { id: 'plantillas', label: 'Editor de Plantillas', icon: FileText, iamResource: 'GESTION.PLANTILLAS' },
      { id: 'config-agenda', label: 'Configurar Agenda', icon: Calendar, iamResource: 'AGENDA.CONFIG' },
    ],
  },
];
