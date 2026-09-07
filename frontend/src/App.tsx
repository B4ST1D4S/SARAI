import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralCanvas from './components/NeuralCanvas';
import SaraiAssistant from './components/SaraiAssistant';
import saraiLogo from './assets/LOGO.png';
import { getParametrosSistema } from './services/adminService';
import { useTheme } from './hooks/useTheme';
import { useIam } from './context/IamContext';
import LaunchpadHub, { SARAI_DEFAULT_TILES } from './components/layout/LaunchpadHub';

// ── Rutas Organizadas por Dominio ──
// Core & Auth
import AuthPage from './pages/auth/AuthPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Consulta Externa
import PacientesPage from './pages/consulta-externa/PacientesPage';
import HistoriaClinicaPage from './pages/consulta-externa/HistoriaClinicaPage';
import AgendaPage from './pages/consulta-externa/AgendaPage';
import AgendaProfesionalPage from './pages/consulta-externa/AgendaProfesionalPage';
import ConfigAgendaPage from './pages/consulta-externa/ConfigAgendaPage';
import AdmisionPage from './pages/consulta-externa/AdmisionPage';
import FollowUpPage from './pages/consulta-externa/FollowUpPage';
import OdontogramaPage from './pages/consulta-externa/OdontogramaPage';
import MapaCorporalPage from './pages/consulta-externa/MapaCorporalPage';

// Quirófano & Cirugía
import VistaCirujanoPage from './pages/quirofano/VistaCirujanoPage';
import VisualClinicoPage from './pages/quirofano/VisualClinicoPage';
import ConsentimientoPage from './pages/quirofano/ConsentimientoPage';
import { Body3DTestPage } from './pages/quirofano/Body3DTestPage';

// Facturación, Contratación & RIPS
import FacturacionPage from './pages/facturacion/FacturacionPage';
import CotizacionesPage from './pages/facturacion/CotizacionesPage';
import ContratacionPage from './pages/facturacion/ContratacionPage';
import CRMPage from './pages/facturacion/CRMPage';
import CentralImpresionPage from './pages/facturacion/CentralImpresionPage';

// Administración & Configuración
import AdminPage from './pages/admin/AdminPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import SeguridadPage from './pages/admin/SeguridadPage';
import PlantillasPage from './pages/admin/PlantillasPage';
import ManualPage from './pages/admin/ManualPage';

export type NavMode = 'hub' | 'sidebar';

const NAV_RECURSO: Record<string, string> = {
  dashboard:          'DASHBOARD',
  pacientes:          'CLINICA.PACIENTES',
  historia:           'CLINICA.HISTORIA',
  fotos:              'CLINICA.VISUAL',
  odontograma:        'CLINICA.ODONTOGRAMA',
  'mapa-corporal':    'CLINICA.MAPA',
  agenda:             'AGENDA.CITAS',
  admision:           'AGENDA.ADMISION',
  agendaProfesional:  'AGENDA.PROFESIONAL',
  'config-agenda':    'AGENDA.CONFIG',
  'vista-cirujano':   'AGENDA.CIRUGIA',
  cotizaciones:       'GESTION.COTIZACIONES',
  crm:                'GESTION.CRM',
  facturacion:        'GESTION.FACTURACION',
  plantillas:         'GESTION.PLANTILLAS',
  impresion:          'GESTION.IMPRESION',
  admin:              'ADMIN.PARAMETRIZACION',
  usuarios:           'ADMIN.USUARIOS',
  seguridad:          'SEGURIDAD',
};

export const MACRO_MODULES_NAV: Record<string, { label: string; items: { id: string; label: string; sym: string }[] }> = {
  CONSULTA: {
    label: 'CONSULTA EXTERNA',
    items: [
      { id: 'agenda',            label: 'Agenda Paciente',    sym: 'A' },
      { id: 'agendaProfesional', label: 'Mi Agenda Médica',   sym: 'G' },
      { id: 'admision',          label: 'Admisión / Triaje',  sym: 'N' },
      { id: 'pacientes',         label: 'Pacientes',          sym: 'P' },
      { id: 'historia',          label: 'Historia Clínica',   sym: 'H' },
      { id: 'followup',          label: 'Seguimiento',        sym: 'W' },
    ],
  },
  CIRUGIA: {
    label: 'CIRUGÍA & QUIRÓFANO',
    items: [
      { id: 'vista-cirujano',    label: 'Quirófano Activo',   sym: 'Q' },
      { id: 'fotos',             label: 'Registro Visual',    sym: 'V' },
      { id: 'consentimiento',    label: 'Consentimientos',    sym: 'K' },
    ],
  },
  FACTURACION: {
    label: 'FACTURACIÓN & RIPS',
    items: [
      { id: 'facturacion',       label: 'Cuentas & Facturas', sym: 'F' },
      { id: 'cotizaciones',      label: 'Cotizaciones',       sym: 'T' },
      { id: 'contratacion',      label: 'Contratación',       sym: 'C' },
      { id: 'crm',               label: 'CRM Comercial',      sym: 'R' },
      { id: 'impresion',         label: 'Central Impresión',  sym: 'I' },
    ],
  },
  ADMINISTRACION: {
    label: 'ADMINISTRACIÓN & TI',
    items: [
      { id: 'admin',             label: 'Parametrización',    sym: 'Z' },
      { id: 'usuarios',          label: 'Usuarios',           sym: 'U' },
      { id: 'seguridad',         label: 'Seguridad & IAM',    sym: 'E' },
      { id: 'config-agenda',     label: 'Configurar Agenda',  sym: 'S' },
      { id: 'plantillas',        label: 'Plantillas Médicas', sym: 'L' },
      { id: 'manual',            label: 'Manual de Usuario',  sym: '?' },
    ],
  },
};

function Sidebar({
  currentPage,
  setCurrentPage,
  navMode,
  activeMacroModule,
  onVolverAlHub,
  user,
  handleLogout,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  currentPage: string;
  setCurrentPage: (p: string) => void;
  navMode: NavMode;
  activeMacroModule: string | null;
  onVolverAlHub: () => void;
  user: any;
  handleLogout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const effectiveCollapsed = mobileOpen ? false : collapsed;
  const { canDo } = useIam();

  const itemVisible = (id: string) => {
    const recurso = NAV_RECURSO[id];
    if (!recurso) return true;
    return canDo(recurso, 'VER');
  };

  const handleNavClick = (id: string) => {
    setCurrentPage(id);
    setMobileOpen(false);
  };

  const sectionsToRender = (navMode === 'hub' && activeMacroModule)
    ? [{ key: activeMacroModule, ...MACRO_MODULES_NAV[activeMacroModule] }]
    : Object.entries(MACRO_MODULES_NAV).map(([key, val]) => ({ key, ...val }));

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <motion.aside
        animate={{ width: effectiveCollapsed ? 68 : 236 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-[#0d0f14] border-r border-white/5 shadow-2xl overflow-hidden select-none
          transition-[transform] duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-3 h-14 border-b border-white/5 flex-shrink-0">
          {navMode === 'hub' ? (
            <button
              onClick={onVolverAlHub}
              title="Volver a todos los módulos"
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-yellow-400 transition-colors w-full overflow-hidden"
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                ⊞
              </div>
              {!effectiveCollapsed && <span className="tracking-wider uppercase text-[11px]">← Menú Hub</span>}
            </button>
          ) : (
            <AnimatePresence mode="wait">
              {effectiveCollapsed ? (
                <motion.div
                  key="logo-mini"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="w-7 h-7 rounded-xl bg-[#1a1a3e] flex items-center justify-center mx-auto shadow-md overflow-hidden"
                >
                  <img src={saraiLogo} alt="SARAI" className="w-7 h-7 object-contain" />
                </motion.div>
              ) : (
                <motion.span
                  key="logo-full"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-black tracking-tight whitespace-nowrap pl-1"
                >
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">SAR</span>
                  <span className="text-white">AI</span>
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scroll">
          {sectionsToRender.map((section) => (
            <div key={section.key} className="mb-3">
              {!effectiveCollapsed && (
                <p className="px-4 mb-1 text-[9px] font-bold text-yellow-500/70 tracking-widest uppercase truncate">
                  {section.label}
                </p>
              )}
              {effectiveCollapsed && <div className="mx-3 mb-1 border-t border-white/5" />}

              {section.items?.filter((item) => itemVisible(item.id)).map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={effectiveCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all duration-150 relative group ${
                      active
                        ? 'text-yellow-400 bg-yellow-500/[0.08]'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="pill"
                        className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-r-full"
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                    <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border transition-colors duration-150 ${
                      active
                        ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                        : 'border-white/10 bg-white/5 text-gray-500 group-hover:text-gray-300'
                    }`}>
                      {item.sym}
                    </span>
                    {!effectiveCollapsed && (
                      <span className="whitespace-nowrap text-[13px]">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div className={`flex items-center gap-2.5 ${effectiveCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-xs">
              {user?.nombre?.[0]}{user?.apellido?.[0]}
            </div>
            {!effectiveCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.nombre} {user?.apellido}</p>
                <p className="text-gray-600 text-[10px] truncate">{user?.especialidad || user?.rol}</p>
              </div>
            )}
            {!effectiveCollapsed && (
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-400 transition-colors text-xs font-bold px-1.5 py-0.5 rounded border border-white/10 hover:border-red-500/30 whitespace-nowrap"
              >
                salir
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeMacroModule, setActiveMacroModule] = useState<string | null>(null);
  const [navMode, setNavMode] = useState<NavMode>(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.preferencias?.navMode) return u.preferencias.navMode;
      }
      return (localStorage.getItem('sarai_nav_mode') as NavMode) || 'hub';
    } catch {
      return 'hub';
    }
  });

  const { canDo } = useIam();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historiaShowForm, setHistoriaShowForm] = useState(false);
  const [historiaSeccion, setHistoriaSeccion] = useState<string>('motivo-consulta');
  const [historiaSeccionActiva, setHistoriaSeccionActiva] = useState<string>('motivo-consulta');
  const [historiaPacienteId, setHistoriaPacienteId] = useState<string | undefined>(undefined);
  const camposHandlerRef = useRef<((c: Record<string, string>) => void) | null>(null);
  const [clinicaConfig, setClinicaConfig] = useState<{ nombre: string; logoUrl: string }>(() => {
    try {
      const cached = localStorage.getItem('sarai_clinica_config');
      return cached ? JSON.parse(cached) : { nombre: '', logoUrl: '' };
    } catch { return { nombre: '', logoUrl: '' }; }
  });
  const { theme } = useTheme();
  const [hotkeyToast, setHotkeyToast] = useState<string | null>(null);
  const currentPageRef = useRef(currentPage);

  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const saraiRoot = document.querySelector('[data-sarai-estado]');
      if (saraiRoot) {
        const estado = saraiRoot.getAttribute('data-sarai-estado') || '';
        if (['grabando', 'transcribiendo', 'procesando'].includes(estado)) return;
      }
      const key = e.key.toUpperCase();
      const allItems = Object.values(MACRO_MODULES_NAV).flatMap((s) => s.items);
      const match = allItems.find((item) => item.sym.toUpperCase() === key);
      if (!match) return;
      e.preventDefault();
      setCurrentPage(match.id);
      setHotkeyToast(match.label);
      setTimeout(() => setHotkeyToast(null), 1800);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
      const page = new URLSearchParams(window.location.search).get('page') || 'dashboard';
      setCurrentPage(page);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (getParametrosSistema('clinica') as Promise<any[]>)
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.clave] = p.valor; });
        const config = { nombre: map['nombre_clinica'] || '', logoUrl: map['logo_url'] || '' };
        setClinicaConfig(config);
        localStorage.setItem('sarai_clinica_config', JSON.stringify(config));
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('auth');
    setClinicaConfig({ nombre: '', logoUrl: '' });
    localStorage.removeItem('sarai_clinica_config');
  };

  if (!user) {
    return <AuthPage />;
  }

  const isHubViewActive = navMode === 'hub' && activeMacroModule === null && currentPage === 'dashboard';
  const shouldRenderSidebar = navMode === 'sidebar' || (navMode === 'hub' && activeMacroModule !== null);

  return (
    <div className="min-h-screen bg-[#080a0f] flex">
      <NeuralCanvas opacity={0.13} nodeCount={100} />

      {hotkeyToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #d4af37, #f0c040)',
            color: '#0a0a0f',
            padding: '0.55rem 1.4rem',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.88rem',
            letterSpacing: '0.03em',
            boxShadow: '0 4px 24px rgba(212,175,55,0.45)',
            zIndex: 99999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ⌨️ {hotkeyToast}
        </div>
      )}

      {shouldRenderSidebar && (
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          navMode={navMode}
          activeMacroModule={activeMacroModule}
          onVolverAlHub={() => {
            setActiveMacroModule(null);
            setCurrentPage('dashboard');
          }}
          user={user}
          handleLogout={handleLogout}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
      )}

      <main className="flex-1 min-h-screen overflow-auto">
        <div
          className={`min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isHubViewActive
              ? 'ml-0'
              : sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[236px]'
          }`}
        >
          {/* Topbar despejada y limpia */}
          {(() => {
            const T = {
              'dark':             { bg: 'bg-[#0a0c13]',    border: 'border-white/[0.06]',   nameGrad: 'from-yellow-300 via-amber-400 to-yellow-500',     date: 'text-gray-400',    dateSub: 'text-gray-600'    },
              'premium-light':    { bg: 'bg-white',         border: 'border-slate-200',      nameGrad: 'from-blue-700 via-indigo-600 to-blue-800',         date: 'text-slate-600',   dateSub: 'text-slate-400'   },
              'soft-medical':     { bg: 'bg-slate-50',      border: 'border-slate-200',      nameGrad: 'from-teal-600 via-cyan-600 to-teal-700',           date: 'text-slate-500',   dateSub: 'text-slate-400'   },
              'executive-ai':     { bg: 'bg-[#0c1220]',     border: 'border-blue-400/12',    nameGrad: 'from-blue-400 via-violet-400 to-blue-500',         date: 'text-blue-300/70', dateSub: 'text-blue-400/40' },
              'rose-care':        { bg: 'bg-white',         border: 'border-rose-200',       nameGrad: 'from-rose-600 via-pink-500 to-rose-700',           date: 'text-slate-500',   dateSub: 'text-slate-400'   },
              'fuchsia-premium':  { bg: 'bg-white',         border: 'border-fuchsia-200',    nameGrad: 'from-fuchsia-600 via-purple-500 to-fuchsia-700',   date: 'text-slate-500',   dateSub: 'text-slate-400'   },
              'purple-care':      { bg: 'bg-white',         border: 'border-violet-200',     nameGrad: 'from-violet-700 via-purple-600 to-violet-800',     date: 'text-slate-500',   dateSub: 'text-slate-400'   },
              'arctic-blue':      { bg: 'bg-white',         border: 'border-sky-200',        nameGrad: 'from-sky-700 via-blue-600 to-sky-800',             date: 'text-slate-500',   dateSub: 'text-slate-400'   },
              'mint-premium':     { bg: 'bg-white',         border: 'border-teal-200',       nameGrad: 'from-teal-700 via-emerald-600 to-teal-800',        date: 'text-slate-500',   dateSub: 'text-slate-400'   },
              'sunset-care':      { bg: 'bg-white',         border: 'border-amber-200',      nameGrad: 'from-amber-600 via-orange-500 to-amber-700',       date: 'text-slate-500',   dateSub: 'text-slate-400'   },
            }[theme] ?? { bg: 'bg-[#0a0c13]', border: 'border-white/[0.06]', nameGrad: 'from-yellow-300 via-amber-400 to-yellow-500', date: 'text-gray-400', dateSub: 'text-gray-600' };

            const hoy = new Date();
            const diaSemana = hoy.toLocaleDateString('es-CO', { weekday: 'long' });
            const fechaCompleta = hoy.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

            return (
              <div className={`sticky top-0 z-20 ${T.bg} backdrop-blur-xl border-b ${T.border} shadow-[0_2px_24px_rgba(0,0,0,0.45)] h-[80px] flex items-center px-4 sm:px-6 relative`}>
                <div className="flex items-center gap-3 flex-shrink-0 z-10">
                  <button className="lg:hidden flex flex-col gap-[5px] p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                    onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">
                    <span className="block w-5 h-[2px] bg-current rounded-full" />
                    <span className="block w-5 h-[2px] bg-current rounded-full" />
                    <span className="block w-3.5 h-[2px] bg-current rounded-full" />
                  </button>
                  {clinicaConfig.logoUrl && (
                    <img
                      src={clinicaConfig.logoUrl}
                      alt="Logo clínica"
                      className="h-14 w-auto object-contain"
                      style={{ maxWidth: '140px', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}
                    />
                  )}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <h1 className={`text-[28px] sm:text-[34px] font-black tracking-wide bg-gradient-to-r ${T.nameGrad} bg-clip-text text-transparent leading-none whitespace-nowrap`}>
                    {clinicaConfig.nombre || 'SARAI'}
                  </h1>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-auto z-10">
                  <div className="hidden md:flex flex-col items-end leading-snug">
                    <span className={`text-[11px] font-semibold capitalize ${T.date}`}>{diaSemana}</span>
                    <span className={`text-[10px] capitalize ${T.dateSub}`}>{fechaCompleta}</span>
                  </div>
                  <div className="w-px h-8 hidden md:block" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} />
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-bold tracking-widest">ONLINE</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* WORKSPACE PRINCIPAL */}
          <div>
            {currentPage === 'dashboard' ? (
              <div className="p-4 sm:p-8">
                <LaunchpadHub
                  userName={user?.nombre ? `Dr. ${user.nombre} ${user.apellido || ''}` : 'Especialista'}
                  showTiles={navMode === 'hub'}
                  tiles={SARAI_DEFAULT_TILES.filter((tile) => {
                    if (tile.id === 'ADMINISTRACION') return canDo('ADMIN.PARAMETRIZACION', 'VER');
                    if (tile.id === 'FACTURACION') return canDo('GESTION.FACTURACION', 'VER');
                    return true;
                  })}
                  onSelectMacroModule={(macroId, defaultPage) => {
                    setActiveMacroModule(macroId);
                    setCurrentPage(defaultPage);
                  }}
                  onQuickAction={(actionId, targetPage) => {
                    if (actionId === 'nueva-historia') {
                      if (navMode === 'hub') setActiveMacroModule('CONSULTA');
                      setHistoriaShowForm(true);
                      setHistoriaSeccion('motivo-consulta');
                      setCurrentPage('historia');
                    } else if (targetPage) {
                      if (navMode === 'hub') {
                        setActiveMacroModule(targetPage === 'admin' ? 'ADMINISTRACION' : 'CONSULTA');
                      }
                      setCurrentPage(targetPage);
                    }
                  }}
                />
              </div>
            ) : (
              <>
                {/* Páginas de Consulta Externa */}
                {currentPage === 'pacientes'           && <PacientesPage />}
                {currentPage === 'historia'            && (
                  <HistoriaClinicaPage
                    onNavegar={setCurrentPage}
                    showFormExternal={historiaShowForm}
                    onShowFormChange={setHistoriaShowForm}
                    seccionExterna={historiaSeccion}
                    onSeccionChange={setHistoriaSeccion}
                    onSeccionActivaChange={setHistoriaSeccionActiva}
                    onRegisterCampos={(fn) => { camposHandlerRef.current = fn; }}
                    pacienteIdExterno={historiaPacienteId}
                  />
                )}
                {currentPage === 'agenda'              && <AgendaPage />}
                {currentPage === 'admision'            && <AdmisionPage />}
                {currentPage === 'config-agenda'       && <ConfigAgendaPage />}
                {currentPage === 'agendaProfesional'   && (
                  <AgendaProfesionalPage
                    onNavegar={setCurrentPage}
                    onAbrirHistoriaPaciente={(pacienteId, _nombre) => {
                      setHistoriaPacienteId(pacienteId);
                      setHistoriaShowForm(true);
                      setHistoriaSeccion('motivo-consulta');
                      if (navMode === 'hub') setActiveMacroModule('CONSULTA');
                      setCurrentPage('historia');
                    }}
                  />
                )}
                {currentPage === 'followup'            && <FollowUpPage />}
                {currentPage === 'mapa-corporal'       && <MapaCorporalPage />}
                {currentPage === 'odontograma'         && <OdontogramaPage />}

                {/* Páginas de Quirófano */}
                {currentPage === 'vista-cirujano'      && <VistaCirujanoPage />}
                {currentPage === 'fotos'               && <VisualClinicoPage />}
                {currentPage === 'consentimiento'      && <ConsentimientoPage />}
                {currentPage === 'body3d-test'         && <Body3DTestPage />}

                {/* Páginas de Facturación & RIPS */}
                {currentPage === 'crm'                 && <CRMPage onNavegar={setCurrentPage} />}
                {currentPage === 'cotizaciones'        && <CotizacionesPage />}
                {currentPage === 'contratacion'        && <ContratacionPage />}
                {currentPage === 'facturacion'         && <FacturacionPage />}
                {currentPage === 'impresion'           && <CentralImpresionPage />}

                {/* Páginas de Administración */}
                {currentPage === 'plantillas'          && <PlantillasPage />}
                {currentPage === 'usuarios'            && <UsuariosPage />}
                {currentPage === 'admin'               && <AdminPage />}
                {currentPage === 'seguridad'           && <SeguridadPage />}
                {currentPage === 'manual'              && <ManualPage />}
              </>
            )}
          </div>
        </div>
      </main>

      <SaraiAssistant
        onCamposDetectados={(campos) => camposHandlerRef.current?.(campos)}
        token={localStorage.getItem('accessToken') || ''}
        contexto={
          currentPage === 'historia'
            ? `Historia clinica - seccion activa: ${historiaSeccionActiva}`
            : currentPage
        }
        onNavegar={(pagina) => {
          setCurrentPage(pagina);
        }}
        onAbrirNuevaHistoria={() => {
          if (navMode === 'hub') setActiveMacroModule('CONSULTA');
          setHistoriaShowForm(true);
          setHistoriaSeccion('motivo-consulta');
          setCurrentPage('historia');
        }}
        onIrSeccion={(id) => {
          if (currentPageRef.current !== 'historia') setCurrentPage('historia');
          setHistoriaSeccion(id);
        }}
        onImprimir={() => {
          window.print();
        }}
      />
    </div>
  );
}

export default App;