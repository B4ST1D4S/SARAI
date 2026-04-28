import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Send, AlertCircle, Check } from 'lucide-react';

interface EntregarHistoriaClinicaProps {
  citaId: string;
  pacienteNombre: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EntregarHistoriaClinica({
  citaId,
  pacienteNombre,
  onClose,
  onSuccess,
}: EntregarHistoriaClinicaProps) {
  const [formData, setFormData] = useState({
    contenido: '',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem('accessToken') || '';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.contenido.trim()) {
        throw new Error('Por favor completa el contenido de la historia clínica');
      }

      // Aquí iría la lógica para entregar la historia clínica
      // Por ahora simularemos el envío
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-emerald-500/15"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="bg-gradient-to-br from-emerald-500/30 to-teal-600/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="text-emerald-300" size={40} />
          </motion.div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-teal-500 bg-clip-text text-transparent mb-3">¡Entregada!</h3>
          <p className="text-gray-300 mb-6 text-base">
            La historia clínica ha sido entregada al paciente exitosamente. ✓
          </p>
          <p className="text-emerald-400 font-bold text-sm animate-pulse">
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
        className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-500/10"
      >
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-emerald-500/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full"></div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-600 bg-clip-text text-transparent">
                Historia Clínica
              </h2>
            </div>
            <p className="text-gray-400 text-sm mt-2 ml-5">👤 <span className="text-emerald-300 font-semibold">{pacienteNombre}</span></p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            onClick={onClose}
            className="p-3 hover:bg-emerald-500/10 rounded-full transition-colors"
          >
            <X className="text-gray-400 hover:text-emerald-400" size={24} />
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/15 border border-red-500/40 rounded-xl flex items-start gap-3 backdrop-blur-sm"
          >
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contenido de Historia Clínica */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="flex items-center gap-3 text-emerald-400 font-bold mb-3 text-sm uppercase tracking-wide">
              <div className="w-1 h-5 bg-emerald-400 rounded-full"></div>
              <FileText size={18} />
              Contenido de Historia Clínica
            </label>
            <textarea
              name="contenido"
              value={formData.contenido}
              onChange={handleInputChange}
              placeholder="📝 Registra la historia clínica completa del paciente..."
              rows={8}
              className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/60 focus:bg-slate-800/80 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 resize-none"
              required
            />
            <p className="text-gray-500 text-xs mt-2">Caracteres: {formData.contenido.length}</p>
          </motion.div>

          {/* Observaciones */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <label className="flex items-center gap-3 text-emerald-400 font-bold mb-3 text-sm uppercase tracking-wide">
              <div className="w-1 h-5 bg-emerald-400 rounded-full"></div>
              💬 Observaciones Adicionales
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              placeholder="Recomendaciones, diagnósticos, tratamientos, seguimiento..."
              rows={4}
              className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/60 focus:bg-slate-800/80 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 resize-none"
            />
          </motion.div>

          {/* Info box */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm"
          >
            <p className="text-gray-300 text-sm">
              ✓ Esta información será entregada inmediatamente al paciente
            </p>
          </motion.div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-600/50 text-white font-semibold rounded-xl hover:bg-slate-700/30 hover:border-slate-500/50 transition-all duration-200"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:from-emerald-400 disabled:to-teal-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entregando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Entregar Ahora
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
