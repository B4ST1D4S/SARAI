/**
 * SARAI - Centro de Inteligencia Visual Clinica v2.0
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Camera, Upload, X, Plus, Brain,
  ChevronsLeftRight, Clock, MapPin, Tag,
  FileText, ZoomIn, Activity, Layers, ChevronLeft, ChevronRight,
  Trash2, User, Search, TrendingUp, Minus, AlertCircle, BarChart2,
} from 'lucide-react';
import { searchPacientes } from '../services/api';

type FaseEvolucion = 'ANTES' | 'DURANTE' | 'DESPUES' | 'SEGUIMIENTO' | 'MANTENIMIENTO' | 'REINTERVENCION';

interface RegistroVisual {
  id: number;
  fase: FaseEvolucion;
  src: string;
  fecha: Date;
  region: string;
  procedimiento: string;
  notas: string;
  tags: string[];
  diaProcedimiento: number;
  ia_ready: boolean;
  pacienteNombre?: string;
  pacienteId?: string;
}

type Tendencia = 'mejora' | 'estable' | 'revision';

interface MetricaCambio {
  label: string;
  valor: string;
  tendencia: Tendencia;
}

interface AnalisisCambio {
  id: number;
  fechaAnalisis: Date;
  faseA: FaseEvolucion;
  diaA: number;
  faseB: FaseEvolucion;
  diaB: number;
  observacion: string;
  metricas: MetricaCambio[];
  score: number; // 0-100
}

const FASES: {
  id: FaseEvolucion; label: string; emoji: string;
  color: string; bg: string; border: string; desc: string;
}[] = [
  { id: 'ANTES',          label: 'Antes',          emoji: '🔵', color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    desc: 'Estado inicial' },
  { id: 'DURANTE',        label: 'Durante',        emoji: '⚡', color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/40',  desc: 'En procedimiento' },
  { id: 'DESPUES',        label: 'Despues',        emoji: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', desc: 'Resultado' },
  { id: 'SEGUIMIENTO',    label: 'Seguimiento',    emoji: '🔭', color: 'text-purple-400',  bg: 'bg-purple-500/15',  border: 'border-purple-500/40',  desc: 'Control evolutivo' },
  { id: 'MANTENIMIENTO',  label: 'Mantenimiento',  emoji: '🔧', color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/40',  desc: 'Mantenimiento' },
  { id: 'REINTERVENCION', label: 'Reintervencion', emoji: '♻️', color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/40',     desc: 'Segunda intervencion' },
];

const HITOS_DIAS: { dia: number; label: string; sublabel: string; faseRef: FaseEvolucion }[] = [
  { dia: 0,   label: 'Dia 0',   sublabel: 'Intervencion',         faseRef: 'ANTES'         },
  { dia: 1,   label: 'Dia 1',   sublabel: 'Post-op inmediato',    faseRef: 'DURANTE'       },
  { dia: 3,   label: 'Dia 3',   sublabel: 'Control de drenaje',   faseRef: 'DURANTE'       },
  { dia: 7,   label: 'Dia 7',   sublabel: 'Primera evaluacion',   faseRef: 'DESPUES'       },
  { dia: 15,  label: 'Dia 15',  sublabel: 'Control de evolucion', faseRef: 'DESPUES'       },
  { dia: 30,  label: 'Mes 1',   sublabel: 'Evaluacion completa',  faseRef: 'SEGUIMIENTO'   },
  { dia: 60,  label: 'Mes 2',   sublabel: 'Control intermedio',   faseRef: 'SEGUIMIENTO'   },
  { dia: 90,  label: 'Mes 3',   sublabel: 'Resultados iniciales', faseRef: 'SEGUIMIENTO'   },
  { dia: 180, label: '6 Meses', sublabel: 'Seguimiento semestral',faseRef: 'MANTENIMIENTO' },
  { dia: 365, label: '1 Año',   sublabel: 'Evaluacion anual',     faseRef: 'MANTENIMIENTO' },
];

const REGIONES = [
  'Rostro completo','Frente','Zona periorbital','Nariz','Mejillas','Labios','Menton',
  'Cuello','Escote','Abdomen','Cintura','Gluteos','Muslos','Brazos','Mamas',
  'Espalda','Cicatriz','Zona corporal general',
];

const getFase = (id: FaseEvolucion) => FASES.find(f => f.id === id) ?? FASES[0];

function FaseBadge({ fase }: { fase: FaseEvolucion }) {
  const f = getFase(fase);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${f.bg} ${f.color} border ${f.border}`}>
      {f.emoji} {f.label}
    </span>
  );
}

// ① LINEA DE PROGRESO
function LineaProgreso({ registros }: { registros: RegistroVisual[] }) {
  const fasesConFoto = new Set(registros.map(r => r.fase));
  return (
    <div className="px-6 py-4 border-b border-white/5 bg-[#0a0c12]/60">
      <div className="max-w-[1600px] mx-auto">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-3 flex items-center gap-1.5">
          <Activity size={10}/> Progreso del ciclo clinico
        </p>
        <div className="flex items-center gap-0">
          {FASES.map((f, idx) => {
            const tiene = fasesConFoto.has(f.id);
            const count = registros.filter(r => r.fase === f.id).length;
            return (
              <div key={f.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <motion.div animate={{ scale: tiene ? 1.1 : 1 }}
                    className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-base transition-all ${
                      tiene ? `${f.bg} ${f.border} shadow-lg` : 'bg-white/3 border-white/10'
                    }`}>
                    {f.emoji}
                  </motion.div>
                  <div className="text-center">
                    <p className={`text-[10px] font-bold leading-tight ${tiene ? f.color : 'text-gray-600'}`}>{f.label}</p>
                    {tiene
                      ? <p className="text-[9px] text-gray-500">{count} foto{count !== 1 ? 's' : ''}</p>
                      : <p className="text-[9px] text-gray-700">Pendiente</p>
                    }
                  </div>
                </div>
                {idx < FASES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                    tiene && fasesConFoto.has(FASES[idx + 1].id)
                      ? 'bg-gradient-to-r from-blue-500/60 to-emerald-500/60'
                      : tiene ? 'bg-gradient-to-r from-blue-500/40 to-white/5'
                      : 'bg-white/5'
                  }`}/>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ② COMPARADOR SLIDER
function ComparadorSlider({ antes, despues, onSubirAntes, onSubirDespues }: {
  antes?: RegistroVisual;
  despues?: RegistroVisual;
  onSubirAntes: () => void;
  onSubirDespues: () => void;
}) {
  const [pos, setPos] = useState(50);

  if (!antes && !despues) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {([['ANTES', onSubirAntes], ['DESPUES', onSubirDespues]] as [FaseEvolucion, () => void][]).map(([fase, fn]) => {
          const f = getFase(fase);
          return (
            <button key={fase} onClick={fn}
              className={`border-2 border-dashed ${f.border} ${f.bg} rounded-2xl flex flex-col items-center justify-center gap-3 h-56 cursor-pointer hover:opacity-80 transition`}>
              <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center`}>
                <Upload size={20} className={f.color}/>
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${f.color}`}>{f.emoji} Foto {f.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                <p className="text-[10px] text-gray-600 mt-1">Clic para subir imagen</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (antes && !despues) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#0d1117]">
          <img src={antes.src} alt="Antes" className="w-full h-full object-contain"/>
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span className="text-xs font-bold text-blue-400">🔵 ANTES</span>
          </div>
        </div>
        <button onClick={onSubirDespues}
          className="border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center gap-3 aspect-[4/3] cursor-pointer hover:opacity-80 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <Upload size={20} className="text-emerald-400"/>
          </div>
          <p className="text-sm font-bold text-emerald-400">✅ Foto Despues</p>
          <p className="text-[11px] text-gray-500">Resultado clinico</p>
        </button>
      </div>
    );
  }

  if (!antes && despues) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onSubirAntes}
          className="border-2 border-dashed border-blue-500/40 bg-blue-500/5 rounded-2xl flex flex-col items-center justify-center gap-3 aspect-[4/3] cursor-pointer hover:opacity-80 transition">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center">
            <Upload size={20} className="text-blue-400"/>
          </div>
          <p className="text-sm font-bold text-blue-400">🔵 Foto Antes</p>
          <p className="text-[11px] text-gray-500">Estado inicial</p>
        </button>
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#0d1117]">
          <img src={despues.src} alt="Despues" className="w-full h-full object-contain"/>
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span className="text-xs font-bold text-emerald-400">✅ DESPUES</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative select-none overflow-hidden rounded-2xl aspect-[4/3] bg-[#0d1117] cursor-ew-resize">
        <img src={antes!.src} alt="Antes" className="absolute inset-0 w-full h-full object-contain pointer-events-none"/>
        <img src={despues!.src} alt="Despues"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}/>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none" style={{ left: `${pos}%` }}/>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white/90 shadow-2xl pointer-events-none flex items-center justify-center z-10"
          style={{ left: `${pos}%` }}>
          <ChevronsLeftRight size={14} className="text-gray-800"/>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg pointer-events-none">
          <span className="text-xs font-bold text-blue-400">🔵 ANTES</span>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg pointer-events-none">
          <span className="text-xs font-bold text-emerald-400">✅ DESPUES</span>
        </div>
        <input type="range" min={5} max={95} value={pos} onChange={e => setPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"/>
      </div>
      <p className="text-[10px] text-gray-600 text-center flex items-center justify-center gap-1">
        <ChevronsLeftRight size={10}/> Arrastra para comparar la evolucion clinica
      </p>
    </div>
  );
}

// ③ DATOS CLINICOS
function DatosClinicosPanel({ registro, total, onVerTodos }: {
  registro?: RegistroVisual; total: number; onVerTodos: () => void;
}) {
  if (!registro) {
    return (
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5 flex flex-col justify-between h-full min-h-[200px]">
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
            <FileText size={10}/> Datos Clinicos
          </p>
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Camera size={24} className="text-gray-700"/>
            <p className="text-gray-600 text-xs text-center">Sin registro seleccionado.<br/>Sube tu primera imagen.</p>
          </div>
        </div>
        <div className="mt-4 bg-purple-500/5 border border-purple-500/15 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={12} className="text-purple-400"/>
            <p className="text-xs text-purple-400 font-semibold">SARAI Vision — IA</p>
          </div>
          <p className="text-[10px] text-gray-600">Arquitectura preparada para analisis automatico, comparacion evolutiva y prediccion de resultados.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
          <FileText size={10}/> Datos Clinicos
        </p>
        <FaseBadge fase={registro.fase}/>
      </div>
      {registro.procedimiento && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Procedimiento</p>
          <p className="text-sm text-white font-semibold">{registro.procedimiento}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <MapPin size={12} className="text-gray-500 flex-shrink-0"/>
        <div>
          <p className="text-[10px] text-gray-600">Region anatomica</p>
          <p className="text-xs text-gray-300 font-medium">{registro.region}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={12} className="text-gray-500 flex-shrink-0"/>
        <div>
          <p className="text-[10px] text-gray-600">Fecha de captura</p>
          <p className="text-xs text-gray-300 font-medium">
            {registro.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            {registro.diaProcedimiento > 0 && <span className="ml-2 text-yellow-400">· Dia {registro.diaProcedimiento}</span>}
          </p>
        </div>
      </div>
      {registro.notas && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Observaciones clinicas</p>
          <p className="text-xs text-gray-300 leading-relaxed">{registro.notas}</p>
        </div>
      )}
      {registro.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {registro.tags.map(t => (
            <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded-full border border-purple-500/20">
              <Tag size={8}/>{t}
            </span>
          ))}
        </div>
      )}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] border ${
        registro.ia_ready ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/3 border-white/8 text-gray-600'
      }`}>
        <Brain size={11}/>
        {registro.ia_ready ? 'Registro optimizado para IA ✓' : 'Añade procedimiento y notas para optimizar IA'}
      </div>
      {total > 1 && (
        <button onClick={onVerTodos}
          className="w-full py-2 bg-white/3 hover:bg-white/6 border border-white/8 text-gray-400 text-xs rounded-xl transition">
          Ver los {total} registros →
        </button>
      )}
    </div>
  );
}

// ④ TIMELINE POR DIAS
function TimelineDias({ registros, onAgregarEnDia }: {
  registros: RegistroVisual[];
  onAgregarEnDia: (dia: number, fase: FaseEvolucion) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fotosDia = (dia: number) => registros.filter(r => r.diaProcedimiento === dia);

  return (
    <div className="px-6 py-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={14} className="text-yellow-400"/> Timeline por Dias
          </p>
          <div className="flex gap-1">
            <button onClick={() => scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              className="w-7 h-7 rounded-lg hover:bg-white/10 border border-white/8 flex items-center justify-center transition">
              <ChevronLeft size={13} className="text-gray-400"/>
            </button>
            <button onClick={() => scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              className="w-7 h-7 rounded-lg hover:bg-white/10 border border-white/8 flex items-center justify-center transition">
              <ChevronRight size={13} className="text-gray-400"/>
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-start min-w-max gap-0">
            {HITOS_DIAS.map((hito, idx) => {
              const fotos = fotosDia(hito.dia);
              const faseInfo = getFase(hito.faseRef);
              const tieneFoto = fotos.length > 0;
              return (
                <div key={hito.dia} className="flex items-start">
                  <div className="flex flex-col items-center w-32">
                    <div className="flex items-center w-full mb-3">
                      {idx > 0 && (
                        <div className={`flex-1 h-px ${tieneFoto ? 'bg-gradient-to-r from-blue-500/40 to-white/10' : 'bg-white/8'}`}/>
                      )}
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${
                        tieneFoto ? `bg-white/20 ${faseInfo.border}` : 'bg-[#0d1117] border-white/20'
                      }`}/>
                      {idx < HITOS_DIAS.length - 1 && (
                        <div className={`flex-1 h-px ${tieneFoto ? 'bg-gradient-to-r from-white/10 to-white/5' : 'bg-white/8'}`}/>
                      )}
                    </div>
                    <div className="text-center px-1 mb-2">
                      <p className={`text-xs font-bold ${tieneFoto ? faseInfo.color : 'text-gray-500'}`}>{hito.label}</p>
                      <p className="text-[9px] text-gray-600 leading-tight">{hito.sublabel}</p>
                    </div>
                    <div className="w-24 space-y-1.5">
                      {fotos.slice(0, 2).map(r => (
                        <div key={r.id} className="relative rounded-xl overflow-hidden aspect-square bg-[#0d1117] border border-white/10 group cursor-pointer">
                          <img src={r.src} alt={r.fase} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          <div className="absolute bottom-1 left-1">
                            <FaseBadge fase={r.fase}/>
                          </div>
                        </div>
                      ))}
                      {fotos.length > 2 && (
                        <div className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="text-xs text-gray-500 font-bold">+{fotos.length - 2}</span>
                        </div>
                      )}
                      <button onClick={() => onAgregarEnDia(hito.dia, hito.faseRef)}
                        className={`w-full aspect-square rounded-xl border border-dashed flex items-center justify-center transition group ${
                          tieneFoto
                            ? 'border-white/10 hover:border-white/25 bg-white/2 hover:bg-white/5'
                            : `${faseInfo.border} ${faseInfo.bg} hover:opacity-80`
                        }`}>
                        <Plus size={16} className={tieneFoto ? 'text-gray-600 group-hover:text-gray-400' : faseInfo.color}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// MODAL NUEVA CAPTURA
function ModalNuevaCaptura({ faseInicial, diaInicial, onClose, onGuardar }: {
  faseInicial: FaseEvolucion; diaInicial: number;
  onClose: () => void;
  onGuardar: (r: Omit<RegistroVisual, 'id'>) => void;
}) {
  const [fase, setFase]                   = useState<FaseEvolucion>(faseInicial);
  const [region, setRegion]               = useState(REGIONES[0]);
  const [procedimiento, setProcedimiento] = useState('');
  const [notas, setNotas]                 = useState('');
  const [tags, setTags]                   = useState('');
  const [dia, setDia]                     = useState(diaInicial);
  const [fechaFoto, setFechaFoto]         = useState(() => new Date().toISOString().split('T')[0]);
  const [preview, setPreview]             = useState<string | null>(null);
  const [drag, setDrag]                   = useState(false);
  const inputRef                          = useRef<HTMLInputElement>(null);

  const cargar = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    if (!preview) return;
    onGuardar({
      fase, region, procedimiento, notas, diaProcedimiento: dia,
      src: preview, fecha: new Date(fechaFoto + 'T12:00:00'),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      ia_ready: !!(region && procedimiento && notas),
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0d1117] z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Camera size={13} className="text-blue-400"/>
            </div>
            <p className="text-white font-bold text-sm">Nueva Captura Visual Clinica</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
            <X size={14} className="text-gray-400"/>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) cargar(f); }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all flex flex-col items-center gap-3 ${
              drag ? 'border-blue-500/60 bg-blue-500/10 scale-[1.01]' : 'border-white/15 bg-white/2 hover:border-blue-500/30 hover:bg-white/4'
            }`}>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) cargar(f); }}/>
            {preview
              ? <img src={preview} alt="Preview" className="w-full max-h-52 object-contain rounded-xl"/>
              : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Upload size={20} className="text-blue-400"/>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-300 font-medium">Arrastra la imagen aqui</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">o haz clic · JPG, PNG, WEBP</p>
                  </div>
                </>
              )
            }
          </div>
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Fase clinica</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FASES.map(f => (
                <button key={f.id} onClick={() => setFase(f.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition border ${
                    fase === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-500 border-white/8 hover:border-white/15'
                  }`}>
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1 mb-2">
                <Clock size={10}/> Fecha de la foto
              </label>
              <input
                type="date"
                value={fechaFoto}
                onChange={e => setFechaFoto(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 [color-scheme:dark]"/>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Dia post-procedimiento</label>
              <div className="flex flex-wrap gap-1.5">
                {HITOS_DIAS.map(h => (
                  <button key={h.dia} onClick={() => setDia(h.dia)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                      dia === h.dia ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' : 'bg-white/3 text-gray-500 border-white/8 hover:border-white/15'
                    }`}>
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Region anatomica</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20">
              {REGIONES.map(r => <option key={r} value={r} className="bg-[#0d1117]">{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Procedimiento / Tratamiento</label>
            <input value={procedimiento} onChange={e => setProcedimiento(e.target.value)}
              placeholder="Ej: Liposuccion abdominal, Rinoplastia..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"/>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Observaciones clinicas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Hallazgos clinicos, estado del paciente..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none"/>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">
              Etiquetas <span className="text-gray-600 normal-case font-normal">(separadas por coma)</span>
            </label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="postop, control-7d, cicatriz..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"/>
          </div>
          {preview && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
              region && procedimiento && notas
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              <Brain size={12}/>
              {region && procedimiento && notas
                ? 'Registro completo — optimizado para analisis IA'
                : 'Completa procedimiento y observaciones para optimizar IA'}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 text-gray-400 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button onClick={guardar} disabled={!preview}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition">
              Guardar Registro Visual
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ⑤ MODAL NUEVO ANALISIS DE CAMBIOS
function ModalNuevoAnalisis({ onClose, onGuardar }: {
  onClose: () => void;
  onGuardar: (a: Omit<AnalisisCambio, 'id'>) => void;
}) {
  const [faseA, setFaseA]         = useState<FaseEvolucion>('ANTES');
  const [diaA, setDiaA]           = useState(0);
  const [faseB, setFaseB]         = useState<FaseEvolucion>('DESPUES');
  const [diaB, setDiaB]           = useState(7);
  const [observacion, setObs]     = useState('');
  const [score, setScore]         = useState(70);
  const [metricas, setMetricas]   = useState<MetricaCambio[]>([
    { label: 'Inflamación', valor: '', tendencia: 'mejora' },
    { label: 'Cicatriz',    valor: '', tendencia: 'estable' },
  ]);

  const addMetrica = () => setMetricas(m => [...m, { label: '', valor: '', tendencia: 'estable' }]);
  const removeMetrica = (i: number) => setMetricas(m => m.filter((_, idx) => idx !== i));
  const updateMetrica = (i: number, key: keyof MetricaCambio, val: string) =>
    setMetricas(m => m.map((x, idx) => idx === i ? { ...x, [key]: val } : x));

  const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const scoreLabel = score >= 70 ? 'Evolución favorable' : score >= 40 ? 'Evolución moderada' : 'Requiere atención';

  const guardar = () => {
    if (!observacion.trim()) return;
    onGuardar({
      fechaAnalisis: new Date(),
      faseA, diaA, faseB, diaB,
      observacion: observacion.trim(),
      metricas: metricas.filter(m => m.label && m.valor),
      score,
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d1117] border border-orange-500/20 rounded-3xl w-full max-w-lg shadow-2xl shadow-orange-500/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0d1117] z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <BarChart2 size={13} className="text-orange-400"/>
            </div>
            <p className="text-white font-bold text-sm">Nuevo Análisis de Cambios</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
            <X size={14} className="text-gray-400"/>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Período de comparación */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-3">Período de comparación</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Desde */}
              <div className="space-y-2">
                <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Desde</p>
                <div className="grid grid-cols-3 gap-1">
                  {FASES.slice(0, 3).map(f => (
                    <button key={f.id} onClick={() => setFaseA(f.id)}
                      className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl text-[9px] font-medium transition border ${
                        faseA === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-600 border-white/8 hover:border-white/15'
                      }`}>
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                  {FASES.slice(3).map(f => (
                    <button key={f.id} onClick={() => setFaseA(f.id)}
                      className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl text-[9px] font-medium transition border ${
                        faseA === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-600 border-white/8 hover:border-white/15'
                      }`}>
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
                <select value={diaA} onChange={e => setDiaA(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500/50 [color-scheme:dark]">
                  {HITOS_DIAS.map(h => <option key={h.dia} value={h.dia}>{h.label}</option>)}
                </select>
              </div>
              {/* Hasta */}
              <div className="space-y-2">
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Hasta</p>
                <div className="grid grid-cols-3 gap-1">
                  {FASES.slice(0, 3).map(f => (
                    <button key={f.id} onClick={() => setFaseB(f.id)}
                      className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl text-[9px] font-medium transition border ${
                        faseB === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-600 border-white/8 hover:border-white/15'
                      }`}>
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                  {FASES.slice(3).map(f => (
                    <button key={f.id} onClick={() => setFaseB(f.id)}
                      className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl text-[9px] font-medium transition border ${
                        faseB === f.id ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/3 text-gray-600 border-white/8 hover:border-white/15'
                      }`}>
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
                <select value={diaB} onChange={e => setDiaB(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]">
                  {HITOS_DIAS.map(h => <option key={h.dia} value={h.dia}>{h.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Score de evolución */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Score de evolución</label>
              <span className={`text-sm font-bold ${scoreColor}`}>{score}/100 <span className="text-[10px] font-normal">{scoreLabel}</span></span>
            </div>
            <input type="range" min={0} max={100} value={score} onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-orange-400 h-2 rounded-full"/>
            <div className="flex justify-between text-[9px] text-gray-700 mt-1">
              <span>Requiere atención</span><span>Moderado</span><span>Favorable</span>
            </div>
          </div>

          {/* Observación clínica */}
          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-2">Observación clínica del período</label>
            <textarea value={observacion} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Describe los cambios observados en este período: respuesta al tratamiento, evolución de la cicatriz, cambios en volumen..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 resize-none"/>
          </div>

          {/* Métricas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Métricas de seguimiento</label>
              <button onClick={addMetrica}
                className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 transition px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Plus size={10}/> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {metricas.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={m.label} onChange={e => updateMetrica(i, 'label', e.target.value)}
                    placeholder="Aspecto (ej: Inflamación)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/40"/>
                  <input value={m.valor} onChange={e => updateMetrica(i, 'valor', e.target.value)}
                    placeholder="Resultado"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/40"/>
                  <select value={m.tendencia} onChange={e => updateMetrica(i, 'tendencia', e.target.value as Tendencia)}
                    className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs focus:outline-none [color-scheme:dark] text-white">
                    <option value="mejora">↑ Mejora</option>
                    <option value="estable">→ Estable</option>
                    <option value="revision">↓ Revisión</option>
                  </select>
                  <button onClick={() => removeMetrica(i)} className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-gray-600 hover:text-red-400 transition flex-shrink-0">
                    <X size={11}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 text-gray-400 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button onClick={guardar} disabled={!observacion.trim()}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition">
              Guardar Análisis
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ⑥ PANEL ANALISIS DE CAMBIOS
const TENDENCIA_CONFIG: Record<Tendencia, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  mejora:   { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Mejora'   },
  estable:  { icon: Minus,        color: 'text-yellow-400',  bg: 'bg-yellow-500/10  border-yellow-500/20',  label: 'Estable'  },
  revision: { icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10     border-red-500/20',     label: 'Revisión' },
};

function PanelAnalisisCambios({ analisis, onNuevo, onEliminar }: {
  analisis: AnalisisCambio[];
  onNuevo: () => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <div className="bg-[#0d1117] border border-orange-500/15 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <BarChart2 size={13} className="text-orange-400"/>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Análisis de Cambios</p>
            <p className="text-[10px] text-gray-600">Evolución clínica documentada por períodos</p>
          </div>
        </div>
        <button onClick={onNuevo}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/35 text-orange-400 rounded-xl text-xs font-semibold transition">
          <Plus size={12}/> Nuevo análisis
        </button>
      </div>

      {/* Contenido */}
      <div className="p-5">
        {analisis.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/8 border border-orange-500/15 flex items-center justify-center mb-1">
              <BarChart2 size={20} className="text-orange-400/50"/>
            </div>
            <p className="text-gray-500 text-sm font-medium">Sin análisis registrados</p>
            <p className="text-gray-700 text-xs max-w-xs">Documenta la evolución del paciente comparando dos momentos del tratamiento</p>
            <button onClick={onNuevo}
              className="mt-2 px-4 py-2 bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-medium transition">
              + Primer análisis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {analisis.map(a => {
              const fA = getFase(a.faseA);
              const fB = getFase(a.faseB);
              const scoreColor = a.score >= 70 ? 'text-emerald-400' : a.score >= 40 ? 'text-yellow-400' : 'text-red-400';
              const scoreBg    = a.score >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : a.score >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#080a0f] border border-white/8 rounded-2xl p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {/* Período */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/3 border border-white/8">
                        <span className={`text-[10px] font-bold ${fA.color}`}>{fA.emoji} {fA.label}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[10px] text-yellow-500">{HITOS_DIAS.find(h => h.dia === a.diaA)?.label ?? `Día ${a.diaA}`}</span>
                        <ChevronRight size={10} className="text-gray-600"/>
                        <span className={`text-[10px] font-bold ${fB.color}`}>{fB.emoji} {fB.label}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[10px] text-yellow-500">{HITOS_DIAS.find(h => h.dia === a.diaB)?.label ?? `Día ${a.diaB}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Score */}
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold ${scoreBg} ${scoreColor}`}>
                        <Activity size={10}/>
                        {a.score}/100
                      </div>
                      <button onClick={() => onEliminar(a.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-500/15 flex items-center justify-center text-gray-700 hover:text-red-400 transition">
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>

                  {/* Observación */}
                  <p className="text-gray-300 text-xs leading-relaxed border-l-2 border-orange-500/40 pl-3">{a.observacion}</p>

                  {/* Métricas */}
                  {a.metricas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.metricas.map((m, i) => {
                        const tc = TENDENCIA_CONFIG[m.tendencia];
                        const Icon = tc.icon;
                        return (
                          <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] ${tc.bg}`}>
                            <Icon size={9} className={tc.color}/>
                            <span className="text-gray-400 font-medium">{m.label}:</span>
                            <span className={tc.color}>{m.valor}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fecha */}
                  <p className="text-[9px] text-gray-700 flex items-center gap-1">
                    <Clock size={8}/> Registrado el {a.fechaAnalisis.toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// PAGINA PRINCIPAL
export default function VisualClinicoPage() {
  const [registros, setRegistros]               = useState<RegistroVisual[]>([]);
  const [analisis, setAnalisis]                 = useState<AnalisisCambio[]>([]);
  const [showModal, setShowModal]               = useState(false);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);
  const [faseModal, setFaseModal]               = useState<FaseEvolucion>('ANTES');
  const [diaModal, setDiaModal]                 = useState(0);
  const [verGaleria, setVerGaleria]             = useState(true);
  const [zoom, setZoom]                         = useState<RegistroVisual | null>(null);
  const [selRegistro, setSelRegistro]           = useState<RegistroVisual | null>(null);
  const [antesSelIdx, setAntesSelIdx]           = useState(0);
  const [despuesSelIdx, setDespuesSelIdx]       = useState(0);
  // Paciente
  const [pacienteNombreDisplay, setPacienteNombreDisplay] = useState('');
  const [pacienteId, setPacienteId]             = useState<string | null>(null);
  const [pacienteSearch, setPacienteSearch]     = useState('');
  const [pacientesBuscados, setPacientesBuscados] = useState<any[]>([]);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);

  const listaAntes   = registros.filter(r => r.fase === 'ANTES');
  const listaDespues = registros.filter(r => r.fase === 'DESPUES');
  const antesComp    = listaAntes[antesSelIdx] ?? listaAntes[0];
  const despuesComp  = listaDespues[despuesSelIdx] ?? listaDespues[0];

  const navZoom = useCallback((dir: 1 | -1) => {
    setZoom(prev => {
      if (!prev) return null;
      const idx = registros.findIndex(r => r.id === prev.id);
      const next = registros[(idx + dir + registros.length) % registros.length];
      setSelRegistro(next);
      return next;
    });
  }, [registros]);

  const eliminarRegistro = useCallback((id: number) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
    setZoom(prev => (prev?.id === id ? null : prev));
    setSelRegistro(prev => (prev?.id === id ? null : prev));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setZoom(null); return; }
      if (e.key === 'ArrowLeft')  navZoom(-1);
      if (e.key === 'ArrowRight') navZoom(1);
    };
    if (zoom) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoom, navZoom]);

  // Auto-guardar registros en localStorage cuando cambian
  useEffect(() => {
    if (!pacienteId) return;
    try {
      localStorage.setItem(`sarai_visual_${pacienteId}`, JSON.stringify(registros));
    } catch {
      // Cuota de almacenamiento excedida
    }
  }, [registros, pacienteId]);

  // Auto-guardar análisis
  useEffect(() => {
    if (!pacienteId) return;
    try {
      localStorage.setItem(`sarai_analisis_${pacienteId}`, JSON.stringify(analisis));
    } catch { /* cuota */ }
  }, [analisis, pacienteId]);

  const buscarPaciente = async () => {
    const q = pacienteSearch.trim();
    if (!q) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setBuscandoPaciente(true);
    try {
      const res = await searchPacientes(q, token);
      const list = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setPacientesBuscados(list);
    } catch {
      setPacientesBuscados([]);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const agregar = useCallback((r: Omit<RegistroVisual, 'id'>) => {
    const nuevo = {
      ...r, id: Date.now(),
      pacienteNombre: pacienteNombreDisplay || undefined,
      pacienteId: pacienteId || undefined,
    };
    setRegistros(prev => [nuevo, ...prev]);
    setSelRegistro(nuevo);
  }, [pacienteNombreDisplay, pacienteId]);

  const abrirModal = (fase: FaseEvolucion = 'ANTES', dia = 0) => {
    setFaseModal(fase); setDiaModal(dia); setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col">

      {/* HEADER */}
      <div className="border-b border-white/5 bg-[#0a0c12]/90 backdrop-blur-xl px-6 py-4 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Eye size={18} className="text-white"/>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Visual Clinico</h1>
              <p className="text-gray-500 text-xs">Centro de Inteligencia Visual · SARAI Vision</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVerGaleria(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                verGaleria ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/8 text-gray-400 hover:bg-white/8'
              }`}>
              <Layers size={13}/> Galeria ({registros.length})
            </button>
            <button onClick={() => abrirModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-500/20">
              <Camera size={14}/> Nueva Captura
            </button>
          </div>
        </div>
      </div>

      {/* SELECTOR DE PACIENTE */}
      <div className="px-6 py-3 border-b border-white/5 bg-[#080a0f]/90 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto relative">
          {pacienteNombreDisplay ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-emerald-400"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider leading-none">Paciente activo</p>
                <p className="text-sm text-white font-semibold truncate mt-0.5">{pacienteNombreDisplay}</p>
              </div>
              <button
                onClick={() => { setPacienteNombreDisplay(''); setPacienteId(null); setRegistros([]); setSelRegistro(null); setAnalisis([]); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 text-gray-500 hover:text-gray-300 rounded-xl text-xs transition">
                <X size={11}/> Cambiar paciente
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-gray-600"/>
              </div>
              <p className="text-sm text-gray-600">Sin paciente —</p>
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={pacienteSearch}
                  onChange={e => setPacienteSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarPaciente()}
                  placeholder="Buscar por nombre o documento..."
                  className="flex-1 max-w-xs bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <button onClick={buscarPaciente} disabled={buscandoPaciente}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-medium transition disabled:opacity-50">
                  <Search size={12}/> {buscandoPaciente ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {pacientesBuscados.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30">
                  {pacientesBuscados.map((p: any) => (
                    <button key={p.id}
                      onClick={() => {
                        const pid = p.id;
                        // Cargar registros guardados para este paciente
                        try {
                          const saved = localStorage.getItem(`sarai_visual_${pid}`);
                          if (saved) {
                            const parsed = JSON.parse(saved);
                            setRegistros(parsed.map((r: any) => ({ ...r, fecha: new Date(r.fecha) })));
                          } else {
                            setRegistros([]);
                          }
                        } catch {
                          setRegistros([]);
                        }
                        // Cargar análisis guardados
                        try {
                          const savedA = localStorage.getItem(`sarai_analisis_${pid}`);
                          if (savedA) {
                            const parsedA = JSON.parse(savedA);
                            setAnalisis(parsedA.map((a: any) => ({ ...a, fechaAnalisis: new Date(a.fechaAnalisis) })));
                          } else {
                            setAnalisis([]);
                          }
                        } catch {
                          setAnalisis([]);
                        }
                        setPacienteNombreDisplay(p.nombreCompleto);
                        setPacienteId(pid);
                        setPacientesBuscados([]);
                        setPacienteSearch('');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/8 border-b border-white/5 last:border-0 text-left transition">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-emerald-400"/>
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{p.nombreCompleto}</p>
                        <p className="text-gray-500 text-[10px]">{p.tipoDocumento} {p.numeroDocumento}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LINEA DE PROGRESO */}
      <LineaProgreso registros={registros}/>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-5 space-y-5">

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Registros',   value: registros.length,                                                                                       icon: Camera, color: 'text-blue-400',   bg: 'bg-blue-500/5'   },
              { label: 'Antes / Despues',   value: `${registros.filter(r=>r.fase==='ANTES').length} / ${registros.filter(r=>r.fase==='DESPUES').length}`,  icon: Eye,    color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
              { label: 'Dias Documentados', value: new Set(registros.map(r => r.diaProcedimiento)).size,                                                   icon: Clock,  color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
              { label: 'Optimizados IA',    value: registros.filter(r => r.ia_ready).length,                                                               icon: Brain,  color: 'text-purple-400', bg: 'bg-purple-500/5' },
            ].map(k => (
              <div key={k.label} className={`${k.bg} border border-white/8 rounded-2xl p-4 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-xl ${k.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                  <k.icon size={17} className={k.color}/>
                </div>
                <div>
                  <p className={`text-lg font-bold leading-tight ${k.color}`}>{k.value}</p>
                  <p className="text-[11px] text-white/60">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* COMPARADOR + DATOS CLINICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
                <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <ChevronsLeftRight size={13} className="text-blue-400"/>
                  Comparador Antes / Despues
                  {antesComp && despuesComp && (
                    <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
                      <ZoomIn size={9}/> Arrastra para comparar
                    </span>
                  )}
                </p>
                <ComparadorSlider
                  antes={antesComp}
                  despues={despuesComp}
                  onSubirAntes={() => abrirModal('ANTES', 0)}
                  onSubirDespues={() => abrirModal('DESPUES', 7)}
                />
                {/* Selector cuando hay múltiples fotos ANTES o DESPUÉS */}
                {(listaAntes.length > 1 || listaDespues.length > 1) && (
                  <div className="mt-3 flex gap-4 border-t border-white/5 pt-3">
                    {listaAntes.length > 1 && (
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-600 mb-1.5">🔵 Elegir foto ANTES ({listaAntes.length})</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {listaAntes.map((r, i) => (
                            <button key={r.id} onClick={() => setAntesSelIdx(i)}
                              className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                                i === antesSelIdx ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-white/10 hover:border-white/30'
                              }`}>
                              <img src={r.src} alt="" className="w-full h-full object-cover"/>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {listaDespues.length > 1 && (
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-600 mb-1.5">✅ Elegir foto DESPUÉS ({listaDespues.length})</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {listaDespues.map((r, i) => (
                            <button key={r.id} onClick={() => setDespuesSelIdx(i)}
                              className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                                i === despuesSelIdx ? 'border-emerald-500 ring-1 ring-emerald-500/40' : 'border-white/10 hover:border-white/30'
                              }`}>
                              <img src={r.src} alt="" className="w-full h-full object-cover"/>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-1">
              <DatosClinicosPanel
                registro={selRegistro ?? despuesComp ?? antesComp}
                total={registros.length}
                onVerTodos={() => setVerGaleria(true)}
              />
            </div>
          </div>

          {/* TIMELINE POR DIAS */}
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
            <TimelineDias registros={registros} onAgregarEnDia={(dia, fase) => abrirModal(fase, dia)}/>
          </div>

          {/* ANALISIS DE CAMBIOS */}
          <PanelAnalisisCambios
            analisis={analisis}
            onNuevo={() => setShowAnalisisModal(true)}
            onEliminar={id => setAnalisis(prev => prev.filter(a => a.id !== id))}
          />

          {/* GALERIA */}
          <AnimatePresence>
            {verGaleria && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers size={14} className="text-purple-400"/> Galeria Completa
                    </p>
                    <div className="flex gap-2">
                      {FASES.map(f => {
                        const n = registros.filter(r => r.fase === f.id).length;
                        if (n === 0) return null;
                        return <span key={f.id} className={`text-[10px] px-2 py-0.5 rounded-full ${f.bg} ${f.color} border ${f.border}`}>{f.emoji} {n}</span>;
                      })}
                    </div>
                  </div>
                  {registros.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-2">
                      <Camera size={28} className="text-gray-700"/>
                      <p className="text-gray-500 text-sm">Sin registros visuales aun</p>
                      <button onClick={() => abrirModal()}
                        className="mt-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-medium transition">
                        + Primera captura
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {registros.map(r => (
                        <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          onClick={() => { setZoom(r); setSelRegistro(r); }}
                          className="group relative bg-[#080a0f] border border-white/8 rounded-xl overflow-hidden cursor-pointer hover:border-white/20 transition-all">
                          <div className="aspect-square overflow-hidden relative">
                            <img src={r.src} alt={r.fase} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200">
                              <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"/>
                            </div>
                          </div>
                          <div className="p-1.5 space-y-0.5">
                            <FaseBadge fase={r.fase}/>
                            {r.pacienteNombre && <p className="text-[9px] text-emerald-400 font-medium truncate">{r.pacienteNombre}</p>}
                            <p className="text-[9px] text-gray-500">{r.fecha.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</p>
                            {r.diaProcedimiento > 0 && <p className="text-[9px] text-yellow-500/70">Día {r.diaProcedimiento}</p>}
                          </div>
                          {r.ia_ready && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500/30 border border-purple-500/50 flex items-center justify-center">
                              <Brain size={9} className="text-purple-400"/>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ROADMAP IA */}
          <div className="bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-violet-500/5 border border-purple-500/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Brain size={13} className="text-purple-400"/>
              </div>
              <p className="text-sm font-bold text-white">SARAI Vision — Roadmap de Inteligencia Visual</p>
              <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">EN CONSTRUCCION</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { num: 1, label: 'Documentacion clinica',    estado: 'activa'    },
                { num: 2, label: 'Comparacion avanzada',     estado: 'activa'    },
                { num: 3, label: 'Analisis de cambios',      estado: 'activa'    },
                { num: 4, label: 'IA asistida (CV)',         estado: 'pendiente' },
                { num: 5, label: 'Gemelo Digital Clinico',   estado: 'pendiente' },
                { num: 6, label: 'Prediccion terapeutica',   estado: 'pendiente' },
              ].map(fase => (
                <div key={fase.num} className={`p-3 rounded-xl border text-center ${
                  fase.estado === 'activa'   ? 'bg-emerald-500/8 border-emerald-500/25' :
                  fase.estado === 'progreso' ? 'bg-blue-500/8 border-blue-500/25' : 'bg-white/2 border-white/5'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 ${
                    fase.estado === 'activa'   ? 'bg-emerald-500/30 text-emerald-400' :
                    fase.estado === 'progreso' ? 'bg-blue-500/30 text-blue-400' : 'bg-white/8 text-gray-600'
                  }`}>{fase.num}</div>
                  <p className={`text-[10px] font-medium leading-tight ${
                    fase.estado === 'activa' ? 'text-emerald-400' :
                    fase.estado === 'progreso' ? 'text-blue-400' : 'text-gray-600'
                  }`}>{fase.label}</p>
                  <p className={`text-[9px] mt-0.5 ${
                    fase.estado === 'activa' ? 'text-emerald-600' :
                    fase.estado === 'progreso' ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {fase.estado === 'activa' ? '● Activa' : fase.estado === 'progreso' ? '◐ Progreso' : '○ Pendiente'}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <ModalNuevaCaptura faseInicial={faseModal} diaInicial={diaModal}
            onClose={() => setShowModal(false)} onGuardar={agregar}/>
        )}
      </AnimatePresence>

      {/* MODAL ANALISIS */}
      <AnimatePresence>
        {showAnalisisModal && (
          <ModalNuevoAnalisis
            onClose={() => setShowAnalisisModal(false)}
            onGuardar={a => setAnalisis(prev => [{ ...a, id: Date.now() }, ...prev])}
          />
        )}
      </AnimatePresence>

      {/* ZOOM */}
      <AnimatePresence>
        {zoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setZoom(null)}>
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }}
              className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>

              {/* Navegación anterior */}
              {registros.length > 1 && (
                <button onClick={() => navZoom(-1)}
                  className="absolute -left-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition z-10">
                  <ChevronLeft size={20} className="text-white"/>
                </button>
              )}

              <img src={zoom.src} alt="Zoom" className="w-full max-h-[75vh] object-contain rounded-2xl"/>

              {/* Navegación siguiente */}
              {registros.length > 1 && (
                <button onClick={() => navZoom(1)}
                  className="absolute -right-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition z-10">
                  <ChevronRight size={20} className="text-white"/>
                </button>
              )}

              {/* Barra superior: fase + contador */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <FaseBadge fase={zoom.fase}/>
                {registros.length > 1 && (
                  <span className="text-[10px] text-gray-400 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                    {registros.findIndex(r => r.id === zoom.id) + 1} / {registros.length}
                  </span>
                )}
              </div>

              {/* Acciones: usar en comparador + eliminar + cerrar */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {zoom.fase === 'ANTES' && listaAntes.length > 0 && (
                  <button
                    onClick={() => { const i = listaAntes.findIndex(r => r.id === zoom.id); if (i !== -1) setAntesSelIdx(i); setZoom(null); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 rounded-xl text-[10px] font-semibold transition">
                    🔵 Usar en comparador
                  </button>
                )}
                {zoom.fase === 'DESPUES' && listaDespues.length > 0 && (
                  <button
                    onClick={() => { const i = listaDespues.findIndex(r => r.id === zoom.id); if (i !== -1) setDespuesSelIdx(i); setZoom(null); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl text-[10px] font-semibold transition">
                    ✅ Usar en comparador
                  </button>
                )}
                <button onClick={() => eliminarRegistro(zoom.id)}
                  title="Eliminar registro"
                  className="w-8 h-8 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition">
                  <Trash2 size={14} className="text-red-400"/>
                </button>
                <button onClick={() => setZoom(null)}
                  title="Cerrar (ESC)"
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition">
                  <X size={16} className="text-white"/>
                </button>
              </div>

              {/* Info inferior */}
              {(zoom.procedimiento || zoom.region || zoom.notas || zoom.pacienteNombre) && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-2.5 rounded-xl space-y-1">
                  {zoom.pacienteNombre && (
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/8">
                      <User size={10} className="text-emerald-400 flex-shrink-0"/>
                      <p className="text-emerald-400 text-[10px] font-semibold truncate">{zoom.pacienteNombre}</p>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      {zoom.procedimiento && (
                        <p className="text-white text-xs font-semibold truncate">{zoom.procedimiento}</p>
                      )}
                      <p className="text-gray-400 text-[10px]">
                        {zoom.region}
                        {zoom.region && ' · '}
                        {zoom.fecha.toLocaleDateString('es-CO')}
                        {zoom.diaProcedimiento > 0 && (
                          <span className="text-yellow-400 ml-1">· Día {zoom.diaProcedimiento}</span>
                        )}
                      </p>
                    </div>
                    {zoom.ia_ready && (
                      <span className="flex items-center gap-1 text-[9px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-lg flex-shrink-0">
                        <Brain size={8}/> IA Ready
                      </span>
                    )}
                  </div>
                  {zoom.notas && (
                    <p className="text-gray-400 text-[10px] border-t border-white/8 pt-1.5 leading-relaxed line-clamp-2">
                      {zoom.notas}
                    </p>
                  )}
                  {zoom.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-0.5">
                      {zoom.tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hint teclado */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-gray-700 flex items-center gap-2 whitespace-nowrap">
                <span>← → navegar</span><span>·</span><span>ESC cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
