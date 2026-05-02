import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createHistoriaClinica, getAllPacientes, getHistoriasMedico } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
interface FormHC {
  pacienteId: string;
  tipoHistoria: string;
  tipoConsulta: string;
  // Anamnesis
  quejaPrincipal: string;
  historiaEnfermedad: string;
  // Antecedentes (Res. 1995/1999)
  antecedentesFamiliares: string;
  antecedentesPersonales: string;
  antecedentesQuirurgicos: string;
  medicamentosActuales: string;
  alergias: string;
  habitosToxicos: string;
  // Revision por sistemas
  revisionSistemas: string;
  // Examen fisico
  examenFisico: string;
  // Signos vitales
  presionArterial: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  temperatura: string;
  peso: string;
  talla: string;
  imc: string;
  // Evaluacion estetica
  procedimientoPropuesto: string;
  zonasIntervencion: string;
  observacionesAntropometricas: string;
  // Diagnostico y plan
  diagnostico: string;
  tratamientoRecomendado: string;
  planQuirurgico: string;
  // Consentimiento y otros
  riesgosInformados: string;
  observaciones: string;
}

const FORM_INICIAL: FormHC = {
  pacienteId: '', tipoHistoria: 'ANAMNESIS', tipoConsulta: 'INICIAL',
  quejaPrincipal: '', historiaEnfermedad: '',
  antecedentesFamiliares: '', antecedentesPersonales: '', antecedentesQuirurgicos: '',
  medicamentosActuales: '', alergias: '', habitosToxicos: '',
  revisionSistemas: '', examenFisico: '',
  presionArterial: '', frecuenciaCardiaca: '', frecuenciaRespiratoria: '',
  temperatura: '', peso: '', talla: '', imc: '',
  procedimientoPropuesto: '', zonasIntervencion: '', observacionesAntropometricas: '',
  diagnostico: '', tratamientoRecomendado: '', planQuirurgico: '',
  riesgosInformados: '', observaciones: '',
};

const SECCIONES = ['Datos Generales', 'Anamnesis', 'Antecedentes', 'Examen Fisico', 'Evaluacion Estetica', 'Diagnostico y Plan'];

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/60 focus:bg-white/[0.07] transition-all resize-none';
const labelCls = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1';

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HistoriaClinicaPage({
  onNavegar,
  showFormExternal,
  onShowFormChange,
  seccionExterna,
  onSeccionChange,
  onRegisterCampos,
}: {
  onNavegar?: (pagina: string) => void;
  showFormExternal?: boolean;
  onShowFormChange?: (v: boolean) => void;
  seccionExterna?: number;
  onSeccionChange?: (n: number) => void;
  onRegisterCampos?: (fn: ((c: Record<string, string>) => void) | null) => void;
} = {}) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [historias, setHistorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Estado inicializado desde props externas (SARAI global) para evitar parpadeo
  const [showForm, setShowFormState] = useState(showFormExternal ?? false);
  const [seccionActiva, setSeccionActivaState] = useState(seccionExterna ?? 0);
  const [guardado, setGuardado] = useState(false);
  const [form, setForm] = useState<FormHC>(FORM_INICIAL);

  // Wrappers que sincronizan estado local ↔ App.tsx
  const setShowForm = (v: boolean) => { setShowFormState(v); onShowFormChange?.(v); };
  const setSeccionActiva = (n: number) => { setSeccionActivaState(n); onSeccionChange?.(n); };
  const token = localStorage.getItem('accessToken') || '';

  const set = (campo: keyof FormHC, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  // IMC auto
  useEffect(() => {
    const p = parseFloat(form.peso);
    const t = parseFloat(form.talla) / 100;
    if (p > 0 && t > 0) set('imc', (p / (t * t)).toFixed(1));
  }, [form.peso, form.talla]);

  useEffect(() => {
    getAllPacientes(1, 100, token).then((r) => {
      if (r.data) setPacientes((r.data as any).pacientes || []);
    });
    cargarHistorias();
  }, []);

  // Sincronizar showForm desde SARAI global (App.tsx)
  useEffect(() => {
    if (showFormExternal !== undefined) setShowFormState(showFormExternal);
  }, [showFormExternal]);

  // Sincronizar sección activa desde SARAI global (App.tsx)
  useEffect(() => {
    if (seccionExterna !== undefined) setSeccionActivaState(seccionExterna);
  }, [seccionExterna]);

  const cargarHistorias = async () => {
    setLoading(true);
    const r = await getHistoriasMedico(1, 20, token);
    if (r.data) setHistorias((r.data as any).historias || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      pacienteId: form.pacienteId,
      tipoHistoria: form.tipoHistoria,
      tipoConsulta: form.tipoConsulta,
      quejaPrincipal: form.quejaPrincipal,
      historiaEnfermedad: form.historiaEnfermedad,
      observacionesAntropometricas: form.observacionesAntropometricas,
      diagnostico: form.diagnostico,
      tratamientoRecomendado: form.tratamientoRecomendado,
      // Campos extendidos en JSON
      datosExtendidos: {
        antecedentesFamiliares: form.antecedentesFamiliares,
        antecedentesPersonales: form.antecedentesPersonales,
        antecedentesQuirurgicos: form.antecedentesQuirurgicos,
        medicamentosActuales: form.medicamentosActuales,
        alergias: form.alergias,
        habitosToxicos: form.habitosToxicos,
        revisionSistemas: form.revisionSistemas,
        examenFisico: form.examenFisico,
        signosVitales: {
          presionArterial: form.presionArterial,
          frecuenciaCardiaca: form.frecuenciaCardiaca,
          frecuenciaRespiratoria: form.frecuenciaRespiratoria,
          temperatura: form.temperatura,
          peso: form.peso,
          talla: form.talla,
          imc: form.imc,
        },
        procedimientoPropuesto: form.procedimientoPropuesto,
        zonasIntervencion: form.zonasIntervencion,
        planQuirurgico: form.planQuirurgico,
        riesgosInformados: form.riesgosInformados,
        observaciones: form.observaciones,
      },
    };

    const r = await createHistoriaClinica(payload, token);
    if (!r.error) {
      setGuardado(true);
      setForm(FORM_INICIAL);
      setSeccionActiva(0);
      cargarHistorias();
      setTimeout(() => { setGuardado(false); setShowForm(false); }, 2500);
    }
    setLoading(false);
  };

  // SARAI completa campos automaticamente
  const handleCamposSarai = (campos: Record<string, string>) => {
    setForm((prev) => {
      const nuevo = { ...prev };
      const mapa: Record<string, keyof FormHC> = {
        quejaPrincipal:          'quejaPrincipal',
        historiaEnfermedad:      'historiaEnfermedad',
        antecedentesFamiliares:  'antecedentesFamiliares',
        antecedentesPersonales:  'antecedentesPersonales',
        antecedentesQuirurgicos: 'antecedentesQuirurgicos',
        antecedentesEsteticos:   'antecedentesQuirurgicos', // mapea al mismo campo por ahora
        medicamentosActuales:    'medicamentosActuales',
        alergias:                'alergias',
        habitosToxicos:          'habitosToxicos',
        revisionSistemas:        'revisionSistemas',
        examenFisico:            'examenFisico',
        presionArterial:         'presionArterial',
        frecuenciaCardiaca:      'frecuenciaCardiaca',
        frecuenciaRespiratoria:  'frecuenciaRespiratoria',
        temperatura:             'temperatura',
        peso:                    'peso',
        talla:                   'talla',
        diagnostico:             'diagnostico',
        planTratamiento:         'tratamientoRecomendado',
        procedimientoPropuesto:  'procedimientoPropuesto',
        recomendaciones:         'observaciones',
        observaciones:           'observaciones',
        consentimientoExplicacion: 'observaciones', // mapea a observaciones hasta que exista campo propio
      };
      Object.entries(campos).forEach(([k, v]) => {
        if (mapa[k] && v) (nuevo as any)[mapa[k]] = v;
      });
      // Signos vitales si vienen en objeto
      if ((campos as any).signosVitales) {
        const sv = (campos as any).signosVitales;
        if (sv.presionArterial)       nuevo.presionArterial = sv.presionArterial;
        if (sv.frecuenciaCardiaca)    nuevo.frecuenciaCardiaca = sv.frecuenciaCardiaca;
        if (sv.frecuenciaRespiratoria) nuevo.frecuenciaRespiratoria = sv.frecuenciaRespiratoria;
        if (sv.temperatura)           nuevo.temperatura = sv.temperatura;
        if (sv.peso)                  nuevo.peso = sv.peso;
        if (sv.talla)                 nuevo.talla = sv.talla;
      }
      return nuevo;
    });
  };

  const progreso = SECCIONES.length;

  // Registrar manejador de campos con SARAI global en App.tsx
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onRegisterCampos?.(handleCamposSarai);
    return () => onRegisterCampos?.(null);
  }, []);
  const completadas = [
    !!(form.pacienteId && form.tipoConsulta),
    !!(form.quejaPrincipal && form.historiaEnfermedad),
    !!(form.antecedentesPersonales || form.antecedentesFamiliares),
    !!(form.examenFisico || form.presionArterial),
    !!(form.procedimientoPropuesto || form.observacionesAntropometricas),
    !!(form.diagnostico && form.tratamientoRecomendado),
  ];
  const porcentaje = Math.round((completadas.filter(Boolean).length / progreso) * 100);

  return (
    <div className="min-h-screen bg-[#080a0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Historia <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Clinica</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">Res. 1995/1999 • Norma tecnica colombiana • {historias.length} registros</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSeccionActiva(0); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              showForm
                ? 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-500/20'
            }`}
          >
            {showForm ? 'Cancelar' : '+ Nueva Historia'}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mb-8"
            >
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* ── Columna lateral: SARAI + navegacion ── */}
                  <div className="xl:col-span-1 space-y-4">

                    {/* Progreso */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Completado</span>
                        <span className="text-yellow-400 font-bold text-sm">{porcentaje}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 mb-4">
                        <motion.div
                          animate={{ width: `${porcentaje}%` }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                        />
                      </div>
                      <nav className="space-y-1">
                        {SECCIONES.map((s, i) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setSeccionActiva(i)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                              seccionActiva === i
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                              completadas[i]
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                                : seccionActiva === i
                                ? 'border-yellow-500 text-yellow-400'
                                : 'border-white/20 text-gray-700'
                            }`}>
                              {completadas[i] ? '✓' : i + 1}
                            </span>
                            {s}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Acciones */}
                    <div className="space-y-2">
                      <button
                        type="submit"
                        disabled={loading || !form.pacienteId || !form.quejaPrincipal}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
                      >
                        {loading ? 'Guardando...' : guardado ? '✓ Guardada' : 'Guardar Historia'}
                      </button>
                      {seccionActiva < SECCIONES.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setSeccionActiva(seccionActiva + 1)}
                          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          Siguiente seccion
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Columna principal: formulario ── */}
                  <div className="xl:col-span-3 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-xs font-bold">
                        {seccionActiva + 1}
                      </span>
                      {SECCIONES[seccionActiva]}
                    </h3>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={seccionActiva}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* ── Seccion 0: Datos Generales ── */}
                        {seccionActiva === 0 && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Campo label="Paciente *">
                                <select
                                  value={form.pacienteId}
                                  onChange={(e) => set('pacienteId', e.target.value)}
                                  required
                                  className={inputCls}
                                >
                                  <option value="">Seleccionar paciente...</option>
                                  {pacientes.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nombreCompleto} — {p.numeroDocumento}
                                    </option>
                                  ))}
                                </select>
                              </Campo>
                              <Campo label="Tipo de Consulta *">
                                <select value={form.tipoConsulta} onChange={(e) => set('tipoConsulta', e.target.value)} className={inputCls}>
                                  <option value="INICIAL">Consulta Inicial</option>
                                  <option value="SEGUIMIENTO">Seguimiento</option>
                                  <option value="CONTROL">Control Post-Operatorio</option>
                                  <option value="URGENCIA">Urgencia</option>
                                  <option value="VALORACION">Valoracion Pre-Quirurgica</option>
                                </select>
                              </Campo>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Campo label="Tipo de Historia">
                                <select value={form.tipoHistoria} onChange={(e) => set('tipoHistoria', e.target.value)} className={inputCls}>
                                  <option value="ANAMNESIS">Anamnesis</option>
                                  <option value="EXAMEN_FISICO">Examen Fisico</option>
                                  <option value="DIAGNOSTICO">Diagnostico</option>
                                  <option value="PLAN">Plan Quirurgico</option>
                                  <option value="SEGUIMIENTO">Seguimiento Post-Op</option>
                                  <option value="EVOLUCION">Evolucion</option>
                                </select>
                              </Campo>
                            </div>
                          </>
                        )}

                        {/* ── Seccion 1: Anamnesis ── */}
                        {seccionActiva === 1 && (
                          <>
                            <Campo label="Motivo de Consulta / Queja Principal *">
                              <textarea rows={2} value={form.quejaPrincipal} onChange={(e) => set('quejaPrincipal', e.target.value)} required placeholder="Describa el motivo principal por el que consulta el paciente..." className={inputCls} />
                            </Campo>
                            <Campo label="Historia de la Enfermedad Actual">
                              <textarea rows={5} value={form.historiaEnfermedad} onChange={(e) => set('historiaEnfermedad', e.target.value)} placeholder="Descripcion cronologica de la enfermedad o situacion actual, tiempo de evolucion, sintomas asociados..." className={inputCls} />
                            </Campo>
                          </>
                        )}

                        {/* ── Seccion 2: Antecedentes ── */}
                        {seccionActiva === 2 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Campo label="Antecedentes Familiares">
                              <textarea rows={3} value={form.antecedentesFamiliares} onChange={(e) => set('antecedentesFamiliares', e.target.value)} placeholder="Enfermedades hereditarias, familiares de primer grado..." className={inputCls} />
                            </Campo>
                            <Campo label="Antecedentes Personales Patologicos">
                              <textarea rows={3} value={form.antecedentesPersonales} onChange={(e) => set('antecedentesPersonales', e.target.value)} placeholder="Enfermedades cronicas, hospitalizaciones previas..." className={inputCls} />
                            </Campo>
                            <Campo label="Antecedentes Quirurgicos">
                              <textarea rows={3} value={form.antecedentesQuirurgicos} onChange={(e) => set('antecedentesQuirurgicos', e.target.value)} placeholder="Cirugias previas, fecha aproximada, complicaciones..." className={inputCls} />
                            </Campo>
                            <Campo label="Medicamentos Actuales">
                              <textarea rows={3} value={form.medicamentosActuales} onChange={(e) => set('medicamentosActuales', e.target.value)} placeholder="Nombre del medicamento, dosis, frecuencia..." className={inputCls} />
                            </Campo>
                            <Campo label="Alergias Conocidas">
                              <textarea rows={2} value={form.alergias} onChange={(e) => set('alergias', e.target.value)} placeholder="Alergias a medicamentos, alimentos, latex..." className={inputCls} />
                            </Campo>
                            <Campo label="Habitos Toxicos">
                              <textarea rows={2} value={form.habitosToxicos} onChange={(e) => set('habitosToxicos', e.target.value)} placeholder="Tabaco, alcohol, sustancias psicoactivas..." className={inputCls} />
                            </Campo>
                            <div className="md:col-span-2">
                              <Campo label="Revision por Sistemas">
                                <textarea rows={4} value={form.revisionSistemas} onChange={(e) => set('revisionSistemas', e.target.value)} placeholder="Cardiovascular, respiratorio, digestivo, neurologico, endocrino, musculoesqueletico, dermato..." className={inputCls} />
                              </Campo>
                            </div>
                          </div>
                        )}

                        {/* ── Seccion 3: Examen Fisico ── */}
                        {seccionActiva === 3 && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Campo label="Presion Arterial (mmHg)">
                                <input type="text" value={form.presionArterial} onChange={(e) => set('presionArterial', e.target.value)} placeholder="120/80" className={inputCls} />
                              </Campo>
                              <Campo label="Frec. Cardiaca (lpm)">
                                <input type="number" value={form.frecuenciaCardiaca} onChange={(e) => set('frecuenciaCardiaca', e.target.value)} placeholder="72" className={inputCls} />
                              </Campo>
                              <Campo label="Frec. Respiratoria (rpm)">
                                <input type="number" value={form.frecuenciaRespiratoria} onChange={(e) => set('frecuenciaRespiratoria', e.target.value)} placeholder="16" className={inputCls} />
                              </Campo>
                              <Campo label="Temperatura (C)">
                                <input type="number" step="0.1" value={form.temperatura} onChange={(e) => set('temperatura', e.target.value)} placeholder="36.5" className={inputCls} />
                              </Campo>
                              <Campo label="Peso (kg)">
                                <input type="number" step="0.1" value={form.peso} onChange={(e) => set('peso', e.target.value)} placeholder="65.0" className={inputCls} />
                              </Campo>
                              <Campo label="Talla (cm)">
                                <input type="number" value={form.talla} onChange={(e) => set('talla', e.target.value)} placeholder="165" className={inputCls} />
                              </Campo>
                              <Campo label="IMC (auto)">
                                <input readOnly value={form.imc} className={`${inputCls} opacity-60 cursor-not-allowed`} placeholder="---" />
                              </Campo>
                            </div>
                            <Campo label="Examen Fisico Detallado">
                              <textarea rows={6} value={form.examenFisico} onChange={(e) => set('examenFisico', e.target.value)} placeholder="Descripcion detallada del examen fisico por sistemas. Estado general, cabeza y cuello, torax, abdomen, extremidades, piel..." className={inputCls} />
                            </Campo>
                          </>
                        )}

                        {/* ── Seccion 4: Evaluacion Estetica ── */}
                        {seccionActiva === 4 && (
                          <>
                            <Campo label="Procedimiento Estetico Propuesto">
                              <input type="text" value={form.procedimientoPropuesto} onChange={(e) => set('procedimientoPropuesto', e.target.value)} placeholder="Ej: Rinoplastia abierta, Liposuccion abdominal..." className={inputCls} />
                            </Campo>
                            <Campo label="Zonas de Intervencion">
                              <textarea rows={2} value={form.zonasIntervencion} onChange={(e) => set('zonasIntervencion', e.target.value)} placeholder="Descripcion anatomica de las zonas a intervenir..." className={inputCls} />
                            </Campo>
                            <Campo label="Observaciones Antropometricas y Esteticas">
                              <textarea rows={5} value={form.observacionesAntropometricas} onChange={(e) => set('observacionesAntropometricas', e.target.value)} placeholder="Medidas, proporciones, asimetrias, ptosis, tono muscular, calidad de la piel, IMC relacion con procedimiento..." className={inputCls} />
                            </Campo>
                          </>
                        )}

                        {/* ── Seccion 5: Diagnostico y Plan ── */}
                        {seccionActiva === 5 && (
                          <>
                            <Campo label="Diagnostico (Impresion Diagnostica) *">
                              <textarea rows={3} value={form.diagnostico} onChange={(e) => set('diagnostico', e.target.value)} placeholder="Diagnostico principal y secundarios con codigo CIE-10 si aplica..." className={inputCls} />
                            </Campo>
                            <Campo label="Tratamiento y Conducta *">
                              <textarea rows={3} value={form.tratamientoRecomendado} onChange={(e) => set('tratamientoRecomendado', e.target.value)} placeholder="Plan de manejo, medicamentos formulados, indicaciones..." className={inputCls} />
                            </Campo>
                            <Campo label="Plan Quirurgico">
                              <textarea rows={3} value={form.planQuirurgico} onChange={(e) => set('planQuirurgico', e.target.value)} placeholder="Tecnica quirurgica, tipo de anestesia, duracion estimada, hospitalizacion..." className={inputCls} />
                            </Campo>
                            <Campo label="Riesgos Informados al Paciente">
                              <textarea rows={3} value={form.riesgosInformados} onChange={(e) => set('riesgosInformados', e.target.value)} placeholder="Riesgos generales y especificos informados..." className={inputCls} />
                            </Campo>
                            <Campo label="Observaciones Adicionales">
                              <textarea rows={2} value={form.observaciones} onChange={(e) => set('observaciones', e.target.value)} placeholder="Indicaciones para el paciente, proxima cita, examenes solicitados..." className={inputCls} />
                            </Campo>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lista de historias ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Historias Recientes</h2>
          {loading && !showForm && (
            <div className="text-center py-12 text-gray-700">Cargando...</div>
          )}
          {!loading && historias.length === 0 && (
            <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/5">
              <p className="text-gray-600 text-4xl mb-3">H</p>
              <p className="text-gray-500 font-semibold">Sin historias clinicas</p>
              <p className="text-gray-700 text-sm">Crea la primera con el boton de arriba o usa SARAI</p>
            </div>
          )}
          {historias.map((h: any) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between hover:border-yellow-500/20 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0">
                  HC
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{h.paciente?.nombreCompleto || 'Paciente'}</p>
                  <p className="text-gray-600 text-xs">{h.tipoHistoria} • {h.tipoConsulta || (h.contenido as any)?.tipoConsulta} • {new Date(h.createdAt).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                  h.entregada
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                }`}>
                  {h.entregada ? 'Entregada' : 'Pendiente'}
                </span>
                <p className="text-gray-700 text-xs truncate max-w-48 hidden md:block">
                  {(h.contenido as any)?.quejaPrincipal || ''}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}