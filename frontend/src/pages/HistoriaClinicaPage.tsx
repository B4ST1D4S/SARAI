import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  createHistoriaClinica,
  getAllPacientes,
  getHistoriasMedico,
} from '../services/api';

export default function HistoriaClinicaPage() {
  const [pacientes, setPacientes] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem('accessToken') || '';

  const [formData, setFormData] = useState({
    pacienteId: '',
    tipoHistoria: 'ANAMNESIS',
    tipoConsulta: 'INICIAL',
    quejaPrincipal: '',
    historiaEnfermedad: '',
    observacionesAntropometricas: '',
    diagnostico: '',
    tratamientoRecomendado: '',
  });

  // Cargar pacientes
  const loadPacientes = async () => {
    const response = await getAllPacientes(1, 100, token);
    if (response.data) {
      setPacientes((response.data as any).pacientes || []);
    }
  };

  // Cargar historias
  const loadHistorias = async () => {
    setLoading(true);
    const response = await getHistoriasMedico(1, 10, token);
    if (response.data) {
      setHistorias((response.data as any).historias || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPacientes();
    loadHistorias();
  }, []);

  // Crear historia
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createHistoriaClinica(formData, token);
      if (!response.error) {
        loadHistorias();

        // Limpiar form
        setFormData({
          pacienteId: '',
          tipoHistoria: 'EVOLUCCION',
          tipoConsulta: 'INICIAL',
          quejaPrincipal: '',
          historiaEnfermedad: '',
          observacionesAntropometricas: '',
          diagnostico: '',
          tratamientoRecomendado: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Historia Clínica</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition"
          >
            {showForm ? 'Cancelar' : '+ Nueva Historia'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-yellow-600/20 rounded-xl p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Nueva Historia Clínica</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Paciente y Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.pacienteId}
                  onChange={(e) =>
                    setFormData({ ...formData, pacienteId: e.target.value })
                  }
                  required
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600 focus:outline-none"
                >
                  <option value="">Seleccionar Paciente</option>
                  {pacientes.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombreCompleto} ({p.numeroDocumento})
                    </option>
                  ))}
                </select>

                <select
                  value={formData.tipoHistoria}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipoHistoria: e.target.value,
                    })
                  }
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600 focus:outline-none"
                >
                  <option value="ANAMNESIS">Anamnesis</option>
                  <option value="EXAMEN_FISICO">Examen Físico</option>
                  <option value="DIAGNOSTICO">Diagnóstico</option>
                  <option value="PLAN">Plan</option>
                  <option value="SEGUIMIENTO">Seguimiento</option>
                </select>
              </div>

              {/* Tipo Consulta y Queja */}
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.tipoConsulta}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipoConsulta: e.target.value,
                    })
                  }
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600 focus:outline-none"
                >
                  <option value="INICIAL">Consulta Inicial</option>
                  <option value="SEGUIMIENTO">Seguimiento</option>
                  <option value="CONTROL">Control Post-Op</option>
                </select>

                <textarea
                  placeholder="Queja Principal *"
                  value={formData.quejaPrincipal}
                  onChange={(e) =>
                    setFormData({ ...formData, quejaPrincipal: e.target.value })
                  }
                  required
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600 focus:outline-none resize-none h-10"
                />
              </div>

              {/* Historia de Enfermedad */}
              <textarea
                placeholder="Historia de Enfermedad Actual"
                value={formData.historiaEnfermedad}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    historiaEnfermedad: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none min-h-24"
              />

              {/* Observaciones Antropométricas */}
              <textarea
                placeholder="Observaciones Antropométricas"
                value={formData.observacionesAntropometricas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observacionesAntropometricas: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none min-h-24"
              />

              {/* Diagnóstico */}
              <textarea
                placeholder="Diagnóstico"
                value={formData.diagnostico}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    diagnostico: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none min-h-24"
              />

              {/* Tratamiento Recomendado */}
              <textarea
                placeholder="Tratamiento Recomendado"
                value={formData.tratamientoRecomendado}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tratamientoRecomendado: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none min-h-24"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Crear Historia'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Historias */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Mis Historias</h2>

          {loading && !showForm ? (
            <div className="text-center text-gray-400">Cargando...</div>
          ) : historias.length === 0 ? (
            <div className="text-center text-gray-400">No hay historias</div>
          ) : (
            historias.map((historia: any) => (
              <motion.div
                key={historia.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-yellow-600/50 transition"
              >
                <div>
                  <h3 className="text-white font-semibold">
                    {historia.paciente?.nombreCompleto}
                  </h3>
                  <p className="text-yellow-400 text-sm">{historia.tipoConsulta}</p>
                  <p className="text-gray-400 text-sm mt-2">{historia.quejaPrincipal}</p>
                  {historia.diagnostico && (
                    <p className="text-gray-300 text-sm mt-2">
                      <strong>Diagnóstico:</strong> {historia.diagnostico}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-2">
                    {new Date(historia.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
