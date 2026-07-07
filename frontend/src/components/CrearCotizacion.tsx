import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, DollarSign, Send, AlertCircle, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface LineaItemCotizacion {
  id: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

interface CrearCotizacionProps {
  pacienteId: string;
  pacienteNombre: string;
  citaId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CrearCotizacion({
  pacienteId,
  pacienteNombre,
  citaId,
  onClose,
  onSuccess,
}: CrearCotizacionProps) {
  const [formData, setFormData] = useState({
    descripcionServicio: '',
    descuentoPorcentaje: 0,
    notasAdicionales: '',
    vigenciaDias: 30,
  });

  const [lineas, setLineas] = useState<LineaItemCotizacion[]>([
    { id: '1', descripcion: '', cantidad: 1, valorUnitario: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem('accessToken') || '';
  const user = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleLineaChange = (
    id: string,
    field: keyof LineaItemCotizacion,
    value: any
  ) => {
    setLineas(lineas.map(linea =>
      linea.id === id
        ? {
            ...linea,
            [field]:
              field === 'cantidad' || field === 'valorUnitario'
                ? parseFloat(value)
                : value,
          }
        : linea
    ));
  };

  const agregarLinea = () => {
    const newId = String(Math.max(...lineas.map(l => parseInt(l.id))) + 1);
    setLineas([
      ...lineas,
      { id: newId, descripcion: '', cantidad: 1, valorUnitario: 0 },
    ]);
  };

  const eliminarLinea = (id: string) => {
    if (lineas.length > 1) {
      setLineas(lineas.filter(linea => linea.id !== id));
    }
  };

  const calcularTotales = () => {
    const subtotal = lineas.reduce((sum, linea) => {
      return sum + linea.cantidad * linea.valorUnitario;
    }, 0);
    const descuento = (subtotal * formData.descuentoPorcentaje) / 100;
    return {
      subtotal,
      descuento,
      total: subtotal - descuento,
    };
  };

  const totales = calcularTotales();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.descripcionServicio.trim()) {
        throw new Error('Por favor completa la descripción del servicio');
      }

      if (lineas.some(l => !l.descripcion.trim() || l.valorUnitario <= 0)) {
        throw new Error('Por favor completa todas las líneas de la cotización');
      }

      const payload = {
        pacienteId,
        medicoId: user.id,
        citaId,
        descripcionServicio: formData.descripcionServicio,
        lineas: lineas.map(({ id, ...rest }) => rest),
        descuentoPorcentaje: formData.descuentoPorcentaje,
        notasAdicionales: formData.notasAdicionales,
        vigenciaDias: formData.vigenciaDias,
      };

      const response = await fetch(`${API_BASE_URL}/cotizaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear cotización');
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-slate-950 to-slate-900 border border-yellow-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-yellow-500/15"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="bg-gradient-to-br from-yellow-500/30 to-amber-600/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="text-yellow-300" size={40} />
          </motion.div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-600 bg-clip-text text-transparent mb-3">¡Cotización Creada!</h3>
          <p className="text-gray-300 mb-6 text-base">
            La cotización ha sido enviada al correo del paciente. ✓
          </p>
          <p className="text-yellow-400 font-bold text-sm animate-pulse">
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
        className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-yellow-500/30 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-yellow-500/10"
      >
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-yellow-500/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full"></div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Crear Cotización
              </h2>
            </div>
            <p className="text-gray-400 text-sm mt-2 ml-5">👤 <span className="text-yellow-300 font-semibold">{pacienteNombre}</span></p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            onClick={onClose}
            className="p-3 hover:bg-yellow-500/10 rounded-full transition-colors"
          >
            <X className="text-gray-400" size={24} />
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
          {/* Descripción del Servicio */}
          <div>
            <label className="block text-yellow-400 font-semibold mb-3">
              Descripción del Servicio
            </label>
            <textarea
              name="descripcionServicio"
              value={formData.descripcionServicio}
              onChange={handleInputChange}
              placeholder="Ej: Rinoplastia + Mentoplastia"
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition resize-none"
              required
            />
          </div>

          {/* Items de Cotización */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-yellow-400 font-semibold">
                Líneas de Cotización
              </label>
              <button
                type="button"
                onClick={agregarLinea}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm font-semibold"
              >
                <Plus size={16} />
                Agregar Línea
              </button>
            </div>

            <div className="space-y-3">
              {lineas.map((linea, idx) => (
                <div key={linea.id} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={linea.descripcion}
                    onChange={(e) =>
                      handleLineaChange(linea.id, 'descripcion', e.target.value)
                    }
                    placeholder="Descripción"
                    className="col-span-6 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition text-sm"
                  />
                  <input
                    type="number"
                    value={linea.cantidad}
                    onChange={(e) =>
                      handleLineaChange(linea.id, 'cantidad', e.target.value)
                    }
                    min="1"
                    className="col-span-2 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500/50 transition text-sm"
                  />
                  <input
                    type="number"
                    value={linea.valorUnitario}
                    onChange={(e) =>
                      handleLineaChange(
                        linea.id,
                        'valorUnitario',
                        e.target.value
                      )
                    }
                    min="0"
                    className="col-span-2 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500/50 transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarLinea(linea.id)}
                    disabled={lineas.length === 1}
                    className="col-span-2 p-2 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Trash2 className="text-red-400" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Descuento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-yellow-400 font-semibold mb-3">
                Descuento (%)
              </label>
              <input
                type="number"
                name="descuentoPorcentaje"
                value={formData.descuentoPorcentaje}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-yellow-400 font-semibold mb-3">
                Vigencia (días)
              </label>
              <input
                type="number"
                name="vigenciaDias"
                value={formData.vigenciaDias}
                onChange={handleInputChange}
                min="1"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/50 transition"
              />
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal:</span>
                <span className="text-white font-semibold">
                  ${totales.subtotal.toLocaleString('es-CO')}
                </span>
              </div>
              {formData.descuentoPorcentaje > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>Descuento ({formData.descuentoPorcentaje}%):</span>
                  <span>-${totales.descuento.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="border-t border-yellow-500/20 pt-2 flex justify-between">
                <span className="text-yellow-400 font-semibold">Total:</span>
                <span className="text-yellow-400 font-bold text-lg">
                  ${totales.total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-yellow-400 font-semibold mb-3">
              Notas Adicionales
            </label>
            <textarea
              name="notasAdicionales"
              value={formData.notasAdicionales}
              onChange={handleInputChange}
              placeholder="Términos, condiciones o información adicional..."
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition resize-none"
            />
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
                  Creando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Crear y Enviar Cotización
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


