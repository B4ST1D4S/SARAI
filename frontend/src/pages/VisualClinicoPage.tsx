/**
 * SARAI – Centro de Inteligencia Visual Clínica
 * Módulo Visual Clínico v1.0
 *
 * Arquitectura preparada para:
 * Fase 1 → Documentación clínica inteligente   (ACTIVA)
 * Fase 2 → Comparación avanzada de evolución  (UI base lista)
 * Fase 3 → Análisis automático de cambios     (slots reservados)
 * Fase 4 → IA asistida (Computer Vision)      (arquitectura lista)
 * Fase 5 → Gemelo Digital Clínico             (roadmap)
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, ZoomIn, X, ChevronLeft, ChevronRight,
  Clock, Eye, TrendingUp, BarChart2, Grid, List,
  Brain, Layers, Target, Zap, Star, Shield,
  PlayCircle, FileText, Download, Share2, Filter,
  Activity, Calendar, User, Tag, MapPin, Cpu,
  AlertTriangle, CheckCircle, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type FaseEvolucion = 'ANTES' | 'DURANTE' | 'DESPUES' | 'SEGUIMIENTO' | 'MANTENIMIENTO' | 'REINTERVENCION';
type VistaActiva = 'cronologica' | 'comparativa' | 'anatomica' | 'indicadores';

interface RegistroVisual {
  id: number;
  fase: FaseEvolucion;
  src: string;
  fecha: Date;
  region: string;
  procedimiento: string;
  sesion: string;
  notas: string;
  tags: string[];
  ia_ready: boolean;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const FASES: { id: FaseEvolucion; label: string; color: string; bg: string; border: string; icon: string; desc: string }[] = [
  { id: 'ANTES',         label: 'Antes',          color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: '🔵', desc: 'Estado clínico inicial' },
  { id: 'DURANTE',       label: 'Durante',        color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  icon: '⚡', desc: 'En proceso de tratamiento' },
  { id: 'DESPUES',       label: 'Después',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '✅', desc: 'Resultado post-procedimiento' },
  { id: 'SEGUIMIENTO',   label: 'Seguimiento',    color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  icon: '🔭', desc: 'Control evolutivo' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  icon: '🔧', desc: 'Sesión de mantenimiento' },
  { id: 'REINTERVENCION',label: 'Reintervención', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: '♻️', desc: 'Segunda intervención' },
];

const REGIONES_ANATOMICAS = [
  'Rostro completo', 'Frente', 'Zona periorbital', 'Nariz', 'Mejillas', 'Labios', 'Mentón',
  'Cuello', 'Escote', 'Abdomen', 'Cintura', 'Glúteos', 'Muslos', 'Brazos', 'Mamas',
  'Espalda', 'Cicatriz', 'Zona corporal general',
];

const VISTAS: { id: VistaActiva; label: string; icon: any; desc: string }[] = [
  { id: 'cronologica',  label: 'Cronológica',  icon: Clock,      desc: 'Línea de tiempo clínica' },
  { id: 'comparativa',  label: 'Comparativa',  icon: Eye,        desc: 'Antes vs después' },
  { id: 'anatomica',    label: 'Anatómica',    icon: Target,     desc: 'Por región corporal' },
  { id: 'indicadores',  label: 'Indicadores',  icon: BarChart2,  desc: 'Métricas visuales' },
];

const getFase = (id: FaseEvolucion) => FASES.find(f => f.id === id) ?? FASES[0];

// ─────────────────────────────────────────────
// COMPONENTES AUXILIARES
// ─────────────────────────────────────────────

function FaseBadge({ fase }: { fase: FaseEvolucion }) {
  const f = getFase(fase);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${f.bg} ${f.color} border ${f.border}`}>
      <span>{f.icon}</span>{f.label}
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub?: string; icon: any; color: string; bg: string;
}) {
  return (
    <div className={`${bg} border border-white/8 rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-xl ${bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
        <Icon size={17} className={color} />
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
        <p className="text-[11px] text-white/70 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ZonaSubirImagen({ fase, onSubir }: {
  fase: FaseEvolucion;
  onSubir: (file: File, fase: FaseEvolucion) => void;
}) {
  const f = getFase(fase);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const procesar = (file: File) => { if (file.type.startsWith('image/')) onSubir(file, fase); };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) procesar(f); }}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center gap-3 ${
        drag ? `${f.border} ${f.bg} scale-[1.02]` : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4'
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const file = e.target.files?.[0]; if (file) procesar(file); }} />
      <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center`}>
        <Upload size={20} className={f.color} />
      </div>
      <div className="text-center">
        <p className={`text-sm font-bold ${f.color}`}>{f.icon} {f.label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
        <p className="text-[10px] text-gray-600 mt-1">Clic o arrastra imagen</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VISTA CRONOLÓGICA
// ─────────────────────────────────────────────
function VistaCronologica({ registros }: { registros: RegistroVisual[] }) {
  if (registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Clock size={28} className="text-blue-400" />
        </div>
        <p className="text-white font-semibold">Sin registros visuales aún</p>
        <p className="text-gray-500 text-sm text-center max-w-xs">
          Sube la primera imagen clínica para comenzar la línea de tiempo evolutiva del paciente.
        </p>
      </div>
    );
  }

  const agrupados = registros.reduce<Record<string, RegistroVisual[]>>((acc, r) => {
    const key = r.fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(agrupados).map(([periodo, items]) => (
        <div key={periodo}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest px-3 py-1 bg-white/4 rounded-full border border-white/8">
              {periodo}
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="aspect-square overflow-hidden bg-white/3">
                  <img src={r.src} alt={r.fase} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                {/* Overlay info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1">
                  <FaseBadge fase={r.fase} />
                  <p className="text-white text-xs font-semibold truncate">{r.region}</p>
                  <p className="text-gray-400 text-[10px]">{r.fecha.toLocaleDateString('es-CO')}</p>
                </div>
                {/* Badge fase siempre visible */}
                <div className="absolute top-2 left-2">
                  <FaseBadge fase={r.fase} />
                </div>
                {/* IA ready indicator */}
                {r.ia_ready && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500/30 border border-purple-500/50 flex items-center justify-center" title="Lista para análisis IA">
                    <Brain size={10} className="text-purple-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// VISTA COMPARATIVA
// ─────────────────────────────────────────────
function VistaComparativa({ registros }: { registros: RegistroVisual[] }) {
  const antes   = registros.filter(r => r.fase === 'ANTES');
  const despues = registros.filter(r => r.fase === 'DESPUES');
  const [selAntes,   setSelAntes]   = useState(0);
  const [selDespues, setSelDespues] = useState(0);

  return (
    <div className="space-y-6">
      {/* Comparador principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel ANTES */}
        <div className="bg-[#0d1117] border border-blue-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-500/10">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Estado Inicial</span>
            {antes.length > 0 && (
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => setSelAntes(p => Math.max(0, p - 1))} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                  <ChevronLeft size={12} className="text-gray-400" />
                </button>
                <span className="text-[10px] text-gray-500">{selAntes + 1}/{antes.length}</span>
                <button onClick={() => setSelAntes(p => Math.min(antes.length - 1, p + 1))} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>
          <div className="aspect-[4/3] bg-white/2 flex items-center justify-center">
            {antes[selAntes] ? (
              <img src={antes[selAntes].src} alt="Antes" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <Camera size={32} />
                <p className="text-xs">Sin imagen inicial</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel DESPUÉS */}
        <div className="bg-[#0d1117] border border-emerald-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Resultado Clínico</span>
            {despues.length > 0 && (
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => setSelDespues(p => Math.max(0, p - 1))} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                  <ChevronLeft size={12} className="text-gray-400" />
                </button>
                <span className="text-[10px] text-gray-500">{selDespues + 1}/{despues.length}</span>
                <button onClick={() => setSelDespues(p => Math.min(despues.length - 1, p + 1))} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>
          <div className="aspect-[4/3] bg-white/2 flex items-center justify-center">
            {despues[selDespues] ? (
              <img src={despues[selDespues].src} alt="Después" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <Camera size={32} />
                <p className="text-xs">Sin imagen resultado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Análisis IA — Fase futura */}
      <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/15 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Brain size={15} className="text-purple-400" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Análisis Comparativo IA</p>
            <p className="text-gray-500 text-[11px]">Próxima capacidad — Fase 3 del roadmap</p>
          </div>
          <span className="ml-auto text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">PRÓXIMAMENTE</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['Detección de cambios', 'Análisis de asimetrías', 'Medición de evolución', 'Generación de informe'].map(cap => (
            <div key={cap} className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2">
              <Cpu size={10} className="text-purple-400 flex-shrink-0" />
              <span className="text-[10px] text-gray-400">{cap}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VISTA ANATÓMICA
// ─────────────────────────────────────────────
function VistaAnatomica({ registros }: { registros: RegistroVisual[] }) {
  const [regionSel, setRegionSel] = useState<string | null>(null);

  const conteo = REGIONES_ANATOMICAS.reduce<Record<string, number>>((acc, r) => {
    acc[r] = registros.filter(reg => reg.region === r).length;
    return acc;
  }, {});

  const regionesConFotos = REGIONES_ANATOMICAS.filter(r => conteo[r] > 0);
  const fotosFiltradas = regionSel ? registros.filter(r => r.region === regionSel) : registros;

  return (
    <div className="space-y-5">
      {/* Mapa de zonas */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={14} className="text-blue-400" />
          <p className="text-sm font-semibold text-white">Regiones Anatómicas Documentadas</p>
          <span className="ml-auto text-xs text-gray-500">{regionesConFotos.length} zonas con registros</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRegionSel(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
              regionSel === null ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-white/3 text-gray-500 border-white/8 hover:border-white/15'
            }`}
          >
            Todas las zonas
          </button>
          {REGIONES_ANATOMICAS.map(region => (
            <button
              key={region}
              onClick={() => setRegionSel(region === regionSel ? null : region)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border flex items-center gap-1.5 ${
                regionSel === region ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                : conteo[region] > 0 ? 'bg-white/5 text-gray-300 border-white/15 hover:border-blue-500/30'
                : 'bg-white/2 text-gray-600 border-white/5 opacity-40 cursor-default'
              }`}
            >
              {region}
              {conteo[region] > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[9px] flex items-center justify-center">{conteo[region]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados filtrados */}
      {fotosFiltradas.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <Target size={28} className="text-gray-700" />
          <p className="text-gray-500 text-sm">Sin registros para esta región</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {fotosFiltradas.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="group bg-[#0d1117] border border-white/8 rounded-xl overflow-hidden hover:border-white/20 transition cursor-pointer">
              <div className="aspect-square overflow-hidden bg-white/3">
                <img src={r.src} alt={r.region} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-2 space-y-1">
                <FaseBadge fase={r.fase} />
                <p className="text-[10px] text-gray-500 truncate">{r.region}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// VISTA INDICADORES
// ─────────────────────────────────────────────
function VistaIndicadores({ registros }: { registros: RegistroVisual[] }) {
  const total = registros.length;
  const porFase = FASES.map(f => ({ ...f, count: registros.filter(r => r.fase === f.id).length }));
  const regiones = [...new Set(registros.map(r => r.region))];
  const cobertura = total > 0 ? Math.round((registros.filter(r => r.ia_ready).length / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Registros Totales"    value={total}               sub="Imágenes clínicas"    icon={Camera}     color="text-blue-400"    bg="bg-blue-500/5" />
        <KpiCard label="Regiones Cubiertas"   value={regiones.length}     sub="Zonas documentadas"   icon={Target}     color="text-purple-400"  bg="bg-purple-500/5" />
        <KpiCard label="Listas para IA"       value={`${cobertura}%`}     sub="Con metadatos"        icon={Brain}      color="text-violet-400"  bg="bg-violet-500/5" />
        <KpiCard label="Fases Documentadas"   value={porFase.filter(f => f.count > 0).length + '/6'} sub="Complitud del ciclo" icon={Layers} color="text-emerald-400" bg="bg-emerald-500/5" />
      </div>

      {/* Distribución por fase */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={14} className="text-blue-400" /> Distribución por Fase Clínica
        </p>
        <div className="space-y-3">
          {porFase.map(f => (
            <div key={f.id} className="flex items-center gap-3">
              <span className="text-base flex-shrink-0 w-6">{f.icon}</span>
              <span className={`text-xs font-medium w-28 flex-shrink-0 ${f.color}`}>{f.label}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: total > 0 ? `${(f.count / total) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${f.bg.replace('/10', '/40')}`}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap IA */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={14} className="text-yellow-400" /> Roadmap de Inteligencia Visual — SARAI Vision
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { fase: 'Fase 1', nombre: 'Documentación Clínica Inteligente',        estado: 'activa',    desc: 'Registro, organización y metadatos clínicos' },
            { fase: 'Fase 2', nombre: 'Comparación Avanzada de Evolución',         estado: 'progreso',  desc: 'UI comparativa y slider interactivo' },
            { fase: 'Fase 3', nombre: 'Análisis Automático de Cambios',            estado: 'pendiente', desc: 'Detección de variaciones anatómicas' },
            { fase: 'Fase 4', nombre: 'Interpretación Clínica Asistida por IA',    estado: 'pendiente', desc: 'Computer Vision + LLM médico' },
            { fase: 'Fase 5', nombre: 'Gemelo Digital Clínico del Paciente',        estado: 'pendiente', desc: 'Modelo 3D evolutivo' },
            { fase: 'Fase 6', nombre: 'Predicción de Evolución Terapéutica',        estado: 'pendiente', desc: 'ML predictivo basado en casos similares' },
          ].map(item => (
            <div key={item.fase} className={`flex items-start gap-3 p-3 rounded-xl border ${
              item.estado === 'activa'    ? 'bg-emerald-500/5 border-emerald-500/20' :
              item.estado === 'progreso' ? 'bg-blue-500/5 border-blue-500/20' :
              'bg-white/2 border-white/5'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                item.estado === 'activa'    ? 'bg-emerald-500/20 text-emerald-400' :
                item.estado === 'progreso' ? 'bg-blue-500/20 text-blue-400' :
                'bg-white/5 text-gray-600'
              }`}>
                {item.estado === 'activa' ? <CheckCircle size={12} /> :
                 item.estado === 'progreso' ? <PlayCircle size={12} /> :
                 <Clock size={12} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-600 font-mono">{item.fase}</span>
                  <span className={`text-xs font-semibold ${
                    item.estado === 'activa' ? 'text-emerald-400' :
                    item.estado === 'progreso' ? 'text-blue-400' : 'text-gray-400'
                  }`}>{item.nombre}</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calidad documental */}
      <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/15 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-blue-400" />
          <p className="text-sm font-semibold text-white">Indicadores de Calidad Documental</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Fotos con región asignada',  value: total > 0 ? `${Math.round((registros.filter(r => r.region).length / total) * 100)}%` : '—', icon: Tag },
            { label: 'Registros con notas',         value: total > 0 ? `${Math.round((registros.filter(r => r.notas).length / total) * 100)}%` : '—', icon: FileText },
            { label: 'Cobertura ciclo completo',    value: porFase.filter(f => f.count > 0).length >= 3 ? 'Buena' : 'Básica', icon: CheckCircle },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 bg-black/20 rounded-xl p-3">
              <item.icon size={13} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-bold">{item.value}</p>
                <p className="text-[10px] text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL NUEVA CAPTURA
// ─────────────────────────────────────────────
function ModalNuevaCaptura({ onClose, onGuardar }: {
  onClose: () => void;
  onGuardar: (r: Omit<RegistroVisual, 'id'>) => void;
}) {
  const [fase, setFase] = useState<FaseEvolucion>('ANTES');
  const [region, setRegion] = useState(REGIONES_ANATOMICAS[0]);
  const [procedimiento, setProcedimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [tags, setTags] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cargar = (file: File) => {
    setArchivo(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    if (!archivo || !preview) return;
    onGuardar({
      fase, region, procedimiento, notas, sesion: new Date().toISOString(),
      src: preview, fecha: new Date(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      ia_ready: !!(region && procedimiento && notas),
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Camera size={15} className="text-blue-400" />
            <p className="text-white font-bold text-sm">Nueva Captura Visual Clínica</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Zona drag/drop */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-blue-500/40 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center gap-3 bg-white/2"
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) cargar(f); }} />
            {preview ? (
              <img src={preview} alt="Preview" className="w-full max-h-48 object-contain rounded-xl" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Upload size={20} className="text-blue-400" />
                </div>
                <p className="text-sm text-gray-400">Haz clic o arrastra la imagen aquí</p>
                <p className="text-[11px] text-gray-600">JPG, PNG, WEBP — Máximo 20MB</p>
              </>
            )}
          </div>

          {/* Fase clínica */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Fase Clínica</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FASES.map(f => (
                <button key={f.id} onClick={() => setFase(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition border ${
                    fase === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-500 border-white/8 hover:border-white/15'
                  }`}>
                  <span>{f.icon}</span>{f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Región anatómica */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Región Anatómica</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20">
              {REGIONES_ANATOMICAS.map(r => <option key={r} value={r} className="bg-[#0d1117]">{r}</option>)}
            </select>
          </div>

          {/* Procedimiento */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Procedimiento / Tratamiento</label>
            <input value={procedimiento} onChange={e => setProcedimiento(e.target.value)}
              placeholder="Ej: Liposucción abdominal, Rinoplastia..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" />
          </div>

          {/* Notas */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Observaciones Clínicas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Hallazgos clínicos, estado del paciente, condiciones de captura..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none" />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">
              Etiquetas <span className="text-gray-600 normal-case">(separadas por coma)</span>
            </label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="postop, cicatriz, control-30d..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" />
          </div>

          {/* IA readiness indicator */}
          {archivo && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
              region && procedimiento && notas
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              <Brain size={12} />
              {region && procedimiento && notas
                ? 'Registro optimizado para análisis IA futuro ✓'
                : 'Completa los campos para optimizar el análisis IA'}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 text-gray-400 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button onClick={guardar} disabled={!archivo}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition">
              Guardar Registro Visual
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function VisualClinicoPage() {
  const [registros, setRegistros]         = useState<RegistroVisual[]>([]);
  const [vistaActiva, setVistaActiva]     = useState<VistaActiva>('cronologica');
  const [filtroFase, setFiltroFase]       = useState<FaseEvolucion | 'TODAS'>('TODAS');
  const [showModal, setShowModal]         = useState(false);
  const [showFiltros, setShowFiltros]     = useState(false);
  const [registroZoom, setRegistroZoom]   = useState<RegistroVisual | null>(null);

  const registrosFiltrados = filtroFase === 'TODAS'
    ? registros
    : registros.filter(r => r.fase === filtroFase);

  const agregarRegistro = useCallback((r: Omit<RegistroVisual, 'id'>) => {
    setRegistros(prev => [{ ...r, id: Date.now() }, ...prev]);
  }, []);

  const subirRapido = useCallback((file: File, fase: FaseEvolucion) => {
    const reader = new FileReader();
    reader.onload = e => {
      setRegistros(prev => [{
        id: Date.now(), fase, src: e.target?.result as string,
        fecha: new Date(), region: 'Zona corporal general',
        procedimiento: '', sesion: new Date().toISOString(),
        notas: '', tags: [], ia_ready: false,
      }, ...prev]);
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col">

      {/* ── HEADER ── */}
      <div className="border-b border-white/5 bg-[#0a0c12]/90 backdrop-blur-xl px-6 py-4 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Logo / ícono del módulo */}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Eye size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Visual Clínico</h1>
              <p className="text-gray-500 text-xs">Centro de Inteligencia Visual · SARAI Vision</p>
            </div>
          </div>

          {/* Vistas */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-0.5">
            {VISTAS.map(v => (
              <button key={v.id} onClick={() => setVistaActiva(v.id)}
                title={v.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  vistaActiva === v.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}>
                <v.icon size={13} />{v.label}
              </button>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFiltros(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                showFiltros ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/8 text-gray-400 hover:bg-white/8'
              }`}>
              <Filter size={13} /> Filtrar
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-500/20">
              <Camera size={14} /> Nueva Captura
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTROS ── */}
      <AnimatePresence>
        {showFiltros && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/5 bg-[#0a0c12]/60 overflow-hidden"
          >
            <div className="px-6 py-3 max-w-[1600px] mx-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mr-1">Fase:</span>
                <button onClick={() => setFiltroFase('TODAS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                    filtroFase === 'TODAS' ? 'bg-white/10 text-white border-white/20' : 'bg-white/3 text-gray-500 border-white/8 hover:border-white/15'
                  }`}>
                  Todas
                </button>
                {FASES.map(f => (
                  <button key={f.id} onClick={() => setFiltroFase(f.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                      filtroFase === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-500 border-white/8 hover:border-white/15'
                    }`}>
                    <span>{f.icon}</span>{f.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBIDA RÁPIDA (solo vista cronológica sin fotos) ── */}
      {vistaActiva === 'cronologica' && registros.length === 0 && (
        <div className="px-6 py-5 max-w-[1600px] mx-auto w-full">
          <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
            <Zap size={11} /> Subida rápida por fase
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {FASES.map(f => (
              <ZonaSubirImagen key={f.id} fase={f.id} onSubir={subirRapido} />
            ))}
          </div>
        </div>
      )}

      {/* ── KPIs rápidos (cuando hay registros) ── */}
      {registros.length > 0 && (
        <div className="px-6 pt-5 pb-2 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total Registros"     value={registros.length}                                   icon={Camera}     color="text-blue-400"   bg="bg-blue-500/5" />
            <KpiCard label="Antes/Después"        value={`${registros.filter(r=>r.fase==='ANTES').length}/${registros.filter(r=>r.fase==='DESPUES').length}`} icon={Eye} color="text-emerald-400" bg="bg-emerald-500/5" />
            <KpiCard label="Zonas Documentadas"   value={[...new Set(registros.map(r=>r.region))].length}    icon={Target}     color="text-purple-400" bg="bg-purple-500/5" />
            <KpiCard label="Listos para IA"       value={registros.filter(r=>r.ia_ready).length}             icon={Brain}      color="text-violet-400" bg="bg-violet-500/5" />
          </div>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={vistaActiva} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {vistaActiva === 'cronologica'  && <VistaCronologica  registros={registrosFiltrados} />}
              {vistaActiva === 'comparativa'  && <VistaComparativa  registros={registrosFiltrados} />}
              {vistaActiva === 'anatomica'    && <VistaAnatomica    registros={registrosFiltrados} />}
              {vistaActiva === 'indicadores'  && <VistaIndicadores  registros={registros} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODAL NUEVA CAPTURA ── */}
      <AnimatePresence>
        {showModal && (
          <ModalNuevaCaptura
            onClose={() => setShowModal(false)}
            onGuardar={agregarRegistro}
          />
        )}
      </AnimatePresence>

      {/* ── ZOOM REGISTRO ── */}
      <AnimatePresence>
        {registroZoom && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setRegistroZoom(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="relative max-w-3xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={registroZoom.src} alt="Zoom" className="w-full max-h-[80vh] object-contain rounded-2xl" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <FaseBadge fase={registroZoom.fase} />
              </div>
              <button onClick={() => setRegistroZoom(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 flex items-center justify-center transition">
                <X size={16} className="text-white" />
              </button>
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-xl">
                <p className="text-white text-xs font-semibold">{registroZoom.region}</p>
                {registroZoom.procedimiento && <p className="text-gray-400 text-[10px]">{registroZoom.procedimiento}</p>}
                <p className="text-gray-500 text-[10px]">{registroZoom.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
