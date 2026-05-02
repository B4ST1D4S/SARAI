import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, FileText, Check, AlertCircle } from 'lucide-react';

interface AgendarCitaProps {
  pacienteId?: string;
  pacienteNombre?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AgendarCita({
  pacienteId = '',
  pacienteNombre = '',
  onClose,
  onSuccess,
}: AgendarCitaProps) {
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    tipoConsulta: 'CONSULTA',
    notas: '',
    reminderEmail: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Leer token y user en cada operación para que nunca sean stale
  const getToken = () => localStorage.getItem('accessToken') || '';
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  };

  const tiposConsulta = [
    { value: 'CONSULTA', label: 'Consulta Inicial' },
    { value: 'PREOPERATORIO', label: 'Preoperatorio' },
    { value: 'POSTOPERATORIO', label: 'Postoperatorio' },
    { value: 'CONTROL', label: 'Control' },
  ];

  const horas = Array.from({ length: 9 }, (_, i) => {
    const h = 9 + i;
    return `${String(h).padStart(2, '0')}:00`;
  });

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
        throw new Error('No se encontró el paciente. Cierra y vuelve a buscar el paciente.');
      }

      const token = getToken();
      if (!token) {
        throw new Error('Sesión expirada. Recarga la página e inicia sesión de nuevo.');
      }

      const user = getUser();
      const medicoId = user.id || user.userId;
      if (!medicoId) {
        throw new Error('No se pudo identificar al médico. Recarga la página.');
      }

      // Combinar fecha y hora en formato ISO
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}:00`);

      const payload = {
        pacienteId,
        medicoId,
        tipoCita: formData.tipoConsulta,
        fechaHora: fechaHora.toISOString(),
        duracionMinutos: 60,
        motivo: `Cita de ${formData.tipoConsulta}`,
        notas: formData.notas,
      };

      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Error ${response.status}: No se pudo crear la cita`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="text-emerald-400" size={32} />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">¡Cita Agendada!</h3>
          <p className="text-gray-400 mb-6">
            La cita ha sido creada exitosamente. Se envió confirmación al correo del paciente.
          </p>
          <p className="text-yellow-400 font-semibold text-sm">
            Redirigiendo...
          </p>
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
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-yellow-500/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full"></div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Agendar Cita
              </h2>
            </div>
            {pacienteNombre && (
              <p className="text-gray-400 text-sm mt-2 ml-5">👤 Paciente: <span className="text-yellow-300 font-semibold">{pacienteNombre}</span></p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            onClick={onClose}
            className="p-3 hover:bg-yellow-500/10 rounded-full transition-colors"
          >
            <X className="text-gray-400 hover:text-yellow-400" size={24} />
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <Calendar size={20} />
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
              required
            />
          </div>

          {/* Hora */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <Clock size={20} />
              Hora
            </label>
            <select
              name="hora"
              value={formData.hora}
              onChange={handleInputChange}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
              required
            >
              <option value="">Selecciona una hora</option>
              {horas.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Consulta */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <FileText size={20} />
              Tipo de Consulta
            </label>
            <select
              name="tipoConsulta"
              value={formData.tipoConsulta}
              onChange={handleInputChange}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
            >
              {tiposConsulta.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
              <FileText size={20} />
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              placeholder="Información adicional sobre la cita..."
              rows={4}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition resize-none"
            />
          </div>

          {/* Checkbox Recordatorio */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <input
              type="checkbox"
              id="reminder"
              name="reminderEmail"
              checked={formData.reminderEmail}
              onChange={handleInputChange}
              className="w-4 h-4 rounded cursor-pointer accent-yellow-500"
            />
            <label htmlFor="reminder" className="text-gray-300 cursor-pointer flex-1">
              Enviar recordatorio por email 24h antes
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-600/50 text-white font-semibold rounded-lg hover:bg-slate-700/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Agendar Cita
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
