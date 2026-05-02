import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, User, AlertCircle, CheckCircle } from 'lucide-react';

interface BuscadorPacienteProps {
  onPacienteEncontrado: (paciente: any) => void;
  onNuevoPaciente: () => void;
  onClose: () => void;
}

export function BuscadorPaciente({ onPacienteEncontrado, onNuevoPaciente, onClose }: BuscadorPacienteProps) {
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState<any>(null);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('accessToken') || '';

  const handleBuscar = async () => {
    if (!numeroDocumento.trim()) {
      setError('Por favor ingresa el número de documento');
      return;
    }

    setBuscando(true);
    setError('');
    setPacienteEncontrado(null);

    try {
      // Buscar por documento
      const response = await fetch(
        `/api/pacientes/search?documento=${numeroDocumento}&tipo=${tipoDocumento}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      const data = await response.json();

      if (response.ok && data) {
        setPacienteEncontrado(data);
      } else {
        setError('Paciente no encontrado');
      }
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      setError('Error al buscar paciente');
    } finally {
      setBuscando(false);
    }
  };

  const handleSeleccionar = () => {
    if (pacienteEncontrado) {
      onPacienteEncontrado(pacienteEncontrado);
    }
  };

  const handleCrearNuevo = () => {
    onNuevoPaciente();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Búsqueda de Paciente</h2>
        <p className="text-slate-400 text-sm mb-6">
          Busca un paciente existente por su tipo y número de documento
        </p>

        {/* Formulario de búsqueda */}
        <div className="space-y-4 mb-6">
          {/* Tipo de documento */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PA">Pasaporte</option>
            </select>
          </div>

          {/* Número de documento */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Número de Documento *
            </label>
            <input
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Ej: 1234567890"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
          >
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}

        {/* Resultado de búsqueda */}
        {pacienteEncontrado && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-green-400 font-semibold">¡Paciente Encontrado!</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Nombre:</span>
                <span className="text-white font-medium">{pacienteEncontrado.nombreCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Documento:</span>
                <span className="text-white font-medium">
                  {pacienteEncontrado.tipoDocumento} {pacienteEncontrado.numeroDocumento}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Email:</span>
                <span className="text-white font-medium">{pacienteEncontrado.email || 'No registrado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Teléfono:</span>
                <span className="text-white font-medium">
                  {pacienteEncontrado.telefonos?.[0] || 'No registrado'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          {pacienteEncontrado ? (
            <>
              <button
                onClick={handleSeleccionar}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Usar este Paciente
              </button>
              <button
                onClick={() => setPacienteEncontrado(null)}
                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Nueva Búsqueda
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBuscar}
                disabled={buscando}
                className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search size={18} />
                {buscando ? 'Buscando...' : 'Buscar Paciente'}
              </button>
              <button
                onClick={handleCrearNuevo}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Crear Nuevo
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
