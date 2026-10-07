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

export interface RevisionSistemasData {
  general?: string;
  cardiovascular?: string;
  respiratorio?: string;
  gastrointestinal?: string;
  genitourinario?: string;
  neurologico?: string;
  osteomuscular?: string;
  dermatologico?: string;
}

export interface IncapacidadMedicaData {
  requiere?: boolean;
  dias?: number;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
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