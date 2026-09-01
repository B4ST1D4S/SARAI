import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Tipos locales ────────────────────────────────────────────── */
type ModalidadDP = 'CAPD' | 'APD' | 'CCPD' | 'IPD';
type FaseDP = 'INICIO' | 'ENTRENAMIENTO' | 'MANTENIMIENTO' | 'COMPLICACION' | 'SUSPENSION';

interface PacienteDP {
  id: string;
  nombre: string;
  cc: string;
  edad: number;
  fase: FaseDP;
  modalidad: ModalidadDP;
  fechaInicio: string;
  kt_v_sem: number;
  meta_ktv: number;
  peritonitis: number;
  estadoCateter: 'BIEN' | 'TUNEL' | 'INFECCION' | 'MIGRADO';
  alertas: string[];
}

interface SesionDP {
  fecha: string;
  modalidad: ModalidadDP;
  volumen_instilacion: number;  // mL
  num_intercambios: number;
  glucosa_dializado: '1.5%' | '2.5%' | '4.25%';
  uf_total: number;   // mL
  peso_pre: number;   // kg
  peso_post: number;  // kg
  pa_pre: string;
  pa_post: string;
  aspecto_liquido: 'CLARO' | 'TURBIO' | 'HEMORRAGICO' | 'FIBROSO';
  kt_v: number;
  creatinina_dializado: number; // mg/dL
  glucosa_dializado_val: number;
  observaciones: string;
}

/* ─── Datos de demostración ─────────────────────────────────────── */
const PACIENTES_DEMO: PacienteDP[] = [
  {
    id: '1',
    nombre: 'María Elena Rodríguez',
    cc: '45678901',
    edad: 62,
    fase: 'MANTENIMIENTO',
    modalidad: 'CAPD',
    fechaInicio: '2024-03-15',
    kt_v_sem: 1.85,
    meta_ktv: 1.7,
    peritonitis: 0,
    estadoCateter: 'BIEN',
    alertas: [],
  },
];

/* ─── Constantes clínicas ─────────────────────────────────────── */
const MODALIDADES: Record<ModalidadDP, { nombre: string; descripcion: string; icono: string }> = {
  CAPD: { nombre: 'DPCA', descripcion: 'Diálisis Peritoneal Continua Ambulatoria — 3-5 intercambios/día manual', icono: '🏠' },
  APD:  { nombre: 'DPA',  descripcion: 'Diálisis Peritoneal Automatizada — cicladora nocturna', icono: '🤖' },
  CCPD: { nombre: 'DPCC', descripcion: 'Diálisis Peritoneal Continua con Cicladora', icono: '⚙️' },
  IPD:  { nombre: 'DPI',  descripcion: 'Diálisis Peritoneal Intermitente — hospitalaria', icono: '🏥' },
};

const FASES_DP: Record<FaseDP, { color: string; label: string }> = {
  INICIO:       { color: '#3b82f6', label: 'Inicio' },
  ENTRENAMIENTO:{ color: '#f59e0b', label: 'Entrenamiento' },
  MANTENIMIENTO:{ color: '#10b981', label: 'Mantenimiento' },
  COMPLICACION: { color: '#ef4444', label: 'Complicación' },
  SUSPENSION:   { color: '#6b7280', label: 'Suspensión' },
};

const CATETER_COLOR: Record<string, string> = {
  BIEN:     '#10b981',
  TUNEL:    '#f59e0b',
  INFECCION:'#ef4444',
  MIGRADO:  '#a855f7',
};

/* ─── Formulario de sesión DP ────────────────────────────────── */
const FORM_VACIO: SesionDP = {
  fecha: new Date().toISOString().slice(0, 16),
  modalidad: 'CAPD',
  volumen_instilacion: 2000,
  num_intercambios: 4,
  glucosa_dializado: '1.5%',
  uf_total: 0,
  peso_pre: 0,
  peso_post: 0,
  pa_pre: '',
  pa_post: '',
  aspecto_liquido: 'CLARO',
  kt_v: 0,
  creatinina_dializado: 0,
  glucosa_dializado_val: 0,
  observaciones: '',
};

function colorKtV(v: number) {
  if (v >= 1.7) return '#10b981';
  if (v >= 1.4) return '#f59e0b';
  return '#ef4444';
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export function DialisisPeritonealPage() {
  const [tab, setTab] = useState<'pacientes' | 'nueva-sesion' | 'entrenamiento' | 'complicaciones' | 'indicadores'>('pacientes');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteDP | null>(null);
  const [mostrarFormSesion, setMostrarFormSesion] = useState(false);
  const [mostrarInscripcion, setMostrarInscripcion] = useState(false);
  const [form, setForm] = useState<SesionDP>(FORM_VACIO);
  const [paso, setPaso] = useState(1);

  const f = (campo: keyof SesionDP, valor: string | number) =>
    setForm(prev => ({ ...prev, [campo]: valor }));

  /* ── KtV Peritoneal estimado ─────────────────────────────── */
  const ktVEstimado = form.creatinina_dializado > 0 && form.volumen_instilacion > 0
    ? ((form.creatinina_dializado * form.volumen_instilacion * form.num_intercambios) / 1000 / 70).toFixed(2)
    : '—';

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: 'var(--bg-primary, #0a0f1a)' }}>

      {/* HEADER ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">💧</span>
            Diálisis Peritoneal
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Programa Renal · CAPD / APD · Res. 3241/2008 – Guías ISPD 2022
          </p>
        </div>
        <button
          onClick={() => setMostrarInscripcion(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#4fc3f7,#0284c7)' }}
        >
          + Inscribir Paciente DP
        </button>
      </div>

      {/* KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes DP', valor: PACIENTES_DEMO.length, icon: '👥', meta: null },
          { label: 'CAPD (manual)', valor: PACIENTES_DEMO.filter(p => p.modalidad === 'CAPD').length, icon: '🏠', meta: null },
          { label: 'APD (cicladora)', valor: PACIENTES_DEMO.filter(p => p.modalidad === 'APD').length, icon: '🤖', meta: null },
          { label: 'Kt/V Promedio sem.', valor: PACIENTES_DEMO.length ? (PACIENTES_DEMO.reduce((a, p) => a + p.kt_v_sem, 0) / PACIENTES_DEMO.length).toFixed(2) : '—', icon: '📊', meta: '≥ 1.7' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{kpi.icon}</span>
              {kpi.meta && <span className="text-white/30 text-xs">Meta {kpi.meta}</span>}
            </div>
            <p className="text-2xl font-bold text-white">{kpi.valor}</p>
            <p className="text-white/40 text-xs">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* TABS ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {([
          { id: 'pacientes',       label: '👥 Pacientes' },
          { id: 'nueva-sesion',    label: '📝 Registrar Sesión' },
          { id: 'entrenamiento',   label: '📚 Entrenamiento' },
          { id: 'complicaciones',  label: '⚠️ Complicaciones' },
          { id: 'indicadores',     label: '📊 Indicadores' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              tab === t.id
                ? 'text-white border-b-2 font-semibold'
                : 'text-white/40 hover:text-white/70'
            }`}
            style={tab === t.id ? { borderColor: '#4fc3f7' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── TAB: PACIENTES ─────────────────────────────────── */}
        {tab === 'pacientes' && (
          <motion.div key="pacientes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {PACIENTES_DEMO.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">💧</p>
                <p className="text-white/40 text-lg">Sin pacientes en Diálisis Peritoneal</p>
                <p className="text-white/25 text-sm mt-2">Usa "+ Inscribir Paciente DP" para agregar el primero</p>
              </div>
            ) : (
              <div className="space-y-3">
                {PACIENTES_DEMO.map(p => (
                  <motion.div
                    key={p.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => { setPacienteSeleccionado(p); setTab('nueva-sesion'); }}
                    className="rounded-xl p-4 border border-white/10 cursor-pointer flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,#4fc3f7,#0284c7)' }}>
                        {p.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{p.nombre}</p>
                        <p className="text-white/40 text-xs">CC {p.cc} · {p.edad} años · Inicio {p.fechaInicio}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-white/40 text-xs">{MODALIDADES[p.modalidad].nombre}</p>
                        <p className="text-white font-semibold">{MODALIDADES[p.modalidad].icono}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-xs">Kt/V sem.</p>
                        <p className="font-bold text-lg" style={{ color: colorKtV(p.kt_v_sem) }}>{p.kt_v_sem}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-xs">Catéter</p>
                        <span className="text-xs px-2 py-1 rounded-full font-semibold"
                          style={{ background: CATETER_COLOR[p.estadoCateter] + '30', color: CATETER_COLOR[p.estadoCateter] }}>
                          {p.estadoCateter}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{
                          background: FASES_DP[p.fase].color + '25',
                          color: FASES_DP[p.fase].color,
                        }}>
                        {FASES_DP[p.fase].label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: REGISTRAR SESIÓN ──────────────────────────── */}
        {tab === 'nueva-sesion' && (
          <motion.div key="sesion" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Selector de paciente */}
            {!pacienteSeleccionado && (
              <div className="rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10 mb-4">
                <p className="text-yellow-400 text-sm">⚠️ Selecciona un paciente desde la pestaña <strong>Pacientes</strong> para registrar una sesión.</p>
              </div>
            )}

            {pacienteSeleccionado && (
              <div className="rounded-xl p-3 border border-cyan-500/30 bg-cyan-500/10 mb-4 flex items-center gap-3">
                <span className="text-cyan-400 text-xl">💧</span>
                <div>
                  <p className="text-white font-semibold">{pacienteSeleccionado.nombre}</p>
                  <p className="text-white/40 text-xs">CC {pacienteSeleccionado.cc} · {MODALIDADES[pacienteSeleccionado.modalidad].nombre}</p>
                </div>
                <button onClick={() => setPacienteSeleccionado(null)} className="ml-auto text-white/30 hover:text-white text-xs">✕ Cambiar</button>
              </div>
            )}

            {/* Pasos del formulario */}
            <div className="flex items-center gap-2 mb-6">
              {['Datos Generales', 'Intercambios', 'Líquido Efluente', 'Kt/V y Laboratorios', 'Guardar'].map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <button
                    onClick={() => setPaso(i + 1)}
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      paso === i + 1 ? 'text-white scale-110' : paso > i + 1 ? 'text-white/70' : 'text-white/30'
                    }`}
                    style={{ background: paso >= i + 1 ? '#4fc3f7' : 'rgba(255,255,255,0.1)' }}
                  >
                    {paso > i + 1 ? '✓' : i + 1}
                  </button>
                  <span className={`text-xs hidden md:inline ${paso === i + 1 ? 'text-white' : 'text-white/30'}`}>{s}</span>
                  {i < 4 && <span className="text-white/20 text-xs">›</span>}
                </div>
              ))}
            </div>

            <div className="rounded-xl p-5 border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.04)' }}>

              {/* PASO 1: Datos generales */}
              {paso === 1 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">📋 Datos Generales de la Sesión</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Fecha y Hora</label>
                      <input type="datetime-local" value={form.fecha} onChange={e => f('fecha', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Modalidad</label>
                      <select value={form.modalidad} onChange={e => f('modalidad', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                        {Object.entries(MODALIDADES).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: '#1a2035' }}>{v.nombre} — {k}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Peso Pre-diálisis (kg)</label>
                      <input type="number" step="0.1" value={form.peso_pre || ''} onChange={e => f('peso_pre', +e.target.value)}
                        placeholder="ej: 68.5" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Peso Post-diálisis (kg)</label>
                      <input type="number" step="0.1" value={form.peso_post || ''} onChange={e => f('peso_post', +e.target.value)}
                        placeholder="ej: 67.8" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">PA Pre (mmHg)</label>
                      <input type="text" value={form.pa_pre} onChange={e => f('pa_pre', e.target.value)}
                        placeholder="120/80" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">PA Post (mmHg)</label>
                      <input type="text" value={form.pa_post} onChange={e => f('pa_post', e.target.value)}
                        placeholder="118/76" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                  {/* UF calculada automáticamente */}
                  {form.peso_pre > 0 && form.peso_post > 0 && (
                    <div className="rounded-lg p-3 border border-cyan-500/30 bg-cyan-500/10">
                      <p className="text-cyan-400 text-sm">
                        💧 Ultrafiltración calculada: <strong>{((form.peso_pre - form.peso_post) * 1000).toFixed(0)} mL</strong>
                        {(form.peso_pre - form.peso_post) < 0 && <span className="text-yellow-400 ml-2">⚠️ Peso post mayor que pre</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 2: Intercambios */}
              {paso === 2 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">🔄 Intercambios Peritoneales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Número de intercambios</label>
                      <input type="number" min={1} max={12} value={form.num_intercambios} onChange={e => f('num_intercambios', +e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                      <p className="text-white/30 text-xs mt-1">CAPD: 3-5 · APD: 5-10 nocturnos</p>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Volumen instilación por intercambio (mL)</label>
                      <select value={form.volumen_instilacion} onChange={e => f('volumen_instilacion', +e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                        {[1000, 1500, 2000, 2500, 3000].map(v => (
                          <option key={v} value={v} style={{ background: '#1a2035' }}>{v} mL</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Concentración glucosa dializado</label>
                      <select value={form.glucosa_dializado} onChange={e => f('glucosa_dializado', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                        <option value="1.5%" style={{ background: '#1a2035' }}>1.5% — Baja osmolaridad (estándar)</option>
                        <option value="2.5%" style={{ background: '#1a2035' }}>2.5% — Osmolaridad media</option>
                        <option value="4.25%" style={{ background: '#1a2035' }}>4.25% — Alta osmolaridad (UF aumentada)</option>
                      </select>
                      {form.glucosa_dializado === '4.25%' && (
                        <p className="text-yellow-400 text-xs mt-1">⚠️ Usar solo cuando sea necesaria mayor UF — riesgo de membrana</p>
                      )}
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Tiempo de permanencia (horas)</label>
                      <input type="number" step="0.5" min={1} max={16} defaultValue={4}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                      <p className="text-white/30 text-xs mt-1">CAPD: 4-6h · APD: 1.5-2h</p>
                    </div>
                  </div>
                  {/* Resumen volumen total */}
                  <div className="rounded-lg p-3 border border-cyan-500/30 bg-cyan-500/10">
                    <p className="text-cyan-400 text-sm">
                      💧 Volumen total instilado: <strong>{(form.volumen_instilacion * form.num_intercambios / 1000).toFixed(1)} L</strong>
                      {' '}({form.num_intercambios} intercambios × {form.volumen_instilacion} mL)
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 3: Líquido efluente */}
              {paso === 3 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">🔬 Características del Líquido Efluente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Aspecto del líquido</label>
                      <select value={form.aspecto_liquido} onChange={e => f('aspecto_liquido', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                        <option value="CLARO" style={{ background: '#1a2035' }}>✅ Claro — Normal</option>
                        <option value="TURBIO" style={{ background: '#1a2035' }}>⚠️ Turbio — Posible peritonitis</option>
                        <option value="HEMORRAGICO" style={{ background: '#1a2035' }}>🔴 Hemorrágico — Requiere evaluación</option>
                        <option value="FIBROSO" style={{ background: '#1a2035' }}>🟡 Fibroso — Coágulos / fibrina</option>
                      </select>
                      {form.aspecto_liquido === 'TURBIO' && (
                        <div className="mt-2 p-2 rounded-lg border border-red-500/40 bg-red-500/10">
                          <p className="text-red-400 text-xs font-semibold">🚨 ALERTA PERITONITIS</p>
                          <p className="text-red-300 text-xs mt-1">Líquido turbio: solicitar citología de efluente (leucocitos {'>'} 100/µL = peritonitis). Notificar nefrólogo. Guías ISPD 2022.</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">UF total sesión (mL)</label>
                      <input type="number" step="50" value={form.uf_total || ''} onChange={e => f('uf_total', +e.target.value)}
                        placeholder="ej: 1200" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Creatinina en dializado (mg/dL)</label>
                      <input type="number" step="0.1" value={form.creatinina_dializado || ''} onChange={e => f('creatinina_dializado', +e.target.value)}
                        placeholder="ej: 4.5" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Glucosa en efluente (mg/dL)</label>
                      <input type="number" step="1" value={form.glucosa_dializado_val || ''} onChange={e => f('glucosa_dializado_val', +e.target.value)}
                        placeholder="ej: 250" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                  {/* Alerta falla de membrana */}
                  {form.uf_total < 400 && form.uf_total > 0 && (
                    <div className="rounded-lg p-3 border border-orange-500/30 bg-orange-500/10">
                      <p className="text-orange-400 text-sm">⚠️ UF {'<'} 400 mL — Evaluar falla de ultrafiltración (Test PET recomendado). Guías ISPD 2022.</p>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 4: Kt/V */}
              {paso === 4 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">📊 Adecuación — Kt/V Peritoneal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Kt/V semanal medido</label>
                      <input type="number" step="0.01" value={form.kt_v || ''} onChange={e => f('kt_v', +e.target.value)}
                        placeholder="ej: 1.85" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div className="rounded-lg p-4 border border-white/10 flex flex-col justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-white/40 text-xs mb-1">Kt/V estimado (peritoneal)</p>
                      <p className="text-2xl font-bold" style={{ color: colorKtV(+(ktVEstimado as string) || 0) }}>
                        {ktVEstimado}
                      </p>
                      <p className="text-white/30 text-xs">Meta ISPD: ≥ 1.7 sem. total</p>
                    </div>
                  </div>

                  {/* Tabla de metas */}
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'rgba(79,195,247,0.15)' }}>
                          <th className="text-white/70 text-left px-4 py-3">Indicador</th>
                          <th className="text-white/70 text-center px-4 py-3">Meta ISPD 2022</th>
                          <th className="text-white/70 text-center px-4 py-3">Normativa CAC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { ind: 'Kt/V semanal total', ispd: '≥ 1.7', cac: '≥ 1.7' },
                          { ind: 'Aclaramiento creatinina', ispd: '≥ 45 L/sem/1.73m²', cac: '≥ 45 L/sem' },
                          { ind: 'Ultrafiltración mínima', ispd: '≥ 1000 mL/día', cac: 'Registro obligatorio' },
                          { ind: 'Control PA', ispd: '< 130/80 mmHg', cac: '< 130/80 mmHg' },
                          { ind: 'Tasa peritonitis', ispd: '< 0.5 episodios/año', cac: 'Trazabilidad obligatoria' },
                        ].map(row => (
                          <tr key={row.ind} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="text-white/80 px-4 py-3">{row.ind}</td>
                            <td className="text-cyan-400 text-center px-4 py-3">{row.ispd}</td>
                            <td className="text-green-400 text-center px-4 py-3">{row.cac}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <label className="text-white/60 text-xs block mb-1">Observaciones clínicas</label>
                    <textarea rows={3} value={form.observaciones} onChange={e => f('observaciones', e.target.value)}
                      placeholder="Tolerancia al procedimiento, eventualidades, indicaciones médicas..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                  </div>
                </div>
              )}

              {/* PASO 5: Confirmación */}
              {paso === 5 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">✅ Confirmar y Guardar</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Fecha', form.fecha],
                      ['Modalidad', form.modalidad],
                      ['Intercambios', `${form.num_intercambios} × ${form.volumen_instilacion} mL`],
                      ['Glucosa dializado', form.glucosa_dializado],
                      ['Peso pre/post', `${form.peso_pre} / ${form.peso_post} kg`],
                      ['PA pre', form.pa_pre || '—'],
                      ['Aspecto líquido', form.aspecto_liquido],
                      ['UF total', `${form.uf_total} mL`],
                      ['Kt/V', form.kt_v || '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/40">{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-3 rounded-xl text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#4fc3f7,#0284c7)' }}
                    onClick={() => {
                      alert('✅ Sesión de Diálisis Peritoneal guardada exitosamente\n\nEsta funcionalidad se conectará a la base de datos en la siguiente fase del desarrollo.');
                      setForm(FORM_VACIO);
                      setPaso(1);
                      setTab('pacientes');
                    }}
                  >
                    💾 Guardar Sesión DP
                  </button>
                </div>
              )}
            </div>

            {/* Navegación entre pasos */}
            <div className="flex justify-between mt-4">
              <button onClick={() => setPaso(p => Math.max(1, p - 1))} disabled={paso === 1}
                className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 disabled:opacity-30 hover:bg-white/10">
                ← Anterior
              </button>
              <button onClick={() => setPaso(p => Math.min(5, p + 1))} disabled={paso === 5}
                className="px-4 py-2 rounded-lg text-sm text-white font-semibold disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg,#4fc3f7,#0284c7)' }}>
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── TAB: ENTRENAMIENTO ─────────────────────────────── */}
        {tab === 'entrenamiento' && (
          <motion.div key="entreno" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <h2 className="text-white font-semibold text-lg">📚 Protocolo de Entrenamiento DP</h2>
            <p className="text-white/40 text-sm">Entrenamiento estandarizado — Guías ISPD 2022 · Duración: 5-7 días</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { dia: 'Día 1', titulo: 'Conocimiento de la técnica', items: ['Anatomía del peritoneo', 'Principios de DP', 'Tipos de soluciones', 'Equipo y materiales'] },
                { dia: 'Día 2', titulo: 'Asepsia y antisepsia', items: ['Lavado de manos correcto (6 pasos OMS)', 'Uso del cubrebocas', 'Preparación del área de trabajo', 'Manejo estéril del catéter'] },
                { dia: 'Día 3', titulo: 'Procedimiento CAPD', items: ['Conexión y desconexión', 'Identificación de turbidez', 'Registro de UF y aspecto', 'Qué hacer ante complicaciones'] },
                { dia: 'Día 4', titulo: 'Cuidado del catéter', items: ['Curación del sitio de salida', 'Signos de infección', 'Fijación correcta', 'Restricciones de actividad'] },
                { dia: 'Día 5', titulo: 'Evaluación práctica', items: ['Demostración sin guía del profesional', 'Identificación de errores', 'Corrección supervisada', 'Certificación de competencia'] },
              ].map(fase => (
                <div key={fase.dia} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: '#4fc3f730', color: '#4fc3f7' }}>{fase.dia}</span>
                    <p className="text-white font-semibold">{fase.titulo}</p>
                  </div>
                  <ul className="space-y-1">
                    {fase.items.map(item => (
                      <li key={item} className="text-white/50 text-sm flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">›</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TAB: COMPLICACIONES ────────────────────────────── */}
        {tab === 'complicaciones' && (
          <motion.div key="complic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <h2 className="text-white font-semibold text-lg">⚠️ Complicaciones y Alertas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { tipo: '🦠 Peritonitis', color: '#ef4444', criterios: ['Líquido turbio', 'Dolor abdominal', 'Fiebre > 38°C', 'Leucocitos efluente > 100/µL'], manejo: 'Antibióticos IP empíricos (Vancomicina + Ceftazidima) — ISPD 2022' },
                { tipo: '🔴 Infección sitio salida', color: '#f59e0b', criterios: ['Eritema periostial', 'Secreción purulenta', 'Dolor en túnel', 'Cultivo positivo'], manejo: 'Antibióticos orales/IP según cultivo. Curación diaria.' },
                { tipo: '💧 Falla UF', color: '#a855f7', criterios: ['UF < 400 mL en 4h con 2L glucosa 4.25%', 'Ganancia de peso progresiva', 'Edema creciente'], manejo: 'Test PET. Cambio de modalidad o frecuencia. Evaluar transferencia a HD.' },
                { tipo: '🔄 Migración catéter', color: '#3b82f6', criterios: ['Drenaje lento', 'Dolor al infundir', 'Eco/placa: catéter fuera de pelvis'], manejo: 'Laxantes, movilización. Reposicionamiento laparoscópico si persiste.' },
              ].map(c => (
                <div key={c.tipo} className="rounded-xl p-4 border" style={{ background: c.color + '12', borderColor: c.color + '40' }}>
                  <p className="font-bold mb-2" style={{ color: c.color }}>{c.tipo}</p>
                  <p className="text-white/50 text-xs font-semibold mb-1">Criterios diagnósticos:</p>
                  <ul className="space-y-1 mb-3">
                    {c.criterios.map(cr => <li key={cr} className="text-white/60 text-xs flex gap-2"><span style={{ color: c.color }}>›</span>{cr}</li>)}
                  </ul>
                  <p className="text-white/40 text-xs font-semibold">Manejo:</p>
                  <p className="text-white/70 text-xs mt-1">{c.manejo}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TAB: INDICADORES ───────────────────────────────── */}
        {tab === 'indicadores' && (
          <motion.div key="indicadores" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <h2 className="text-white font-semibold text-lg">📊 Indicadores CAC — Diálisis Peritoneal</h2>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(79,195,247,0.12)' }}>
                    <th className="text-white/60 text-left px-4 py-3">Indicador</th>
                    <th className="text-white/60 text-center px-4 py-3">Meta</th>
                    <th className="text-white/60 text-center px-4 py-3">Actual</th>
                    <th className="text-white/60 text-center px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ind: 'Kt/V ≥ 1.7 semanal', meta: '≥ 80% pacientes', actual: '—', ok: null },
                    { ind: 'Tasa peritonitis', meta: '< 0.5/año', actual: '0', ok: true },
                    { ind: 'Adecuación DP trimestral', meta: '100% medición', actual: '—', ok: null },
                    { ind: 'Pacientes en entrenamiento', meta: 'Registro 100%', actual: '0', ok: null },
                    { ind: 'Control PA < 130/80', meta: '≥ 70%', actual: '—', ok: null },
                    { ind: 'Hemoglobina 10-12 g/dL', meta: '≥ 70%', actual: '—', ok: null },
                    { ind: 'Hospitalización por peritonitis', meta: '< 10%', actual: '0%', ok: true },
                  ].map(row => (
                    <tr key={row.ind} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="text-white/80 px-4 py-3">{row.ind}</td>
                      <td className="text-cyan-400 text-center px-4 py-3">{row.meta}</td>
                      <td className="text-white text-center px-4 py-3 font-semibold">{row.actual}</td>
                      <td className="text-center px-4 py-3">
                        {row.ok === null ? <span className="text-white/30 text-xs">Sin datos</span>
                          : row.ok ? <span className="text-green-400 text-xs font-bold">✅ OK</span>
                          : <span className="text-red-400 text-xs font-bold">⚠️ Alerta</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Inscripción rápida ─────────────────────────── */}
      <AnimatePresence>
        {mostrarInscripcion && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="rounded-2xl p-6 w-full max-w-md border border-white/20"
              style={{ background: '#0d1526' }}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <h3 className="text-white font-bold text-lg mb-4">💧 Inscribir Paciente — Diálisis Peritoneal</h3>
              <p className="text-white/40 text-sm mb-4">
                La inscripción completa (búsqueda de paciente SARAI + datos clínicos) se conectará a la base de datos en la siguiente fase. El flujo es idéntico al de Hemodiálisis.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-white/60 text-xs block mb-1">Buscar paciente (CC o nombre)</label>
                  <input placeholder="Ej: 12345678 o García" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Modalidad inicial</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="CAPD" style={{ background: '#1a2035' }}>DPCA — Manual ambulatoria</option>
                    <option value="APD" style={{ background: '#1a2035' }}>DPA — Automatizada (cicladora)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setMostrarInscripcion(false)}
                  className="flex-1 py-2 rounded-lg text-white/60 border border-white/20 text-sm hover:bg-white/10">
                  Cancelar
                </button>
                <button onClick={() => setMostrarInscripcion(false)}
                  className="flex-1 py-2 rounded-xl text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#4fc3f7,#0284c7)' }}>
                  Continuar →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
