import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthPage from './pages/AuthPage';
import NeuralCanvas from './components/NeuralCanvas';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import HistoriaClinicaPage from './pages/HistoriaClinicaPage';
import VisualClinicoPage from './pages/VisualClinicoPage';
import ConsentimientoPage from './pages/ConsentimientoPage';
import AgendaPage from './pages/AgendaPage';
import AgendaProfesionalPage from './pages/AgendaProfesionalPage';
import ConfigAgendaPage from './pages/ConfigAgendaPage';
import AdmisionPage from './pages/AdmisionPage';
import VistaCirujanoPage from './pages/VistaCirujanoPage';
import FollowUpPage from './pages/FollowUpPage';
import CRMPage from './pages/CRMPage';
import FacturacionPage from './pages/FacturacionPage';
import PlantillasPage from './pages/PlantillasPage';
import MapaCorporalPage from './pages/MapaCorporalPage';
import { Body3DTestPage } from './pages/Body3DTestPage';
import UsuariosPage from './pages/UsuariosPage';
import AdminPage from './pages/AdminPage';
import CentralImpresionPage from './pages/CentralImpresionPage';
import CotizacionesPage from './pages/CotizacionesPage';
import SaraiAssistant from './components/SaraiAssistant';
import saraiLogo from './assets/logo1.png';
import { getParametrosSistema } from './services/adminService';
import { useTheme } from './hooks/useTheme';

const NAV_SECTIONS = [
  {
    label: 'CLINICA',
    items: [
      { id: 'dashboard',     label: 'Dashboard',          sym: 'M' },
      { id: 'pacientes',     label: 'Pacientes',          sym: 'P' },
      { id: 'historia',      label: 'Historia Clinica',   sym: 'H' },
      { id: 'fotos',         label: 'Visual Clínico',     sym: 'V' },
      { id: 'mapa-corporal', label: 'Mapa Corporal',      sym: 'C' },
    ],
  },
  {
    label: 'AGENDA',
    items: [
      { id: 'agenda',            label: 'Agenda Paciente',    sym: 'A' },
      { id: 'admision',          label: 'Admisión',           sym: 'D' },
      { id: 'agendaProfesional', label: 'Agenda Profesional', sym: 'G' },
      { id: 'config-agenda',     label: 'Config Agenda',      sym: 'Z' },
      { id: 'vista-cirujano',    label: 'Quirofano',          sym: 'Q' },
      { id: 'followup',          label: 'Follow-up',          sym: 'U' },
    ],
  },
  {
    label: 'GESTION',
    items: [
      { id: 'consentimiento', label: 'Consentimiento', sym: 'K' },
      { id: 'cotizaciones',   label: 'Cotizaciones',   sym: 'O' },
      { id: 'crm',            label: 'CRM',            sym: 'R' },
      { id: 'facturacion',    label: 'Facturacion',    sym: 'B' },
      { id: 'plantillas',     label: 'Plantillas',     sym: 'L' },
      { id: 'impresion',      label: 'Central Impresión', sym: 'I' },
    ],
  },
  {
    label: 'ADMINISTRACIÓN',
    items: [
      { id: 'admin', label: 'Parametrización', sym: 'X' },
      { id: 'usuarios', label: 'Usuarios', sym: 'V' },
    ],
  },
];

function Sidebar({
  currentPage,
  setCurrentPage,
  user,
  handleLogout,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  currentPage: string;
  setCurrentPage: (p: string) => void;
  user: any;
  handleLogout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  // En móvil el sidebar siempre se muestra expandido cuando está abierto
  const effectiveCollapsed = mobileOpen ? false : collapsed;

  const handleNavClick = (id: string) => {
    setCurrentPage(id);
    setMobileOpen(false);
  };

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
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-white/5 flex-shrink-0">
          <AnimatePresence mode="wait">
            {effectiveCollapsed ? (
              <motion.div
                key="logo-mini"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="w-9 h-9 rounded-xl bg-[#1a1a3e] flex items-center justify-center mx-auto shadow-md overflow-hidden"
              >
                <img src={saraiLogo} alt="SARAI" className="w-9 h-9 object-cover" />
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
        </div>

        {/* Nav con scrollbar estilizada */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scroll">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-2">
              <AnimatePresence>
              {!effectiveCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-4 mb-1 text-[9px] font-bold text-gray-600 tracking-widest whitespace-nowrap"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>
              {effectiveCollapsed && <div className="mx-3 mb-1 border-t border-white/5" />}

              {section.items.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={effectiveCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 relative group ${
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
                    <AnimatePresence>
                      {!effectiveCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="whitespace-nowrap text-[13px]"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer usuario */}
        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div className={`flex items-center gap-2.5 ${effectiveCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-xs">
              {user?.nombre?.[0]}{user?.apellido?.[0]}
            </div>
            <AnimatePresence>
              {!effectiveCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.05 } }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-white text-xs font-semibold truncate">{user?.nombre} {user?.apellido}</p>
                  <p className="text-gray-600 text-[10px] truncate">{user?.especialidad || user?.rol}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!effectiveCollapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-400 transition-colors text-xs font-bold px-1.5 py-0.5 rounded border border-white/10 hover:border-red-500/30 whitespace-nowrap"
                >
                  salir
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
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
  // Ref para currentPage — evita stale closure en callbacks de SARAI
  const currentPageRef = useRef(currentPage);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
      const page = new URLSearchParams(window.location.search).get('page') || 'dashboard';
      setCurrentPage(page);
    }
  }, []);

  // Cargar configuración de la clínica al iniciar sesión
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
      .catch(() => { /* mantener cache existente */ });
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

  const sidebarWidth = sidebarCollapsed ? 68 : 236;
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const currentLabel = allItems.find((i) => i.id === currentPage)?.label || 'EstetIA';

  return (
    <div className="min-h-screen bg-[#080a0f] flex">
      <NeuralCanvas opacity={0.13} nodeCount={100} />
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        handleLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      {/* En lg+ → margin izquierdo dinámico; en móvil → sin margin (sidebar es overlay) */}
      <main
        className="flex-1 min-h-screen overflow-auto"
        style={{
          marginLeft: mobileMenuOpen ? 0 : undefined,
          transition: 'margin-left 0.25s ease-in-out',
        }}
      >
        {/* Wrapper que en lg+ aplica el margin del sidebar */}
        <div
          className={`min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[236px]'
          }`}
        >
        {/* ══════ TOPBAR PREMIUM ══════ */}
        {(() => {
          const T = {
            'dark':          { bg: 'bg-[#0a0c13]',    border: 'border-white/[0.06]',  nameGrad: 'from-yellow-300 via-amber-400 to-yellow-500', sub: 'text-yellow-500/50', date: 'text-gray-400',    dateSub: 'text-gray-600'    },
            'premium-light': { bg: 'bg-white',         border: 'border-slate-200',     nameGrad: 'from-blue-700 via-indigo-600 to-blue-800',    sub: 'text-blue-500/60',   date: 'text-slate-600',   dateSub: 'text-slate-400'   },
            'soft-medical':  { bg: 'bg-slate-50',      border: 'border-slate-200',     nameGrad: 'from-teal-600 via-cyan-600 to-teal-700',      sub: 'text-teal-500/60',   date: 'text-slate-500',   dateSub: 'text-slate-400'   },
            'executive-ai':  { bg: 'bg-[#0c1220]',     border: 'border-blue-400/12',   nameGrad: 'from-blue-400 via-violet-400 to-blue-500',    sub: 'text-blue-400/45',   date: 'text-blue-300/70', dateSub: 'text-blue-400/40' },
          }[theme] ?? { bg: 'bg-[#0a0c13]', border: 'border-white/[0.06]', nameGrad: 'from-yellow-300 via-amber-400 to-yellow-500', sub: 'text-yellow-500/50', date: 'text-gray-400', dateSub: 'text-gray-600' };

          const hoy = new Date();
          const diaSemana = hoy.toLocaleDateString('es-CO', { weekday: 'long' });
          const fechaCompleta = hoy.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

          return (
            <div className={`sticky top-0 z-20 ${T.bg} backdrop-blur-xl border-b ${T.border} shadow-[0_2px_24px_rgba(0,0,0,0.45)] h-[80px] flex items-center px-4 sm:px-6 relative`}>

              {/* ── IZQUIERDA: hamburger + logo ── */}
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

              {/* ── CENTRO ABSOLUTO: nombre clínica ── */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <h1
                  className={`text-[28px] sm:text-[34px] font-black tracking-wide bg-gradient-to-r ${T.nameGrad} bg-clip-text text-transparent leading-none whitespace-nowrap`}
                  style={{ letterSpacing: '0.04em' }}
                >
                  {clinicaConfig.nombre || 'EstetIA'}
                </h1>
                {/* Línea decorativa bajo el nombre */}
                <div className="mt-[5px] h-[2px] w-48 sm:w-64 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${theme === 'premium-light' || theme === 'soft-medical' ? 'rgba(99,102,241,0.45)' : 'rgba(212,175,55,0.55)'}, transparent)` }} />
              </div>

              {/* ── DERECHA: fecha + online ── */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-auto z-10">
                <div className="hidden sm:flex flex-col items-end leading-snug">
                  <span className={`text-[11px] font-semibold capitalize ${T.date}`}>{diaSemana}</span>
                  <span className={`text-[10px] capitalize ${T.dateSub}`}>{fechaCompleta}</span>
                </div>
                <div className="w-px h-8 hidden sm:block" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} />
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                  <span className="text-emerald-400 text-[10px] font-bold tracking-widest">ONLINE</span>
                </div>
              </div>

            </div>
          );
        })()}
        <div>
          {currentPage === 'dashboard'          && <DashboardPage onNavegar={setCurrentPage} />}
          {currentPage === 'pacientes'           && <PacientesPage />}
          {currentPage === 'historia' && (
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
          {currentPage === 'fotos'               && <VisualClinicoPage />}
          {currentPage === 'consentimiento'      && <ConsentimientoPage />}
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
                setCurrentPage('historia');
              }}
            />
          )}
          {currentPage === 'vista-cirujano'      && <VistaCirujanoPage />}
          {currentPage === 'followup'            && <FollowUpPage />}
          {currentPage === 'crm'                 && <CRMPage onNavegar={setCurrentPage} />}
          {currentPage === 'cotizaciones'        && <CotizacionesPage />}
          {currentPage === 'facturacion'         && <FacturacionPage />}
          {currentPage === 'plantillas'          && <PlantillasPage />}
          {currentPage === 'impresion'           && <CentralImpresionPage />}
          {currentPage === 'mapa-corporal'       && <MapaCorporalPage />}
          {currentPage === 'body3d-test'         && <Body3DTestPage />}
          {currentPage === 'usuarios'            && <UsuariosPage />}
          {currentPage === 'admin'               && <AdminPage />}
        </div>
        </div>
      </main>
      {/* ── SARAI Global — flotante en todas las páginas ── */}
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