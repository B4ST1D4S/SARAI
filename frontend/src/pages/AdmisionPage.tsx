/**
 * CU-03: Admisión / Llegada del Paciente
 * Recepción registra la llegada: CONFIRMADA → EN_SALA
 * Muestra cola de espera ordenada por hora.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, Clock, RefreshCw, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { getCitasMedico } from '../services/api';

interface Cita {
  id: string;
  pacienteNombre: string;
  pacienteId: string;
  hora: string;
  fecha: string;
  procedimiento: string;
  estado: string;
  turno?: number;
}

export default function AdmisionPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const getToken = () => localStorage.getItem('accessToken') || '';
  const hoy = new Date().toISOString().split('T')[0];

  const cargar = async () => {
    setLoading(true);
    const token = getToken();
    const res = await getCitasMedico(token);
    if (!res.error && res.data) {
      const todas = ((res.data as any).citas || []).map((c: any, i: number) => {
        const fecha = new Date(c.fechaHora);
        return {
          id: c.id,
          pacienteId: c.paciente?.id || c.pacienteId,
          pacienteNombre: c.paciente?.nombreCompleto || 'Paciente',
          fecha: fecha.toISOString().split('T')[0],
          hora: fecha.toTimeString().slice(0, 5),
          procedimiento: c.tipoCita || c.motivo || 'Consulta',
          estado: c.estado,
          turno: i + 1,
        } as Cita;
      });
      // Mostrar solo de hoy + estados relevantes
      const hoyFiltrado = todas.filter((c: Cita) =>
        c.fecha === hoy && ['CONFIRMADA', 'EN_SALA', 'PENDIENTE'].includes(c.estado)
      ).sort((a: Cita, b: Cita) => a.hora.localeCompare(b.hora));
      setCitas(hoyFiltrado);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const registrarLlegada = async (citaId: string, nombre: string) => {
    const token = getToken();
    try {
      const res = await fetch(`/api/citas/${citaId}/admision`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setMsg({ tipo: 'ok', texto: `✓ ${nombre} — en sala de espera` });
        cargar();
      } else {
        const d = await res.json();
        setMsg({ tipo: 'error', texto: d.error || 'Error al registrar llegada' });
      }
    } catch {
      setMsg({ tipo: 'error', texto: 'Error de conexión' });
    }
    setTimeout(() => setMsg(null), 4000);
  };

  const enSala = citas.filter(c => c.estado === 'EN_SALA');
  const enEspera = citas.filter(c => c.estado === 'CONFIRMADA' || c.estado === 'PENDIENTE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
                <div className="w-1.5 sm:w-2 h-7 sm:h-10 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full flex-shrink-0" />
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Admisión
                </h1>
              </div>
              <p className="text-gray-400 ml-4 sm:ml-6 text-[10px] sm:text-sm truncate">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <button onClick={cargar} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 transition text-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>
        </motion.div>

        {/* Notificación */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                msg.tipo === 'ok'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
              {msg.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {msg.texto}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400/80 text-xs font-semibold uppercase tracking-wider mb-1">En Sala</p>
                <p className="text-4xl font-bold text-white">{enSala.length}</p>
              </div>
              <UserCheck className="text-cyan-400" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400/80 text-xs font-semibold uppercase tracking-wider mb-1">Pendientes</p>
                <p className="text-4xl font-bold text-white">{enEspera.length}</p>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </div>
        </div>

        {/* Cola EN SALA */}
        {enSala.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mb-3">
              <UserCheck size={18} /> En Sala de Espera
            </h2>
            <div className="space-y-3">
              {enSala.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-cyan-500/5 border border-cyan-500/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                      <span className="text-cyan-400 font-bold text-sm">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{c.pacienteNombre}</p>
                      <p className="text-gray-400 text-xs">{c.hora} · {c.procedimiento}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs rounded-full font-semibold">
                    EN SALA
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Citas pendientes de admisión */}
        <section>
          <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2 mb-3">
            <Bell size={18} /> Citas de Hoy — Registrar Llegada
          </h2>
          {enEspera.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-600 rounded-xl text-center text-gray-500 text-sm">
              No hay citas pendientes de admisión para hoy.
            </div>
          ) : (
            <div className="space-y-3">
              {enEspera.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Users size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{c.pacienteNombre}</p>
                      <p className="text-gray-400 text-xs">{c.hora} · {c.procedimiento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${
                      c.estado === 'CONFIRMADA'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    }`}>{c.estado}</span>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => registrarLlegada(c.id, c.pacienteNombre)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-cyan-500/20 transition-shadow">
                      Registrar Llegada
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
