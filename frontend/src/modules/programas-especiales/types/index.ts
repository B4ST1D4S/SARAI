// ============================================================
// Tipos para el módulo Programas Especializados
// Enfoque: Hemodiálisis – Normativa colombiana
// ============================================================

export type EstadoInscripcion = 'ACTIVO' | 'RETIRADO' | 'TRASLADADO' | 'FALLECIDO' | 'ALTA';

export type EstadioERC =
  | 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5' | 'G5D';

export type CategoriaAlbuminuria = 'A1' | 'A2' | 'A3';

export type RiesgoKDIGO = 'BAJO' | 'MODERADO' | 'ALTO' | 'MUY_ALTO' | 'DESCONOCIDO';

export type ModalidadRenal =
  | 'NEFROPROTECCION'
  | 'PREDIALISIS'
  | 'HEMODIALISIS'
  | 'DIALISIS_PERITONEAL'
  | 'TRASPLANTE';

export type TipoAccesoVascular =
  | 'FAV_RADIOCEFÁLICA'
  | 'FAV_BRAQUIOCEFÁLICA'
  | 'INJERTO_PTFE'
  | 'CATETER_TEMPORAL'
  | 'CATETER_TUNELIZADO_DERECHO'
  | 'CATETER_TUNELIZADO_IZQUIERDO'
  | 'CATETER_PERMCATH';

export type EstadoAcceso =
  | 'ACTIVO' | 'DISFUNCIONAL' | 'TROMBOSADO' | 'INFECTADO' | 'RETIRADO' | 'MADURACIÓN';

export type EstadoSesion =
  | 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'SUSPENDIDA' | 'CANCELADA';

export type TipoAnticoagulacion =
  | 'HEPARINA_NO_FRACCIONADA'
  | 'ENOXAPARINA'
  | 'CITRATO'
  | 'SIN_ANTICOAGULACION';

export type Turno = 'MANANA' | 'TARDE' | 'NOCHE';

export type Disciplina =
  | 'MEDICO'
  | 'ENFERMERIA'
  | 'NUTRICION'
  | 'PSICOLOGIA'
  | 'TRABAJO_SOCIAL'
  | 'FARMACIA'
  | 'QUIMICO_FARMACEUTICO'
  | 'EDUCACION';

export type SeveridadEvento = 'LEVE' | 'MODERADO' | 'GRAVE' | 'CRITICO';

// ── Paciente en programa ──────────────────────────────────────

export interface PacienteResumen {
  id: string;
  nombreCompleto: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaNacimiento: string;
  genero: string;
  telefonos: string[];
  email?: string;
}

export interface InscripcionPrograma {
  id: string;
  pacienteId: string;
  programaId: string;
  codigoPrograma: string;
  fechaIngreso: string;
  fechaEgreso?: string;
  motivoEgreso?: string;
  estado: EstadoInscripcion;
  entidadRemitente?: string;
  medicoIngresoId?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  paciente?: PacienteResumen;
  historiaRenal?: HistoriaClinicaRenalResumen;
  accesosVasculares?: AccesoVascular[];
}

export interface HistoriaClinicaRenalResumen {
  estadioERC?: EstadioERC;
  modalidadActual?: ModalidadRenal;
  tfgBasal?: number;
  riesgoKDIGO?: RiesgoKDIGO;
}

// ── Historia Clínica Renal ────────────────────────────────────

export interface HistoriaClinicaRenal {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  codigoCIE10?: string;
  diagnosticoPrincipal: string;
  etiologia?: string;
  otrosDiagnosticos?: string;
  estadioERC?: EstadioERC;
  categoriaAlbuminuria?: CategoriaAlbuminuria;
  riesgoKDIGO?: RiesgoKDIGO;
  tfgBasal?: number;
  metodoTFG?: string;
  creatininaBasal?: number;
  fechaTFGBasal?: string;
  peso?: number;
  talla?: number;
  imc?: number;
  hipertension: boolean;
  diabetes: boolean;
  obesidad: boolean;
  tabaquismo: boolean;
  dislipidemia: boolean;
  cardiopatia: boolean;
  antecedentesFamiliares: boolean;
  otrasComorbilidades?: string;
  modalidadActual?: ModalidadRenal;
  fechaInicioDialisis?: string;
  nefrologoTratante?: string;
  periodicidadControl?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Acceso Vascular ───────────────────────────────────────────

export interface AccesoVascular {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  tipo: TipoAccesoVascular;
  lateralidad?: string;
  sitio?: string;
  fechaCreacion?: string;
  fechaUso?: string;
  fechaRetiro?: string;
  estado: EstadoAcceso;
  flujoActual?: number;
  recirculacion?: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Máquina de Diálisis ───────────────────────────────────────

export interface MaquinaDialisis {
  id: string;
  codigo: string;
  marca: string;
  modelo?: string;
  serie?: string;
  sillon?: string;
  estado: string;
  sedeId?: string;
}

// ── Sesión de Hemodiálisis ────────────────────────────────────

export interface MedicamentoSesion {
  nombre: string;
  dosis: string;
  via: string;
  hora?: string;
  lote?: string;
}

export interface SignoVitalIntra {
  hora: string;
  pas: number;
  pad: number;
  fc: number;
  sintomas?: string;
}

export interface SesionHemodialisis {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  numeroSesion?: number;
  fechaSesion: string;
  turno?: Turno;
  nefrologoId?: string;
  nefrologo?: string;
  enfermeroId?: string;
  enfermero?: string;
  maquinaId?: string;
  codigoMaquina?: string;
  accesoVascularId?: string;
  sillon?: string;
  // Pre-diálisis
  pesoPre: number;
  pesoSeco?: number;
  gananciaPesoInter?: number;
  taSistolicaPre?: number;
  taDiastolicaPre?: number;
  frecCardiacaPre?: number;
  temperaturaPre?: number;
  saturacionO2Pre?: number;
  // Prescripción
  tiempoPrescrito?: number;
  qbPrescrito?: number;
  qdPrescrito?: number;
  ufPrescrita?: number;
  concentracionDializado?: string;
  temperaturaDializado?: number;
  filtroTipo?: string;
  filtroLote?: string;
  filtroReutilizado?: boolean;
  filtroUsos?: number;
  // Anticoagulación
  tipoAnticoagulacion?: TipoAnticoagulacion;
  heparinaInicial?: number;
  heparinaMantenimiento?: number;
  heparinaTotal?: number;
  // Logrado
  tiempoReal?: number;
  qbReal?: number;
  ufReal?: number;
  ktVSesion?: number;
  urrSesion?: number;
  volumeTratado?: number;
  // Post-diálisis
  pesoPost?: number;
  taSistolicaPost?: number;
  taDiastolicaPost?: number;
  frecCardiacaPost?: number;
  temperaturaPost?: number;
  saturacionO2Post?: number;
  // Evaluación
  toleranciaDialisis?: string;
  estadoConciencia?: string;
  medicamentosSesion?: MedicamentoSesion[];
  signosVitalesIntra?: SignoVitalIntra[];
  incidencias?: string[];
  estadoSesion: EstadoSesion;
  motivoCancelacion?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  maquina?: Pick<MaquinaDialisis, 'codigo' | 'marca' | 'sillon'>;
  accesoVascular?: Pick<AccesoVascular, 'tipo' | 'lateralidad' | 'estado'>;
}

// ── Laboratorio Renal ─────────────────────────────────────────

export interface LaboratorioRenal {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  fechaToma: string;
  fechaResultado?: string;
  tipo: string;
  // Función renal
  creatinina?: number;
  urea?: number;
  bun?: number;
  tfgCalculada?: number;
  acidoUrico?: number;
  // Electrolitos
  sodio?: number;
  potasio?: number;
  calcio?: number;
  fosforo?: number;
  magnesio?: number;
  bicarbonato?: number;
  productoCaP?: number;
  // Hemograma
  hemoglobina?: number;
  hematocrito?: number;
  leucocitos?: number;
  plaquetas?: number;
  // Metabolismo óseo
  pth?: number;
  vitaminaD?: number;
  fosfatasaAlcalina?: number;
  // Anemia
  ferritina?: number;
  hierroSerico?: number;
  saturacionTransferrina?: number;
  // Nutrición/Inflamación
  albumina?: number;
  proteC?: number;
  // Adecuación
  ktVMensual?: number;
  urrMensual?: number;
  // Serología
  hbsAg?: string;
  antiHbs?: string;
  antiHcvTotal?: string;
  antiHiv?: string;
  observaciones?: string;
  createdAt: string;
}

// ── Evento Adverso ────────────────────────────────────────────

export interface EventoAdversoPE {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  sesionId?: string;
  tipo: string;
  descripcion: string;
  fechaEvento: string;
  horaEvento?: string;
  severidad: SeveridadEvento;
  tratamiento?: string;
  resolucion?: string;
  requirioHospitalizacion: boolean;
  seguimiento?: string;
  createdAt: string;
}

// ── Evolución Multidisciplinaria ──────────────────────────────

export interface EvolucionMultidisciplinaria {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  profesionalId?: string;
  profesional?: string;
  disciplina: Disciplina;
  fechaEvolucion: string;
  subjetivo?: string;
  objetivo?: string;
  analisis?: string;
  plan?: string;
  notaLibre?: string;
  firmado: boolean;
  createdAt: string;
}

// ── Tamizaje ──────────────────────────────────────────────────

export interface TamizajePE {
  id: string;
  inscripcionId: string;
  tipo: string;
  descripcion: string;
  fechaProgramada?: string;
  fechaRealizada?: string;
  resultado?: string;
  estado: string;
  periodicidad?: string;
  observaciones?: string;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardRenal {
  pacientes: {
    totalActivos: number;
    totalHD: number;
    totalDP: number;
    totalPredialisis: number;
    totalTraslado: number;
    totalFallecidos: number;
  };
  sesionesHoy: number;
  adecuacion: {
    ktVPromedio30d?: number | null;
    metaKtV: number;
  };
  eventosRecientes: any[];
  laboratoriosRecientes: any[];
}

// ── Helpers de UI ─────────────────────────────────────────────

export const ESTADIO_ERC_LABELS: Record<string, string> = {
  G1:  'G1 – TFG ≥ 90 mL/min',
  G2:  'G2 – TFG 60-89 mL/min',
  G3a: 'G3a – TFG 45-59 mL/min',
  G3b: 'G3b – TFG 30-44 mL/min',
  G4:  'G4 – TFG 15-29 mL/min',
  G5:  'G5 – TFG < 15 mL/min',
  G5D: 'G5D – En Diálisis',
};

export const RIESGO_KDIGO_COLORS: Record<RiesgoKDIGO, string> = {
  BAJO:       '#22c55e',
  MODERADO:   '#f59e0b',
  ALTO:       '#f97316',
  MUY_ALTO:   '#ef4444',
  DESCONOCIDO:'#6b7280',
};

export const MODALIDAD_LABELS: Record<string, string> = {
  NEFROPROTECCION:    'Nefroprotección',
  PREDIALISIS:        'Pre-diálisis',
  HEMODIALISIS:       'Hemodiálisis',
  DIALISIS_PERITONEAL:'Diálisis Peritoneal',
  TRASPLANTE:         'Trasplante',
};

export const ACCESO_LABELS: Record<string, string> = {
  FAV_RADIOCEFÁLICA:          'FAV Radio-Cefálica',
  FAV_BRAQUIOCEFÁLICA:        'FAV Braquio-Cefálica',
  INJERTO_PTFE:               'Injerto PTFE',
  CATETER_TEMPORAL:           'Catéter Temporal',
  CATETER_TUNELIZADO_DERECHO: 'Catéter Tunelizado Derecho',
  CATETER_TUNELIZADO_IZQUIERDO:'Catéter Tunelizado Izquierdo',
  CATETER_PERMCATH:           'Catéter PermCath',
};

export const EVENTO_TIPO_LABELS: Record<string, string> = {
  HIPOTENSION:        'Hipotensión',
  CALAMBRES:          'Calambres musculares',
  NAUSEAS:            'Náuseas',
  VOMITOS:            'Vómitos',
  CEFALEA:            'Cefalea',
  FIEBRE_ESCALOSFRIOS:'Fiebre / Escalofrío',
  SANGRADO_ACCESO:    'Sangrado del acceso',
  TROMBOSIS:          'Trombosis acceso',
  INFECCION_ACCESO:   'Infección del acceso',
  REACCION_FILTRO:    'Reacción al filtro',
  ARRITMIA:           'Arritmia',
  CONVULSION:         'Convulsión',
  COAGULACION_LINEAS: 'Coagulación de líneas',
  OTRO:               'Otro',
};

export const DISCIPLINA_LABELS: Record<Disciplina, string> = {
  MEDICO:              'Médico',
  ENFERMERIA:          'Enfermería',
  NUTRICION:           'Nutrición',
  PSICOLOGIA:          'Psicología',
  TRABAJO_SOCIAL:      'Trabajo Social',
  FARMACIA:            'Farmacia',
  QUIMICO_FARMACEUTICO:'Químico Farmacéutico',
  EDUCACION:           'Educación',
};

export const KTV_META = 1.2;    // Kt/V mínimo – Res. 3241/2008
export const URR_META = 65;     // URR % mínimo
export const HB_MIN = 10;       // g/dL hemoglobina mínima en HD
export const HB_MAX = 12;       // g/dL hemoglobina máxima en HD
export const ALBUMINA_MIN = 3.5; // g/dL albúmina mínima
export const PTH_MIN_HD = 150;  // pg/mL PTH mínimo en HD
export const PTH_MAX_HD = 600;  // pg/mL PTH máximo en HD

// ── HD-02: Turnos de Hemodiálisis ────────────────────────────

export type EsquemaTurno = 'LMV' | 'MJS';
export type Jornada = 'MADRUGADA' | 'MANANA' | 'TARDE' | 'NOCHE';

export interface TurnoHD {
  id: string;
  inscripcionId: string;
  esquema: EsquemaTurno;
  jornada: Jornada;
  sillaNumero?: string;
  maquinaId?: string;
  activo: boolean;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  inscripcion?: {
    paciente?: {
      id: string;
      nombreCompleto: string;
      numeroDocumento: string;
      tipoDocumento: string;
      fechaNacimiento: string;
      genero: string;
    };
    historiaRenal?: {
      estadioERC?: string;
      riesgoKDIGO?: string;
      modalidadActual?: string;
    };
  };
  maquina?: {
    id: string;
    codigo: string;
    marca: string;
    sillon?: string;
  };
}

export const ESQUEMA_LABELS: Record<EsquemaTurno, string> = {
  LMV: 'L - M - V',
  MJS: 'M - J - S',
};

export const JORNADA_LABELS: Record<Jornada, string> = {
  MADRUGADA: 'Madrugada',
  MANANA:    'Mañana',
  TARDE:     'Tarde',
  NOCHE:     'Noche',
};

export const JORNADA_HORARIO: Record<Jornada, string> = {
  MADRUGADA: '00:00 – 06:00',
  MANANA:    '06:00 – 12:00',
  TARDE:     '12:00 – 18:00',
  NOCHE:     '18:00 – 00:00',
};

// ── P6: Contadores del día ────────────────────────────────────

export interface ContadoresDia {
  programadosHoy: number;
  enSala: number;
  finalizados: number;
  suspendidos: number;
  ausentes: number;
}

// ── P3: Serología ─────────────────────────────────────────────

export type MarcadorSerologico =
  | 'HBsAg' | 'AntiHBc' | 'AntiHBs' | 'AntiHVC'
  | 'HIV' | 'VDRL' | 'HBeAg' | 'AntiHBe';

export type ResultadoSerologia =
  | 'REACTIVO' | 'NO_REACTIVO' | 'PENDIENTE' | 'INDETERMINADO';

export interface ResultadoSerologico {
  id: string;
  inscripcionId: string;
  pacienteId: string;
  marcador: MarcadorSerologico;
  resultado: ResultadoSerologia;
  valorNumerico?: number;
  fechaToma?: string;
  fechaResultado?: string;
  laboratorio?: string;
  observaciones?: string;
  validadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerologiaData {
  registros: ResultadoSerologico[];
  mapa: Record<string, ResultadoSerologico | null>;
  marcadores: string[];
}

export const MARCADOR_LABELS: Record<string, string> = {
  HBsAg:   'HBsAg – Hepatitis B (Ag superficie)',
  AntiHBc: 'Anti-HBc – Hepatitis B (Ac core)',
  AntiHBs: 'Anti-HBs – Hepatitis B (Ac superficie)',
  AntiHVC: 'Anti-HVC – Hepatitis C',
  HIV:     'Anti-HIV 1/2',
  VDRL:    'VDRL / Sífilis',
  HBeAg:   'HBeAg – Hepatitis B (Ag e)',
  AntiHBe: 'Anti-HBe – Hepatitis B (Ac e)',
};

export const RESULTADO_SEROLOGIA_COLOR: Record<ResultadoSerologia, { bg: string; text: string; border: string }> = {
  REACTIVO:      { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
  NO_REACTIVO:   { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30' },
  PENDIENTE:     { bg: 'bg-white/8',       text: 'text-white/40',   border: 'border-white/10' },
  INDETERMINADO: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

export const RESULTADO_SEROLOGIA_LABEL: Record<ResultadoSerologia, string> = {
  REACTIVO:      'Reactivo',
  NO_REACTIVO:   'No Reactivo',
  PENDIENTE:     'Pendiente',
  INDETERMINADO: 'Indeterminado',
};

// ── Parametrización HD ────────────────────────────────────────

export interface SillonHD {
  id: string;
  numero: string;
  descripcion?: string;
  estado: 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA';
  maquinaAsignada?: string;
}

export interface EsquemaConfig {
  id: string;
  codigo: string;
  nombre: string;
  dias: number[];        // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  activo: boolean;
}

export interface JornadaConfig {
  id: string;
  codigo: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  orden: number;
}

export interface ParametrizacionHD {
  sillones: SillonHD[];
  esquemas: EsquemaConfig[];
  jornadas: JornadaConfig[];
}

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const SILLON_ESTADO_COLOR: Record<SillonHD['estado'], string> = {
  ACTIVO:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MANTENIMIENTO:'text-amber-400   bg-amber-500/10   border-amber-500/20',
  BAJA:         'text-red-400     bg-red-500/10     border-red-500/20',
};

export const SILLON_ESTADO_LABEL: Record<SillonHD['estado'], string> = {
  ACTIVO:        'Activo',
  MANTENIMIENTO: 'Mantenimiento',
  BAJA:          'Baja',
};
