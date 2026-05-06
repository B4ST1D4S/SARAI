import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Camera, AlertCircle, CheckCircle, MessageCircle, TrendingUp } from 'lucide-react';
import { followUpService, initializeMockData } from '../services/mockData';

interface FollowUp {
  id: string;
  pacienteNombre: string;
  procedimiento: string;
  fechaCirugia: string;
  dia: number;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'ALERTA';
  fotos: number;
  sintomas: string[];
  mensajeEnviado: boolean;
  proximaRevision: string;
}

export default function FollowUpPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  // Inicializar datos
  useEffect(() => {
    initializeMockData();
    // Crear follow-ups de ejemplo dinámicamente
    if (followUpService.getAll().length === 0) {
      const hoy = new Date().toISOString().split('T')[0];
      const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      followUpService.create({
        pacienteNombre: 'María González',
        procedimiento: 'Liposucción',
        fechaCirugia: hace7dias,
        dia: 7,
        estado: 'COMPLETADO',
        fotos: 3,
        sintomas: ['Edema leve', 'Sin dolor'],
        mensajeEnviado: true,
        proximaRevision: hoy,
      });

      followUpService.create({
        pacienteNombre: 'Juan Pérez',
        procedimiento: 'Rinoplastia',
        fechaCirugia: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dia: 2,
        estado: 'ALERTA',
        fotos: 1,
        sintomas: ['Dolor moderado', 'Edema importante'],
        mensajeEnviado: true,
        proximaRevision: hoy,
      });
    }

    setFollowUps(followUpService.getAll() as FollowUp[]);
  }, []);

  // Días de control automático
  const diasControl = [
    { dia: 1, nombre: 'Día 1', tareas: ['Dolor/Drenaje', 'Cambio de vendaje'] },
    { dia: 3, nombre: 'Día 3', tareas: ['Foto control', 'Edema'] },
    { dia: 7, nombre: 'Día 7', tareas: ['Evaluación completa', 'Radiografía'] },
    { dia: 15, nombre: 'Día 15', tareas: ['Revisión', 'Evolución faja'] },
    { dia: 30, nombre: 'Día 30', tareas: ['Evaluación final', 'Fotos'] },
  ];

  const getEstadoColor = (estado: FollowUp['estado']) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'ALERTA':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'PENDIENTE':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">📊 Seguimiento Postop</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Control automático de evolución post-cirugía</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 border border-blue-500/30"
          >
            <div className="text-blue-200 text-sm font-semibold mb-2">Pacientes en Seguimiento</div>
            <div className="text-3xl font-bold text-white">{followUps.length}</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg p-4 border border-emerald-500/30"
          >
            <div className="text-emerald-200 text-sm font-semibold mb-2">Completados</div>
            <div className="text-3xl font-bold text-white">
              {followUps.filter((f) => f.estado === 'COMPLETADO').length}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-4 border border-red-500/30"
          >
            <div className="text-red-200 text-sm font-semibold mb-2">⚠️ Alertas</div>
            <div className="text-3xl font-bold text-white">
              {followUps.filter((f) => f.estado === 'ALERTA').length}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-4 border border-yellow-500/30"
          >
            <div className="text-yellow-200 text-sm font-semibold mb-2">Fotos Enviadas</div>
            <div className="text-3xl font-bold text-white">{followUps.reduce((a, f) => a + f.fotos, 0)}</div>
          </motion.div>
        </div>

        {/* Lista de Seguimientos */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Pacientes en Control</h2>

          <div className="space-y-3">
            {followUps.map((followUp) => (
              <motion.div
                key={followUp.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedFollowUp(followUp)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 cursor-pointer hover:border-yellow-600/50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{followUp.pacienteNombre}</h3>
                    <p className="text-gray-400 text-sm">
                      {followUp.procedimiento} • {followUp.dia} días post-op • Cirugía: {followUp.fechaCirugia}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${getEstadoColor(followUp.estado)}`}>
                    {followUp.estado}
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center text-sm text-gray-300">
                  <span>📸 {followUp.fotos} fotos | {followUp.sintomas.join(', ')}</span>
                  {followUp.mensajeEnviado && <span className="text-emerald-400">✓ WhatsApp enviado</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline de Controles Automáticos */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">📅 Timeline de Controles Automáticos</h2>

          <div className="grid grid-cols-5 gap-3">
            {diasControl.map((control, idx) => (
              <motion.div
                key={control.dia}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-700/50 border border-yellow-600/30 rounded-lg p-4 text-center hover:border-yellow-600/60 transition"
              >
                <div className="text-2xl font-bold text-yellow-600 mb-2">{control.dia}</div>
                <h4 className="text-white font-semibold text-sm mb-3">{control.nombre}</h4>
                <div className="space-y-1">
                  {control.tareas.map((tarea, i) => (
                    <div key={i} className="text-xs text-gray-300 bg-slate-600/50 p-2 rounded">
                      • {tarea}
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 text-xs font-semibold rounded transition">
                  Control
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detalle de Paciente Seleccionado */}
        {selectedFollowUp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-emerald-600/30 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">📊 Detalle: {selectedFollowUp.pacienteNombre}</h2>
              <button
                onClick={() => setSelectedFollowUp(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Fotos */}
              <div>
                <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                  <Camera size={18} /> FOTOS ({selectedFollowUp.fotos})
                </h3>
                <div className="space-y-2">
                  {[...Array(selectedFollowUp.fotos)].map((_, i) => (
                    <div key={i} className="w-full h-32 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                      <span className="text-gray-400 text-sm">Foto {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Síntomas */}
              <div>
                <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                  <AlertCircle size={18} /> SÍNTOMAS REPORTADOS
                </h3>
                <div className="space-y-2">
                  {selectedFollowUp.sintomas.map((sintoma, i) => (
                    <div key={i} className="bg-yellow-500/20 border border-yellow-500/50 px-3 py-2 rounded text-yellow-300 text-sm">
                      • {sintoma}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="text-gray-300 font-semibold text-sm mb-2">Agregar síntoma:</h4>
                  <input
                    type="text"
                    placeholder="Nuevo síntoma..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:border-yellow-600"
                  />
                </div>
              </div>

              {/* Comunicación */}
              <div>
                <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                  <MessageCircle size={18} /> COMUNICACIÓN
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${selectedFollowUp.mensajeEnviado ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-700 border-slate-600'}`}>
                    <p className="text-sm text-white font-semibold">
                      {selectedFollowUp.mensajeEnviado ? '✅ WhatsApp enviado' : '❌ Sin contacto'}
                    </p>
                  </div>

                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition">
                    💬 Enviar WhatsApp
                  </button>

                  <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition">
                    ☎️ Llamar Paciente
                  </button>

                  <div className="bg-slate-700/50 border border-slate-600 rounded p-3">
                    <p className="text-gray-400 text-xs mb-2">Próxima revisión: {selectedFollowUp.proximaRevision}</p>
                    <button className="w-full py-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 text-xs font-semibold rounded transition">
                      📅 Agendar revisión
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Evolución */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mt-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" /> EVOLUCIÓN CLÍNICA
              </h3>
              <div className="space-y-3">
                {[
                  { dia: '1', descripcion: 'Vendaje, dolor intenso, drenaje importante' },
                  { dia: '3', descripcion: 'Foto control, edema persistente' },
                  { dia: '7', descripcion: 'Mejoría evidente, edema en regresión' },
                  { dia: '15', descripcion: 'Muy buena evolución, comienza presoterapia' },
                  { dia: '30', descripcion: 'Resultado final satisfactorio' },
                ].map((evol) => (
                  <div key={evol.dia} className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-yellow-600/20 border border-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-600 font-bold">D{evol.dia}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-gray-300 text-sm">{evol.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
