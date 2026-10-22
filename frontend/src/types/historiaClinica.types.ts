// ============================================================================
// CONTRATOS DE DATOS: HISTORIA CLÍNICA DINÁMICA & PLANTILLAS (SARAI HIS)
// ============================================================================

export type FinalidadConsulta = 
  | 'PRIMERA_VEZ' 
  | 'CONTROL' 
  | 'LECTURA_EXAMENES' 
  | 'PROCEDIMIENTO_MENOR';

export type CategoriaSubmodulo = 
  | 'VALORACION' 
  | 'EXAMEN' 
  | 'DIAGNOSTICO' 
  | 'ORDENAMIENTO';

// Identificadores fijos de submódulos registrados en BD
export type SubmoduloId = 
  | 'motivo_consulta'
  | 'antecedentes'
  | 'alergias'
  | 'antecedentes_personales'
  | 'antecedentes_familiares'
  | 'factores_riesgo'
  | 'signos_vitales'
  | 'revision_sistemas'
  | 'examen_fisico'
  | 'diagnosticos'
  | 'evolucion_nota'
  | 'plan_manejo'
  | 'prescripcion_medica'
  | 'solicitud_ayudas_diag'
  | 'solicitud_procedimientos';

// ----------------------------------------------------------------------------
// 1. Catálogo de Submódulos Atómicos
// ----------------------------------------------------------------------------
export interface SubmoduloDefinicion {
  id: SubmoduloId;
  nombre: string;
  descripcion?: string;
  categoriaSugerida: CategoriaSubmodulo;
  componenteFront: string;
  icono: string;
  esObligatorioLey: boolean;
  activo: boolean;
}

// ----------------------------------------------------------------------------
// 2. Estructura Jerárquica de la Plantilla (JSON Schema)
// ----------------------------------------------------------------------------
export interface PlantillaSubmoduloConfig {
  id: SubmoduloId;
  requerido: boolean;
  orden?: number;
}

export interface PlantillaSeccion {
  id: string;                      // Ej: 'sec_valoracion', 'sec_ordenamiento'
  titulo: string;                  // Título mostrado en la sub-sidebar
  icono: string;                   // Nombre de icono Lucide
  submodulos: PlantillaSubmoduloConfig[];
}

export interface PlantillaEstructura {
  secciones: PlantillaSeccion[];
}

// ----------------------------------------------------------------------------
// 3. Respuesta de Resolución de Plantilla (Payload retornado por NestJS)
// ----------------------------------------------------------------------------
export interface PlantillaResueltaResponse {
  plantillaId: string;
  codigoPlantilla: string;
  nombrePlantilla: string;
  origenResolucion: 'PROFESIONAL_OVERRIDE' | 'SEDE_OVERRIDE' | 'INSTITUCIONAL_DEFAULT';
  estructura: PlantillaEstructura;
  metadataAtencion: {
    citaId: string;
    pacienteId: string;
    tipoConsultaId: string;
    finalidad: FinalidadConsulta;
    medicoId: string;
    sedeId: string;
  };
}

// ----------------------------------------------------------------------------
// 4. Estados de Diligenciamiento y Validación en Frontend
// ----------------------------------------------------------------------------
export interface SubmoduloStatus {
  id: SubmoduloId;
  completado: boolean;
  errores: string[];
  sucio: boolean; // Si el médico ya escribió algo
}

export interface SeccionNavStatus {
  id: string;
  titulo: string;
  icono: string;
  totalSubmodulos: number;
  completados: number;
  activa: boolean;
}

// ----------------------------------------------------------------------------
// 5. Borrador de Diligenciamiento (State del Formulario Continuo)
// ----------------------------------------------------------------------------
export interface GinecoObstetricosData {
  fum?: string;
  gravidez?: number;
  partos?: number;
  cesareas?: number;
  abortos?: number;
  planificacion?: string;
}

export interface AntecedentesData {
  patologicos?: string;
  quirurgicos?: string;
  alergicos?: string;
  farmacologicos?: string;
  toxicos?: string;
  familiares?: string;
  ginecoObstetricos?: GinecoObstetricosData;
}

export interface ExamenFisicoData {
  estadoGeneral?: string;
  cabezaCuello?: string;
  toraxCardiopulmonar?: string;
  abdomen?: string;
  extremidades?: string;
  neurologico?: string;
  osteomuscular?: string;
}

/** Revisión por sistemas: texto libre por cada uno de los 12 sistemas. */
export interface RevisionSistemasData {
  general?: string;
  cardiovascular?: string;
  respiratorio?: string;
  gastrointestinal?: string;
  genitourinario?: string;
  neurologico?: string;
  dermatologico?: string;
  osteomuscular?: string;
  endocrino?: string;
  organosSentidos?: string;
  psiquiatrico?: string;
  linfatico?: string;
}

// ----------------------------------------------------------------------------
// Alergias e intolerancias (códigos FHIR AllergyIntolerance)
// ----------------------------------------------------------------------------

export type CategoriaAlergia = 'medication' | 'food' | 'environment' | 'biologic';
export type SeveridadReaccion = 'LEVE' | 'MODERADA' | 'SEVERA';

export interface AlergiaItem {
  /** Identidad estable de la fila (key de React); viaja en los datos, no en estado local. */
  id: string;
  sustancia: string;
  categoria: CategoriaAlergia;
  tipo: 'allergy' | 'intolerance';
  criticidad: 'low' | 'high' | 'unable-to-assess';
  /** Severidad de la reacción; vacía = no indicada. */
  severidad: SeveridadReaccion | '';
  manifestacion: string;
}

/** Alergia activa registrada en un folio anterior: solo lectura. */
export interface AlergiaPrevia {
  id: string;
  sustanciaAlergeno: string;
  categoria: 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'BIOLOGICO';
  tipo: 'ALERGIA' | 'INTOLERANCIA';
  criticidad?: 'ALTA' | 'BAJA' | null;
  manifestacion?: string | null;
  numeroFolio: number | null;
}

/** draft.datos.alergias */
export interface AlergiasData {
  sinAlergiasConocidas?: boolean;
  alergias?: AlergiaItem[];
  /** Historial de folios anteriores. Lo carga quien hidrata el borrador; el submódulo solo lo lee. */
  alergiasPrevias?: AlergiaPrevia[];
}

// ----------------------------------------------------------------------------
// Antecedentes personales y familiares (listas estructuradas)
// ----------------------------------------------------------------------------

/** Antecedente personal (FHIR Condition). */
export interface AntecedentePersonalItem {
  id: string;
  diagnostico: string;
  codigoCie10?: string;
  estadoClinico: 'active' | 'recurrence' | 'relapse' | 'remission' | 'resolved';
  verificacion: 'confirmed' | 'provisional' | 'differential';
  /** Edad de inicio en años. */
  edadInicio?: number;
}

/** Antecedente personal registrado en un folio anterior: solo lectura. */
export interface AntecedentePrevio {
  id: string;
  descripcion: string;
  codigoEstandar?: string | null;
  categoria: string;
  fechaDiagnosticoAproximada?: string | null;
  numeroFolio: number | null;
}

/** draft.datos.antecedentes_personales */
export interface AntecedentesPersonalesData {
  niegaAntecedentes?: boolean;
  antecedentesPersonales?: AntecedentePersonalItem[];
  /** Historial de folios anteriores. Lo carga quien hidrata el borrador; el submódulo solo lo lee. */
  antecedentesPrevios?: AntecedentePrevio[];
}

/** Parentesco con códigos HL7 v3 RoleCode. */
export type ParentescoFamiliar = 'FTH' | 'MTH' | 'BRO' | 'SIS' | 'GRMTH' | 'GRFTH' | 'UNC' | 'AUNT';

export interface AntecedenteFamiliarItem {
  id: string;
  parentesco: ParentescoFamiliar;
  condicion: string;
  /** Edad aproximada del familiar al diagnóstico, en años. */
  edadDiagnostico?: number;
  fallecido: boolean;
}

/** draft.datos.antecedentes_familiares */
export interface AntecedentesFamiliaresData {
  sinAntecedentesFamiliares?: boolean;
  antecedentesFamiliares?: AntecedenteFamiliarItem[];
}

// ----------------------------------------------------------------------------
// Factores de riesgo y estilos de vida (LOINC 72166-2, 11331-6, 68516-4)
// ----------------------------------------------------------------------------

/** draft.datos.factores_riesgo. Un hábito sin valor = no registrado (nunca se asume uno). */
export interface FactoresRiesgoData {
  tabaquismo?: 'NEVER' | 'FORMER' | 'CURRENT';
  /** Índice paquetes/año; solo aplica a fumadores activos o exfumadores. */
  paquetesAnio?: number;
  alcohol?: 'NUNCA' | 'OCASIONAL' | 'MODERADO' | 'FRECUENTE';
  actividadFisica?: 'SEDENTARIO' | 'LIGERO' | 'MODERADO' | 'ACTIVO';
  exposicionOcupacional?: string;
}

/** Tipos de incapacidad: los mismos valores que el CHECK de hc_incapacidades. */
export type TipoIncapacidad =
  | 'ENFERMEDAD_GENERAL'
  | 'ENFERMEDAD_LABORAL'
  | 'ACCIDENTE_TRABAJO'
  | 'ACCIDENTE_TRANSITO'
  | 'LICENCIA_MATERNIDAD'
  | 'LICENCIA_PATERNIDAD';

export type ModalidadServicio = 'INTRAMURAL' | 'EXTRAMURAL' | 'TELEMEDICINA';

/** Certificado de incapacidad, dentro de draft.datos.plan_manejo.incapacidad. */
export interface IncapacidadMedicaData {
  requiere?: boolean;
  tipoIncapacidad?: TipoIncapacidad;
  modalidadServicio?: ModalidadServicio;
  fechaInicio?: string;
  dias?: number;
  /** Derivada de fechaInicio + dias - 1; se emite junto con ellos para que el borrador la persista. */
  fechaFin?: string;
  /** undefined = sin responder. */
  esProrroga?: boolean;
  /** undefined = sin responder. Debe coincidir con que fechaInicio sea anterior a hoy. */
  esRetroactiva?: boolean;
  codigoCie10?: string;
  descripcionDiagnostico?: string;
  observaciones?: string;
  ciudadLabora?: string;
  dependencia?: string;
}

export interface PlanManejoData {
  conducta?: string;
  recomendaciones?: string;
  signosAlarma?: string;
  incapacidad?: IncapacidadMedicaData;
}

export interface AyudaDiagnosticaItem {
  id: string;
  codigoCups?: string;
  descripcion: string;
  cantidad: number;
  justificacion?: string;
}

export interface SolicitudAyudasDiagData {
  items?: AyudaDiagnosticaItem[];
  observacionesGenerales?: string;
}

export interface ProcedimientoItem {
  id: string;
  codigoCups?: string;
  descripcion: string;
  cantidad: number;
  justificacion?: string;
  tipoAmbito?: 'AMBULATORIO' | 'HOSPITALARIO' | 'URGENCIAS' | 'QUIRURGICO';
}

export interface SolicitudProcedimientosData {
  items?: ProcedimientoItem[];
  observacionesGenerales?: string;
}

export interface DiligenciamientoDraft {
  citaId: string;
  pacienteId: string;
  plantillaId: string;
  // Cada submódulo guarda su payload particular en formato llave-valor
  datos: {
    motivo_consulta?: { motivo: string; enfermedadActual: string };
    antecedentes?: AntecedentesData;
    signos_vitales?: { fc: number; fr: number; paSistolica: number; paDiastolica: number; temp: number; pesoKg: number; tallaCm: number; imc: number };
    revisionSistemas?: RevisionSistemasData;
    revision_sistemas?: RevisionSistemasData;
    examenFisico?: ExamenFisicoData;
    examen_fisico?: ExamenFisicoData;
    diagnosticos?: { principal: string; tipoPrincipal: string; relacionados: string[] };
    evolucion_nota?: { nota: string };
    planManejo?: PlanManejoData;
    plan_manejo?: PlanManejoData;
    solicitudAyudasDiag?: SolicitudAyudasDiagData;
    solicitud_ayudas_diag?: SolicitudAyudasDiagData;
    solicitudProcedimientos?: SolicitudProcedimientosData;
    solicitud_procedimientos?: SolicitudProcedimientosData;
    [key: string]: unknown;
  };
  ultimaActualizacion: string; // ISO Date para autosave
}