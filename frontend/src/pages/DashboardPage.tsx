import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const getToken = () => localStorage.getItem('accessToken') || '';
const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pacientesHoy: 0,
    citasProximas: 0,
    historiasActivas: 0,
    tasaComplecion: 0,
  });

  const [citasProximas, setCitasProximas] = useState<any[]>([]);

  const storedUser = getStoredUser();
  const user = {
    nombre: storedUser.nombre || 'Dr.',
    apellido: storedUser.apellido || '',
    especialidad: 'Cirugía Estética',
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const hoyInicio = new Date(); hoyInicio.setHours(0, 0, 0, 0);
        const hoyFin = new Date(); hoyFin.setHours(23, 59, 59, 999);
        const semanaFin = new Date(); semanaFin.setDate(semanaFin.getDate() + 7); semanaFin.setHours(23, 59, 59, 999);

        const [resHoy, resSemana] = await Promise.all([
          fetch(`/api/citas/medico/agenda?fechaInicio=${hoyInicio.toISOString()}&fechaFin=${hoyFin.toISOString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/citas/medico/agenda?fechaInicio=${hoyInicio.toISOString()}&fechaFin=${semanaFin.toISOString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const dataHoy = resHoy.ok ? await resHoy.json() : { citas: [] };
        const dataSemana = resSemana.ok ? await resSemana.json() : { citas: [] };
        const citasHoy = dataHoy.citas || [];
        const citasSem = dataSemana.citas || [];

        const confirmadas = citasHoy.filter((c: any) => c.estado === 'CONFIRMADA').length;
        const tasaComp = citasHoy.length > 0 ? Math.round((confirmadas / citasHoy.length) * 100) : 0;

        setStats({
          pacientesHoy: citasHoy.length,
          citasProximas: citasSem.length,
          historiasActivas: citasHoy.filter((c: any) => c.estado === 'COMPLETADA').length,
          tasaComplecion: tasaComp,
        });

        const estadoLabel: Record<string, string> = {
          CONFIRMADA: 'Confirmada',
          EN_SALA:    'En Sala',
          COMPLETADA: 'Atendida',
          CANCELADA:  'Cancelada',
          PENDIENTE:  'Pendiente',
        };
        const normalizadas = citasSem.map((c: any) => ({
          id: c.id,
          paciente: c.paciente?.nombreCompleto || 'Paciente',
          hora: new Date(c.fechaHora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
          procedimiento: c.tipoCita || c.motivo || 'Consulta',
          estado: c.estado,
          estadoLabel: estadoLabel[c.estado] || c.estado,
        }));
        normalizadas.sort((a: any, b: any) => a.hora.localeCompare(b.hora));
        setCitasProximas(normalizadas);
      } catch (e) {
        console.error('Error cargando dashboard:', e);
      }
    };
    cargarDatos();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-10"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Dashboard
              </h1>
              <p className="text-gray-400 text-xs sm:text-base lg:text-lg truncate">
                {user.nombre} {user.apellido} • {user.especialidad}
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 rounded-2xl p-6">
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-semibold mb-2">ONLINE</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 font-semibold">Disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-5 sm:mb-10"
        >
          {/* Card 1: Citas Hoy */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-yellow-400/80 text-sm font-semibold uppercase tracking-wider">Citas Hoy</p>
                  <p className="text-4xl font-bold text-white mt-2">{stats.pacientesHoy}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-3 rounded-xl">
                  <Calendar className="text-yellow-400" size={28} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-400/70 text-sm">
                <TrendingUp size={16} />
                <span>Todas confirmadas</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Citas Próximas */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-cyan-400/80 text-sm font-semibold uppercase tracking-wider">Próximas</p>
                  <p className="text-4xl font-bold text-white mt-2">{stats.citasProximas}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-3 rounded-xl">
                  <Clock className="text-cyan-400" size={28} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-cyan-400/70 text-sm">
                <TrendingUp size={16} />
                <span>Esta semana</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Historias */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-400/80 text-sm font-semibold uppercase tracking-wider">Historias</p>
                  <p className="text-4xl font-bold text-white mt-2">{stats.historiasActivas}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 p-3 rounded-xl">
                  <FileText className="text-emerald-400" size={28} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400/70 text-sm">
                <CheckCircle2 size={16} />
                <span>Completas</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Tasa de Compleción */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-pink-500/20 rounded-2xl p-6 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-pink-400/80 text-sm font-semibold uppercase tracking-wider">Compleción</p>
                  <p className="text-4xl font-bold text-white mt-2">{stats.tasaComplecion}%</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500/20 to-rose-600/20 p-3 rounded-xl">
                  <TrendingUp className="text-pink-400" size={28} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-pink-400/70 text-sm">
                <CheckCircle2 size={16} />
                <span>Excelente</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Citas Próximas */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-yellow-500/10 rounded-2xl p-4 sm:p-8"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
              <h2 className="text-lg sm:text-2xl font-bold text-white">Próximas Citas</h2>
              <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold text-xs sm:text-sm rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-200 whitespace-nowrap">
                Ver Agenda
              </button>
            </div>

            <div className="space-y-4">
              {citasProximas.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay citas esta semana</p>
                </div>
              ) : (
                citasProximas.map((cita, index) => (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group bg-gradient-to-r from-slate-700/30 to-slate-800/20 border border-slate-700/50 rounded-xl p-3 sm:p-5 hover:border-yellow-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-lg mb-0.5 sm:mb-1 truncate">{cita.paciente}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-400 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-yellow-400" />
                          {cita.hora}
                        </span>
                        <span className="hidden sm:inline text-gray-600">•</span>
                        <span className="truncate">{cita.procedimiento}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                      <span
                        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs ${
                          cita.estado === 'CONFIRMADA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : cita.estado === 'EN_SALA'    ? 'bg-cyan-500/20    text-cyan-400    border border-cyan-500/30'
                          : cita.estado === 'COMPLETADA' ? 'bg-purple-500/20   text-purple-400  border border-purple-500/30'
                          : cita.estado === 'CANCELADA'  ? 'bg-red-500/20      text-red-400     border border-red-500/30'
                          :                               'bg-amber-500/20    text-amber-400   border border-amber-500/30'
                        }`}
                      >
                        {cita.estadoLabel}
                      </span>
                      <button className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors">
                        <ArrowRight size={20} className="text-yellow-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Acciones Rápidas */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-yellow-500/10 rounded-2xl p-4 sm:p-8"
          >
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">Acciones Rápidas</h2>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Nueva Cita
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Nuevo Paciente
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <FileText size={20} />
                Historia Clínica
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
              >
                <FileText size={20} />
                Cotización
              </motion.button>
            </div>

            {/* Alerts */}
            <div className="mt-8 pt-8 border-t border-slate-700/50">
              <div className="flex items-start gap-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-white font-semibold text-sm">Recordatorio</p>
                  <p className="text-yellow-400/80 text-xs mt-1">
                    3 pacientes esperan confirmación de cita
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
