import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Target, Zap, Phone, Mail, MessageCircle,
  Plus, Search, Filter, MoreVertical, Edit3, Trash2, X, Check,
  ChevronRight, Clock, Star, Flame, Snowflake, ArrowRight,
  BarChart2, Calendar, DollarSign, Activity, RefreshCw,
  AlertCircle, CheckCircle2, UserPlus, GripVertical,
  FileText, Stethoscope, ChevronLeft,
} from 'lucide-react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { apiCall } from '../services/api';
import AgendarCitaWizard from '../components/AgendarCitaWizard';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Etapa =
  | 'NUEVO_LEAD'
  | 'CONTACTADO'
  | 'COTIZACION_ENVIADA'
  | 'EN_NEGOCIACION'
  | 'AGENDADO'
  | 'CONVERTIDO'
  | 'PERDIDO'
  | 'INACTIVO';

type Calificacion = 'HOT' | 'WARM' | 'COLD';

interface CrmLead {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  procedimientos: string[];
  etapa: Etapa;
  calificacion: Calificacion;
  valorEstimado: number;
  origen?: string;
  notas?: string;
  observaciones?: string;
  tags: string[];
  pacienteId?: string;
  proximoContacto?: string;
  ultimaInteraccion?: string;
  createdAt: string;
  updatedAt: string;
  paciente?: { id: string; nombreCompleto: string };
}

interface Stats {
  totalLeads: number;
  leadsEstesMes: number;
  convertidos: number;
  perdidos: number;
  tasaConversion: number;
  valorPipeline: number;
  seguimientosHoy: number;
  porEtapa: { etapa: string; _count: { id: number }; _sum: { valorEstimado: number | null } }[];
  porCalificacion: { calificacion: string; _count: { id: number } }[];
}

// Para el panel de detalle del prospecto
interface CotizacionResumen {
  id: string;
  descripcionServicio: string;
  total: number;
  estado: string; // PENDIENTE | ACEPTADA | RECHAZADA
  creadoEn: string;
  vigenciaHasta?: string;
  lineas: { descripcion: string; cantidad: number; valorUnitario: number }[];
}

interface CitaResumen {
  id: string;
  fechaHora: string;
  tipoCita: string;
  estado: string; // PENDIENTE | CONFIRMADA | COMPLETADA | CANCELADA
  observaciones?: string;
}

// ─────────────────────────────────────────────
// CONFIG ETAPAS
// ─────────────────────────────────────────────
const ETAPAS: {
  id: Etapa; label: string; desc: string; emoji: string;
  color: string; bg: string; border: string;
}[] = [
  { id: 'NUEVO_LEAD',         label: 'Nuevo Prospecto', desc: 'Persona interesada, aún sin contactar',             emoji: '🟡', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30' },
  { id: 'CONTACTADO',         label: 'Contactado',      desc: 'Ya se habló con el prospecto',                       emoji: '🔵', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  { id: 'COTIZACION_ENVIADA', label: 'Cotización',      desc: 'Se envió cotización con precios y procedimientos',   emoji: '🟣', color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  { id: 'EN_NEGOCIACION',     label: 'Negociación',     desc: 'Revisando precios, condiciones o financiación',      emoji: '🟠', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  { id: 'AGENDADO',           label: 'Cita Agendada',   desc: 'Tiene cita confirmada en la clínica',                emoji: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'CONVERTIDO',         label: 'Paciente',        desc: 'Se convirtió en paciente — cotización aceptada',     emoji: '✅', color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30' },
  { id: 'PERDIDO',            label: 'No Interesado',   desc: 'Descartó el procedimiento o eligió otra clínica',    emoji: '🔴', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
  { id: 'INACTIVO',           label: 'Inactivo',        desc: 'Sin respuesta — puede reactivarse más adelante',     emoji: '⚫', color: 'text-gray-500',    bg: 'bg-gray-500/10',    border: 'border-gray-500/30' },
];

const ESTADO_COTIZACION: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  ACEPTADA:   { label: 'Aceptada',   color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  RECHAZADA:  { label: 'Rechazada',  color: 'text-red-400',     bg: 'bg-red-500/15' },
};

const ESTADO_CITA: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:   { label: 'Pendiente',    color: 'text-yellow-400',  bg: 'bg-yellow-500/15' },
  CONFIRMADA:  { label: 'Confirmada',   color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  COMPLETADA:  { label: 'Completada',   color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  CANCELADA:   { label: 'Cancelada',    color: 'text-red-400',     bg: 'bg-red-500/15' },
  ADMITIDO:    { label: 'En consulta',  color: 'text-purple-400',  bg: 'bg-purple-500/15' },
};

const CALIFICACIONES: {
  id: Calificacion; label: string; desc: string; icon: any; color: string; bg: string;
}[] = [
  { id: 'HOT',  label: 'Caliente', desc: 'Listo para agendar',    icon: Flame,     color: 'text-red-400',    bg: 'bg-red-500/20' },
  { id: 'WARM', label: 'Tibio',    desc: 'Interesado, evaluando', icon: Star,      color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'COLD', label: 'Frío',     desc: 'Poco interés aún',      icon: Snowflake, color: 'text-blue-400',   bg: 'bg-blue-500/20' },
];

const ORIGENES = [
  'WHATSAPP', 'REFERIDO', 'INSTAGRAM', 'TIKTOK', 'FACEBOOK',
  'WEB', 'TELEFONO', 'PRESENCIAL', 'EMAIL', 'OTRO',
];
const PROCEDIMIENTOS_COMUNES = [
  'Liposucción', 'Aumento Mamario', 'Rinoplastia', 'Abdominoplastia',
  'Lifting Facial', 'Bichectomía', 'Blefaroplastia', 'Otoplastia',
  'Botox / Toxina Botulínica', 'Rellenos de Ácido Hialurónico',
  'Peeling Químico', 'Mesoterapia Capilar',
  'Lifting de Glúteos', 'Mentoplastia', 'Cirugía Post-bariátrica',
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
/** Formato moneda COP — $18,5M | $850K | $320.000 */
const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n.toLocaleString('es-CO')}`;

/** Días hasta fecha. Negativo = vencido */
const diffDays = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
};

const getEtapa = (id: Etapa) => ETAPAS.find(e => e.id === id) ?? ETAPAS[0];
const getCal   = (id: Calificacion) => CALIFICACIONES.find(c => c.id === id) ?? CALIFICACIONES[2];

/** Formatea fecha a dd/mm/aaaa en español */
const fmtFecha = (str?: string) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Enlace WhatsApp con prefijo +57 Colombia */
const waLink = (tel?: string) => {
  if (!tel) return '#';
  const digits = tel.replace(/\D/g, '');
  const num = digits.startsWith('57') ? digits : `57${digits}`;
  return `https://wa.me/${num}`;
};

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/5 ${bg} p-4 flex flex-col gap-2`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} bg-white/5`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────
function CalBadge({ cal }: { cal: Calificacion }) {
  const c = getCal(cal);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.color}`}>
      <c.icon size={9} />{c.label}
    </span>
  );
}

function EtapaBadge({ etapa }: { etapa: Etapa }) {
  const e = getEtapa(etapa);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${e.bg} ${e.color} ${e.border} border`}>
      {e.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// LEAD FORM MODAL
// ─────────────────────────────────────────────
const EMPTY: any = {
  nombre: '', telefono: '', email: '', procedimientos: [],
  etapa: 'NUEVO_LEAD', calificacion: 'COLD',
  valorEstimado: '', origen: '', notas: '', tags: [], proximoContacto: '',
};

function LeadModal({
  lead, onClose, onSave,
}: {
  lead: CrmLead | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState<any>(() =>
    lead
      ? {
          nombre: lead.nombre,
          telefono: lead.telefono ?? '',
          email: lead.email ?? '',
          procedimientos: lead.procedimientos,
          etapa: lead.etapa,
          calificacion: lead.calificacion,
          valorEstimado: String(lead.valorEstimado),
          origen: lead.origen ?? '',
          notas: lead.notas ?? '',
          tags: lead.tags,
          proximoContacto: lead.proximoContacto
            ? new Date(lead.proximoContacto).toISOString().split('T')[0]
            : '',
        }
      : { ...EMPTY, procedimientos: [], tags: [] }
  );
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleProc = (p: string) =>
    set('procedimientos',
      form.procedimientos.includes(p)
        ? form.procedimientos.filter((x: string) => x !== p)
        : [...form.procedimientos, p]
    );

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { set('tags', [...form.tags, t]); setTagInput(''); }
  };

  const submit = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      valorEstimado: parseFloat(form.valorEstimado) || 0,
      proximoContacto: form.proximoContacto || undefined,
    });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1117] border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <UserPlus size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">{lead ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h2>
              <p className="text-[10px] text-gray-500">Posible paciente para la clínica</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Nombre completo *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="Ana García López"
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition placeholder-gray-600" />
          </div>

          {/* Tel + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Celular (Colombia)</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                placeholder="312 345 6789"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition placeholder-gray-600" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Correo electrónico</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="ana@gmail.com"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition placeholder-gray-600" />
            </div>
          </div>

          {/* Etapa + Cal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Etapa en el proceso</label>
              <select value={form.etapa} onChange={e => set('etapa', e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition">
                {ETAPAS.map(e => <option key={e.id} value={e.id} className="bg-[#0d1117]">{e.emoji} {e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Temperatura del prospecto</label>
              <div className="flex gap-1.5">
                {CALIFICACIONES.map(c => (
                  <button key={c.id} onClick={() => set('calificacion', c.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                      form.calificacion === c.id
                        ? `${c.bg} ${c.color} border-white/20`
                        : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
                    }`}>
                    <c.icon size={11} />{c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Valor + Origen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Valor estimado (COP)</label>
              <input type="number" value={form.valorEstimado} onChange={e => set('valorEstimado', e.target.value)}
                placeholder="8500000"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition placeholder-gray-600" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">¿Cómo nos conoció?</label>
              <select value={form.origen} onChange={e => set('origen', e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition">
                <option value="" className="bg-[#0d1117]">Seleccionar canal...</option>
                {ORIGENES.map(o => <option key={o} value={o} className="bg-[#0d1117]">{o.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Próximo contacto */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Próximo seguimiento</label>
            <input type="date" value={form.proximoContacto} onChange={e => set('proximoContacto', e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition" />
          </div>

          {/* Procedimientos */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Procedimientos de interés</label>
            <div className="flex flex-wrap gap-1.5">
              {PROCEDIMIENTOS_COMUNES.map(p => (
                <button key={p} onClick={() => toggleProc(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                    form.procedimientos.includes(p)
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300'
                  }`}>
                  {form.procedimientos.includes(p) ? '✓ ' : ''}{p}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Etiquetas internas</label>
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Ej: cirugía-doble, financiación..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2 text-sm text-white outline-none transition placeholder-gray-600" />
              <button onClick={addTag} className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t: string) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                  {t}
                  <button onClick={() => set('tags', form.tags.filter((x: string) => x !== t))} className="hover:text-red-400 transition">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Notas del asesor</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={3}
              placeholder="Contexto de la consulta, preferencias, observaciones..."
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-y transition placeholder-gray-600" />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button onClick={submit} disabled={saving || !form.nombre.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {lead ? 'Guardar cambios' : 'Crear prospecto'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// PANEL DE DETALLE DEL PROSPECTO (drawer derecho)
// ─────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onEdit, onMove, token }: {
  lead: CrmLead;
  onClose: () => void;
  onEdit: () => void;
  onMove: (e: Etapa) => void;
  token: string;
}) {
  const [cotizaciones, setCotizaciones] = useState<CotizacionResumen[]>([]);
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [tabActiva, setTabActiva] = useState<'info' | 'cotizaciones' | 'citas'>('info');
  const [showWizard, setShowWizard] = useState(false);

  const recargarCitas = () => {
    if (!lead.pacienteId) return;
    apiCall<{ citas: CitaResumen[] }>(`/citas/paciente/${lead.pacienteId}`, { token }).then(r => {
      const d = r.data as any;
      setCitas(Array.isArray(d) ? d : d?.citas ?? []);
    });
  };

  useEffect(() => {
    if (!lead.pacienteId) return;
    setLoadingData(true);
    Promise.all([
      apiCall<{ cotizaciones: CotizacionResumen[] }>(`/cotizaciones/paciente/${lead.pacienteId}`, { token }),
      apiCall<{ citas: CitaResumen[] }>(`/citas/paciente/${lead.pacienteId}`, { token }),
    ]).then(([cotRes, citRes]) => {
      const cotData = cotRes.data as any;
      const citData = citRes.data as any;
      setCotizaciones(Array.isArray(cotData) ? cotData : cotData?.cotizaciones ?? []);
      setCitas(Array.isArray(citData) ? citData : citData?.citas ?? []);
      setLoadingData(false);
    });
  }, [lead.pacienteId, token]);

  const days = diffDays(lead.proximoContacto);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-[#0d1117] border-l border-white/8 z-40 flex flex-col shadow-2xl shadow-black/50 overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-5 py-4 flex items-start justify-between gap-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition flex-shrink-0">
              <ChevronLeft size={14} className="text-gray-400" />
            </button>
            <h2 className="text-white font-bold text-sm truncate">{lead.nombre}</h2>
          </div>
          <div className="flex items-center gap-2 ml-8 flex-wrap">
            <EtapaBadge etapa={lead.etapa} />
            <CalBadge cal={lead.calificacion} />
            {lead.pacienteId && (
              <span className="text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Paciente registrado
              </span>
            )}
          </div>
        </div>
        <button onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-xs font-medium transition flex-shrink-0">
          <Edit3 size={11} /> Editar
        </button>
      </div>

      {/* Wizard Agendar Cita — se abre encima del panel */}
      <AnimatePresence>
        {showWizard && lead.pacienteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto"
          >
            <AgendarCitaWizard
              pacienteId={lead.pacienteId}
              pacienteNombre={lead.nombre}
              onClose={() => setShowWizard(false)}
              onSuccess={() => {
                setShowWizard(false);
                recargarCitas();
                setTabActiva('citas');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Valor + acciones rápidas */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Valor estimado</p>
          <p className="text-emerald-400 font-bold text-xl">
            {fmt(lead.valorEstimado)} <span className="text-xs text-gray-500 font-normal">COP</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          {lead.telefono && (
            <a href={`tel:${lead.telefono}`}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition" title="Llamar">
              <Phone size={13} className="text-gray-400" />
            </a>
          )}
          {lead.telefono && (
            <a href={waLink(lead.telefono)} target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center transition" title="WhatsApp (+57)">
              <MessageCircle size={13} className="text-emerald-400" />
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition" title="Enviar correo">
              <Mail size={13} className="text-gray-400" />
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 flex-shrink-0">
        {(['info', 'cotizaciones', 'citas'] as const).map(tab => {
          const labels: Record<string, string> = { info: 'Información', cotizaciones: 'Cotizaciones', citas: 'Citas' };
          const counts: Record<string, number> = { cotizaciones: cotizaciones.length, citas: citas.length };
          const disabled = tab !== 'info' && !lead.pacienteId;
          return (
            <button key={tab} onClick={() => !disabled && setTabActiva(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                tabActiva === tab ? 'text-white border-b-2 border-blue-500' : disabled ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {labels[tab]}
              {counts[tab] > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[9px] flex items-center justify-center">{counts[tab]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido del tab — scrollable */}
      <div className="flex-1 overflow-y-auto">

        {/* ── TAB: INFO ── */}
        {tabActiva === 'info' && (
          <div className="p-5 space-y-4">
            {/* Datos de contacto */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Datos de contacto</p>
              {lead.telefono && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300">{lead.telefono}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">{lead.email}</span>
                </div>
              )}
              {lead.origen && (
                <div className="flex items-center gap-2 text-sm">
                  <Zap size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Canal: <span className="text-gray-300">{lead.origen.replace(/_/g, ' ')}</span></span>
                </div>
              )}
            </div>

            {/* Alerta seguimiento */}
            {lead.proximoContacto && (
              <div className={`rounded-xl p-3 border ${
                days !== null && days < 0 ? 'bg-red-500/10 border-red-500/30'
                : days !== null && days <= 1 ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-white/3 border-white/8'
              }`}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Próximo seguimiento</p>
                <div className="flex items-center gap-2">
                  <Clock size={13} className={days !== null && days < 0 ? 'text-red-400' : days !== null && days <= 1 ? 'text-yellow-400' : 'text-gray-400'} />
                  <span className="text-sm text-white">{fmtFecha(lead.proximoContacto)}</span>
                  {days !== null && (
                    <span className={`text-xs ml-auto font-bold ${days < 0 ? 'text-red-400' : days === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {days < 0 ? `Vencido hace ${Math.abs(days)}d` : days === 0 ? '¡Hoy!' : `En ${days} día(s)`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Procedimientos */}
            {lead.procedimientos.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Procedimientos de interés</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.procedimientos.map(p => (
                    <span key={p} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20 flex items-center gap-1.5">
                      <Stethoscope size={9} />{p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cambiar etapa rápido */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Mover a otra etapa</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ETAPAS.filter(e => e.id !== lead.etapa).map(e => (
                  <button key={e.id} onClick={() => onMove(e.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition border ${e.bg} ${e.color} ${e.border} hover:opacity-80`}>
                    <span>{e.emoji}</span>{e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            {lead.notas && (
              <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Notas del asesor</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{lead.notas}</p>
              </div>
            )}

            {/* Tags */}
            {lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">{t}</span>
                ))}
              </div>
            )}

            {!lead.pacienteId && (
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
                <Users size={20} className="text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Este prospecto aún no es paciente registrado.</p>
                <p className="text-[10px] text-gray-600 mt-1">Cuando se convierta, aquí aparecerán sus citas y cotizaciones.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: COTIZACIONES ── */}
        {tabActiva === 'cotizaciones' && (
          <div className="p-5 space-y-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Cotizaciones enviadas al paciente</p>
            {loadingData ? (
              <div className="flex justify-center py-8"><RefreshCw size={18} className="text-blue-500 animate-spin" /></div>
            ) : cotizaciones.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <FileText size={28} className="text-gray-700" />
                <p className="text-sm text-gray-500">Sin cotizaciones registradas</p>
              </div>
            ) : cotizaciones.map(c => {
              const est = ESTADO_COTIZACION[c.estado] ?? { label: c.estado, color: 'text-gray-400', bg: 'bg-white/5' };
              return (
                <div key={c.id} className="bg-white/3 border border-white/8 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white font-medium leading-snug">{c.descripcionServicio || 'Cotización'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${est.bg} ${est.color}`}>{est.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold text-base">{fmt(c.total)} <span className="text-xs text-gray-500 font-normal">COP</span></span>
                    <span className="text-[10px] text-gray-500">{fmtFecha(c.creadoEn)}</span>
                  </div>
                  {c.vigenciaHasta && (
                    <p className="text-[10px] text-gray-600">Vigente hasta: {fmtFecha(c.vigenciaHasta)}</p>
                  )}
                  {c.lineas?.length > 0 && (
                    <div className="border-t border-white/5 pt-2 space-y-1">
                      {c.lineas.map((l, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 truncate flex-1 mr-2">{l.descripcion}</span>
                          <span className="text-gray-500 flex-shrink-0">{l.cantidad}× {fmt(l.valorUnitario)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: CITAS ── */}
        {tabActiva === 'citas' && (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Historial de citas en la clínica</p>
              {lead.pacienteId && (
                <button onClick={() => setShowWizard(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-lg text-[11px] font-medium transition">
                  <Plus size={10}/> Nueva cita
                </button>
              )}
            </div>
            {loadingData ? (
              <div className="flex justify-center py-8"><RefreshCw size={18} className="text-blue-500 animate-spin" /></div>
            ) : citas.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Calendar size={28} className="text-gray-700" />
                <p className="text-sm text-gray-500">Sin citas registradas</p>
                <button onClick={() => setShowWizard(true)}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-medium transition">
                  <Plus size={11}/> Crear primera cita
                </button>
              </div>
            ) : citas.map(c => {
              const est = ESTADO_CITA[c.estado] ?? { label: c.estado, color: 'text-gray-400', bg: 'bg-white/5' };
              return (
                <div key={c.id} className="bg-white/3 border border-white/8 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-white font-medium">
                        {new Date(c.fechaHora).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${est.bg} ${est.color}`}>{est.label}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-5">
                    <span className="text-xs text-gray-400">
                      {new Date(c.fechaHora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {c.tipoCita && (
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{c.tipoCita.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  {c.observaciones && (
                    <p className="text-[11px] text-gray-500 ml-5">{c.observaciones}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-5 py-3 flex-shrink-0">
        <p className="text-[10px] text-gray-600 text-center">
          Última interacción: {fmtFecha(lead.ultimaInteraccion)} · Creado: {fmtFecha(lead.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// LEAD CARD (pipeline) — soporta drag handle y click para detalle
// ─────────────────────────────────────────────
function LeadCard({
  lead, onEdit, onDelete, onMove, onSelect, dragHandleProps, isDragging,
}: {
  lead: CrmLead;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (e: Etapa) => void;
  onSelect?: () => void;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const days = diffDays(lead.proximoContacto);
  const isOverdue = days !== null && days < 0;
  const isUrgent  = days !== null && days <= 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      onClick={e => {
        if ((e.target as HTMLElement).closest('[data-no-select]')) return;
        onSelect?.();
      }}
      className={`bg-[#0d1117] border rounded-2xl p-3.5 hover:border-white/15 transition-all group relative cursor-pointer ${
        isDragging ? 'opacity-40' : ''
      } ${
        isOverdue ? 'border-red-500/30' : isUrgent ? 'border-yellow-500/30' : 'border-white/8'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        {/* Drag handle */}
        <div
          data-no-select
          {...dragHandleProps}
          className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-40 hover:!opacity-80 transition cursor-grab active:cursor-grabbing flex-shrink-0 mt-1 mr-1"
        >
          <GripVertical size={11} className="text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{lead.nombre}</p>
          {lead.telefono && (
            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1"><Phone size={9}/>{lead.telefono}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-2" data-no-select>
          <CalBadge cal={lead.calificacion} />
          <div className="relative">
            <button onClick={() => setMenu(p => !p)}
              className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <MoreVertical size={12} className="text-gray-400" />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-7 z-20 bg-[#161b22] border border-white/10 rounded-xl shadow-xl w-44 py-1"
                >
                  <button onClick={() => { onEdit(); setMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition">
                    <Edit3 size={11}/> Editar
                  </button>
                  {ETAPAS.filter(e => e.id !== lead.etapa).slice(0, 4).map(e => (
                    <button key={e.id} onClick={() => { onMove(e.id); setMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition">
                      <ArrowRight size={11}/> → {e.label}
                    </button>
                  ))}
                  <hr className="border-white/5 my-1"/>
                  <button onClick={() => { onDelete(); setMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 size={11}/> Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {lead.procedimientos.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.procedimientos.slice(0, 2).map(p => (
            <span key={p} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] rounded-md font-medium">{p}</span>
          ))}
          {lead.procedimientos.length > 2 && (
            <span className="px-1.5 py-0.5 bg-white/5 text-gray-500 text-[9px] rounded-md">+{lead.procedimientos.length - 2}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-emerald-400 font-bold text-sm">{fmt(lead.valorEstimado)}</span>
        <div className="flex items-center gap-1.5">
          {days !== null && (
            <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-gray-500'}`}>
              <Clock size={9}/>
              {isOverdue ? `Vencido ${Math.abs(days)}d` : days === 0 ? 'Hoy' : `${days}d`}
            </span>
          )}
          {lead.origen && (
            <span className="text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-md">
              {lead.origen.replace(/_/g,' ')}
            </span>
          )}
        </div>
      </div>

      {lead.tags.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {lead.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">{t}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// DRAGGABLE CARD WRAPPER
// ─────────────────────────────────────────────
function DraggableLeadCard({ lead, onEdit, onDelete, onMove, onSelect }: {
  lead: CrmLead;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (e: Etapa) => void;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { etapa: lead.etapa },
  });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
      <LeadCard
        lead={lead}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        onSelect={onSelect}
        dragHandleProps={{ ...listeners, ...attributes }}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// PIPELINE COLUMN CON DROP ZONE
// ─────────────────────────────────────────────
function PipelineCol({ etapa, leads, onEdit, onDelete, onMove, onSelect }: {
  etapa: typeof ETAPAS[0];
  leads: CrmLead[];
  onEdit: (l: CrmLead) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, e: Etapa) => void;
  onSelect: (l: CrmLead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const total = leads.reduce((s, l) => s + l.valorEstimado, 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[195px] max-w-[250px] rounded-2xl ${etapa.bg} ${etapa.border} border p-3 flex flex-col gap-2 transition-all ${
        isOver ? 'ring-2 ring-blue-400/40 shadow-lg shadow-blue-500/10 scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{etapa.emoji}</span>
          <div>
            <p className={`text-xs font-bold ${etapa.color}`}>{etapa.label}</p>
            <p className="text-[10px] text-gray-500">{fmt(total)} COP</p>
          </div>
        </div>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${etapa.bg} ${etapa.color} border ${etapa.border}`}>
          {leads.length}
        </span>
      </div>
      <div className={`flex flex-col gap-2 min-h-[80px] rounded-xl transition-all ${isOver ? 'bg-blue-500/5' : ''}`}>
        <AnimatePresence>
          {leads.map(l => (
            <DraggableLeadCard key={l.id} lead={l}
              onEdit={() => onEdit(l)}
              onDelete={() => onDelete(l.id)}
              onMove={e => onMove(l.id, e)}
              onSelect={() => onSelect(l)}
            />
          ))}
        </AnimatePresence>
        {leads.length === 0 && (
          <div className={`flex-1 flex items-center justify-center py-6 rounded-xl border-2 border-dashed transition-all ${
            isOver ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5'
          }`}>
            <p className="text-xs text-gray-600 italic">{isOver ? 'Soltar aquí' : 'Sin prospectos'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FUNNEL CHART
// ─────────────────────────────────────────────
function Funnel({ leads }: { leads: CrmLead[] }) {
  const active = ETAPAS.filter(e => !['PERDIDO','INACTIVO'].includes(e.id));
  const maxCount = Math.max(1, ...active.map(e => leads.filter(l => l.etapa === e.id).length));
  return (
    <div className="space-y-2">
      {active.map((e, i) => {
        const count = leads.filter(l => l.etapa === e.id).length;
        const valor = leads.filter(l => l.etapa === e.id).reduce((s, l) => s + l.valorEstimado, 0);
        const pct = Math.max(8, Math.round((count / maxCount) * 100));
        return (
          <div key={e.id} className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 w-24 text-right">{e.label}</span>
            <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={`h-full rounded-lg flex items-center px-2 ${e.bg} border ${e.border}`}
              >
                <span className={`text-[10px] font-bold ${e.color} whitespace-nowrap`}>
                  {count} · {fmt(valor)}
                </span>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
type View = 'pipeline' | 'lista' | 'dashboard';

export default function CRMPage({ onNavegar }: { onNavegar?: (page: string) => void }) {
  const token = localStorage.getItem('accessToken') ?? '';

  const [leads,   setLeads]   = useState<CrmLead[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<View>('pipeline');
  const [search,  setSearch]  = useState('');
  const [filterEtapa, setFilterEtapa] = useState<Etapa | 'TODOS'>('TODOS');
  const [filterCal,   setFilterCal]   = useState<Calificacion | 'TODOS'>('TODOS');
  const [modal,   setModal]   = useState(false);
  const [editLead, setEditLead] = useState<CrmLead | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing,  setSyncing]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  // Panel de detalle del prospecto
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Drag & Drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Load
  const loadAll = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (filterEtapa !== 'TODOS') p.set('etapa', filterEtapa);
    if (filterCal   !== 'TODOS') p.set('calificacion', filterCal);

    const [lRes, sRes] = await Promise.all([
      apiCall<{ leads: CrmLead[] }>(`/crm/leads?${p}`, { token }),
      apiCall<{ stats: Stats }>('/crm/stats', { token }),
    ]);
    if (lRes.data) setLeads(lRes.data.leads);
    if (sRes.data) setStats(sRes.data.stats);
    setLoading(false);
  }, [search, filterEtapa, filterCal, token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSave = async (data: any) => {
    if (editLead) {
      const r = await apiCall(`/crm/leads/${editLead.id}`, { method: 'PUT', body: data, token });
      if (r.data) { showToast('Prospecto actualizado ✓'); loadAll(); }
      else showToast(r.error ?? 'Error', false);
    } else {
      const r = await apiCall('/crm/leads', { method: 'POST', body: data, token });
      if (r.data) { showToast('Prospecto creado ✓'); loadAll(); }
      else showToast(r.error ?? 'Error', false);
    }
    setModal(false); setEditLead(null);
  };

  const handleMove = async (id: string, etapa: Etapa) => {
    // Actualización optimista: UI responde de inmediato
    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, etapa } : null);
    const r = await apiCall(`/crm/leads/${id}`, { method: 'PUT', body: { etapa }, token });
    if (r.data) showToast(`→ ${getEtapa(etapa).label} ✓`);
    else { showToast('Error al mover', false); loadAll(); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const r = await apiCall(`/crm/leads/${id}`, { method: 'DELETE', token });
    if (r.status < 300) {
      showToast('Prospecto eliminado');
      if (selectedLead?.id === id) setSelectedLead(null);
      loadAll();
    } else showToast('Error al eliminar', false);
    setDeleting(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    const r = await apiCall<{ created: number; skipped: number; message: string }>('/crm/sync', { method: 'POST', token });
    if (r.data) { showToast(r.data.message); loadAll(); }
    else showToast(r.error ?? 'Error al sincronizar', false);
    setSyncing(false);
  };

  const openCreate = () => { setEditLead(null); setModal(true); };
  const openEdit   = (l: CrmLead) => { setEditLead(l); setModal(true); setSelectedLead(null); };
  const byEtapa    = (e: Etapa) => leads.filter(l => l.etapa === e);

  // ── DnD handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setSelectedLead(null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const leadId = String(active.id);
    const targetEtapa = String(over.id) as Etapa;
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.etapa !== targetEtapa) handleMove(leadId, targetEtapa);
  };
  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium ${
              toast.ok
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}
          >
            {toast.ok ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal crear/editar */}
      <AnimatePresence>
        {modal && (
          <LeadModal
            lead={editLead}
            onClose={() => { setModal(false); setEditLead(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Panel detalle prospecto (drawer derecho) */}
      <AnimatePresence>
        {selectedLead && !modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
              onClick={() => setSelectedLead(null)}
            />
            <LeadDetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onEdit={() => openEdit(selectedLead)}
              onMove={e => handleMove(selectedLead.id, e)}
              token={token}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="border-b border-white/5 bg-[#0a0c12]/90 backdrop-blur-xl px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">CRM</h1>
              <p className="text-gray-500 text-xs">Prospectos · Cotizaciones · Conversión a pacientes</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View tabs */}
            <div className="flex bg-white/5 border border-white/8 rounded-xl p-0.5">
              {([
                ['pipeline', BarChart2, 'Pipeline'],
                ['lista',    Users,     'Lista'],
                ['dashboard',Activity, 'Dashboard'],
              ] as const).map(([v, Icon, lbl]) => (
                <button key={v} onClick={() => setView(v as View)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    view === v ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  <Icon size={13}/>{lbl}
                </button>
              ))}
            </div>

            <button onClick={loadAll}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 flex items-center justify-center transition">
              <RefreshCw size={13} className="text-gray-400"/>
            </button>

            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition disabled:opacity-50"
              title="Importar cotizaciones existentes como prospectos">
              {syncing ? <RefreshCw size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
              Sincronizar
            </button>

            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-500/20">
              <Plus size={15}/> Nuevo Prospecto
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="text-gray-500"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lead..."
              className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"/>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <Filter size={11} className="text-gray-600 mr-1"/>
            <button onClick={() => setFilterEtapa('TODOS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${filterEtapa === 'TODOS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              Todas
            </button>
            {ETAPAS.map(e => (
              <button key={e.id} onClick={() => setFilterEtapa(filterEtapa === e.id ? 'TODOS' : e.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  filterEtapa === e.id ? `${e.bg} ${e.color} border ${e.border}` : 'text-gray-500 hover:text-gray-300'
                }`}>
                {e.emoji} {e.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {CALIFICACIONES.map(c => (
              <button key={c.id} onClick={() => setFilterCal(filterCal === c.id ? 'TODOS' : c.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  filterCal === c.id ? `${c.bg} ${c.color}` : 'text-gray-500 hover:text-gray-300'
                }`}>
                <c.icon size={10}/>{c.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-600 ml-auto">{leads.length} prospectos</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="max-w-[1600px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={24} className="text-blue-500"/>
              </motion.div>
            </div>
          ) : (
            <>
              {/* ═══════════ DASHBOARD ═══════════ */}
              {view === 'dashboard' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <KpiCard label="Total Leads"    value={stats?.totalLeads ?? leads.length}  icon={Users}        color="text-blue-400"    bg="bg-blue-500/5"/>
                    <KpiCard label="Este Mes"       value={stats?.leadsEstesMes ?? 0}           icon={Calendar}     color="text-purple-400"  bg="bg-purple-500/5"/>
                    <KpiCard label="Convertidos"    value={stats?.convertidos ?? 0}             icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/5"/>
                    <KpiCard label="Conversión"     value={`${stats?.tasaConversion ?? 0}%`}    icon={TrendingUp}   color="text-green-400"   bg="bg-green-500/5"/>
                    <KpiCard label="Pipeline"       value={fmt(stats?.valorPipeline ?? 0)}      icon={DollarSign}   color="text-yellow-400"  bg="bg-yellow-500/5"/>
                    <KpiCard label="Seguim. Hoy"   value={stats?.seguimientosHoy ?? 0}         icon={Clock}        color="text-orange-400"  bg="bg-orange-500/5"/>
                    <KpiCard label="Perdidos"       value={stats?.perdidos ?? 0}                icon={AlertCircle}  color="text-red-400"     bg="bg-red-500/5"/>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Funnel */}
                    <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
                      <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <Target size={15} className="text-blue-400"/> Embudo de Conversión
                      </h3>
                      <Funnel leads={leads}/>
                    </div>

                    {/* Temperatura + campañas */}
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
                      <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <Flame size={15} className="text-red-400"/> Temperatura
                      </h3>
                      {CALIFICACIONES.map(c => {
                        const count = leads.filter(l => l.calificacion === c.id).length;
                        const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                        return (
                          <div key={c.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium flex items-center gap-1.5 ${c.color}`}><c.icon size={11}/>{c.label}</span>
                              <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${c.bg}`}/>
                            </div>
                          </div>
                        );
                      })}

                      <hr className="border-white/5"/>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Campañas</p>
                      {[
                        { label: '🎂 Cumpleaños', sub: 'Enviar oferta especial', col: 'text-pink-400' },
                        { label: '🔄 Retoques 6m+', sub: 'Reactivar post-op', col: 'text-blue-400' },
                        { label: '📢 Referidos', sub: 'Traer un amigo', col: 'text-purple-400' },
                      ].map(cam => (
                        <button key={cam.label}
                          className="w-full flex items-center justify-between p-2.5 bg-white/3 hover:bg-white/8 border border-white/5 rounded-xl transition group">
                          <div className="text-left">
                            <p className={`text-xs font-bold ${cam.col}`}>{cam.label}</p>
                            <p className="text-[10px] text-gray-600">{cam.sub}</p>
                          </div>
                          <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400 transition"/>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seguimientos urgentes */}
                  {(() => {
                    const urgentes = leads
                      .filter(l => {
                        const d = diffDays(l.proximoContacto);
                        return d !== null && d <= 2 && !['CONVERTIDO','PERDIDO','INACTIVO'].includes(l.etapa);
                      })
                      .sort((a, b) => (a.proximoContacto ?? '').localeCompare(b.proximoContacto ?? ''));
                    if (!urgentes.length) return null;
                    return (
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
                        <h3 className="text-orange-400 font-bold text-sm mb-3 flex items-center gap-2">
                          <Zap size={14}/> Seguimientos Urgentes ({urgentes.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {urgentes.map(l => {
                            const d = diffDays(l.proximoContacto);
                            return (
                              <div key={l.id} className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-semibold truncate">{l.nombre}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <EtapaBadge etapa={l.etapa}/>
                                    <span className={`text-[10px] ${d! < 0 ? 'text-red-400' : d === 0 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                      {d! < 0 ? `Vencido ${Math.abs(d!)}d` : d === 0 ? 'Hoy' : `En ${d}d`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  {l.telefono && (
                                    <a href={`https://wa.me/${l.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                                      className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center transition">
                                      <MessageCircle size={12} className="text-emerald-400"/>
                                    </a>
                                  )}
                                  <button onClick={() => openEdit(l)}
                                    className="w-7 h-7 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition">
                                    <Edit3 size={12} className="text-blue-400"/>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* ═══════════ PIPELINE ═══════════ */}
              {view === 'pipeline' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <KpiCard label="Pipeline COP"       value={fmt(leads.reduce((s,l) => s + l.valorEstimado, 0))} sub="Valor total potencial" icon={DollarSign}  color="text-yellow-400"  bg="bg-yellow-500/5"/>
                    <KpiCard label="Prospectos"          value={leads.length}                                        icon={Users}       color="text-blue-400"    bg="bg-blue-500/5"/>
                    <KpiCard label="Ya son Pacientes"   value={byEtapa('CONVERTIDO').length}                        icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/5"/>
                    <KpiCard label="Contactar Hoy"      value={stats?.seguimientosHoy ?? 0}                         icon={Clock}       color="text-orange-400"  bg="bg-orange-500/5"/>
                  </div>

                  <p className="text-[11px] text-gray-600 mb-3 flex items-center gap-1.5">
                    <GripVertical size={11}/> Arrastra las tarjetas entre columnas para cambiar la etapa del prospecto
                  </p>

                  <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex gap-3 overflow-x-auto pb-4">
                      {ETAPAS.map(e => (
                        <PipelineCol
                          key={e.id}
                          etapa={e}
                          leads={byEtapa(e.id)}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          onMove={handleMove}
                          onSelect={setSelectedLead}
                        />
                      ))}
                    </div>
                    <DragOverlay dropAnimation={null}>
                      {activeLead ? (
                        <div className="rotate-2 scale-105 opacity-95 pointer-events-none">
                          <LeadCard lead={activeLead} onEdit={() => {}} onDelete={() => {}} onMove={() => {}} />
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </motion.div>
              )}

              {/* ═══════════ LISTA ═══════════ */}
              {view === 'lista' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Users size={40} className="text-gray-700"/>
                      <p className="text-gray-500 text-sm">No hay prospectos. Crea el primero.</p>
                      <button onClick={openCreate}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition">
                        + Nuevo Prospecto
                      </button>
                    </div>
                  ) : (
                    leads.map(lead => {
                      const days = diffDays(lead.proximoContacto);
                      const isSelected = selectedLead?.id === lead.id;
                      return (
                        <motion.div key={lead.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedLead(isSelected ? null : lead)}
                          className={`border rounded-2xl px-5 py-3.5 flex items-center gap-4 transition group cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/8 border-blue-500/30'
                              : 'bg-white/3 border-white/8 hover:border-white/15'
                          }`}>
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            lead.calificacion === 'HOT' ? 'bg-red-400' : lead.calificacion === 'WARM' ? 'bg-yellow-400' : 'bg-blue-400'
                          }`}/>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-semibold text-sm truncate">{lead.nombre}</p>
                              <EtapaBadge etapa={lead.etapa}/>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {lead.telefono && <span className="text-gray-500 text-xs flex items-center gap-1"><Phone size={9}/>{lead.telefono}</span>}
                              {lead.email    && <span className="text-gray-500 text-xs flex items-center gap-1"><Mail size={9}/>{lead.email}</span>}
                              {lead.procedimientos.slice(0,2).map(p => (
                                <span key={p} className="text-blue-400 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded-md">{p}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-emerald-400 font-bold text-sm">{fmt(lead.valorEstimado)}</p>
                            {days !== null && (
                              <p className={`text-[10px] ${days < 0 ? 'text-red-400' : days <= 1 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                <Clock size={9} className="inline mr-0.5"/>
                                {days < 0 ? 'Vencido' : days === 0 ? 'Hoy' : `${days}d`}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0" data-no-select onClick={e => e.stopPropagation()}>
                            {lead.telefono && (
                              <a href={waLink(lead.telefono)} target="_blank" rel="noreferrer"
                                className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center transition">
                                <MessageCircle size={12} className="text-emerald-400"/>
                              </a>
                            )}
                            <button onClick={() => openEdit(lead)}
                              className="w-7 h-7 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition">
                              <Edit3 size={12} className="text-blue-400"/>
                            </button>
                            <button onClick={() => handleDelete(lead.id)} disabled={deleting === lead.id}
                              className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition">
                              {deleting === lead.id
                                ? <RefreshCw size={12} className="text-red-400 animate-spin"/>
                                : <Trash2 size={12} className="text-red-400"/>
                              }
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
