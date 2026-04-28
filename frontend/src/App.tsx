import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import HistoriaClinicaPage from './pages/HistoriaClinicaPage';
import FotosPage from './pages/FotosPage';
import ConsentimientoPage from './pages/ConsentimientoPage';
import AgendaPage from './pages/AgendaPage';
import AgendaProfesionalPage from './pages/AgendaProfesionalPage';
import VistaCirujanoPage from './pages/VistaCirujanoPage';
import FollowUpPage from './pages/FollowUpPage';
import CRMPage from './pages/CRMPage';
import FacturacionPage from './pages/FacturacionPage';
import PlantillasPage from './pages/PlantillasPage';
import MapaCorporalPage from './pages/MapaCorporalPage';
import { Body3DTestPage } from './pages/Body3DTestPage';

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    // Auto-login para demo
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === 'true';

    if (token && userStr) {
      setUser(JSON.parse(userStr));
      const page = new URLSearchParams(window.location.search).get('page') || 'dashboard';
      setCurrentPage(page);
    } else if (isDemo) {
      // Auto-login for demo - hacer login real con credenciales de demostración
      // Esto ahora requiere que el backend tenga un usuario demo, o ajustará a login normal
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('auth');
  };

  // Si no está autenticado, mostrar login
  if (!user) {
    return <AuthPage />;
  }

  // Dashboard con navegación
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-yellow-600/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-600">EstetIA</h1>

          <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'dashboard'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('pacientes')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'pacientes'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👥 Pacientes
            </button>
            <button
              onClick={() => setCurrentPage('historia')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'historia'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 Historia
            </button>
            <button
              onClick={() => setCurrentPage('fotos')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'fotos'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📸 Fotos
            </button>
            <button
              onClick={() => setCurrentPage('consentimiento')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'consentimiento'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ✍️ Consentimiento
            </button>
            <button
              onClick={() => setCurrentPage('agenda')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'agenda'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 Agenda Paciente
            </button>

            {/* Separador */}
            <div className="border-l border-gray-600 px-2"></div>

            <button
              onClick={() => setCurrentPage('agendaProfesional')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'agendaProfesional'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👨‍⚕️ Agenda Prof
            </button>
            <button
              onClick={() => setCurrentPage('vista-cirujano')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'vista-cirujano'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏥 Quirófano
            </button>
            <button
              onClick={() => setCurrentPage('followup')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'followup'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Follow-up
            </button>
            <button
              onClick={() => setCurrentPage('crm')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'crm'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💎 CRM
            </button>
            <button
              onClick={() => setCurrentPage('facturacion')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'facturacion'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💳 Facturación
            </button>
            <button
              onClick={() => setCurrentPage('plantillas')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'plantillas'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📄 Plantillas
            </button>
            <button
              onClick={() => setCurrentPage('mapa-corporal')}
              className={`px-3 py-2 text-sm rounded-lg font-semibold transition ${
                currentPage === 'mapa-corporal'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🗺️ Mapa Corporal
            </button>
          </div>

            <div className="border-l border-gray-600 pl-4 ml-4">
              <p className="text-gray-400 text-sm">
                {user.nombre} {user.apellido}
              </p>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 text-sm font-semibold transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <div>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'pacientes' && <PacientesPage />}
        {currentPage === 'historia' && <HistoriaClinicaPage />}
        {currentPage === 'fotos' && <FotosPage />}
        {currentPage === 'consentimiento' && <ConsentimientoPage />}
        {currentPage === 'agenda' && <AgendaPage />}
        {currentPage === 'agendaProfesional' && <AgendaProfesionalPage />}
        {currentPage === 'vista-cirujano' && <VistaCirujanoPage />}
        {currentPage === 'followup' && <FollowUpPage />}
        {currentPage === 'crm' && <CRMPage />}
        {currentPage === 'facturacion' && <FacturacionPage />}
        {currentPage === 'plantillas' && <PlantillasPage />}
        {currentPage === 'mapa-corporal' && <MapaCorporalPage />}
        {currentPage === 'body3d-test' && <Body3DTestPage />}
      </div>
    </div>
  );
}

export default App;
