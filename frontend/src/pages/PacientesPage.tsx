import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Trash2, Upload } from 'lucide-react';
import {
  createPaciente,
  getAllPacientes,
  deletePaciente,
  searchPacientes,
} from '../services/api';
import { FormularioPaciente } from '../components/FormularioPaciente';
import { CargaMasivaPacientes } from '../components/CargaMasivaPacientes';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCargaMasiva, setMostrarCargaMasiva] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('accessToken') || '';

  // Cargar pacientes
  const loadPacientes = async () => {
    setLoading(true);
    const response = await getAllPacientes(1, 10, token);
    if (response.data) {
      setPacientes(((response.data as any).pacientes || []) as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  // Buscar
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPacientes();
      return;
    }

    setLoading(true);
    const response = await searchPacientes(searchQuery, token);
    if (response.data) {
      setPacientes(response.data as any);
    }
    setLoading(false);
  };

  // Manejar envío del formulario
  const handleFormularioSubmit = async (formData: any) => {
    setLoading(true);

    try {
      // Mapear datos del nuevo formulario a formato de API
      const pacienteMapeado = {
        numeroDocumento: formData.numeroDocumento,
        tipoDocumento: formData.tipoDocumento,
        nombreCompleto: `${formData.primerNombre} ${formData.apellidoPaterno}`.trim(),
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.generoBiologico,
        telefonos: [formData.numeroCelular],
        email: formData.correoElectronico,
        ciudad: formData.ciudadResidencia,
        // Campos adicionales
        direccion: formData.domicilioActual,
        barrio: formData.barrioSector,
        telefonoFijo: formData.telefonoFijo,
        ocupacion: formData.profesionOcupacion,
        estadoCivil: formData.estadoCivil,
        etnia: formData.grupoEtnico,
        nivelEducacion: formData.nivelEducacion,
        discapacidad: formData.discapacidadDiagnosticada,
        observaciones: formData.notasPaciente,
      };

      const response = await createPaciente(pacienteMapeado, token);
      
      if (!response.error) {
        await loadPacientes();
        setMostrarFormulario(false);
      } else {
        console.error('Error al crear paciente:', response.error);
      }
    } catch (error) {
      console.error('Error al crear paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar paciente
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este paciente?')) return;

    setLoading(true);
    const response = await deletePaciente(id, token);
    if (!response.error) {
      await loadPacientes();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestión de Pacientes</h1>
            <p className="text-slate-400">Administra la información de tus pacientes</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={() => setMostrarCargaMasiva(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
            >
              <Upload size={20} />
              Carga Masiva
            </motion.button>
            <motion.button
              onClick={() => setMostrarFormulario(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              <Plus size={20} />
              Nuevo Paciente
            </motion.button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <motion.button
            onClick={handleSearch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
          >
            Buscar
          </motion.button>
        </motion.div>

        {/* Pacientes List */}
        <div className="space-y-4">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-slate-400 text-lg">Cargando pacientes...</p>
            </motion.div>
          ) : pacientes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-slate-800/20 rounded-lg border border-slate-700"
            >
              <p className="text-slate-400 text-lg mb-4">No hay pacientes registrados</p>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Crear el primer paciente
              </button>
            </motion.div>
          ) : (
            <motion.div layout className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {pacientes.map((paciente: any, index: number) => (
                  <motion.div
                    key={paciente.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {paciente.nombreCompleto || 'Sin nombre'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 mb-3">
                          <div>
                            <span className="text-slate-500">Documento:</span>
                            <span className="text-white ml-2">
                              {paciente.tipoDocumento} {paciente.numeroDocumento}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Email:</span>
                            <span className="text-white ml-2">{paciente.email}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Teléfono:</span>
                            <span className="text-white ml-2">
                              {paciente.telefonos?.[0] || 'No registrado'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Ciudad:</span>
                            <span className="text-white ml-2">{paciente.ciudad}</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 ml-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(paciente.id)}
                          disabled={loading}
                          className="p-2 bg-slate-700 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal del Formulario */}
      <AnimatePresence>
        {mostrarFormulario && (
          <FormularioPaciente
            onClose={() => setMostrarFormulario(false)}
            onSubmit={handleFormularioSubmit}
            titulo="Crear Nuevo Paciente"
          />
        )}
      </AnimatePresence>

      {/* Modal de Carga Masiva */}
      <AnimatePresence>
        {mostrarCargaMasiva && (
          <CargaMasivaPacientes
            onClose={() => setMostrarCargaMasiva(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
