import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Stethoscope,
  Activity,
  FileText,
  ClipboardList,
  Pill,
  Syringe,
  HeartPulse,
  Heart,
  ShieldCheck,
  Sparkles,
  User,
  FileCheck,
  Sliders,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  ArrowLeft,
  Check,
  CheckSquare,
  Info,
  Lock,
  RefreshCw,
  Eye,
  Layers,
  Search,
  ChevronRight,
  Printer,
  type LucideIcon,
} from 'lucide-react';
import {
  PlantillaResueltaResponse,
  DiligenciamientoDraft,
  SubmoduloId,
  PlantillaSeccion,
  PlantillaSubmoduloConfig,
} from '@/types/historiaClinica.types';
import { useActiveSection } from '@/hooks/useActiveSection';
import { RenderSubmodulo } from '@/modules/historia-clinica/registry';

// ============================================================================
// MAPA DINÁMICO DE ICONOS LUCIDE PARA SECCIONES & SUBMÓDULOS
// ============================================================================
const ICON_MAP: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  activity: Activity,
  filetext: FileText,
  file_text: FileText,
  clipboardlist: ClipboardList,
  clipboard_list: ClipboardList,
  pill: Pill,
  syringe: Syringe,
  heartpulse: HeartPulse,
  heart_pulse: HeartPulse,
  heart: Heart,
  shieldcheck: ShieldCheck,
  shield_check: ShieldCheck,
  sparkles: Sparkles,
  user: User,
  filecheck: FileCheck,
  file_check: FileCheck,
  sliders: Sliders,
  calendar: Calendar,
  layers: Layers,
  eye: Eye,
};

function resolveLucideIcon(iconName?: string): LucideIcon {
  if (!iconName) return FileText;
  const key = iconName.toLowerCase().replace(/[-_\s]/g, '');
  for (const mapKey of Object.keys(ICON_MAP)) {
    if (mapKey.toLowerCase().replace(/[-_\s]/g, '') === key) {
      return ICON_MAP[mapKey];
    }
  }
  return FileText;
}

// Nombres descriptivos para los submódulos atómicos
const SUBMODULO_TITULOS: Record<SubmoduloId, string> = {
  motivo_consulta: 'Motivo de Consulta & Anamnesis',
  signos_vitales: 'Signos Vitales & Biometría',
  antecedentes: 'Antecedentes Personales y Familiares',
  revision_sistemas: 'Revisión por Sistemas',
  examen_fisico: 'Examen Físico Segmentario',
  diagnosticos: 'Diagnósticos (CIE-10)',
  evolucion_nota: 'Nota de Evolución Clínica',
  plan_manejo: 'Plan de Manejo & Conducta',
  prescripcion_medica: 'Prescripción Médica (Fórmulas)',
  solicitud_ayudas_diag: 'Órdenes de Ayudas Diagnósticas',
  solicitud_procedimientos: 'Solicitud de Procedimientos',
};

// ============================================================================
// PLANTILLA MOCK POR DEFECTO (RESOLUCIÓN 1995 / MINSALUD COLOMBIA)
// ============================================================================
export const DEFAULT_PLANTILLA_RESUELTA: PlantillaResueltaResponse = {
  plantillaId: 'plantilla_med_general_v1',
  codigoPlantilla: 'HC-MED-GEN-01',
  nombrePlantilla: 'Consulta Médica General & Anamnesis Integral',
  origenResolucion: 'INSTITUCIONAL_DEFAULT',
  metadataAtencion: {
    citaId: 'cita_demo_101',
    pacienteId: 'pac_demo_202',
    tipoConsultaId: 'tc_primera_vez',
    finalidad: 'PRIMERA_VEZ',
    medicoId: 'med_sarai_dr',
    sedeId: 'sede_principal',
  },
  estructura: {
    secciones: [
      {
        id: 'sec_motivo_anamnesis',
        titulo: 'Anamnesis & Motivo',
        icono: 'Stethoscope',
        submodulos: [
          { id: 'motivo_consulta', requerido: true, orden: 1 },
          { id: 'antecedentes', requerido: false, orden: 2 },
        ],
      },
      {
        id: 'sec_examen_biometria',
        titulo: 'Examen Físico & Signos',
        icono: 'Activity',
        submodulos: [
          { id: 'signos_vitales', requerido: true, orden: 1 },
          { id: 'revision_sistemas', requerido: false, orden: 2 },
          { id: 'examen_fisico', requerido: true, orden: 3 },
        ],
      },
      {
        id: 'sec_juicio_clinico',
        titulo: 'Diagnóstico & Juicio',
        icono: 'ClipboardList',
        submodulos: [
          { id: 'diagnosticos', requerido: true, orden: 1 },
          { id: 'evolucion_nota', requerido: false, orden: 2 },
        ],
      },
      {
        id: 'sec_conducta_ordenes',
        titulo: 'Plan & Prescripción',
        icono: 'FileText',
        submodulos: [
          { id: 'plan_manejo', requerido: true, orden: 1 },
          { id: 'prescripcion_medica', requerido: false, orden: 2 },
          { id: 'solicitud_ayudas_diag', requerido: false, orden: 3 },
          { id: 'solicitud_procedimientos', requerido: false, orden: 4 },
        ],
      },
    ],
  },
};

// ============================================================================
// PROPS DEL WORKBENCH DE HISTORIA CLÍNICA
// ============================================================================
export interface PacienteInfo {
  id?: string;
  nombreCompleto?: string;
  primerNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  edad?: number | string;
  sexo?: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  eps?: string;
  alergiasAlert?: string;
}

export interface HistoriaClinicaWorkbenchProps {
  plantillaResuelta?: PlantillaResueltaResponse;
  paciente?: PacienteInfo;
  citaId?: string;
  initialDraft?: DiligenciamientoDraft;
  onSaveDraft?: (draft: DiligenciamientoDraft) => Promise<void> | void;
  onFinalizarAtencion?: (draft: DiligenciamientoDraft) => Promise<void> | void;
  onBack?: () => void;
  readOnly?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL: HISTORIA CLÍNICA WORKBENCH
// ============================================================================
export const HistoriaClinicaWorkbench: React.FC<HistoriaClinicaWorkbenchProps> = ({
  plantillaResuelta: plantillaProp,
  paciente: pacienteProp,
  citaId: citaIdProp,
  initialDraft,
  onSaveDraft,
  onFinalizarAtencion,
  onBack,
  readOnly = false,
}) => {
  // 1. Resolver Plantilla Activa
  const plantilla = useMemo(() => {
    return plantillaProp || DEFAULT_PLANTILLA_RESUELTA;
  }, [plantillaProp]);

  // 2. Resolver Datos del Paciente
  const paciente = useMemo<PacienteInfo>(() => {
    if (pacienteProp) return pacienteProp;
    return {
      id: plantilla.metadataAtencion?.pacienteId || 'PAC-2026-981',
      nombreCompleto: 'Valentina Restrepo Morales',
      tipoDocumento: 'CC',
      numeroDocumento: '1.020.458.912',
      edad: '34 años',
      sexo: 'Femenino',
      eps: 'Sura EPS - Plan Complementario',
      alergiasAlert: 'Penicilina / AINEs',
    };
  }, [pacienteProp, plantilla]);

  // 3. Lista de IDs de Secciones para el Observer
  const sectionIds = useMemo(() => {
    return plantilla.estructura.secciones.map((s) => s.id);
  }, [plantilla]);

  // 4. Hook de Navegación Activa y Scroll Suave
  const { activeSectionId, scrollToSection } = useActiveSection(sectionIds, 130);

  // 5. Estado Central del Borrador (DiligenciamientoDraft)
  const [draft, setDraft] = useState<DiligenciamientoDraft>(() => {
    if (initialDraft) return initialDraft;
    
    const storageKey = `sarai_hc_draft_${plantilla.metadataAtencion?.citaId || 'default'}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      /* ignore */
    }

    return {
      citaId: citaIdProp || plantilla.metadataAtencion?.citaId || 'cita_activa',
      pacienteId: paciente.id || plantilla.metadataAtencion?.pacienteId || 'pac_activo',
      plantillaId: plantilla.plantillaId,
      datos: {
        motivo_consulta: {
          motivo: '',
          enfermedadActual: '',
        },
        signos_vitales: {
          fc: 74,
          fr: 16,
          paSistolica: 118,
          paDiastolica: 78,
          temp: 36.6,
          spo2: 99,
          pesoKg: 64,
          tallaCm: 168,
          imc: 22.7,
        },
        diagnosticos: {
          principal: {
            id: 'diag_p1',
            codigoCie10: 'Z000',
            descripcion: 'Examen médico general',
            tipo: 'IMPRESION_DIAGNOSTICA',
          },
          relacionados: [],
        },
        plan_manejo: {
          conducta: '',
          recomendaciones: 'Hidratación adecuada, actividad física regular y control programado.',
          diasIncapacidad: '',
        },
      },
      ultimaActualizacion: new Date().toISOString(),
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Guardado localmente');
  const [showConfirmFinalizar, setShowConfirmFinalizar] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Actualizador atómico de submódulo
  const handleSubmoduloChange = useCallback((subId: SubmoduloId, patch: any) => {
    setDraft((prev) => {
      const currentSubData = prev.datos?.[subId] || {};
      const updatedSubData = { ...currentSubData, ...patch };
      const updatedDraft: DiligenciamientoDraft = {
        ...prev,
        datos: {
          ...prev.datos,
          [subId]: updatedSubData,
        },
        ultimaActualizacion: new Date().toISOString(),
      };

      try {
        const storageKey = `sarai_hc_draft_${plantilla.metadataAtencion?.citaId || 'default'}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedDraft));
      } catch {
        /* ignore */
      }

      return updatedDraft;
    });

    setIsDirty(true);
    setLastSavedTime('Cambios sin guardar');
  }, [plantilla]);

  // Guardado de borrador (Autosave / Manual)
  const handleGuardarBorrador = async () => {
    setIsSaving(true);
    try {
      if (onSaveDraft) {
        await onSaveDraft(draft);
      }
      setIsDirty(false);
      const now = new Date();
      setLastSavedTime(`Guardado a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      console.error('Error al guardar borrador:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Validación clínica básica antes de finalizar
  const validarHistoria = (): string[] => {
    const errs: string[] = [];
    const datos = draft.datos || {};

    plantilla.estructura.secciones.forEach((sec) => {
      sec.submodulos.forEach((sub) => {
        if (sub.requerido) {
          const subData = datos[sub.id] as any;
          if (!subData) {
            errs.push(`La sección "${sec.titulo}" tiene el submódulo requerido "${SUBMODULO_TITULOS[sub.id] || sub.id}" sin diligenciar.`);
          } else if (sub.id === 'motivo_consulta' && (!subData.motivo || subData.motivo.trim().length === 0)) {
            errs.push('Debe registrar el Motivo de Consulta.');
          } else if (sub.id === 'signos_vitales' && (!subData.fc || !subData.paSistolica)) {
            errs.push('Debe registrar los signos vitales principales (FC y Presión Arterial).');
          } else if (sub.id === 'diagnosticos' && (!subData.principal?.codigoCie10 || !subData.principal?.descripcion)) {
            errs.push('Debe asignar el Diagnóstico Principal con su código CIE-10.');
          } else if (sub.id === 'plan_manejo' && (!subData.conducta || subData.conducta.trim().length === 0)) {
            errs.push('Debe registrar la Conducta y Plan Terapéutico.');
          }
        }
      });
    });

    return errs;
  };

  const handleIntentarFinalizar = () => {
    const errs = validarHistoria();
    setValidationErrors(errs);
    setShowConfirmFinalizar(true);
  };

  const handleEjecutarFinalizacion = async () => {
    setIsFinalizing(true);
    try {
      if (onFinalizarAtencion) {
        await onFinalizarAtencion(draft);
      }
      setIsDirty(false);
      setShowConfirmFinalizar(false);
    } catch (err) {
      console.error('Error al finalizar atención:', err);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Cálculo de completitud de cada sección
  const getSeccionStatus = useCallback(
    (seccion: PlantillaSeccion) => {
      let completados = 0;
      const total = seccion.submodulos.length;

      seccion.submodulos.forEach((sub) => {
        const d = draft.datos?.[sub.id] as any;
        if (d && Object.keys(d).length > 0) {
          const hasContent = Object.values(d).some((v) => {
            if (typeof v === 'string') return v.trim().length > 0;
            if (typeof v === 'number') return v > 0;
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
            return false;
          });
          if (hasContent) completados++;
        }
      });

      return {
        total,
        completados,
        porcentaje: total > 0 ? Math.round((completados / total) * 100) : 0,
        esCompleta: total > 0 && completados === total,
      };
    },
    [draft]
  );

  // Origen de resolución con badge amigable
  const origenResolucionBadge = useMemo(() => {
    switch (plantilla.origenResolucion) {
      case 'PROFESIONAL_OVERRIDE':
        return { label: 'Plantilla Personalizada Médico', style: 'bg-primary/20 text-primary border-primary/40' };
      case 'SEDE_OVERRIDE':
        return { label: 'Plantilla Sede Asistencial', style: 'bg-subtle text-secondary border-border' };
      default:
        return { label: 'Plantilla Institucional Estándar', style: 'bg-subtle text-secondary border-border' };
    }
  }, [plantilla.origenResolucion]);

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col overflow-hidden bg-app text-primary antialiased selection:bg-primary/30 selection:text-primary">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BARRA SUPERIOR ASISTENCIAL (FIJA ARRIBA)                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 z-20 bg-app/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Identificación del Paciente & Navegación */}
          <div className="flex items-center gap-3.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-xl bg-subtle hover:bg-subtle/80 border border-border text-secondary hover:text-primary transition-colors"
                title="Volver al panel"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                {paciente.primerNombre?.charAt(0) || paciente.nombreCompleto?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-bold text-primary truncate">
                    {paciente.nombreCompleto || `${paciente.primerNombre || ''} ${paciente.primerApellido || ''}`}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-subtle text-secondary border border-border">
                    {paciente.tipoDocumento || 'CC'}: {paciente.numeroDocumento || 'Sin ID'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-subtle text-secondary border border-border">
                    {paciente.edad || '34 años'} · {paciente.sexo || 'F'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                  <span className="truncate">{paciente.eps || 'EPS No especificada'}</span>
                  <span>•</span>
                  <span className="font-mono text-primary/80 font-medium">{plantilla.codigoPlantilla}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Asistenciales & Autosave Status */}
          <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle/60 border border-border text-xs text-secondary">
              {isDirty ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  <span className="text-warning font-medium">Cambios pendientes</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-success" />
                  <span className="text-muted">{lastSavedTime}</span>
                </>
              )}
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleGuardarBorrador}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-subtle hover:bg-subtle/80 border border-border text-primary transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{isSaving ? 'Guardando...' : 'Guardar Borrador'}</span>
              </button>
            )}

            {!readOnly && (
              <button
                type="button"
                onClick={handleIntentarFinalizar}
                disabled={isFinalizing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-95 shadow-md shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isFinalizing ? <RefreshCw size={15} className="animate-spin" /> : <CheckSquare size={15} />}
                <span>Guardar y Finalizar Atención</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ÁREA CENTRAL DE TRABAJO: 2 COLUMNAS CON SCROLL INDEPENDIENTE        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* ================================================================= */}
        {/* PANEL IZQUIERDO: SUB-SIDEBAR FIJA (NO SE DESPLAZA NI SE PIERDE)   */}
        {/* ================================================================= */}
        <aside className="w-full md:w-[280px] flex-shrink-0 h-full flex flex-col">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden">
            
            {/* Header de la Sub-sidebar */}
            <div className="border-b border-border pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Secciones</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${origenResolucionBadge.style}`}>
                  {plantilla.codigoPlantilla}
                </span>
              </div>
              <h2 className="text-xs font-medium text-muted mt-1 truncate" title={plantilla.nombrePlantilla}>
                {plantilla.nombrePlantilla}
              </h2>
            </div>

            {/* Lista de Secciones con scroll propio */}
            <nav className="space-y-1.5 flex-1 overflow-y-auto py-2 pr-1" aria-label="Navegación de secciones">
              {plantilla.estructura.secciones.map((sec) => {
                const IconComponent = resolveLucideIcon(sec.icono);
                const isActive = activeSectionId === sec.id;
                const status = getSeccionStatus(sec);

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group relative ${
                      isActive
                        ? 'bg-primary/15 text-primary border-l-4 border-primary font-semibold ring-1 ring-primary/30'
                        : 'text-secondary hover:text-primary hover:bg-subtle/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-subtle text-secondary group-hover:text-primary'
                        }`}
                      >
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs block truncate">{sec.titulo}</span>
                        <span className="text-[10px] text-muted block">
                          {status.completados}/{status.total} submódulos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {status.esCompleta ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <ChevronRight
                          size={14}
                          className={`transition-transform ${
                            isActive ? 'text-primary translate-x-0.5' : 'text-muted opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Resumen de Diligenciamiento en Pie de Sidebar */}
            <div className="pt-3 border-t border-border flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs text-secondary">
                <span>Progreso total</span>
                <span className="font-mono font-bold text-primary">
                  {(() => {
                    let t = 0;
                    let c = 0;
                    plantilla.estructura.secciones.forEach((s) => {
                      const st = getSeccionStatus(s);
                      t += st.total;
                      c += st.completados;
                    });
                    return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
                  })()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: (() => {
                      let t = 0;
                      let c = 0;
                      plantilla.estructura.secciones.forEach((s) => {
                        const st = getSeccionStatus(s);
                        t += st.total;
                        c += st.completados;
                      });
                      return `${t > 0 ? (c / t) * 100 : 0}%`;
                    })(),
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* PANEL DERECHO: CASCA DE FORMULARIOS CON SCROLL CONTINUO           */}
        {/* ================================================================= */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto pr-2 pb-24 space-y-8" aria-label="Contenido de historia clínica">
          
          {plantilla.estructura.secciones.map((sec, secIdx) => {
            const SecIcon = resolveLucideIcon(sec.icono);
            const status = getSeccionStatus(sec);

            return (
              <div
                key={sec.id}
                id={sec.id}
                className="scroll-mt-6 space-y-4 transition-all"
              >
                {/* Encabezado de Sección */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <SecIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-primary/80 uppercase tracking-widest">
                          Sección {secIdx + 1}
                        </span>
                        {status.esCompleta && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">
                            Completada
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-primary">{sec.titulo}</h2>
                    </div>
                  </div>

                  <span className="text-xs text-muted font-medium">
                    {sec.submodulos.length} {sec.submodulos.length === 1 ? 'submódulo' : 'submódulos'}
                  </span>
                </div>

                {/* Cascada de Submódulos pertenecientes a esta Sección */}
                <div className="space-y-4">
                  {sec.submodulos.map((sub: PlantillaSubmoduloConfig, subIdx: number) => {
                    const subData = draft.datos?.[sub.id];
                    const subTitulo = SUBMODULO_TITULOS[sub.id] || sub.id;

                    return (
                      <div
                        key={`${sec.id}_${sub.id}_${subIdx}`}
                        className="bg-surface border border-border rounded-2xl p-5 mb-4 shadow-sm hover:border-primary/20 transition-all"
                      >
                        {/* Header de la tarjeta del Submódulo */}
                        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <h3 className="text-sm font-bold text-primary">{subTitulo}</h3>
                            {sub.requerido && (
                              <span className="text-[10px] font-semibold text-danger uppercase tracking-wider">
                                (Obligatorio)
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[11px] text-muted">
                            ID: <code className="font-mono text-primary/70">{sub.id}</code>
                          </span>
                        </div>

                        {/* Renderizado declarativo con lazy loading */}
                        <RenderSubmodulo
                          id={sub.id}
                          data={subData}
                          onChange={(patch: any) => handleSubmoduloChange(sub.id, patch)}
                          readOnly={readOnly}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Footer Asistencial al final del scroll */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary">Fin del Diligenciamiento</h4>
                <p className="text-xs text-secondary">
                  Revise que todos los campos requeridos estén completos antes de firmar y finalizar la atención.
                </p>
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleIntentarFinalizar}
                disabled={isFinalizing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-95 shadow-lg shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <CheckSquare size={16} />
                <span>Guardar y Finalizar Atención</span>
              </button>
            )}
          </div>
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL DE VALIDACIÓN Y CONFIRMACIÓN DE CIERRE                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showConfirmFinalizar && (
        <div className="fixed inset-0 z-50 bg-app/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${validationErrors.length > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  {validationErrors.length > 0 ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">
                    {validationErrors.length > 0 ? 'Validaciones Requeridas' : 'Confirmar Finalización de Consulta'}
                  </h3>
                  <p className="text-xs text-secondary">
                    {validationErrors.length > 0
                      ? 'Corrija los siguientes puntos antes de guardar definitivamente:'
                      : 'Esta acción guardará y cerrará el registro clínico en el sistema SARAI.'}
                  </p>
                </div>
              </div>
            </div>

            {validationErrors.length > 0 ? (
              <div className="space-y-2 bg-danger/5 border border-danger/20 rounded-xl p-3 max-h-60 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-danger">
                    <span className="mt-0.5">•</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-subtle/50 border border-border space-y-2 text-xs text-secondary">
                <p>
                  Paciente: <strong className="text-primary">{paciente.nombreCompleto}</strong> ({paciente.tipoDocumento} {paciente.numeroDocumento})
                </p>
                <p>
                  Plantilla: <strong className="text-primary">{plantilla.nombrePlantilla}</strong>
                </p>
                <p>
                  Última actualización: <strong className="text-primary">{new Date().toLocaleString()}</strong>
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmFinalizar(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-subtle hover:bg-subtle/80 border border-border text-primary transition-colors"
              >
                {validationErrors.length > 0 ? 'Entendido, volver a editar' : 'Cancelar'}
              </button>

              {validationErrors.length === 0 && (
                <button
                  type="button"
                  onClick={handleEjecutarFinalizacion}
                  disabled={isFinalizing}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-95 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isFinalizing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isFinalizing ? 'Finalizando...' : 'Confirmar y Guardar'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriaClinicaWorkbench;