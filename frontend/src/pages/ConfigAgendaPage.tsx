/**
 * CU-01: Configuración de Agenda del Profesional
 * Permite definir disponibilidad semanal, horarios, sede y bloqueos.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, Calendar, Clock, MapPin, AlertCircle, Check, X } from 'lucide-react';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIPOS = ['CONSULTA', 'PREOPERATORIO', 'POSTOPERATORIO', 'CONTROL'];

interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionSlot: number;
  sede: string;
  tipoAtencion: string;
  consultorio: string;
}

interface Bloqueo {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  todoElDia: boolean;
}

export default function ConfigAgendaPage() {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showFormDisp, setShowFormDisp] = useState(false);
  const [showFormBloqueo, setShowFormBloqueo] = useState(false);

  const [newDisp, setNewDisp] = useState({
    diaSemana: 1,
    horaInicio: '08:00',
    horaFin: '18:00',
    duracionSlot: 60,
    sede: 'Principal',
    tipoAtencion: 'CONSULTA',
    consultorio: '',
  });

  const [newBloqueo, setNewBloqueo] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    todoElDia: true,
  });

  const getToken = () => localStorage.getItem('accessToken') || '';
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  };

  const medicoId = getUser().id || getUser().userId;

  const cargar = async () => {
    if (!medicoId) return;
    setLoading(true);
    try {
      const token = getToken();
      const [rdis, rblq] = await Promise.all([
        fetch(`/api/disponibilidad/medico/${medicoId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/disponibilidad/bloqueos/medico/${medicoId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [ddata, bdata] = await Promise.all([rdis.json(), rblq.json()]);
      setDisponibilidades(ddata.disponibilidades || []);
      setBloqueos(bdata.bloqueos || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardarDisp = async () => {
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newDisp),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccess('Disponibilidad configurada');
      setShowFormDisp(false);
      cargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEliminarDisp = async (id: string) => {
    const token = getToken();
    await fetch(`/api/disponibilidad/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    cargar();
  };

  const handleGuardarBloqueo = async () => {
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/disponibilidad/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newBloqueo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccess('Bloqueo creado');
      setShowFormBloqueo(false);
      cargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEliminarBloqueo = async (id: string) => {
    const token = getToken();
    await fetch(`/api/disponibilidad/bloqueos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    cargar();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-10 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Configuración de Agenda
            </h1>
          </div>
          <p className="text-gray-400 ml-6">CU-01 · Define tu disponibilidad semanal, horarios y bloqueos</p>
        </motion.div>

        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
            <Check size={16} /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        {/* ── DISPONIBILIDAD ─────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-yellow-400" /> Disponibilidad Semanal
            </h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowFormDisp(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-semibold text-sm shadow-lg">
              <Plus size={16} /> Agregar Horario
            </motion.button>
          </div>

          {loading ? (
            <div className="text-gray-400 text-sm p-4">Cargando...</div>
          ) : disponibilidades.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-600 rounded-xl text-center text-gray-500">
              <Settings size={40} className="mx-auto mb-3 opacity-30" />
              <p>No has configurado ningún horario aún.</p>
              <p className="text-sm mt-1">Agrega tu disponibilidad semanal para que los pacientes puedan agendar citas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disponibilidades.map((d) => (
                <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-400 font-bold text-xs">{DIAS[d.diaSemana].slice(0, 3).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{DIAS[d.diaSemana]}</p>
                      <p className="text-gray-400 text-sm">{d.horaInicio} – {d.horaFin} · {d.duracionSlot}min/cita</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gray-300 text-sm">{d.sede || 'Principal'}</p>
                      <p className="text-gray-500 text-xs">{d.tipoAtencion}</p>
                    </div>
                    <button onClick={() => handleEliminarDisp(d.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── BLOQUEOS ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-orange-400" /> Bloqueos y Excepciones
            </h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowFormBloqueo(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold text-sm shadow-lg">
              <Plus size={16} /> Bloquear Período
            </motion.button>
          </div>

          {bloqueos.length === 0 ? (
            <div className="p-6 border border-dashed border-slate-600 rounded-xl text-center text-gray-500 text-sm">
              Sin bloqueos configurados (vacaciones, festivos, etc.)
            </div>
          ) : (
            <div className="space-y-3">
              {bloqueos.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 border border-orange-500/20 rounded-xl">
                  <div>
                    <p className="text-white font-semibold">{b.motivo || 'Bloqueo'}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(b.fechaInicio).toLocaleDateString('es-CO')} → {new Date(b.fechaFin).toLocaleDateString('es-CO')}
                      {b.todoElDia && <span className="ml-2 text-orange-400 text-xs">Todo el día</span>}
                    </p>
                  </div>
                  <button onClick={() => handleEliminarBloqueo(b.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── MODAL NUEVA DISPONIBILIDAD ────────────────────────────────── */}
      <AnimatePresence>
        {showFormDisp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  <Plus size={20} /> Nuevo Horario
                </h3>
                <button onClick={() => setShowFormDisp(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Día de la semana</label>
                  <select value={newDisp.diaSemana} onChange={e => setNewDisp(p => ({ ...p, diaSemana: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Duración slot (min)</label>
                  <select value={newDisp.duracionSlot} onChange={e => setNewDisp(p => ({ ...p, duracionSlot: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    {[15, 20, 30, 45, 60, 90].map(v => <option key={v} value={v}>{v} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Hora inicio</label>
                  <input type="time" value={newDisp.horaInicio} onChange={e => setNewDisp(p => ({ ...p, horaInicio: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Hora fin</label>
                  <input type="time" value={newDisp.horaFin} onChange={e => setNewDisp(p => ({ ...p, horaFin: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Sede</label>
                  <input type="text" value={newDisp.sede} onChange={e => setNewDisp(p => ({ ...p, sede: e.target.value }))}
                    placeholder="Principal" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Tipo Atención</label>
                  <select value={newDisp.tipoAtencion} onChange={e => setNewDisp(p => ({ ...p, tipoAtencion: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Consultorio (opcional)</label>
                  <input type="text" value={newDisp.consultorio} onChange={e => setNewDisp(p => ({ ...p, consultorio: e.target.value }))}
                    placeholder="Ej: Consultorio 2" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowFormDisp(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 transition text-sm">
                  Cancelar
                </button>
                <button onClick={handleGuardarDisp}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-semibold text-sm shadow-lg">
                  <Check size={14} className="inline mr-1" /> Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL NUEVO BLOQUEO ──────────────────────────────────────── */}
      <AnimatePresence>
        {showFormBloqueo && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2">
                  <Calendar size={20} /> Bloquear Período
                </h3>
                <button onClick={() => setShowFormBloqueo(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Motivo</label>
                  <input type="text" value={newBloqueo.motivo} onChange={e => setNewBloqueo(p => ({ ...p, motivo: e.target.value }))}
                    placeholder="Vacaciones, festivo, capacitación..." className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Fecha inicio</label>
                    <input type="date" value={newBloqueo.fechaInicio} onChange={e => setNewBloqueo(p => ({ ...p, fechaInicio: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Fecha fin</label>
                    <input type="date" value={newBloqueo.fechaFin} onChange={e => setNewBloqueo(p => ({ ...p, fechaFin: e.target.value }))}
                      min={newBloqueo.fechaInicio} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowFormBloqueo(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 transition text-sm">
                  Cancelar
                </button>
                <button onClick={handleGuardarBloqueo}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold text-sm shadow-lg">
                  <Check size={14} className="inline mr-1" /> Guardar Bloqueo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
