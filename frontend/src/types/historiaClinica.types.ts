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
export interface DiligenciamientoDraft {
  citaId: string;
  pacienteId: string;
  plantillaId: string;
  // Cada submódulo guarda su payload particular en formato llave-valor
  datos: {
    motivo_consulta?: { motivo: string; enfermedadActual: string };
    signos_vitales?: { fc: number; fr: number; paSistolica: number; paDiastolica: number; temp: number; pesoKg: number; tallaCm: number; imc: number };
    diagnosticos?: { principal: string; tipoPrincipal: string; relacionados: string[] };
    evolucion_nota?: { nota: string };
    plan_manejo?: { conducta: string; recomendaciones: string };
    [key: string]: unknown;
  };
  ultimaActualizacion: string; // ISO Date para autosave
}