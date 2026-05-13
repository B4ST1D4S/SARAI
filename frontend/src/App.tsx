import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import HistoriaClinicaPage from './pages/HistoriaClinicaPage';
import FotosPage from './pages/FotosPage';
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
import SaraiAssistant from './components/SaraiAssistant';

const NAV_SECTIONS = [
  {
    label: 'CLINICA',
    items: [
      { id: 'dashboard',     label: 'Dashboard',          sym: 'M' },
      { id: 'pacientes',     label: 'Pacientes',          sym: 'P' },
      { id: 'historia',      label: 'Historia Clinica',   sym: 'H' },
      { id: 'fotos',         label: 'Fotos',              sym: 'F' },
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
  const handleNavClick = (id: string) => {
    setCurrentPage(id);
    setMobileOpen(false); // cierra drawer en móvil al navegar
  };

  return (
    <>
      {/* Overlay oscuro en móvil cuando el drawer está abierto */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    <motion.aside
      animate={{ width: collapsed ? 68 : 236 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-[#0d0f14] border-r border-white/5 shadow-2xl overflow-hidden select-none
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
    >
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 flex-shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-black tracking-tight whitespace-nowrap"
            >
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">SAR</span>
              <span className="text-white">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all ml-auto text-xs font-bold"
        >
          {collapsed ? '>>' : '<<'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <p className="px-4 mb-1 text-[9px] font-bold text-gray-600 tracking-widest">
                {section.label}
              </p>
            )}
            {collapsed && <div className="mx-3 mb-1 border-t border-white/5" />}
            {section.items.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
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
                    />
                  )}
                  <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${
                    active
                      ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                      : 'border-white/10 bg-white/5 text-gray-500 group-hover:text-gray-300'
                  }`}>
                    {item.sym}
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap text-[13px]"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 transition-opacity duration-150">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3 flex-shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center flex-col' : ''}`}>
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-xs">
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-xs font-semibold truncate">{user?.nombre} {user?.apellido}</p>
                <p className="text-gray-600 text-[10px] truncate">{user?.especialidad || user?.rol}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              className="text-gray-600 hover:text-red-400 transition-colors text-xs font-bold px-1.5 py-0.5 rounded border border-white/10 hover:border-red-500/30"
            >
              salir
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              className="text-gray-600 hover:text-red-400 transition-colors text-[9px] font-bold"
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
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historiaShowForm, setHistoriaShowForm] = useState(false);
  const [historiaSeccion, setHistoriaSeccion] = useState<string>('motivo-consulta');
  const [historiaSeccionActiva, setHistoriaSeccionActiva] = useState<string>('motivo-consulta');
  const [historiaPacienteId, setHistoriaPacienteId] = useState<string | undefined>(undefined);
  const camposHandlerRef = useRef<((c: Record<string, string>) => void) | null>(null);
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('auth');
  };

  if (!user) {
    return <AuthPage />;
  }

  const sidebarWidth = sidebarCollapsed ? 68 : 236;
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const currentLabel = allItems.find((i) => i.id === currentPage)?.label || 'EstetIA';

  return (
    <div className="min-h-screen bg-[#080a0f] flex">
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
          className={`min-h-screen ${
            sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[236px]'
          }`}
          style={{ transition: 'margin-left 0.25s ease-in-out' }}
        >
        <div className="sticky top-0 z-20 bg-[#080a0f]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger — solo visible en móvil */}
            <button
              className="lg:hidden flex flex-col gap-1 p-1.5 mr-1 rounded-md text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <span className="block w-5 h-0.5 bg-current rounded" />
              <span className="block w-5 h-0.5 bg-current rounded" />
              <span className="block w-4 h-0.5 bg-current rounded" />
            </button>
            <h2 className="text-white font-semibold text-sm">{currentLabel}</h2>
            <span className="text-gray-700 text-xs hidden sm:block">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-medium tracking-wide">ONLINE</span>
          </div>
        </div>
        <div>
          {currentPage === 'dashboard'          && <DashboardPage />}
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
          {currentPage === 'fotos'               && <FotosPage />}
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
          {currentPage === 'crm'                 && <CRMPage />}
          {currentPage === 'facturacion'         && <FacturacionPage />}
          {currentPage === 'plantillas'          && <PlantillasPage />}
          {currentPage === 'impresion'           && <CentralImpresionPage />}
          {currentPage === 'mapa-corporal'       && <MapaCorporalPage />}
          {currentPage === 'body3d-test'         && <Body3DTestPage />}
          {currentPage === 'usuarios'            && <UsuariosPage />}
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