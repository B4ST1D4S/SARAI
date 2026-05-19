import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, User, AlertCircle, CheckCircle } from 'lucide-react';

interface BuscadorPacienteProps {
  onPacienteEncontrado: (paciente: any) => void;
  onNuevoPaciente: () => void;
  onConfirmarYAgendar: (paciente: any) => void;
  onClose: () => void;
}

export function BuscadorPaciente({ onPacienteEncontrado, onNuevoPaciente, onConfirmarYAgendar, onClose }: BuscadorPacienteProps) {
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
        // Paciente no encontrado → abrir formulario de creación automáticamente
        setError('Paciente no encontrado. Abriendo formulario de registro...');
        setTimeout(() => onNuevoPaciente(), 1200);
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
            className={`mb-4 flex items-center gap-2 p-3 rounded-lg border ${
              error.includes('no encontrado')
                ? 'bg-yellow-500/10 border-yellow-500/40'
                : 'bg-red-500/20 border-red-500/50'
            }`}
          >
            <AlertCircle size={18} className={error.includes('no encontrado') ? 'text-yellow-400' : 'text-red-400'} />
            <span className={`text-sm ${error.includes('no encontrado') ? 'text-yellow-300' : 'text-red-400'}`}>{error}</span>
          </motion.div>
        )}

        {/* Resultado: Paciente encontrado → tarjeta compacta con acciones */}
        {pacienteEncontrado && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Card del paciente */}
            <div className="p-4 bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/40 rounded-xl mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {pacienteEncontrado.nombreCompleto?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Paciente encontrado</span>
                  </div>
                  <p className="text-white font-bold text-lg leading-tight">{pacienteEncontrado.nombreCompleto}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <p className="text-slate-400 text-xs">Documento</p>
                  <p className="text-white font-medium">{pacienteEncontrado.tipoDocumento} {pacienteEncontrado.numeroDocumento}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <p className="text-slate-400 text-xs">Teléfono</p>
                  <p className="text-white font-medium">{pacienteEncontrado.telefonos?.[0] || '—'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 col-span-2">
                  <p className="text-slate-400 text-xs">Email</p>
                  <p className="text-white font-medium truncate">{pacienteEncontrado.email || '—'}</p>
                </div>
                {pacienteEncontrado.entidadSalud && (
                  <div className="bg-slate-800/50 rounded-lg px-3 py-2 col-span-2">
                    <p className="text-slate-400 text-xs">Entidad de salud</p>
                    <p className="text-white font-medium">{pacienteEncontrado.entidadSalud}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onConfirmarYAgendar(pacienteEncontrado)}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle size={18} />
                Confirmar datos y Agendar Cita →
              </button>
              <button
                onClick={() => onPacienteEncontrado(pacienteEncontrado)}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-slate-600"
              >
                <User size={16} />
                Editar datos del paciente primero
              </button>
            </div>
          </motion.div>
        )}

        {/* Botones de búsqueda / navegación */}
        <div className="flex gap-3">
          {!pacienteEncontrado && (
            <button
              onClick={handleBuscar}
              disabled={buscando}
              className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search size={18} />
              {buscando ? 'Buscando...' : 'Buscar Paciente'}
            </button>
          )}
          {pacienteEncontrado && (
            <button
              onClick={() => { setPacienteEncontrado(null); setNumeroDocumento(''); setError(''); }}
              className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors border border-slate-600"
            >
              ← Nueva Búsqueda
            </button>
          )}
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-700/50 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
