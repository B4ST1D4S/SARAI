import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface AgendarCitaProps {
  pacienteId?: string;
  pacienteNombre?: string;
  entidadSaludInicial?: string;
  medicoId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AgendarCita({
  pacienteId = '',
  pacienteNombre = '',
  entidadSaludInicial = '',
  medicoId: medicoIdProp = '',
  onClose,
  onSuccess,
}: AgendarCitaProps) {
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    tipoConsultaId: '',
    tipoConsulta: 'CONSULTA',
    entidadSalud: entidadSaludInicial,
    notas: '',
    reminderEmail: true,
  });

  // Tipos de consulta cargados desde la parametrización
  const [tiposConsultaApi, setTiposConsultaApi] = useState<{ id: string; nombre: string; duracionMinutos: number; clasificacion: string }[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getToken = () => localStorage.getItem('accessToken') || '';
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  };

  // Determinar el medicoId efectivo
  const getEfectiveMedicoId = () => {
    if (medicoIdProp) return medicoIdProp;
    const u = getUser();
    return u.id || u.userId || '';
  };

  // ── Cargar tipos de consulta desde la parametrización ─────────────────────
  useEffect(() => {
    const mId = getEfectiveMedicoId();
    if (!mId) return;
    setLoadingTipos(true);
    fetch(`/api/disponibilidad/tipos-consulta/${mId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => {
        const tipos = d.tiposConsulta || [];
        setTiposConsultaApi(tipos);
        // Si hay tipos, pre-seleccionar el primero
        if (tipos.length > 0) {
          setFormData(p => ({
            ...p,
            tipoConsultaId: tipos[0].id,
            tipoConsulta: tipos[0].nombre,
          }));
        }
      })
      .catch(() => {/* fallback a tipos hardcoded abajo */})
      .finally(() => setLoadingTipos(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Duración del tipo seleccionado (para los slots)
  const duracionTipoActual = (): number | undefined => {
    const tipo = tiposConsultaApi.find(t => t.id === formData.tipoConsultaId);
    return tipo?.duracionMinutos;
  };

  const tiposConsultaFallback = [
    { id: 'CONSULTA',       nombre: 'Consulta Inicial',  duracionMinutos: 30, clasificacion: 'consulta' },
    { id: 'PREOPERATORIO',  nombre: 'Preoperatorio',     duracionMinutos: 45, clasificacion: 'preoperatorio' },
    { id: 'POSTOPERATORIO', nombre: 'Postoperatorio',    duracionMinutos: 30, clasificacion: 'control' },
    { id: 'CONTROL',        nombre: 'Control',           duracionMinutos: 20, clasificacion: 'control' },
    { id: 'PROCEDIMIENTO',  nombre: 'Procedimiento',     duracionMinutos: 90, clasificacion: 'procedimiento' },
    { id: 'OTRO',           nombre: 'Otro',              duracionMinutos: 60, clasificacion: 'otro' },
  ];

  // Lista efectiva: usa API si hay resultados, sino los hardcoded
  const tiposEfectivos = tiposConsultaApi.length > 0 ? tiposConsultaApi : tiposConsultaFallback;

  const entidadesSalud = [
    'Particular',
    'SURA EPS',
    'Nueva EPS',
    'Sanitas EPS',
    'Compensar EPS',
    'Coomeva EPS',
    'Famisanar',
    'Salud Total',
    'Medimás EPS',
    'Coosalud EPS',
    'Aliansalud',
    'Emssanar',
    'Anas Wayuu',
    'Otro convenio',
  ];

  // ── Cargar slots disponibles cuando cambia la fecha o el tipo de consulta ──
  useEffect(() => {
    if (!formData.fecha) { setSlots([]); return; }

    const cargarSlots = async () => {
      setLoadingSlots(true);
      setFormData(p => ({ ...p, hora: '' }));
      try {
        const user = getUser();
        const medicoId = getEfectiveMedicoId();
        if (!medicoId) { setSlots([]); return; }

        const token = getToken();
        const duracion = duracionTipoActual();
        const url = duracion
          ? `/api/disponibilidad/slots?medicoId=${medicoId}&fecha=${formData.fecha}&duracion=${duracion}`
          : `/api/disponibilidad/slots?medicoId=${medicoId}&fecha=${formData.fecha}`;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        if (res.ok) {
          const data = await res.json();
          if (data.slots && data.slots.length > 0) {
            setSlots(data.slots);
          } else {
            const genericos: string[] = [];
            for (let h = 9; h < 17; h++) genericos.push(`${String(h).padStart(2, '0')}:00`);
            setSlots(genericos);
          }
        } else {
          const genericos: string[] = [];
          for (let h = 9; h < 17; h++) genericos.push(`${String(h).padStart(2, '0')}:00`);
          setSlots(genericos);
        }
      } catch {
        const genericos: string[] = [];
        for (let h = 9; h < 17; h++) genericos.push(`${String(h).padStart(2, '0')}:00`);
        setSlots(genericos);
      } finally {
        setLoadingSlots(false);
      }
    };

    cargarSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fecha, formData.tipoConsultaId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? inputElement.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.fecha || !formData.hora) {
        throw new Error('Por favor completa fecha y hora');
      }
      if (!pacienteId) {
        throw new Error('No se encontró el paciente. Cierra y vuelve a buscar.');
      }
      const token = getToken();
      if (!token) throw new Error('Sesión expirada. Recarga la página.');

      const user = getUser();
      const medicoId = user.id || user.userId;
      if (!medicoId) throw new Error('No se pudo identificar al médico. Recarga la página.');

      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          medicoId,
          tipoCita: formData.tipoConsulta,
          entidadSalud: formData.entidadSalud || undefined,
          fechaHora: `${formData.fecha}T${formData.hora}:00.000Z`,
          duracionMinutos: duracionTipoActual() || 60,
          motivo: `Cita de ${formData.tipoConsulta}`,
          notas: formData.notas,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Error ${response.status}`);
      }

      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-emerald-400" size={32} />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">¡Cita Agendada!</h3>
          <p className="text-gray-400 mb-4">La cita fue creada exitosamente.</p>
          <p className="text-yellow-400 font-semibold text-sm">Redirigiendo...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-yellow-500/30 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-yellow-500/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-yellow-500/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Agendar Cita
              </h2>
            </div>
            {pacienteNombre && (
              <p className="text-gray-400 text-sm mt-2 ml-5">
                <User size={14} className="inline mr-1" />
                Paciente: <span className="text-yellow-300 font-semibold">{pacienteNombre}</span>
              </p>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose}
            className="p-3 hover:bg-yellow-500/10 rounded-full transition-colors">
            <X className="text-gray-400 hover:text-yellow-400" size={24} />
          </motion.button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <Calendar size={20} /> Fecha
            </label>
            <input
              type="date" name="fecha" value={formData.fecha}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition"
              required
            />
          </div>

          {/* Hora — grilla de slots disponibles */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <Clock size={20} /> Horario Disponible
              {loadingSlots && <RefreshCw size={14} className="text-yellow-400 animate-spin ml-2" />}
            </label>

            {!formData.fecha ? (
              <p className="text-gray-500 text-sm italic p-3 border border-slate-600/30 rounded-lg bg-slate-800/30">
                Selecciona una fecha para ver los horarios disponibles del médico
              </p>
            ) : loadingSlots ? (
              <div className="p-3 border border-slate-600/30 rounded-lg text-gray-400 text-sm bg-slate-800/30">
                Consultando disponibilidad del médico...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-3 border border-red-500/30 bg-red-500/5 rounded-lg text-red-400 text-sm">
                No hay horarios disponibles para esta fecha. Selecciona otro día.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot} type="button"
                      onClick={() => setFormData(p => ({ ...p, hora: slot }))}
                      className={`px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        formData.hora === slot
                          ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                          : 'bg-slate-700/50 border-slate-600/50 text-white hover:border-yellow-500/50 hover:bg-yellow-500/10'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {formData.hora && (
                  <p className="mt-2 text-emerald-400 text-sm">
                    ✓ Horario seleccionado: <strong>{formData.hora}</strong>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Tipo de Consulta — cards dinámicas desde parametrización */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <FileText size={20} /> Tipo de Consulta
              {loadingTipos && <RefreshCw size={13} className="text-yellow-400 animate-spin ml-1" />}
              {tiposConsultaApi.length > 0 && (
                <span className="text-xs text-emerald-400 ml-auto font-normal">Desde parametrización</span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiposEfectivos.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, tipoConsultaId: t.id, tipoConsulta: t.nombre }))}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    formData.tipoConsultaId === t.id
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10'
                      : 'bg-slate-700/40 border-slate-600/40 text-slate-300 hover:border-slate-500 hover:bg-slate-700/60'
                  }`}
                >
                  <span className="text-xs text-slate-400 font-normal">{t.duracionMinutos}min</span>
                  <span className="text-center leading-tight">{t.nombre}</span>
                </button>
              ))}
            </div>
            {formData.tipoConsulta && (
              <p className="mt-1.5 text-yellow-400/70 text-xs">
                ✓ {formData.tipoConsulta}
                {duracionTipoActual() && <span className="ml-1 text-slate-400">· {duracionTipoActual()} min/slot</span>}
              </p>
            )}
          </div>

          {/* Entidad / Plan a cobrar */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <User size={20} /> Entidad / Plan a Cobrar
            </label>
            <select
              name="entidadSalud"
              value={formData.entidadSalud}
              onChange={handleInputChange}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition"
            >
              <option value="">— Seleccionar entidad —</option>
              {entidadesSalud.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            {formData.entidadSalud && (
              <p className="mt-1.5 text-emerald-400 text-xs">✓ {formData.entidadSalud}</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <FileText size={20} /> Notas Adicionales
            </label>
            <textarea name="notas" value={formData.notas} onChange={handleInputChange}
              placeholder="Información adicional sobre la cita..." rows={3}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition resize-none"
            />
          </div>

          {/* Recordatorio */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <input type="checkbox" id="reminder" name="reminderEmail"
              checked={formData.reminderEmail} onChange={handleInputChange}
              className="w-4 h-4 rounded cursor-pointer accent-yellow-500" />
            <label htmlFor="reminder" className="text-gray-300 cursor-pointer flex-1 text-sm">
              Enviar recordatorio por email 24h antes
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-600/50 text-white font-semibold rounded-lg hover:bg-slate-700/30 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              disabled={loading || !formData.hora || slots.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" /> Agendando...</>
              ) : (
                <><Check size={20} /> Agendar Cita</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
