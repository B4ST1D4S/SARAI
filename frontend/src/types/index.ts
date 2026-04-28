// Tipos principales del sistema
// ============================================

// USUARIO Y AUTENTICACIÓN
export type UserRole = 'SUPER_ADMIN' | 'MEDICO' | 'AUXILIAR' | 'RECEPCIONISTA' | 'PACIENTE';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  especialidad?: string; // Para médicos
  telefono: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// PACIENTES (CORE)
export interface Paciente {
  id: string;
  numeroDocumento: string;
  tipoDocumento: 'CC' | 'CE' | 'PS' | 'PEP';
  nombreCompleto: string;
  fechaNacimiento: Date;
  genero: 'M' | 'F' | 'O';
  telefonos: string[];
  email: string;
  direccion: string;
  ciudad: string;
  alergias: Alergia[];
  medicacionActual: Medicamento[];
  antecedentesQuirurgicos: AntecedentesQuirurgicos[];
  antecedentesMediacos: AntecedentesMedicos[];
  fotoPerfil?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'FALLECIDO';
  whatsapp: string;
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string; // user ID
}

export interface Alergia {
  id: string;
  nombre: string;
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'LEVE';
  reaccion?: string;
}

export interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  indicacion: string;
  activo: boolean;
}

export interface AntecedentesQuirurgicos {
  id: string;
  procedimiento: string;
  fecha: Date;
  complicaciones?: string;
  cirujano?: string;
}

export interface AntecedentesMedicos {
  id: string;
  condicion: string;
  activo: boolean;
  medicacion?: string;
}

// PROCEDIMIENTOS / CIRUGÍAS
export type TipoProcedimiento = 
  | 'RINOPLASTIA' | 'BLEFAROPLASTIA' | 'LIFTING'
  | 'LIPOSUCCION' | 'ABDOMINOPLASTIA' | 'MAMOPLASTIA'
  | 'BOTOX' | 'ACIDO_HIALURONICO' | 'HILOS' | 'PLASMA';

export interface Procedimiento {
  id: string;
  pacienteId: string;
  medicoId: string;
  tipoProcedimiento: TipoProcedimiento;
  nombreProcedimiento: string;
  descripcion: string;
  fechaProgramada: Date;
  fechaRealizada?: Date;
  duracionEstimada: number; // en minutos
  duracionReal?: number;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  notasPreoperatorio?: string;
  notasOperatorio?: string;
  complicaciones?: string[];
  resultadoVisualEsperado?: string;
  resultadoVisualActual?: string;
  medicacionPrescrita: Medicamento[];
  restriccionesPost: string[];
  createdAt: Date;
  updatedAt: Date;
}

// HISTORIA CLÍNICA
export type TipoHistoria = 'ANAMNESIS' | 'EXAMEN_FISICO' | 'DIAGNOSTICO' | 'PLAN' | 'SEGUIMIENTO';

export interface HistoriaClinica {
  id: string;
  pacienteId: string;
  procedimientoId?: string;
  tipoHistoria: TipoHistoria;
  contenido: Record<string, any>; // JSON flexible
  version: number;
  editadoPor: string; // user ID
  fechaCreacion: Date;
  fechaUltimaEdicion: Date;
  firmadoPorMedico: boolean;
  fechaFirma?: Date;
  hashIntegridad: string;
}

// PLANTILLAS POR PROCEDIMIENTO
export interface PlantillaGeneral {
  id: string;
  codigoCups: string;
  nombreProcedimiento: string;
  categoria: 'FACIAL' | 'CORPORAL' | 'NO_INVASIVO';
  descripcion: string;
  camposObligatorios: FormField[];
  camposOpcionales: FormField[];
  riesgosPorDefecto: string[];
  complicacionesEsperadas: string[];
  medicacionRecomendada: Medicamento[];
  postoperatorioPorDias: PostOperatorioDia[];
  consentimientoTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormField {
  id: string;
  nombre: string;
  tipo: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'checkbox' | 'radio';
  obligatorio: boolean;
  opciones?: string[];
  placeholder?: string;
  ayuda?: string;
}

export interface PostOperatorioDia {
  dia: number;
  checklist: ChecklistItem[];
  medicacion?: Medicamento[];
  restricciones?: string[];
  proximaVisita?: string;
}

export interface ChecklistItem {
  id: string;
  pregunta: string;
  tipo: 'si_no' | 'escala_dolor' | 'texto' | 'foto';
  esencial: boolean;
}

// CONSENTIMIENTO INFORMADO
export interface Consentimiento {
  id: string;
  pacienteId: string;
  procedimientoId: string;
  plantillaId: string;
  contenidoHtml: string;
  contenidoPdfUrl?: string;
  firmaDigitalUrl?: string;
  selfieUrl?: string;
  fechaFirma?: Date;
  ipDispositivo: string;
  navegador: string;
  sistemaOperativo: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  firmado: boolean;
  hashIntegridad: string;
  createdAt: Date;
}

// FOTOS CLÍNICAS
export type TipoFoto = 'ANTES' | 'DESPUES' | 'SEGUIMIENTO';

export interface FotoClinica {
  id: string;
  pacienteId: string;
  procedimientoId?: string;
  tipo: TipoFoto;
  diasPostOperatorio?: number;
  urlOriginal: string;
  urlComprimida: string;
  urlMiniatura: string;
  metadatos?: {
    fecha: Date;
    hora: string;
    dispositivo: string;
  };
  anotaciones?: Anotacion[];
  visibleAlPaciente: boolean;
  fechaCaptura: Date;
  createdAt: Date;
}

export interface Anotacion {
  id: string;
  x: number; // porcentaje
  y: number; // porcentaje
  texto: string;
  tipo: 'NORMAL' | 'ALERTA' | 'COMPLICACION';
}

// MAPA CORPORAL
export interface MapaCorporal {
  id: string;
  pacienteId: string;
  procedimientoId: string;
  fechaEvaluacion: Date;
  zonasMarcadas: GeoZona[];
  edemaZonas: EdemaZona[];
  fibrosis: FibrosisZona[];
  dolorZonas: DolorZona[];
  colorIndicator: string;
  anotacionesClinics?: string;
  evaluadoPor: string; // user ID
}

export interface GeoZona {
  nombre: string;
  puntos: [number, number][]; // lat, lng
  tipo: string;
}

export interface EdemaZona {
  zona: string;
  severidad: 'LEVE' | 'MODERADO' | 'SEVERO';
  colorCode: string;
}

export interface FibrosisZona {
  zona: string;
  presente: boolean;
  descripcion?: string;
}

export interface DolorZona {
  zona: string;
  escala: number; // 1-10
  tipo: string;
}

// SEGUIMIENTO POSTOPERATORIO
export interface SeguimientoPostOp {
  id: string;
  pacienteId: string;
  procedimientoId: string;
  diaPostOp: number;
  fechaPrevista: Date;
  fechaCompletada?: Date;
  tipoSeguimiento: 'CHECKLIST' | 'FOTOS' | 'CONTROL' | 'EVALUACION';
  checklistPreguntas: ChecklistItem[];
  checklistRespuestas: Record<string, any>;
  reportarComplicacion: boolean;
  descripcionComplicacion?: string;
  alertasGeneradas: Alerta[];
  completado: boolean;
  notificacionEnviadaWhatsapp: boolean;
  createdAt: Date;
}

// ALERTAS
export type SeveridadAlerta = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export interface Alerta {
  id: string;
  pacienteId: string;
  procedimientoId?: string;
  tipoAlerta: 'RIESGO' | 'COMPLICACION' | 'CONTROL_PENDIENTE' | 'MEDICACION';
  severidad: SeveridadAlerta;
  descripcion: string;
  accionRecomendada: string;
  iaDetectada: boolean;
  resuelta: boolean;
  fechaResolucion?: Date;
  createdAt: Date;
}

// CITAS / AGENDA
export type TipoCita = 'CONSULTA' | 'PREOPERATORIO' | 'POSTOPERATORIO' | 'CONTROL';

export interface Cita {
  id: string;
  pacienteId: string;
  medicoId: string;
  tipoCita: TipoCita;
  fechaHora: Date;
  duracionMinutos: number;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';
  motivo: string;
  notas?: string;
  recordatorioWhatsappEnviado: boolean;
  asistencia?: boolean;
  salaQuirofanoId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// TRANSACCIONES / FACTURACIÓN
export type TipoTransaccion = 'CARGO' | 'PAGO' | 'ABONO';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFER' | 'OTRO';

export interface Transaccion {
  id: string;
  pacienteId: string;
  procedimientoId?: string;
  tipo: TipoTransaccion;
  concepto: string;
  monto: number;
  moneda: 'COP' | 'USD';
  metodoPago: MetodoPago;
  referenciaPago?: string;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO';
  reciboUrl?: string;
  creadoPor: string; // user ID
  createdAt: Date;
}

// ============================================
// PROCEDIMIENTOS CUPS - PARAMETRIZABLES
// ============================================

export interface ProcedimientoCUPS {
  id: string;
  codigoCUPS: string;
  nombre: string;
  descripcion?: string;
  tipoCategoria: 'Facial' | 'Corporal' | 'No-invasivo';
  riesgoNivel: 'Bajo' | 'Medio' | 'Alto';
  diasSeguimiento: number;
  datosAdicionales?: Record<string, any>;
  activo: boolean;
  plantillas?: PlantillaTemplate[];
  checklistTemplates?: ChecklistTemplate[];
  consentimientosTemplate?: ConsentimientoTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantillaTemplate {
  id: string;
  codigoCUPS: string;
  nombre: string;
  tipo: 'historia-clinica' | 'evaluacion' | 'seguimiento' | string;
  descripcion?: string;
  seccionesJSON: SectionField[];
  requiereSignatura: boolean;
  requiereFoto: boolean;
  requiereMapaCorporal: boolean;
  ordenVisualizacion: number;
  activa: boolean;
  creadoPor?: string;
  actualizadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionField {
  id: string;
  nombre: string;
  campos: FormularioField[];
}

export interface FormularioField {
  id: string;
  label: string;
  tipo: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'radio';
  opciones?: string[];
  requerido?: boolean;
  placeholder?: string;
}

export interface ChecklistTemplate {
  id: string;
  codigoCUPS: string;
  fase: 'pre-operatorio' | 'intra-operatorio' | 'post-operatorio';
  nombre: string;
  itemsJSON: ChecklistItemTemplate[];
  alertasAutomaticasJSON?: AlertaAutomatica[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  requerido: boolean;
  orden: number;
}

export interface AlertaAutomatica {
  dia: number;
  mensaje: string;
  tipo: 'info' | 'warning' | 'critical';
}

export interface ConsentimientoTemplate {
  id: string;
  codigoCUPS: string;
  titulo: string;
  seccionesJSON: SeccionConsentimiento[];
  riesgosJSON: RiesgoConsentimiento[];
  recomendacionesJSON?: RecomendacionConsentimiento[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeccionConsentimiento {
  id: string;
  titulo: string;
  contenido: string;
  requerido: boolean;
}

export interface RiesgoConsentimiento {
  riesgo: string;
  probabilidad: 'Muy baja' | 'Baja' | 'Media' | 'Alta';
  severidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  descripcion: string;
}

export interface RecomendacionConsentimiento {
  tipo: 'pre' | 'post';
  texto: string;
}

// LOGS DE AUDITORÍA
export type TipoOperacion = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';

export interface AuditLog {
  id: string;
  usuarioId: string;
  tablaAfectada: string;
  registroId: string;
  tipoOperacion: TipoOperacion;
  datosAntes?: Record<string, any>;
  datosDespues?: Record<string, any>;
  ipOrigen: string;
  userAgent: string;
  razon?: string;
  timestamp: Date;
}

// DASHBOARD
export interface DashboardStats {
  pacientesActivos: number;
  citasHoy: number;
  procedimientosProximos: number;
  pacientesEnSeguimiento: number;
  alertasCriticas: number;
  ingresosMes: number;
}

export interface PacienteResumen {
  paciente: Paciente;
  procedimientoActual?: Procedimiento;
  alertas: Alerta[];
  proximoControl?: Cita;
  estado: 'PRE_OP' | 'POST_OP' | 'SEGUIMIENTO' | 'COMPLETADO';
}
