/**
 * CU-01: Configuración de Agenda del Profesional
 * Permite seleccionar un profesional, ver sus tipos de consulta por especialidad
 * y definir disponibilidad semanal con intervalos de turno.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Plus, Trash2, Calendar, Clock, MapPin,
  AlertCircle, Check, X, User, Stethoscope, ChevronRight,
  Clock3,
} from 'lucide-react';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const INTERVALOS = [10, 15, 20, 30, 45, 60, 90, 120];

interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string | null;
  registroMedico: string | null;
  email: string | null;
}

interface TipoConsulta {
  id: string;
  nombre: string;
  duracionMinutos: number;
  clasificacion: string;
}

interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionSlot: number;
  sede: string;
  tipoAtencion: string;
  consultorio: string;
  activo: boolean;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

interface Bloqueo {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  todoElDia: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_DISP = {
  diaSemana: 1,
  todaLaSemana: false,   // si true → crea Lun-Sáb
  horaInicio: '08:00',
  horaFin: '16:00',
  duracionSlot: 30,
  sede: 'Principal',
  tipoConsultaId: '',
  tipoConsultaNombre: '',
  consultorio: '',
  fechaDesde: '',        // vigencia opcional
  fechaHasta: '',
};

function calcularTurnos(horaInicio: string, horaFin: string, intervalo: number): number {
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  const totalMin = (hF * 60 + mF) - (hI * 60 + mI);
  if (totalMin <= 0 || intervalo <= 0) return 0;
  return Math.floor(totalMin / intervalo);
}

export default function ConfigAgendaPage() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState<Medico | null>(null);
  const [tiposConsulta, setTiposConsulta] = useState<TipoConsulta[]>([]);
  const [especialidadMedico, setEspecialidadMedico] = useState('');
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showFormDisp, setShowFormDisp] = useState(false);
  const [showFormBloqueo, setShowFormBloqueo] = useState(false);
  const [newDisp, setNewDisp] = useState({ ...EMPTY_DISP });

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

  // ── Cargar lista de médicos al montar ────────────────────────────────
  useEffect(() => {
    const cargarMedicos = async () => {
      setLoadingMedicos(true);
      try {
        const token = getToken();
        const res = await fetch('/api/disponibilidad/medicos-list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const lista: Medico[] = data.medicos || [];
        setMedicos(lista);

        // Si el usuario logueado es MEDICO, pre-seleccionarlo
        const user = getUser();
        if (user.rol === 'MEDICO' && lista.length > 0) {
          const propio = lista.find(m => m.id === (user.id || user.userId));
          if (propio) await seleccionarMedico(propio);
        }
      } catch {
        setError('Error cargando lista de profesionales');
      } finally {
        setLoadingMedicos(false);
      }
    };
    cargarMedicos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Seleccionar médico → cargar tipos de consulta y disponibilidades ─
  const seleccionarMedico = async (medico: Medico) => {
    setMedicoSeleccionado(medico);
    setTiposConsulta([]);
    setDisponibilidades([]);
    setBloqueos([]);
    setLoadingTipos(true);

    const token = getToken();
    try {
      const [resTipos, resDis, resBlq] = await Promise.all([
        fetch(`/api/disponibilidad/tipos-consulta/${medico.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/disponibilidad/medico/${medico.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/disponibilidad/bloqueos/medico/${medico.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [dataTipos, dataDis, dataBlq] = await Promise.all([resTipos.json(), resDis.json(), resBlq.json()]);
      setTiposConsulta(dataTipos.tiposConsulta || []);
      setEspecialidadMedico(dataTipos.especialidadMedico || '');
      setDisponibilidades(dataDis.disponibilidades || []);
      setBloqueos(dataBlq.bloqueos || []);

      if (dataTipos.tiposConsulta?.length > 0) {
        const t = dataTipos.tiposConsulta[0];
        setNewDisp(p => ({ ...p, tipoConsultaId: t.id, tipoConsultaNombre: t.nombre, duracionSlot: t.duracionMinutos || 30 }));
      }
    } catch {
      setError('Error cargando datos del profesional');
    } finally {
      setLoadingTipos(false);
    }
  };

  const recargar = async () => {
    if (!medicoSeleccionado) return;
    setLoading(true);
    try {
      const token = getToken();
      const [resDis, resBlq] = await Promise.all([
        fetch(`/api/disponibilidad/medico/${medicoSeleccionado.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/disponibilidad/bloqueos/medico/${medicoSeleccionado.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [dataDis, dataBlq] = await Promise.all([resDis.json(), resBlq.json()]);
      setDisponibilidades(dataDis.disponibilidades || []);
      setBloqueos(dataBlq.bloqueos || []);
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar disponibilidad ────────────────────────────────────────────
  const handleGuardarDisp = async () => {
    setError('');
    if (!medicoSeleccionado) return;

    const turnos = calcularTurnos(newDisp.horaInicio, newDisp.horaFin, newDisp.duracionSlot);
    if (turnos <= 0) { setError('El horario de fin debe ser posterior al de inicio'); return; }
    if (newDisp.fechaHasta && newDisp.fechaDesde && newDisp.fechaHasta < newDisp.fechaDesde) {
      setError('La fecha fin debe ser igual o posterior a la fecha inicio'); return;
    }

    const dias = newDisp.todaLaSemana ? [1, 2, 3, 4, 5, 6] : [newDisp.diaSemana];
    const baseBody = {
      medicoId: medicoSeleccionado.id,
      horaInicio: newDisp.horaInicio,
      horaFin: newDisp.horaFin,
      duracionSlot: newDisp.duracionSlot,
      sede: newDisp.sede || 'Principal',
      tipoAtencion: newDisp.tipoConsultaNombre || 'CONSULTA',
      consultorio: newDisp.consultorio,
      fechaDesde: newDisp.fechaDesde || undefined,
      fechaHasta: newDisp.fechaHasta || undefined,
    };

    try {
      const token = getToken();
      const errors: string[] = [];

      for (const dia of dias) {
        const res = await fetch('/api/disponibilidad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...baseBody, diaSemana: dia }),
        });
        const data = await res.json();
        if (!res.ok) errors.push(`${DIAS[dia]}: ${data.error || 'error'}`);
      }

      if (errors.length > 0 && errors.length === dias.length) {
        throw new Error(errors[0]);
      }
      const creados = dias.length - errors.length;
      setSuccess(
        newDisp.todaLaSemana
          ? `Agenda creada para ${creados} día${creados !== 1 ? 's' : ''}: ${turnos} turnos de ${newDisp.duracionSlot}min`
          : `Agenda creada: ${turnos} turnos de ${newDisp.duracionSlot}min`
      );
      if (errors.length > 0) setError(`Algunos días ya tenían horario: ${errors.join(', ')}`);
      setShowFormDisp(false);
      setNewDisp({ ...EMPTY_DISP });
      await recargar();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEliminarDisp = async (id: string) => {
    const token = getToken();
    await fetch(`/api/disponibilidad/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await recargar();
  };

  // ── Guardar bloqueo ──────────────────────────────────────────────────
  const handleGuardarBloqueo = async () => {
    setError('');
    if (!medicoSeleccionado) return;
    try {
      const token = getToken();
      const res = await fetch('/api/disponibilidad/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newBloqueo, medicoId: medicoSeleccionado.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccess('Bloqueo creado');
      setShowFormBloqueo(false);
      setNewBloqueo({ fechaInicio: '', fechaFin: '', motivo: '', todoElDia: true });
      await recargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEliminarBloqueo = async (id: string) => {
    const token = getToken();
    await fetch(`/api/disponibilidad/bloqueos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await recargar();
  };

  const turnosPreview = calcularTurnos(newDisp.horaInicio, newDisp.horaFin, newDisp.duracionSlot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-10 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Configuración de Agenda
              </h1>
              <p className="text-gray-400 text-sm">Asigna horarios y tipos de consulta por profesional</p>
            </div>
          </div>
        </motion.div>

        {/* Alertas */}
        <AnimatePresence>
          {success && (
            <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2 text-sm">
              <Check size={16} /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
              <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Panel izquierdo: lista de profesionales */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700/50">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <User size={16} className="text-yellow-400" /> Profesionales
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">Selecciona para configurar agenda</p>
              </div>

              {loadingMedicos ? (
                <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
              ) : medicos.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <User size={32} className="mx-auto mb-2 opacity-30" />
                  No hay profesionales registrados
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {medicos.map(m => (
                    <button key={m.id} onClick={() => seleccionarMedico(m)}
                      className={`w-full text-left p-4 flex items-center gap-3 hover:bg-slate-700/40 transition-colors ${
                        medicoSeleccionado?.id === m.id ? 'bg-yellow-500/10 border-l-2 border-yellow-400' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        medicoSeleccionado?.id === m.id ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-gray-300'
                      }`}>
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{m.nombre} {m.apellido}</p>
                        <p className="text-gray-400 text-xs truncate">{m.especialidad || 'Sin especialidad'}</p>
                      </div>
                      {medicoSeleccionado?.id === m.id && (
                        <ChevronRight size={16} className="text-yellow-400 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="lg:col-span-2 space-y-5">

            {!medicoSeleccionado ? (
              <div className="flex flex-col items-center justify-center h-64 bg-slate-800/40 border border-dashed border-slate-600 rounded-2xl text-gray-500">
                <Settings size={48} className="mb-3 opacity-20" />
                <p className="font-semibold">Selecciona un profesional</p>
                <p className="text-sm">para ver y configurar su agenda</p>
              </div>
            ) : loadingTipos ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando datos...</div>
            ) : (
              <>
                {/* Info del profesional + tipos de consulta */}
                <div className="bg-slate-800/60 border border-yellow-500/20 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-full">
                          {especialidadMedico || medicoSeleccionado.especialidad || 'Sin especialidad'}
                        </span>
                        {medicoSeleccionado.registroMedico && (
                          <span className="text-gray-400 text-xs">Reg. {medicoSeleccionado.registroMedico}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setNewDisp({ ...EMPTY_DISP }); setShowFormDisp(true); }}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg">
                        <Plus size={15} /> Franja
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowFormBloqueo(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold text-sm shadow-lg">
                        <Calendar size={15} /> Bloqueo
                      </motion.button>
                    </div>
                  </div>

                  {tiposConsulta.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                        Tipos de consulta compatibles ({tiposConsulta.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tiposConsulta.map(t => (
                          <span key={t.id}
                            className="px-3 py-1 bg-slate-700/60 border border-slate-600 text-gray-300 text-xs rounded-lg flex items-center gap-1.5">
                            <Clock3 size={10} className="text-yellow-400" />
                            {t.nombre}
                            <span className="text-gray-500">· {t.duracionMinutos}min</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-400/80 text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      Sin tipos de consulta para esta especialidad. Se podrá configurar agenda de forma general.
                    </div>
                  )}
                </div>

                {/* Franjas horarias */}
                <div>
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" /> Franjas Horarias
                    <span className="ml-auto text-xs text-gray-500 font-normal">{disponibilidades.length} registro{disponibilidades.length !== 1 ? 's' : ''}</span>
                  </h3>

                  {loading ? (
                    <div className="text-gray-500 text-sm p-4 text-center">Cargando...</div>
                  ) : disponibilidades.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-600 rounded-xl text-center text-gray-500">
                      <Clock size={36} className="mx-auto mb-2 opacity-25" />
                      <p className="text-sm">Sin franjas configuradas. Usa "Franja" para agregar.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {disponibilidades.map(d => {
                        const turnos = calcularTurnos(d.horaInicio, d.horaFin, d.duracionSlot);
                        return (
                          <motion.div key={d.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-yellow-500/20 transition-colors group"
                          >
                            <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
                              <span className="text-yellow-400 font-bold text-xs">{DIAS[d.diaSemana].slice(0, 3).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-semibold text-sm">{DIAS[d.diaSemana]}</span>
                                <span className="text-gray-400 text-sm">{d.horaInicio} – {d.horaFin}</span>
                                <span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-xs rounded-full">{d.duracionSlot}min/turno</span>
                                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full">{turnos} turnos</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-gray-500 text-xs flex items-center gap-1"><MapPin size={10} />{d.sede || 'Principal'}</span>
                                {d.tipoAtencion && <span className="text-gray-500 text-xs flex items-center gap-1"><Stethoscope size={10} />{d.tipoAtencion}</span>}
                                {d.consultorio && <span className="text-gray-500 text-xs">{d.consultorio}</span>}
                                {(d.fechaDesde || d.fechaHasta) && (
                                  <span className="text-yellow-400/70 text-xs flex items-center gap-1">
                                    <Calendar size={9} />
                                    {d.fechaDesde ? new Date(d.fechaDesde).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '…'}
                                    {' → '}
                                    {d.fechaHasta ? new Date(d.fechaHasta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '…'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button onClick={() => handleEliminarDisp(d.id)}
                              className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={15} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bloqueos */}
                {bloqueos.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-orange-400" /> Bloqueos
                    </h3>
                    <div className="space-y-2">
                      {bloqueos.map(b => (
                        <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center justify-between p-4 bg-slate-800/50 border border-orange-500/20 rounded-xl group">
                          <div>
                            <p className="text-white font-semibold text-sm">{b.motivo || 'Bloqueo'}</p>
                            <p className="text-gray-400 text-xs">
                              {new Date(b.fechaInicio).toLocaleDateString('es-CO')} → {new Date(b.fechaFin).toLocaleDateString('es-CO')}
                              {b.todoElDia && <span className="ml-2 text-orange-400">Todo el día</span>}
                            </p>
                          </div>
                          <button onClick={() => handleEliminarBloqueo(b.id)}
                            className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={15} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Nueva Franja Horaria */}
      <AnimatePresence>
        {showFormDisp && medicoSeleccionado && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2"><Plus size={18} /> Nueva Franja Horaria</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{medicoSeleccionado.nombre} {medicoSeleccionado.apellido}</p>
                </div>
                <button onClick={() => setShowFormDisp(false)} className="text-gray-400 hover:text-white p-1"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Tipo de Consulta */}
                {tiposConsulta.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Tipo de Consulta</label>
                    <select
                      value={newDisp.tipoConsultaId}
                      onChange={e => {
                        const t = tiposConsulta.find(x => x.id === e.target.value);
                        setNewDisp(p => ({ ...p, tipoConsultaId: e.target.value, tipoConsultaNombre: t?.nombre || '', duracionSlot: t?.duracionMinutos || p.duracionSlot }));
                      }}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="">— Selecciona tipo de consulta —</option>
                      {tiposConsulta.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre} ({t.duracionMinutos}min)</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Toggle toda la semana */}
                <div className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-600/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewDisp(p => ({ ...p, todaLaSemana: !p.todaLaSemana }))}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      newDisp.todaLaSemana ? 'bg-yellow-500' : 'bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      newDisp.todaLaSemana ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {newDisp.todaLaSemana ? 'Toda la semana (Lun–Sáb)' : 'Día específico'}
                    </p>
                    {newDisp.todaLaSemana && (
                      <p className="text-gray-400 text-xs">Se crearán 6 franjas: Lunes a Sábado</p>
                    )}
                  </div>
                </div>

                {/* Día y slot */}
                <div className="grid grid-cols-2 gap-3">
                  {!newDisp.todaLaSemana && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Día</label>
                      <select value={newDisp.diaSemana} onChange={e => setNewDisp(p => ({ ...p, diaSemana: +e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none">
                        {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  <div className={newDisp.todaLaSemana ? 'col-span-2' : ''}>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Intervalo de turno</label>
                    <select value={newDisp.duracionSlot} onChange={e => setNewDisp(p => ({ ...p, duracionSlot: +e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none">
                      {INTERVALOS.map(v => <option key={v} value={v}>{v} min</option>)}
                    </select>
                  </div>
                </div>

                {/* Hora inicio / fin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Hora inicio</label>
                    <input type="time" value={newDisp.horaInicio} onChange={e => setNewDisp(p => ({ ...p, horaInicio: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Hora fin</label>
                    <input type="time" value={newDisp.horaFin} onChange={e => setNewDisp(p => ({ ...p, horaFin: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none" />
                  </div>
                </div>

                {/* Preview turnos */}
                <div className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${
                  turnosPreview > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  <Clock size={16} />
                  {turnosPreview > 0
                    ? <><strong className="text-white">{turnosPreview} turnos</strong> de {newDisp.duracionSlot}min entre {newDisp.horaInicio} y {newDisp.horaFin}</>
                    : 'La hora fin debe ser posterior al inicio'}
                </div>

                {/* Sede y consultorio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Sede</label>
                    <input type="text" value={newDisp.sede} onChange={e => setNewDisp(p => ({ ...p, sede: e.target.value }))}
                      placeholder="Principal" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1.5 block">Consultorio</label>
                    <input type="text" value={newDisp.consultorio} onChange={e => setNewDisp(p => ({ ...p, consultorio: e.target.value }))}
                      placeholder="Ej: Consultorio 2" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-yellow-500 focus:outline-none" />
                  </div>
                </div>

                {/* Vigencia (rango de fechas opcional) */}
                <div className="border-t border-slate-700/50 pt-4">
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-2 block flex items-center gap-1.5">
                    <Calendar size={11} /> Vigencia <span className="text-gray-600 normal-case font-normal">(opcional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                      <input type="date" value={newDisp.fechaDesde}
                        min={today()}
                        onChange={e => setNewDisp(p => ({ ...p, fechaDesde: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                      <input type="date" value={newDisp.fechaHasta}
                        min={newDisp.fechaDesde || today()}
                        onChange={e => setNewDisp(p => ({ ...p, fechaHasta: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none" />
                    </div>
                  </div>
                  {newDisp.fechaDesde && newDisp.fechaHasta && (
                    <p className="text-xs text-yellow-400/80 mt-1.5">
                      Esta franja aplica del {new Date(newDisp.fechaDesde + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} al {new Date(newDisp.fechaHasta + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowFormDisp(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-600 text-gray-300 rounded-xl hover:bg-slate-800 transition text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleGuardarDisp} disabled={turnosPreview <= 0}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-semibold text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Check size={16} /> Guardar Agenda
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Nuevo Bloqueo */}
      <AnimatePresence>
        {showFormBloqueo && medicoSeleccionado && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2"><Calendar size={20} /> Bloquear Período</h3>
                <button onClick={() => setShowFormBloqueo(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-gray-500 text-xs -mt-2">{medicoSeleccionado.nombre} {medicoSeleccionado.apellido}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Motivo</label>
                  <input type="text" value={newBloqueo.motivo} onChange={e => setNewBloqueo(p => ({ ...p, motivo: e.target.value }))}
                    placeholder="Vacaciones, festivo, capacitación..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
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

