import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RenalDashboard } from './pages/renal/RenalDashboard';
import { HemodialisisPage } from './pages/renal/HemodialisisPage';
import { TurnosHDPage } from './pages/renal/TurnosHDPage';
import { PreDialisisPage } from './pages/renal/PreDialisisPage';
import { TrasplantePage } from './pages/renal/TrasplantePage';
import { DialisisPeritonealPage } from './pages/renal/DialisisPeritonealPage';
import { VIHPage } from './pages/VIHPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';

// ── Sub-módulos disponibles ───────────────────────────────────

type SubModulo =
  | 'dashboard'
  | 'renal.dashboard'
  | 'renal.hemodialisis'
  | 'renal.turnos'
  | 'renal.predialisis'
  | 'renal.peritoneal'
  | 'renal.trasplante'
  | 'vih.dashboard'
  | 'configuracion';

interface NavItem {
  id: SubModulo;
  label: string;
  icon: string;
  disabled?: boolean;
}

const NAV_GRUPOS: { label: string; color: string; items: NavItem[] }[] = [
  {
    label: 'General',
    color: '#00B4D8',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'Programa Renal',
    color: '#4fc3f7',
    items: [
      { id: 'renal.dashboard',    label: 'Dashboard Renal',    icon: '🫀' },
      { id: 'renal.hemodialisis', label: 'Hemodiálisis',        icon: '💧' },
      { id: 'renal.turnos',       label: 'Turnos HD',           icon: '📅' },
      { id: 'renal.peritoneal',   label: 'Diálisis Peritoneal', icon: '🫀' },
      { id: 'renal.predialisis',  label: 'Pre-diálisis',        icon: '⚕️' },
      { id: 'renal.trasplante',   label: 'Trasplante',          icon: '🏥' },
    ],
  },
  {
    label: 'Programa VIH',
    color: '#a855f7',
    items: [
      { id: 'vih.dashboard', label: 'VIH / TAR', icon: '🔬' },
    ],
  },
  {
    label: 'Configuración',
    color: '#6b7280',
    items: [
      { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
    ],
  },
];

// ── Dashboard general del módulo ─────────────────────────────

type ProgramaActivoMap = Record<string, boolean>;

const PROGRAMAS_DISPONIBLES = [
  { codigo: 'RENAL', id: 'renal.dashboard' as SubModulo, titulo: 'Programa Renal',      descripcion: 'Nefroprotección · Hemodiálisis · Diálisis Peritoneal · Trasplante', icon: '🫀', color: '#00B4D8', noPuedeDesactivar: true },
  { codigo: 'VIH',   id: 'vih.dashboard'   as SubModulo, titulo: 'Programa VIH',        descripcion: 'TAR · Carga Viral · CD4 · Adherencia · Dispensación',                icon: '🔬', color: '#a855f7', noPuedeDesactivar: false },
  { codigo: 'DIAB',  id: 'dashboard'       as SubModulo, titulo: 'Programa Diabetes',   descripcion: 'Control glicémico · HbA1c · Complicaciones · Pie diabético',          icon: '🩺', color: '#f59e0b', noPuedeDesactivar: false },
  { codigo: 'HEMO',  id: 'dashboard'       as SubModulo, titulo: 'Hemofilia',            descripcion: 'Factor VIII/IX · Profilaxis · Eventos hemorrágicos',                  icon: '🩸', color: '#ef4444', noPuedeDesactivar: false },
  { codigo: 'ART',   id: 'dashboard'       as SubModulo, titulo: 'Artritis Reumatoide', descripcion: 'Biológicos · DAS28 · Seguimiento reumatológico',                       icon: '🦴', color: '#22c55e', noPuedeDesactivar: false },
  { codigo: 'ONC',   id: 'dashboard'       as SubModulo, titulo: 'Oncología',            descripcion: 'Quimioterapia · Seguimiento oncológico · Toxicidades',                 icon: '🎗️', color: '#ec4899', noPuedeDesactivar: false },
];

function cargarEstadoInicialProgramas(): ProgramaActivoMap {
  try {
    const guardado = localStorage.getItem('sarai_programas_activos');
    if (guardado) return JSON.parse(guardado);
  } catch { /* ignore */ }
  return { RENAL: true, VIH: true, DIAB: false, HTA: false, HEMO: false, ART: false, ONC: false };
}

function DashboardGeneral({
  onNavegar,
  programasActivos,
}: {
  onNavegar: (id: SubModulo) => void;
  programasActivos: ProgramaActivoMap;
}) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/20 flex items-center justify-center text-xl">⚕️</div>
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">
              Programas Especializados
            </h1>
            <p className="text-white/40 text-sm">
              Módulo de Alto Costo · Sistema SARAI · Norma colombiana
            </p>
          </div>
        </div>
      </div>

      {/* Programas disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PROGRAMAS_DISPONIBLES.map((prog) => {
          const activo = !!programasActivos[prog.codigo];
          return (
            <motion.button
              key={prog.titulo}
              whileHover={activo ? { scale: 1.02 } : {}}
              onClick={() => activo && onNavegar(prog.id)}
              disabled={!activo}
              className={`relative text-left p-5 rounded-xl border transition-all overflow-hidden ${
                activo
                  ? 'border-white/12 bg-white/5 hover:bg-white/8 cursor-pointer'
                  : 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
              }`}
            >
              {!activo && (
                <span className="absolute top-3 right-3 text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full border border-white/10">
                  Inactivo
                </span>
              )}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${prog.color}, transparent)` }}
              />
              <div className="text-3xl mb-3">{prog.icon}</div>
              <h3 className="text-white font-bold text-base mb-1">{prog.titulo}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{prog.descripcion}</p>
              {activo && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">Activo</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Normativa */}
      <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
        <h3 className="text-white/70 font-semibold text-sm mb-2">📋 Normativa Aplicable</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { norma: 'Res. 3241/2008', desc: 'Condiciones de habilitación unidades renales' },
            { norma: 'Circular 030/2006', desc: 'Instrucciones manejo pacientes ERC en diálisis' },
            { norma: 'Acuerdo 029/2011', desc: 'Plan obligatorio de salud – ERC' },
            { norma: 'Res. 2463/2014', desc: 'Cuenta de Alto Costo – Sistema de información' },
            { norma: 'Res. 4725/2014', desc: 'Lineamientos técnicos fibrosis quística, VIH, ERC' },
          ].map((n) => (
            <div key={n.norma} className="flex gap-2 text-xs">
              <span className="text-[#00B4D8] font-mono shrink-0">{n.norma}</span>
              <span className="text-white/40">{n.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Componente raíz del módulo ────────────────────────────────

interface Props {
  moduloInicial?: SubModulo;
}

export default function ProgramasEspecialesModule({ moduloInicial = 'dashboard' }: Props) {
  const [subModulo, setSubModulo] = useState<SubModulo>(moduloInicial);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [programasActivos, setProgramasActivos] = useState<ProgramaActivoMap>(cargarEstadoInicialProgramas);

  const togglePrograma = (codigo: string) => {
    setProgramasActivos(prev => {
      const nuevo = { ...prev, [codigo]: !prev[codigo] };
      try { localStorage.setItem('sarai_programas_activos', JSON.stringify(nuevo)); } catch { /* ignore */ }
      return nuevo;
    });
  };

  const renderContenido = () => {
    switch (subModulo) {
      case 'dashboard':
        return <DashboardGeneral onNavegar={setSubModulo} programasActivos={programasActivos} />;
      case 'renal.dashboard':
        return (
          <div className="p-6 overflow-y-auto">
            <RenalDashboard
              onNavegarPacientes={() => setSubModulo('renal.hemodialisis')}
              onNavegarHemodialisis={() => setSubModulo('renal.hemodialisis')}
            />
          </div>
        );
      case 'renal.hemodialisis':
        return <HemodialisisPage />;
      case 'renal.turnos':
        return <div className="p-6 overflow-y-auto h-full"><TurnosHDPage /></div>;
      case 'renal.peritoneal':
        return <div className="overflow-y-auto h-full"><DialisisPeritonealPage /></div>;
      case 'renal.predialisis':
        return <div className="overflow-y-auto h-full"><PreDialisisPage /></div>;
      case 'renal.trasplante':
        return <div className="overflow-y-auto h-full"><TrasplantePage /></div>;
      case 'vih.dashboard':
        return <div className="overflow-y-auto h-full"><VIHPage /></div>;
      case 'configuracion':
        return (
          <div className="overflow-y-auto h-full">
            <ConfiguracionPage
              programasActivos={programasActivos}
              onTogglePrograma={togglePrograma}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-white/30 text-2xl mb-2">🚧</p>
              <p className="text-white/40">Módulo en desarrollo</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-[#0a0c10]">
      {/* Sidebar interno del módulo */}
      <motion.div
        animate={{ width: sidebarExpanded ? 220 : 52 }}
        className="flex-shrink-0 border-r border-white/5 bg-[#0d0f14] overflow-hidden flex flex-col"
      >
        {/* Toggle + título */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider truncate"
              >
                Programas Esp.
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="text-white/30 hover:text-white/60 transition-colors text-sm shrink-0"
          >
            {sidebarExpanded ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GRUPOS.map((grupo) => (
            <div key={grupo.label} className="mb-1">
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 py-1 text-xs font-semibold text-white/25 uppercase tracking-wider"
                    style={{ borderLeft: `2px solid ${grupo.color}40` }}
                  >
                    {grupo.label}
                  </motion.p>
                )}
              </AnimatePresence>
              {grupo.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setSubModulo(item.id)}
                  disabled={item.disabled}
                  title={!sidebarExpanded ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    subModulo === item.id
                      ? 'bg-[#00B4D8]/10 text-[#00B4D8]'
                      : item.disabled
                      ? 'text-white/20 cursor-not-allowed'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span className={`text-base shrink-0 ${sidebarExpanded ? '' : 'mx-auto'}`}>
                    {item.icon}
                  </span>
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.disabled && sidebarExpanded && (
                    <span className="ml-auto text-white/20 text-xs">🔒</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={subModulo}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto"
          >
            {renderContenido()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
