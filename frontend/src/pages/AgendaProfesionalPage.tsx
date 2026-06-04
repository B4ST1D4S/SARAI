import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, Plus, Trash2, Stethoscope, Bell, RefreshCw, Zap } from 'lucide-react';
import { completarCita } from '../services/api';
import { API_BASE_URL } from '../config';

interface Cita {
  id: string;
  pacienteNombre: string;
  pacienteId?: string;
  fecha: string;
  hora: string;
  duracion: number;
  procedimiento: string;
  estado: 'CONFIRMADA' | 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA' | 'COMPLETADA' | 'EN_SALA';
  notas: string;
}

interface AgendaProfesionalProps {
  onNavegar?: (pagina: string) => void;
  onAbrirHistoriaPaciente?: (pacienteId: string, nombre: string) => void;
}

export default function AgendaProfesionalPage({ onNavegar, onAbrirHistoriaPaciente }: AgendaProfesionalProps = {}) {
  const hoyDate = new Date();
  const hoy = `${hoyDate.getFullYear()}-${String(hoyDate.getMonth() + 1).padStart(2, '0')}-${String(hoyDate.getDate()).padStart(2, '0')}`;

  const [citas, setCitas] = useState<Cita[]>([]);
  const [selectedDate, setSelectedDate] = useState(hoy);
  const [loadingCitas, setLoadingCitas] = useState(false);

  const getToken = () => localStorage.getItem('accessToken') || '';

  // Cargar citas por rango de fecha (igual que AgendaPage — sin bug de timezone)
  const cargarCitas = useCallback(async () => {
    setLoadingCitas(true);
    try {
      const token = getToken();
      const [year, month, day] = selectedDate.split('-').map(Number);
      const inicioLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
      const finLocal    = new Date(year, month - 1, day, 23, 59, 59, 999);
      const res = await fetch(
        `${API_BASE_URL}/citas/medico/agenda?fechaInicio=${inicioLocal.toISOString()}&fechaFin=${finLocal.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error al obtener citas');
      const data = await res.json();
      const lista = (data.citas || []).map((c: any) => {
        const fecha = new Date(c.fechaHora);
        return {
          id: c.id,
          pacienteId: c.paciente?.id || c.pacienteId,
          pacienteNombre: c.paciente?.nombreCompleto || 'Paciente',
          fecha: selectedDate,
          hora: fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
          duracion: c.duracionMinutos || 30,
          procedimiento: c.tipoCita || c.motivo || 'Consulta',
          estado: (c.estado === 'COMPLETADA' ? 'ATENDIDA' : c.estado) as Cita['estado'],
          notas: c.notas || '',
        } as Cita;
      });
      lista.sort((a: Cita, b: Cita) => a.hora.localeCompare(b.hora));
      setCitas(lista);
    } catch (e) {
      console.error('Error cargando citas:', e);
      setCitas([]);
    } finally {
      setLoadingCitas(false);
    }
  }, [selectedDate]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);
  const [showNewCita, setShowNewCita] = useState(false);

  const [formData, setFormData] = useState({
    pacienteNombre: '',
    hora: '',
    duracion: 30,
    procedimiento: '',
    notas: '',
  });

  // Cambiar estado de cita
  const handleCambiarEstado = async (id: string, nuevoEstado: Cita['estado']) => {
    if (nuevoEstado === 'ATENDIDA') {
      const token = getToken();
      const cita = citas.find((c) => c.id === id);
      if (token && cita) await completarCita(id, token);
      setCitas((prev) => prev.map((c) => c.id === id ? { ...c, estado: 'ATENDIDA' } : c));
      if (cita?.pacienteId && onAbrirHistoriaPaciente) {
        onAbrirHistoriaPaciente(cita.pacienteId, cita.pacienteNombre);
      } else if (onNavegar) {
        onNavegar('historia');
      }
      return;
    }
    if (nuevoEstado === 'CONFIRMADA') {
      const token = getToken();
      await fetch(`${API_BASE_URL}/citas/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'CONFIRMADA' }),
      });
      setCitas((prev) => prev.map((c) => c.id === id ? { ...c, estado: 'CONFIRMADA' } : c));
      return;
    }
    setCitas((prev) => prev.map((c) => c.id === id ? { ...c, estado: nuevoEstado } : c));
  };

  // Eliminar / cancelar cita
  const handleEliminarCita = async (id: string) => {
    const token = getToken();
    await fetch(`${API_BASE_URL}/citas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCitas((prev) => prev.filter((c) => c.id !== id));
  };

  // Estadísticas del día
  const citasHoy = citas; // ya vienen filtradas por fecha desde la API
  const totalHoy       = citasHoy.length;
  const confirmSala    = citasHoy.filter(c => ['CONFIRMADA', 'EN_SALA'].includes(c.estado)).length;
  const pendientes     = citasHoy.filter(c => c.estado === 'PENDIENTE').length;
  const atendidas      = citasHoy.filter(c => ['ATENDIDA', 'COMPLETADA'].includes(c.estado)).length;

  const getEstadoConfig = (estado: Cita['estado']) => {
    switch (estado) {
      case 'CONFIRMADA': return { label: '✓ Confirmada',       color: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/60 hover:shadow-emerald-500/20', glow: 'from-emerald-500/10', clock: 'text-emerald-400' };
      case 'EN_SALA':    return { label: '🏥 En Sala',          color: 'text-cyan-400',    border: 'border-cyan-500/20    hover:border-cyan-500/60    hover:shadow-cyan-500/20',    glow: 'from-cyan-500/10',    clock: 'text-cyan-400'    };
      case 'ATENDIDA':
      case 'COMPLETADA': return { label: '✅ Atendida',          color: 'text-purple-400',  border: 'border-purple-500/20  hover:border-purple-500/60  hover:shadow-purple-500/20',  glow: 'from-purple-500/10',  clock: 'text-purple-400'  };
      case 'CANCELADA':  return { label: '✕ Cancelada',         color: 'text-red-400',     border: 'border-red-500/20     hover:border-red-500/60     hover:shadow-red-500/20',     glow: 'from-red-500/10',     clock: 'text-red-400'     };
      default:           return { label: '⚠ Pendiente',         color: 'text-orange-400',  border: 'border-orange-500/20  hover:border-orange-500/60  hover:shadow-orange-500/20',  glow: 'from-orange-500/10',  clock: 'text-orange-400'  };
    }
  };

  const labelFecha = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header Premium */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 sm:w-2 h-8 sm:h-10 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full flex-shrink-0"></div>
              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
                  Agenda Profesional
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm ml-1 flex items-center gap-1.5 mt-0.5">
                  <Zap size={12} className="text-yellow-500" />
                  Control de tus citas y procedimientos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cargarCitas}
                className="p-2 text-gray-400 hover:text-yellow-400 transition rounded-xl hover:bg-slate-800/60"
                title="Actualizar"
              >
                <RefreshCw size={18} className={loadingCitas ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowNewCita(!showNewCita)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-yellow-500/25"
              >
                <Plus size={16} /> Nueva Cita
              </button>
            </div>
          </div>
        </motion.div>

        {/* Selector Fecha + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Selector fecha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-center"
          >
            <p className="text-yellow-400/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">Fecha</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
            />
          </motion.div>

          {/* HOY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-yellow-400/80 text-[9px] sm:text-sm font-semibold uppercase tracking-wider">HOY</p>
                  <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{totalHoy}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-1.5 sm:p-3 rounded-xl">
                  <Zap className="text-yellow-400" size={18} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Confirm / Sala */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-400/80 text-[9px] sm:text-sm font-semibold uppercase tracking-wider">Confirm./Sala</p>
                  <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{confirmSala}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 p-1.5 sm:p-3 rounded-xl">
                  <CheckCircle className="text-emerald-400" size={18} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pendientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-orange-400/80 text-[9px] sm:text-sm font-semibold uppercase tracking-wider">Pendient.</p>
                  <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{pendientes}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-amber-600/20 p-1.5 sm:p-3 rounded-xl">
                  <Clock className="text-orange-400" size={18} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Form Nueva Cita */}
        {showNewCita && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-yellow-500/30 rounded-2xl p-6 mb-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={20} className="text-yellow-400" /> Crear Nueva Cita
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del Paciente"
                value={formData.pacienteNombre}
                onChange={(e) => setFormData({ ...formData, pacienteNombre: e.target.value })}
                className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
              />
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Procedimiento"
                value={formData.procedimiento}
                onChange={(e) => setFormData({ ...formData, procedimiento: e.target.value })}
                className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
              />
              <select
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
              >
                {[15, 30, 45, 60, 90, 120].map(v => (
                  <option key={v} value={v}>{v < 60 ? `${v} min` : `${v / 60}h`}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Notas (ayuno, exámenes, etc)"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full mt-4 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none min-h-20"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNewCita(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Panel de Citas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 rounded-2xl p-5 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full"></div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Citas del Día</h2>
                  <p className="text-gray-400 text-xs capitalize">{labelFecha()}</p>
                </div>
              </div>
              <button onClick={cargarCitas} className="p-2 text-gray-500 hover:text-yellow-400 transition rounded-lg">
                <RefreshCw size={15} className={loadingCitas ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingCitas ? (
              <div className="flex items-center justify-center py-14 gap-3 text-gray-500">
                <RefreshCw size={20} className="animate-spin" />
                <span className="text-sm">Cargando citas...</span>
              </div>
            ) : citasHoy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-600 gap-3">
                <Calendar size={40} className="opacity-30" />
                <p className="text-sm">Sin citas agendadas para este día</p>
              </div>
            ) : (
              <div className="space-y-4">
                {citasHoy.map((cita, idx) => {
                  const cfg = getEstadoConfig(cita.estado);
                  return (
                    <motion.div
                      key={cita.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08 }}
                      whileHover={{ scale: 1.01, x: 6 }}
                      className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-5 border transition-all duration-300 group cursor-pointer overflow-hidden relative hover:shadow-2xl ${cfg.border}`}
                    >
                      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 bg-gradient-to-br ${cfg.glow} to-transparent`}></div>
                      <div className="relative">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className={`text-sm uppercase tracking-wider font-semibold mb-2 ${cfg.color}`}>{cfg.label}</p>
                            <p className="text-white font-bold text-2xl flex items-center gap-2 mb-1">
                              <Clock size={20} className={cfg.clock} />
                              {cita.hora}
                              <span className="text-gray-500 text-sm font-normal">({cita.duracion} min)</span>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mb-4">
                          <p className="text-white font-semibold flex items-center gap-2 text-base">
                            <User size={16} className="text-blue-400 flex-shrink-0" />
                            {cita.pacienteNombre}
                          </p>
                          <p className="text-gray-300 text-sm ml-6">{cita.procedimiento}</p>
                          {cita.notas && (
                            <p className="text-gray-500 text-xs ml-6 italic">📝 {cita.notas}</p>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 mt-3">
                          {cita.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => handleCambiarEstado(cita.id, 'CONFIRMADA')}
                              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={14} /> Confirmar
                            </button>
                          )}

                          {cita.estado === 'CONFIRMADA' && (
                            <button
                              onClick={async () => {
                                const token = getToken();
                                const res = await fetch(`${API_BASE_URL}/citas/${cita.id}/admision`, {
                                  method: 'POST',
                                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                });
                                if (res.ok) setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: 'EN_SALA' } : c));
                              }}
                              className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                            >
                              <Bell size={14} /> Paciente Llegó
                            </button>
                          )}

                          {cita.estado === 'EN_SALA' && (
                            <button
                              onClick={() => handleCambiarEstado(cita.id, 'ATENDIDA')}
                              className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                            >
                              <Stethoscope size={14} /> Atender → HC
                            </button>
                          )}

                          {(cita.estado === 'ATENDIDA' || cita.estado === 'COMPLETADA') && (
                            <div className="flex-1 py-2 bg-slate-700/50 text-gray-500 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-600/50">
                              ✅ Atendida
                            </div>
                          )}

                          <button
                            onClick={() => handleEliminarCita(cita.id)}
                            className="px-3 py-2 bg-red-600/10 hover:bg-red-600/30 text-red-400 rounded-xl transition border border-red-600/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Checklist Preoperatorio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 rounded-2xl p-5 sm:p-7"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Checklist Preoperatorio</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { text: 'Consentimiento firmado', icon: '📄' },
              { text: 'Exámenes de laboratorio', icon: '🧪' },
              { text: 'Fotografías clínicas', icon: '📷' },
              { text: 'Ayuno confirmado', icon: '⏰' },
              { text: 'Medicación suspendida', icon: '💊' },
              { text: 'Alergias documentadas', icon: '⚠️' },
              { text: 'Autorización anestesia', icon: '💉' },
              { text: 'Marca quirúrgica lista', icon: '✏️' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-3 p-3.5 bg-slate-800/40 rounded-xl border border-emerald-600/20 hover:border-emerald-500/50 transition cursor-pointer group"
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-gray-300 group-hover:text-white text-xs sm:text-sm transition">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}



