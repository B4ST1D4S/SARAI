/**
 * HistoriaClinicaPage.tsx — v2
 * Historia Clínica Completa · Resolución 1995/1999 · Colombia
 * Diseño: EMR moderno, scroll continuo, diligenciamiento fluido
 * Incluye: 12 secciones HC + 4 secciones Órdenes Médicas
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, Plus, Trash2, Save,
} from 'lucide-react';
import {
  createHistoriaClinica, getAllPacientes, getHistoriasMedico, updateHistoriaClinica,
} from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
interface ApodiagItem  { id: string; tipo: string; descripcion: string; urgente: boolean; }
interface ProcQxItem   { id: string; codigoCups: string; nombre: string; prioridad: string; anestesia: string; observaciones: string; }
interface MedItem      { id: string; nombre: string; dosis: string; frecuencia: string; duracion: string; via: string; observaciones: string; }
interface IntercItem   { id: string; especialidad: string; prioridad: string; motivo: string; observaciones: string; }

interface FormHC {
  pacienteId: string; tipoConsulta: string; tipoHistoria: string;
  // 2. Motivo
  motivoConsulta: string; historiaEnfermedad: string;
  // 3. Signos vitales
  peso: string; talla: string; imc: string; temperatura: string;
  frecuenciaCardiaca: string; frecuenciaRespiratoria: string;
  taSistolica: string; taDiastolica: string; saturacionO2: string; glicemia: string;
  // 4. Antecedentes personales
  antPatologicos: string; antFarmacologicos: string; antQuirurgicos: string;
  antAlergicos: string; antToxicos: string; antHospitalarios: string;
  // 5. Antecedentes familiares
  antFamHTA: boolean; antFamDiabetes: boolean; antFamCancer: boolean;
  antFamCardiopatias: boolean; antFamOtros: string;
  // 6. Gineco
  fum: string; gestaciones: string; partos: string; cesareas: string;
  abortos: string; planificacion: string; menopausia: boolean;
  // 7. Evolución Cx
  procedimientoRealizado: string; evolucionCx: string; complicacionesCx: string;
  recomendacionesCx: string; evolucionPostop: string;
  // 8. Finalidad (RIPS)
  finalidadAtencion: string;
  // 9. Origen
  origenAtencion: string;
  // 10. Diagnóstico
  diagnosticoPrincipal: string; codigoCie10: string;
  diagnosticosRelacionados: string; tipoDiagnostico: string;
  // 11. Plan
  conducta: string; incapacidadDias: string; procedimientosPlan: string; seguimiento: string;
  // 12. Recomendaciones
  recomendacionesMed: string;
  // Órdenes
  apoyosDiag: ApodiagItem[];
  procedimientosQx: ProcQxItem[];
  medicamentos: MedItem[];
  interconsultas: IntercItem[];
}

const BLANK: FormHC = {
  pacienteId: '', tipoConsulta: 'INICIAL', tipoHistoria: 'ANAMNESIS',
  motivoConsulta: '', historiaEnfermedad: '',
  peso: '', talla: '', imc: '', temperatura: '',
  frecuenciaCardiaca: '', frecuenciaRespiratoria: '',
  taSistolica: '', taDiastolica: '', saturacionO2: '', glicemia: '',
  antPatologicos: '', antFarmacologicos: '', antQuirurgicos: '',
  antAlergicos: '', antToxicos: '', antHospitalarios: '',
  antFamHTA: false, antFamDiabetes: false, antFamCancer: false,
  antFamCardiopatias: false, antFamOtros: '',
  fum: '', gestaciones: '', partos: '', cesareas: '',
  abortos: '', planificacion: '', menopausia: false,
  procedimientoRealizado: '', evolucionCx: '', complicacionesCx: '',
  recomendacionesCx: '', evolucionPostop: '',
  finalidadAtencion: 'D',
  origenAtencion: 'CE',
  diagnosticoPrincipal: '', codigoCie10: '',
  diagnosticosRelacionados: '', tipoDiagnostico: 'CONFIRMADO',
  conducta: '', incapacidadDias: '', procedimientosPlan: '', seguimiento: '',
  recomendacionesMed: '',
  apoyosDiag: [], procedimientosQx: [], medicamentos: [], interconsultas: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Secciones
// ─────────────────────────────────────────────────────────────────────────────
const SECCIONES_HC = [
  { id: 'motivo-consulta', label: 'Motivo de Consulta',     num: 1  },
  { id: 'signos-vitales',  label: 'Signos Vitales',         num: 2  },
  { id: 'antec-pers',      label: 'Antec. Personales',      num: 3  },
  { id: 'antec-fam',       label: 'Antec. Familiares',      num: 4  },
  { id: 'antec-gineco',    label: 'Gineco Obstétrico',      num: 5  },
  { id: 'evolucion-cx',    label: 'Evolución Cirugía',      num: 6  },
  { id: 'finalidad',       label: 'Finalidad de Atención',  num: 7  },
  { id: 'origen',          label: 'Origen de Atención',     num: 8  },
  { id: 'diagnostico',     label: 'Impresión Diagnóstica',  num: 9  },
  { id: 'plan',            label: 'Plan Terapéutico',       num: 10 },
  { id: 'recomendaciones', label: 'Recomendaciones',        num: 11 },
];
const SECCIONES_OM = [
  { id: 'apoyos-diag',   label: 'Apoyos Diagnósticos',    num: 12 },
  { id: 'proc-qx',       label: 'Procedimientos Qx',      num: 13 },
  { id: 'medicamentos',  label: 'Formulación Meds',       num: 14 },
  { id: 'interconsulta', label: 'Interconsulta',          num: 15 },
];
const ALL_SECCIONES = [...SECCIONES_HC, ...SECCIONES_OM];

// ─────────────────────────────────────────────────────────────────────────────
// Mini-componentes reutilizables
// ─────────────────────────────────────────────────────────────────────────────
const ic = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/60 focus:bg-white/[0.07] transition-all resize-none';
const lc = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1';

const Lb  = ({ t }: { t: string }) => <label className={lc}>{t}</label>;
const F   = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><Lb t={label} />{children}</div>
);
const Inp = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <F label={label}><input {...p} className={`${ic} ${p.className || ''}`} /></F>
);
const Ta  = ({ label, rows = 3, ...p }: { label: string; rows?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <F label={label}><textarea rows={rows} {...p} className={`${ic} ${p.className || ''}`} /></F>
);
const Sel = ({ label, children, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <F label={label}><select {...p} className={ic}>{children}</select></F>
);
const Chk = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 cursor-pointer py-1 group">
    <div
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${checked ? 'bg-yellow-500 border-yellow-500' : 'border-white/20 bg-white/5 group-hover:border-yellow-500/50'}`}
    >
      {checked && <span className="text-[8px] text-slate-900 font-bold">✓</span>}
    </div>
    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors select-none">{label}</span>
  </label>
);

function SecCard({ id, num, title, emoji, done, children }: {
  id: string; num: number; title: string; emoji: string;
  done?: boolean; children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden scroll-mt-4">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/[0.015]">
        <span className="text-base select-none">{emoji}</span>
        <span className="w-5 h-5 rounded bg-yellow-500/15 flex items-center justify-center text-yellow-400 text-[9px] font-bold shrink-0">{num}</span>
        <h3 className="text-sm font-bold text-white flex-1">{title}</h3>
        {done && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function RowCard({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-3 bg-white/[0.015] border border-white/5 rounded-xl p-3">{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function HistoriaClinicaPage({
  onNavegar,
  showFormExternal,
  onShowFormChange,
  seccionExterna,
  onSeccionChange,
  onRegisterCampos,
  pacienteIdExterno,
}: {
  onNavegar?: (pagina: string) => void;
  showFormExternal?: boolean;
  onShowFormChange?: (v: boolean) => void;
  seccionExterna?: number;
  onSeccionChange?: (n: number) => void;
  onRegisterCampos?: (fn: ((c: Record<string, string>) => void) | null) => void;
  pacienteIdExterno?: string;
} = {}) {
  const [pacientes,  setPacientes]  = useState<any[]>([]);
  const [historias,  setHistorias]  = useState<any[]>([]);
  const [showForm,   setShowFormS]  = useState(showFormExternal ?? false);
  const [secActiva,  setSecActiva]  = useState<string>('motivo-consulta');
  const [form,       setForm]       = useState<FormHC>(BLANK);
  const [guardado,   setGuardado]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [autoMsg,    setAutoMsg]    = useState(false);
  const savedIdRef   = useRef<string | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token        = localStorage.getItem('accessToken') || '';

  // Evitar unused-variable warnings
  void onNavegar;
  void onSeccionChange;

  const setShowForm = (v: boolean) => { setShowFormS(v); onShowFormChange?.(v); };

  // Setter tipado
  const s = <K extends keyof FormHC>(k: K, v: FormHC[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  // IMC automático
  useEffect(() => {
    const p = parseFloat(form.peso), t = parseFloat(form.talla) / 100;
    if (p > 0 && t > 0) s('imc', (p / (t * t)).toFixed(1));
  }, [form.peso, form.talla]);

  // Cargar datos iniciales
  useEffect(() => {
    getAllPacientes(1, 200, token).then(r => {
      if (r.data) setPacientes((r.data as any).pacientes || []);
    });
    cargarHistorias();
  }, []);

  // Sync desde props externas
  useEffect(() => { if (showFormExternal !== undefined) setShowFormS(showFormExternal); }, [showFormExternal]);
  useEffect(() => {
    if (seccionExterna !== undefined) {
      const sec = ALL_SECCIONES[seccionExterna];
      if (sec) setSecActiva(sec.id);
    }
  }, [seccionExterna]);
  useEffect(() => {
    if (pacienteIdExterno) { s('pacienteId', pacienteIdExterno); setShowForm(true); }
  }, [pacienteIdExterno]);

  // Build payload
  const buildPayload = useCallback(() => ({
    pacienteId: form.pacienteId,
    tipoHistoria: form.tipoHistoria,
    tipoConsulta: form.tipoConsulta,
    quejaPrincipal: form.motivoConsulta,
    historiaEnfermedad: form.historiaEnfermedad,
    observacionesAntropometricas: form.evolucionCx,
    diagnostico: form.diagnosticoPrincipal,
    tratamientoRecomendado: form.conducta,
    datosExtendidos: {
      signosVitales: {
        peso: form.peso, talla: form.talla, imc: form.imc,
        temperatura: form.temperatura, frecuenciaCardiaca: form.frecuenciaCardiaca,
        frecuenciaRespiratoria: form.frecuenciaRespiratoria,
        taSistolica: form.taSistolica, taDiastolica: form.taDiastolica,
        saturacionO2: form.saturacionO2, glicemia: form.glicemia,
      },
      antecedentesPersonales: {
        patologicos: form.antPatologicos, farmacologicos: form.antFarmacologicos,
        quirurgicos: form.antQuirurgicos, alergicos: form.antAlergicos,
        toxicos: form.antToxicos, hospitalarios: form.antHospitalarios,
      },
      antecedentesFamiliares: {
        hta: form.antFamHTA, diabetes: form.antFamDiabetes,
        cancer: form.antFamCancer, cardiopatias: form.antFamCardiopatias,
        otros: form.antFamOtros,
      },
      antecedentesGineco: {
        fum: form.fum, gestaciones: form.gestaciones, partos: form.partos,
        cesareas: form.cesareas, abortos: form.abortos,
        planificacion: form.planificacion, menopausia: form.menopausia,
      },
      evolucionCx: {
        procedimientoRealizado: form.procedimientoRealizado,
        evolucion: form.evolucionCx, complicaciones: form.complicacionesCx,
        recomendaciones: form.recomendacionesCx, evolucionPostop: form.evolucionPostop,
      },
      finalidadAtencion: form.finalidadAtencion,
      origenAtencion: form.origenAtencion,
      diagnostico: {
        principal: form.diagnosticoPrincipal, codigoCie10: form.codigoCie10,
        relacionados: form.diagnosticosRelacionados, tipo: form.tipoDiagnostico,
      },
      planTerapeutico: {
        conducta: form.conducta, incapacidadDias: form.incapacidadDias,
        procedimientos: form.procedimientosPlan, seguimiento: form.seguimiento,
      },
      recomendaciones: form.recomendacionesMed,
      ordenesMedicas: {
        apoyosDiagnosticos: form.apoyosDiag,
        procedimientosQx:   form.procedimientosQx,
        medicamentos:       form.medicamentos,
        interconsultas:     form.interconsultas,
      },
    },
  }), [form]);

  // Autoguardado con debounce 3s
  useEffect(() => {
    if (!form.pacienteId || !form.motivoConsulta) return;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(async () => {
      const payload = buildPayload();
      let r: any;
      if (savedIdRef.current) {
        r = await updateHistoriaClinica(savedIdRef.current, payload, token);
      } else {
        r = await createHistoriaClinica(payload, token);
        if (!r?.error && r?.data) savedIdRef.current = (r.data as any).id;
      }
      if (!r?.error) { setAutoMsg(true); setTimeout(() => setAutoMsg(false), 2000); }
    }, 3000);
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); };
  }, [form, buildPayload]);

  const cargarHistorias = async () => {
    setLoading(true);
    const r = await getHistoriasMedico(1, 20, token);
    if (r.data) setHistorias((r.data as any).historias || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = buildPayload();
    let r: any;
    if (savedIdRef.current) {
      r = await updateHistoriaClinica(savedIdRef.current, payload, token);
    } else {
      r = await createHistoriaClinica(payload, token);
    }
    if (!r?.error) {
      setGuardado(true);
      savedIdRef.current = null;
      setForm(BLANK);
      cargarHistorias();
      setTimeout(() => { setGuardado(false); setShowForm(false); }, 2500);
    }
    setLoading(false);
  };

  // SARAI: mapeo de campos de voz a form
  const handleCamposSarai = useCallback((campos: Record<string, string>) => {
    setForm(prev => {
      const n = { ...prev };
      const mapa: Partial<Record<string, keyof FormHC>> = {
        quejaPrincipal:          'motivoConsulta',
        historiaEnfermedad:      'historiaEnfermedad',
        antecedentesFamiliares:  'antFamOtros',
        antecedentesPersonales:  'antPatologicos',
        antecedentesQuirurgicos: 'antQuirurgicos',
        antecedentesEsteticos:   'antQuirurgicos',
        medicamentosActuales:    'antFarmacologicos',
        alergias:                'antAlergicos',
        habitosToxicos:          'antToxicos',
        examenFisico:            'historiaEnfermedad',
        presionArterial:         'taSistolica',
        frecuenciaCardiaca:      'frecuenciaCardiaca',
        frecuenciaRespiratoria:  'frecuenciaRespiratoria',
        temperatura:             'temperatura',
        peso:                    'peso',
        talla:                   'talla',
        diagnostico:             'diagnosticoPrincipal',
        planTratamiento:         'conducta',
        procedimientoPropuesto:  'procedimientoRealizado',
        recomendaciones:         'recomendacionesMed',
        observaciones:           'recomendacionesMed',
        consentimientoExplicacion: 'recomendacionesMed',
      };
      Object.entries(campos).forEach(([k, v]) => {
        if (mapa[k] && v) (n as any)[mapa[k]!] = v;
      });
      const sv = (campos as any).signosVitales;
      if (sv) {
        if (sv.peso)                  n.peso = sv.peso;
        if (sv.talla)                 n.talla = sv.talla;
        if (sv.temperatura)           n.temperatura = sv.temperatura;
        if (sv.frecuenciaCardiaca)    n.frecuenciaCardiaca = sv.frecuenciaCardiaca;
        if (sv.frecuenciaRespiratoria) n.frecuenciaRespiratoria = sv.frecuenciaRespiratoria;
      }
      return n;
    });
  }, []);

  useEffect(() => {
    onRegisterCampos?.(handleCamposSarai);
    return () => onRegisterCampos?.(null);
  }, [onRegisterCampos, handleCamposSarai]);

  const scrollTo = (id: string) => {
    setSecActiva(id);
    const panel = document.getElementById('hc-scroll-panel');
    const el    = document.getElementById(id);
    if (panel && el) panel.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
  };

  const done: Record<string, boolean> = {
    'motivo-consulta': !!form.motivoConsulta,
    'signos-vitales':  !!(form.peso && form.talla),
    'antec-pers':      !!(form.antPatologicos || form.antQuirurgicos),
    'antec-fam':       !!(form.antFamOtros || form.antFamHTA || form.antFamDiabetes),
    'antec-gineco':    !!form.fum,
    'evolucion-cx':    !!(form.procedimientoRealizado || form.evolucionCx),
    'finalidad':       !!form.finalidadAtencion,
    'origen':          !!form.origenAtencion,
    'diagnostico':     !!form.diagnosticoPrincipal,
    'plan':            !!form.conducta,
    'recomendaciones': !!form.recomendacionesMed,
  };
  const porcentaje = Math.round(
    (Object.values(done).filter(Boolean).length / Object.keys(done).length) * 100
  );

  const uid = () => Math.random().toString(36).slice(2);
  const today = new Date().toISOString().slice(0, 10);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#080a0f]">

      {/* ══ TOP BAR ══ */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black text-white tracking-tight">
            Historia <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Clínica</span>
          </h1>
          {!showForm && <span className="text-[10px] text-gray-600 border border-white/10 rounded-full px-2 py-0.5">{historias.length} registros</span>}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            showForm
              ? 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-500/20'
          }`}
        >
          {showForm ? '✕ Cancelar' : '+ Nueva Historia'}
        </button>
      </div>

      {/* ══ MODO DASHBOARD (formulario) ══ */}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

          {/* Barra de datos del paciente */}
          <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.01]">
            <F label="Paciente *">
              <select value={form.pacienteId} onChange={e => s('pacienteId', e.target.value)} required className={ic}>
                <option value="">Seleccionar paciente...</option>
                {pacientes.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombreCompleto} — {p.numeroDocumento}</option>
                ))}
              </select>
            </F>
            <Sel label="Tipo de Consulta *" value={form.tipoConsulta} onChange={e => s('tipoConsulta', e.target.value)}>
              <option value="INICIAL">Consulta Inicial</option>
              <option value="SEGUIMIENTO">Seguimiento</option>
              <option value="CONTROL">Control Post-Op</option>
              <option value="URGENCIA">Urgencia</option>
              <option value="VALORACION">Valoración Pre-Qx</option>
            </Sel>
            <Sel label="Tipo de Historia" value={form.tipoHistoria} onChange={e => s('tipoHistoria', e.target.value)}>
              <option value="ANAMNESIS">Anamnesis</option>
              <option value="EXAMEN_FISICO">Examen Físico</option>
              <option value="DIAGNOSTICO">Diagnóstico</option>
              <option value="PLAN">Plan Quirúrgico</option>
              <option value="SEGUIMIENTO">Seguimiento Post-Op</option>
              <option value="EVOLUCION">Evolución</option>
            </Sel>
            <div>
              <label className={lc}>Fecha</label>
              <input readOnly value={today} className={`${ic} opacity-50 cursor-not-allowed`} />
            </div>
          </div>

          {/* ── Paneles: nav izquierda + formulario derecha ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* ══ PANEL IZQUIERDO ══ */}
            <div className="w-48 flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#0b0d14]">

              {/* barra de progreso */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Progreso</span>
                  <span className="text-[10px] text-yellow-400 font-bold">{porcentaje}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-[3px]">
                  <motion.div animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.4 }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" />
                </div>
              </div>

              {/* nav secciones */}
              <div className="flex-1 overflow-y-auto px-2 pb-4">
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest px-2 pt-3 pb-1">Historia Clínica</p>
                {SECCIONES_HC.map(sec => (
                  <button key={sec.id} type="button" onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-all flex items-center gap-2 ${
                      secActiva === sec.id
                        ? 'bg-yellow-500/10 text-yellow-300 font-semibold border-l-2 border-yellow-400'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] border-l-2 border-transparent'
                    }`}>
                    {done[sec.id]
                      ? <CheckCircle size={10} className="text-emerald-400 shrink-0" />
                      : <span className="text-[9px] text-gray-600 w-3 text-center shrink-0">{sec.num}</span>
                    }
                    {sec.label}
                  </button>
                ))}

                <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-widest px-2 pt-4 pb-1">Órdenes Médicas</p>
                {SECCIONES_OM.map(sec => (
                  <button key={sec.id} type="button" onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-all flex items-center gap-2 ${
                      secActiva === sec.id
                        ? 'bg-blue-500/10 text-blue-300 font-semibold border-l-2 border-blue-400'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] border-l-2 border-transparent'
                    }`}>
                    <span className="text-[9px] text-gray-600 w-3 text-center shrink-0">{sec.num}</span>
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* guardar fijo abajo */}
              <div className="flex-shrink-0 p-3 border-t border-white/[0.06]">
                <button type="submit"
                  disabled={loading || !form.pacienteId || !form.motivoConsulta}
                  className="w-full py-2 rounded-lg font-bold text-xs bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5">
                  {loading
                    ? <><span className="w-3 h-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> Guardando…</>
                    : guardado ? <><CheckCircle size={12} /> Guardada ✓</>
                    : <><Save size={12} /> Guardar Historia</>}
                </button>
                {autoMsg && (
                  <p className="text-center text-[9px] text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle size={8} /> Autoguardado
                  </p>
                )}
              </div>
            </div>

            {/* ══ PANEL DERECHO: todas las secciones ══ */}
            <div id="hc-scroll-panel" className="flex-1 overflow-y-auto bg-[#080a0f]">
              <div className="p-6 space-y-6 max-w-4xl">

                {/* 1 */}
                <SecCard id="motivo-consulta" num={1} title="Motivo de Consulta" emoji="💬" done={done['motivo-consulta']}>
                  <Ta label="Motivo / Queja Principal *" rows={3} value={form.motivoConsulta}
                    onChange={e => s('motivoConsulta', e.target.value)} required
                    placeholder="Describa el motivo principal por el que consulta el paciente..." />
                  <Ta label="Historia de la Enfermedad Actual" rows={6} value={form.historiaEnfermedad}
                    onChange={e => s('historiaEnfermedad', e.target.value)}
                    placeholder="Descripción cronológica, tiempo de evolución, síntomas asociados, tratamientos previos..." />
                </SecCard>

                {/* 2 */}
                <SecCard id="signos-vitales" num={2} title="Signos Vitales" emoji="❤️" done={done['signos-vitales']}>
                  <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                    <Inp label="Peso (kg)" type="number" step="0.1" value={form.peso} onChange={e => s('peso', e.target.value)} placeholder="65.0" />
                    <Inp label="Talla (cm)" type="number" value={form.talla} onChange={e => s('talla', e.target.value)} placeholder="165" />
                    <div>
                      <label className={lc}>IMC (auto)</label>
                      <div className="flex items-center gap-1">
                        <input readOnly value={form.imc} className={`${ic} opacity-60 cursor-not-allowed`} placeholder="---" />
                        {form.imc && <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${
                          parseFloat(form.imc)<18.5?'bg-blue-500/20 text-blue-300':parseFloat(form.imc)<25?'bg-emerald-500/20 text-emerald-300':parseFloat(form.imc)<30?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'
                        }`}>{parseFloat(form.imc)<18.5?'Bajo':parseFloat(form.imc)<25?'Normal':parseFloat(form.imc)<30?'Sobrepeso':'Obesidad'}</span>}
                      </div>
                    </div>
                    <Inp label="Temp (°C)" type="number" step="0.1" value={form.temperatura} onChange={e => s('temperatura', e.target.value)} placeholder="36.5" />
                    <Inp label="FC (lpm)" type="number" value={form.frecuenciaCardiaca} onChange={e => s('frecuenciaCardiaca', e.target.value)} placeholder="72" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Inp label="FR (rpm)" type="number" value={form.frecuenciaRespiratoria} onChange={e => s('frecuenciaRespiratoria', e.target.value)} placeholder="16" />
                    <Inp label="TA Sist. (mmHg)" type="number" value={form.taSistolica} onChange={e => s('taSistolica', e.target.value)} placeholder="120" />
                    <Inp label="TA Diast. (mmHg)" type="number" value={form.taDiastolica} onChange={e => s('taDiastolica', e.target.value)} placeholder="80" />
                    <Inp label="SatO₂ (%)" type="number" step="0.1" value={form.saturacionO2} onChange={e => s('saturacionO2', e.target.value)} placeholder="98" />
                  </div>
                  <div className="w-44"><Inp label="Glicemia (mg/dL)" type="number" value={form.glicemia} onChange={e => s('glicemia', e.target.value)} placeholder="90" /></div>
                </SecCard>

                {/* 3 */}
                <SecCard id="antec-pers" num={3} title="Antecedentes Personales" emoji="📁" done={done['antec-pers']}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Ta label="Patológicos" rows={3} value={form.antPatologicos} onChange={e => s('antPatologicos', e.target.value)} placeholder="HTA, DM2, cardiopatías..." />
                    <Ta label="Farmacológicos" rows={3} value={form.antFarmacologicos} onChange={e => s('antFarmacologicos', e.target.value)} placeholder="Medicamentos actuales, dosis..." />
                    <Ta label="Quirúrgicos" rows={3} value={form.antQuirurgicos} onChange={e => s('antQuirurgicos', e.target.value)} placeholder="Cirugías previas, fecha, complicaciones..." />
                    <Ta label="Alérgicos" rows={3} value={form.antAlergicos} onChange={e => s('antAlergicos', e.target.value)} placeholder="Medicamentos, alimentos, látex..." />
                    <Ta label="Tóxicos" rows={2} value={form.antToxicos} onChange={e => s('antToxicos', e.target.value)} placeholder="Tabaco, alcohol, SPA..." />
                    <Ta label="Hospitalarios" rows={2} value={form.antHospitalarios} onChange={e => s('antHospitalarios', e.target.value)} placeholder="Hospitalizaciones previas..." />
                  </div>
                </SecCard>

                {/* 4 */}
                <SecCard id="antec-fam" num={4} title="Antecedentes Familiares" emoji="👨‍👩‍👧" done={done['antec-fam']}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                    <Chk label="HTA"          checked={form.antFamHTA}         onChange={v => s('antFamHTA', v)} />
                    <Chk label="Diabetes"     checked={form.antFamDiabetes}     onChange={v => s('antFamDiabetes', v)} />
                    <Chk label="Cáncer"       checked={form.antFamCancer}       onChange={v => s('antFamCancer', v)} />
                    <Chk label="Cardiopatías" checked={form.antFamCardiopatias} onChange={v => s('antFamCardiopatias', v)} />
                  </div>
                  <Ta label="Otros antecedentes familiares" rows={3} value={form.antFamOtros} onChange={e => s('antFamOtros', e.target.value)} placeholder="Enfermedades genéticas, mentales, otras..." />
                </SecCard>

                {/* 5 */}
                <SecCard id="antec-gineco" num={5} title="Antecedentes Gineco Obstétricos" emoji="🌸" done={done['antec-gineco']}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Inp label="FUM" type="date" value={form.fum} onChange={e => s('fum', e.target.value)} />
                    <Inp label="Gestaciones (G)" type="number" min="0" value={form.gestaciones} onChange={e => s('gestaciones', e.target.value)} placeholder="0" />
                    <Inp label="Partos (P)" type="number" min="0" value={form.partos} onChange={e => s('partos', e.target.value)} placeholder="0" />
                    <Inp label="Cesáreas (C)" type="number" min="0" value={form.cesareas} onChange={e => s('cesareas', e.target.value)} placeholder="0" />
                    <Inp label="Abortos (A)" type="number" min="0" value={form.abortos} onChange={e => s('abortos', e.target.value)} placeholder="0" />
                    <Inp label="Planificación" value={form.planificacion} onChange={e => s('planificacion', e.target.value)} placeholder="ACO, DIU, condón..." />
                  </div>
                  <Chk label="Menopausia" checked={form.menopausia} onChange={v => s('menopausia', v)} />
                </SecCard>

                {/* 6 */}
                <SecCard id="evolucion-cx" num={6} title="Evolución Cirugía Plástica y Estética" emoji="✂️" done={done['evolucion-cx']}>
                  <Inp label="Procedimiento Realizado" value={form.procedimientoRealizado} onChange={e => s('procedimientoRealizado', e.target.value)} placeholder="Ej: Rinoplastia abierta, liposucción abdominal..." />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Ta label="Evolución" rows={3} value={form.evolucionCx} onChange={e => s('evolucionCx', e.target.value)} placeholder="Evolución postoperatoria..." />
                    <Ta label="Complicaciones" rows={3} value={form.complicacionesCx} onChange={e => s('complicacionesCx', e.target.value)} placeholder="Complicaciones presentes o ausentes..." />
                    <Ta label="Recomendaciones Quirúrgicas" rows={3} value={form.recomendacionesCx} onChange={e => s('recomendacionesCx', e.target.value)} placeholder="Cuidados del área intervenida..." />
                    <Ta label="Evolución Postoperatoria" rows={3} value={form.evolucionPostop} onChange={e => s('evolucionPostop', e.target.value)} placeholder="Cicatrización, edema, resultado..." />
                  </div>
                </SecCard>

                {/* 7 */}
                <SecCard id="finalidad" num={7} title="Finalidad de Atención" emoji="🎯" done={done['finalidad']}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[{v:'P',l:'P — Promoción y Mantenimiento'},{v:'V',l:'V — Prevención'},{v:'D',l:'D — Diagnóstico'},{v:'T',l:'T — Tratamiento'},{v:'R',l:'R — Rehabilitación'},{v:'C',l:'C — Cuidado Paliativo'},{v:'E',l:'E — Educación'},{v:'I',l:'I — Investigación'}].map(({v,l}) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer group py-1">
                        <input type="radio" name="finalidad" value={v} checked={form.finalidadAtencion===v} onChange={() => s('finalidadAtencion',v)} className="accent-yellow-500" />
                        <span className={`text-xs ${form.finalidadAtencion===v?'text-yellow-300 font-semibold':'text-gray-400 group-hover:text-gray-300'}`}>{l}</span>
                      </label>
                    ))}
                  </div>
                </SecCard>

                {/* 8 */}
                <SecCard id="origen" num={8} title="Origen de Atención" emoji="📍" done={done['origen']}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[{v:'CE',l:'Consulta Externa'},{v:'UR',l:'Urgencias'},{v:'HO',l:'Hospitalización'},{v:'RE',l:'Remisión'},{v:'PA',l:'Particular'},{v:'TM',l:'Telemedicina'}].map(({v,l}) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer group py-1">
                        <input type="radio" name="origen" value={v} checked={form.origenAtencion===v} onChange={() => s('origenAtencion',v)} className="accent-yellow-500" />
                        <span className={`text-xs ${form.origenAtencion===v?'text-yellow-300 font-semibold':'text-gray-400 group-hover:text-gray-300'}`}>{l}</span>
                      </label>
                    ))}
                  </div>
                </SecCard>

                {/* 9 */}
                <SecCard id="diagnostico" num={9} title="Impresión Diagnóstica" emoji="🔬" done={done['diagnostico']}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Inp label="Diagnóstico Principal *" value={form.diagnosticoPrincipal} onChange={e => s('diagnosticoPrincipal', e.target.value)} required placeholder="Diagnóstico principal..." />
                    <Inp label="Código CIE-10" value={form.codigoCie10} onChange={e => s('codigoCie10', e.target.value)} placeholder="Ej: Z41.1" />
                  </div>
                  <Ta label="Diagnósticos Relacionados" rows={2} value={form.diagnosticosRelacionados} onChange={e => s('diagnosticosRelacionados', e.target.value)} placeholder="Comorbilidades con CIE-10..." />
                  <Sel label="Tipo de Diagnóstico" value={form.tipoDiagnostico} onChange={e => s('tipoDiagnostico', e.target.value)}>
                    <option value="CONFIRMADO">Confirmado</option>
                    <option value="PRESUNTIVO">Presuntivo / Sospecha</option>
                    <option value="DESCARTADO">Descartado</option>
                  </Sel>
                </SecCard>

                {/* 10 */}
                <SecCard id="plan" num={10} title="Plan Terapéutico" emoji="📋" done={done['plan']}>
                  <Ta label="Conducta / Manejo" rows={4} value={form.conducta} onChange={e => s('conducta', e.target.value)} placeholder="Plan de manejo, indicaciones terapéuticas..." />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Inp label="Incapacidad (días)" type="number" min="0" value={form.incapacidadDias} onChange={e => s('incapacidadDias', e.target.value)} placeholder="0" />
                    <div className="sm:col-span-2">
                      <Inp label="Procedimientos a Realizar" value={form.procedimientosPlan} onChange={e => s('procedimientosPlan', e.target.value)} placeholder="Código CUPS..." />
                    </div>
                  </div>
                  <Ta label="Seguimiento" rows={2} value={form.seguimiento} onChange={e => s('seguimiento', e.target.value)} placeholder="Control en X días/semanas..." />
                </SecCard>

                {/* 11 */}
                <SecCard id="recomendaciones" num={11} title="Recomendaciones Médicas" emoji="📝" done={done['recomendaciones']}>
                  <Ta label="Recomendaciones al Paciente" rows={7} value={form.recomendacionesMed} onChange={e => s('recomendacionesMed', e.target.value)} placeholder="Indicaciones de cuidado, actividad física, señales de alarma..." />
                </SecCard>

                {/* 12 */}
                <SecCard id="apoyos-diag" num={12} title="Solicitud Apoyos Diagnósticos" emoji="🧪" done={form.apoyosDiag.length > 0}>
                  <div className="space-y-2">
                    {form.apoyosDiag.map(item => (
                      <RowCard key={item.id}>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select value={item.tipo} onChange={e => s('apoyosDiag', form.apoyosDiag.map(x => x.id===item.id?{...x,tipo:e.target.value}:x))} className={ic}>
                            <option value="LAB">Laboratorio</option>
                            <option value="IMAGEN">Imagen Diagnóstica</option>
                            <option value="ESPECIALIZADA">Ayuda Especializada</option>
                          </select>
                          <div className="sm:col-span-2">
                            <input className={ic} value={item.descripcion} onChange={e => s('apoyosDiag', form.apoyosDiag.map(x => x.id===item.id?{...x,descripcion:e.target.value}:x))} placeholder="Descripción..." />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                            <input type="checkbox" className="accent-red-500" checked={item.urgente} onChange={e => s('apoyosDiag', form.apoyosDiag.map(x => x.id===item.id?{...x,urgente:e.target.checked}:x))} /> Urgente
                          </label>
                          <button type="button" onClick={() => s('apoyosDiag', form.apoyosDiag.filter(x => x.id!==item.id))} className="text-gray-600 hover:text-red-400"><Trash2 size={13} /></button>
                        </div>
                      </RowCard>
                    ))}
                    <button type="button" onClick={() => s('apoyosDiag', [...form.apoyosDiag, {id:uid(),tipo:'LAB',descripcion:'',urgente:false}])}
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 border border-dashed border-blue-500/30 rounded-xl w-full justify-center">
                      <Plus size={12} /> Agregar apoyo diagnóstico
                    </button>
                  </div>
                </SecCard>

                {/* 13 */}
                <SecCard id="proc-qx" num={13} title="Solicitud Procedimientos Quirúrgicos" emoji="🏥" done={form.procedimientosQx.length > 0}>
                  <div className="space-y-2">
                    {form.procedimientosQx.map(item => (
                      <RowCard key={item.id}>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input className={ic} value={item.codigoCups} onChange={e => s('procedimientosQx', form.procedimientosQx.map(x => x.id===item.id?{...x,codigoCups:e.target.value}:x))} placeholder="Código CUPS" />
                          <input className={ic} value={item.nombre} onChange={e => s('procedimientosQx', form.procedimientosQx.map(x => x.id===item.id?{...x,nombre:e.target.value}:x))} placeholder="Nombre procedimiento..." />
                          <select value={item.prioridad} onChange={e => s('procedimientosQx', form.procedimientosQx.map(x => x.id===item.id?{...x,prioridad:e.target.value}:x))} className={ic}>
                            <option value="ELECTIVA">Electiva</option><option value="PREFERENTE">Preferente</option><option value="URGENTE">Urgente</option>
                          </select>
                          <input className={ic} value={item.anestesia} onChange={e => s('procedimientosQx', form.procedimientosQx.map(x => x.id===item.id?{...x,anestesia:e.target.value}:x))} placeholder="Tipo anestesia..." />
                          <div className="col-span-2"><input className={ic} value={item.observaciones} onChange={e => s('procedimientosQx', form.procedimientosQx.map(x => x.id===item.id?{...x,observaciones:e.target.value}:x))} placeholder="Observaciones..." /></div>
                        </div>
                        <button type="button" onClick={() => s('procedimientosQx', form.procedimientosQx.filter(x => x.id!==item.id))} className="text-gray-600 hover:text-red-400 shrink-0 mt-1"><Trash2 size={13} /></button>
                      </RowCard>
                    ))}
                    <button type="button" onClick={() => s('procedimientosQx', [...form.procedimientosQx, {id:uid(),codigoCups:'',nombre:'',prioridad:'ELECTIVA',anestesia:'',observaciones:''}])}
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 border border-dashed border-blue-500/30 rounded-xl w-full justify-center">
                      <Plus size={12} /> Agregar procedimiento
                    </button>
                  </div>
                </SecCard>

                {/* 14 */}
                <SecCard id="medicamentos" num={14} title="Formulación Medicamentos" emoji="💊" done={form.medicamentos.length > 0}>
                  <div className="space-y-2">
                    {form.medicamentos.map(item => (
                      <RowCard key={item.id}>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="col-span-2 sm:col-span-3"><input className={ic} value={item.nombre} onChange={e => s('medicamentos', form.medicamentos.map(x => x.id===item.id?{...x,nombre:e.target.value}:x))} placeholder="Medicamento (nombre genérico)..." /></div>
                          <input className={ic} value={item.dosis} onChange={e => s('medicamentos', form.medicamentos.map(x => x.id===item.id?{...x,dosis:e.target.value}:x))} placeholder="Dosis" />
                          <input className={ic} value={item.frecuencia} onChange={e => s('medicamentos', form.medicamentos.map(x => x.id===item.id?{...x,frecuencia:e.target.value}:x))} placeholder="Frecuencia" />
                          <input className={ic} value={item.duracion} onChange={e => s('medicamentos', form.medicamentos.map(x => x.id===item.id?{...x,duracion:e.target.value}:x))} placeholder="Duración" />
                          <input className={ic} value={item.via} onChange={e => s('medicamentos', form.medicamentos.map(x => x.id===item.id?{...x,via:e.target.value}:x))} placeholder="Vía" />
                          <div className="col-span-2"><input className={ic} value={item.observaciones} onChange={e => s('medicamentos', form.medicamentos.map(x => x.id===item.id?{...x,observaciones:e.target.value}:x))} placeholder="Observaciones..." /></div>
                        </div>
                        <button type="button" onClick={() => s('medicamentos', form.medicamentos.filter(x => x.id!==item.id))} className="text-gray-600 hover:text-red-400 shrink-0 mt-1"><Trash2 size={13} /></button>
                      </RowCard>
                    ))}
                    <button type="button" onClick={() => s('medicamentos', [...form.medicamentos, {id:uid(),nombre:'',dosis:'',frecuencia:'',duracion:'',via:'',observaciones:''}])}
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 border border-dashed border-blue-500/30 rounded-xl w-full justify-center">
                      <Plus size={12} /> Agregar medicamento
                    </button>
                  </div>
                </SecCard>

                {/* 15 */}
                <SecCard id="interconsulta" num={15} title="Solicitud de Interconsulta" emoji="👨‍⚕️" done={form.interconsultas.length > 0}>
                  <div className="space-y-2">
                    {form.interconsultas.map(item => (
                      <RowCard key={item.id}>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input className={ic} value={item.especialidad} onChange={e => s('interconsultas', form.interconsultas.map(x => x.id===item.id?{...x,especialidad:e.target.value}:x))} placeholder="Especialidad destino..." />
                          <select value={item.prioridad} onChange={e => s('interconsultas', form.interconsultas.map(x => x.id===item.id?{...x,prioridad:e.target.value}:x))} className={ic}>
                            <option value="URGENTE">Urgente</option><option value="PREFERENTE">Preferente</option><option value="PROGRAMADA">Programada</option>
                          </select>
                          <input className={ic} value={item.motivo} onChange={e => s('interconsultas', form.interconsultas.map(x => x.id===item.id?{...x,motivo:e.target.value}:x))} placeholder="Motivo..." />
                          <input className={ic} value={item.observaciones} onChange={e => s('interconsultas', form.interconsultas.map(x => x.id===item.id?{...x,observaciones:e.target.value}:x))} placeholder="Observaciones..." />
                        </div>
                        <button type="button" onClick={() => s('interconsultas', form.interconsultas.filter(x => x.id!==item.id))} className="text-gray-600 hover:text-red-400 shrink-0 mt-1"><Trash2 size={13} /></button>
                      </RowCard>
                    ))}
                    <button type="button" onClick={() => s('interconsultas', [...form.interconsultas, {id:uid(),especialidad:'',prioridad:'PROGRAMADA',motivo:'',observaciones:''}])}
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 border border-dashed border-blue-500/30 rounded-xl w-full justify-center">
                      <Plus size={12} /> Agregar interconsulta
                    </button>
                  </div>
                </SecCard>

              </div>
            </div>{/* fin panel derecho */}

          </div>{/* fin flex paneles */}
        </form>
      )}{/* fin showForm */}

      {/* ══ MODO LISTA ══ */}
      {!showForm && (
        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Historias Recientes</h2>
          {loading && !historias.length && <div className="text-gray-600 text-sm py-4">Cargando...</div>}
          {!loading && !historias.length && (
            <div className="text-center py-12 text-gray-700">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">Sin historias clínicas registradas</p>
            </div>
          )}
          <div className="space-y-2">
            {historias.map((h: any) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between hover:border-yellow-500/20 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold shrink-0">HC</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{h.paciente?.nombreCompleto || 'Paciente'}</p>
                    <p className="text-gray-600 text-xs">{h.tipoHistoria} · {(h.contenido as any)?.tipoConsulta || h.tipoConsulta} · {new Date(h.fechaCreacion || h.createdAt).toLocaleDateString('es-CO',{year:'numeric',month:'short',day:'numeric'})}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${h.entregadoEn?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                  {h.entregadoEn ? 'Entregada' : 'Pendiente'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
