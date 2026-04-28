import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { citasService, initializeMockData } from '../services/mockData';

interface Cita {
  id: string;
  pacienteNombre: string;
  fecha: string;
  hora: string;
  duracion: number;
  procedimiento: string;
  estado: 'CONFIRMADA' | 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA';
  notas: string;
}

export default function AgendaProfesionalPage() {
  const hoy = new Date().toISOString().split('T')[0];
  
  const [citas, setCitas] = useState<Cita[]>([]);
  const [selectedDate, setSelectedDate] = useState(hoy);

  // Cargar datos inicialmente
  useEffect(() => {
    initializeMockData();
    setCitas(citasService.getAll());
  }, []);
  const [showNewCita, setShowNewCita] = useState(false);
  const [showAssignCita, setShowAssignCita] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  const [formData, setFormData] = useState({
    pacienteNombre: '',
    hora: '',
    duracion: 30,
    procedimiento: '',
    notas: '',
  });

  // Crear nueva cita
  const handleCrearCita = () => {
    if (!formData.pacienteNombre || !formData.hora) return;

    const newCita = citasService.create({
      pacienteNombre: formData.pacienteNombre,
      fecha: selectedDate,
      hora: formData.hora,
      duracion: formData.duracion,
      procedimiento: formData.procedimiento,
      estado: 'PENDIENTE',
      notas: formData.notas,
      pacienteId: 'temp-' + Date.now(),
    });

    setCitas(citasService.getAll());
    setFormData({ pacienteNombre: '', hora: '', duracion: 30, procedimiento: '', notas: '' });
    setShowNewCita(false);
  };

  // Cambiar estado de cita
  const handleCambiarEstado = (id: string, nuevoEstado: Cita['estado']) => {
    citasService.update(id, {
      estado: nuevoEstado,
      notas: nuevoEstado === 'ATENDIDA' 
        ? `${formData.notas}\n[ATENDIDA: ${new Date().toLocaleTimeString()}]` 
        : formData.notas,
    } as any);
    setCitas(citasService.getAll());
  };

  // Eliminar cita
  const handleEliminarCita = (id: string) => {
    citasService.delete(id);
    setCitas(citasService.getAll());
  };

  // Filtrar citas por fecha
  const citasHoy = citas.filter((c) => c.fecha === selectedDate).sort((a, b) => a.hora.localeCompare(b.hora));

  const getStatusColor = (estado: Cita['estado']) => {
    switch (estado) {
      case 'CONFIRMADA':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'ATENDIDA':
        return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'PENDIENTE':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'CANCELADA':
        return 'bg-red-500/20 border-red-500 text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Agenda Profesional</h1>
            <p className="text-gray-400">Gestiona tus citas y procedimientos</p>
          </div>
          <button
            onClick={() => setShowNewCita(!showNewCita)}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <Plus size={20} /> Nueva Cita
          </button>
        </div>

        {/* Selector Fecha */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-4 mb-6">
          <label className="block text-white font-semibold mb-3">Seleccionar Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600 focus:outline-none"
          />
        </div>

        {/* Form Nueva Cita */}
        {showNewCita && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Crear Nueva Cita</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del Paciente"
                value={formData.pacienteNombre}
                onChange={(e) => setFormData({ ...formData, pacienteNombre: e.target.value })}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600"
              />
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600"
              />
              <input
                type="text"
                placeholder="Procedimiento"
                value={formData.procedimiento}
                onChange={(e) => setFormData({ ...formData, procedimiento: e.target.value })}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600"
              />
              <select
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-600"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            <textarea
              placeholder="Notas (ayuno, exámenes, etc)"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full mt-4 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 min-h-20"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCrearCita}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
              >
                Crear Cita
              </button>
              <button
                onClick={() => setShowNewCita(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Resumen del día */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 border border-blue-500/30"
          >
            <div className="text-blue-200 text-sm font-semibold mb-2">Citas Hoy</div>
            <div className="text-3xl font-bold text-white">{citasHoy.length}</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg p-4 border border-emerald-500/30"
          >
            <div className="text-emerald-200 text-sm font-semibold mb-2">Confirmadas</div>
            <div className="text-3xl font-bold text-white">
              {citasHoy.filter((c) => c.estado === 'CONFIRMADA').length}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-4 border border-yellow-500/30"
          >
            <div className="text-yellow-200 text-sm font-semibold mb-2">Pendientes</div>
            <div className="text-3xl font-bold text-white">
              {citasHoy.filter((c) => c.estado === 'PENDIENTE').length}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 border border-purple-500/30"
          >
            <div className="text-purple-200 text-sm font-semibold mb-2">Atendidas</div>
            <div className="text-3xl font-bold text-white">
              {citasHoy.filter((c) => c.estado === 'ATENDIDA').length}
            </div>
          </motion.div>
        </div>

        {/* Timeline de Citas */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Citas del {selectedDate}</h2>

          {citasHoy.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay citas programadas para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citasHoy.map((cita, idx) => (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-yellow-600/50 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-yellow-600/20 rounded-lg p-3">
                        <Clock className="text-yellow-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{cita.pacienteNombre}</h3>
                        <p className="text-gray-400 text-sm">{cita.procedimiento}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(cita.estado)}`}>
                      {cita.estado}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3 text-gray-300 text-sm">
                    <span>
                      ⏰ {cita.hora} ({cita.duracion} min)
                    </span>
                    <span className="text-yellow-600 font-semibold">{cita.procedimiento}</span>
                  </div>

                  {cita.notas && <div className="text-gray-400 text-sm mb-3 bg-slate-600/30 p-2 rounded italic">📝 {cita.notas}</div>}

                  <div className="flex gap-2">
                    {cita.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => handleCambiarEstado(cita.id, 'CONFIRMADA')}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition"
                      >
                        ✓ Confirmar
                      </button>
                    )}

                    {cita.estado === 'CONFIRMADA' && (
                      <button
                        onClick={() => handleCambiarEstado(cita.id, 'ATENDIDA')}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                      >
                        ✅ Atender Ahora
                      </button>
                    )}

                    {cita.estado === 'ATENDIDA' && (
                      <button
                        disabled
                        className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-semibold rounded"
                      >
                        ✅ Atendida
                      </button>
                    )}

                    <button
                      onClick={() => handleEliminarCita(cita.id)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition border border-red-600/30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist Preoperatorio */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Checklist Preoperatorio</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              '✓ Consentimiento firmado',
              '✓ Exámenes de laboratorio',
              '✓ Fotografías clínicas',
              '✓ Ayuno confirmado',
              '✓ Medicación suspendida',
              '✓ Alergias documentadas',
              '✓ Autorización anestesia',
              '✓ Marca quirúrgica lista',
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-emerald-600/30 hover:border-emerald-600/60 transition cursor-pointer"
              >
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                <span className="text-white text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
