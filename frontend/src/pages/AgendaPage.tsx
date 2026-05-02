import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Clock, User, MapPin, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { FormularioPaciente } from '../components/FormularioPaciente';
import { BuscadorPaciente } from '../components/BuscadorPaciente';
import AgendarCita from '../components/AgendarCita';
import { createPaciente } from '../services/api';

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 17));
  const [mostrarBuscador, setMostrarBuscador] = useState(true);
  const [mostrarFormularioPaciente, setMostrarFormularioPaciente] = useState(false);
  const [mostrarAgendarCita, setMostrarAgendarCita] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [errorPaciente, setErrorPaciente] = useState<string>('');
  
  const [citas, setCitas] = useState<any[]>([
    {
      id: 1,
      paciente: 'Valeria Gómez',
      hora: '09:00',
      duracion: '30 min',
      procedimiento: 'Rinoplastia',
      estado: 'CONFIRMADA',
      ubicacion: 'Quirófano 1',
    },
    {
      id: 2,
      paciente: 'Carla López',
      hora: '10:00',
      duracion: '45 min',
      procedimiento: 'Liposucción',
      estado: 'PENDIENTE',
      ubicacion: 'Quirófano 2',
    },
    {
      id: 3,
      paciente: 'María García',
      hora: '14:00',
      duracion: '60 min',
      procedimiento: 'Aumento de Glúteos',
      estado: 'CONFIRMADA',
      ubicacion: 'Quirófano 1',
    },
  ]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Leer token en cada operación (no en render) para que nunca sea stale
  const getToken = () => localStorage.getItem('accessToken') || '';

  const handleCrearPaciente = async (formData: any) => {
    setErrorPaciente('');
    try {
      const pacienteMapeado = {
        numeroDocumento: formData.numeroDocumento,
        tipoDocumento: formData.tipoDocumento,
        nombreCompleto: `${formData.primerNombre} ${formData.apellidoPaterno}`.trim(),
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.generoBiologico,
        telefonos: [formData.numeroCelular].filter(Boolean),
        email: formData.correoElectronico,
        ciudad: formData.ciudadResidencia,
        direccion: formData.domicilioActual,
        barrio: formData.barrioSector,
        telefonoFijo: formData.telefonoFijo,
        ocupacion: formData.profesionOcupacion,
        estadoCivil: formData.estadoCivil,
        etnia: formData.grupoEtnico,
        nivelEducacion: formData.nivelEducacion,
        discapacidad: formData.discapacidadDiagnosticada,
        entidadSalud: formData.entidadSalud,
        observaciones: formData.notasPaciente,
      };

      const response = await createPaciente(pacienteMapeado, getToken());

      if (response.error) {
        setErrorPaciente(response.error);
        console.error('Error al crear paciente:', response.error);
      } else {
        // Usar la respuesta del servidor (tiene el id real del paciente)
        const pacienteCreado = response.data || response;
        setMostrarFormularioPaciente(false);
        setPacienteSeleccionado(pacienteCreado);
        setMostrarAgendarCita(true);
      }
    } catch (error: any) {
      setErrorPaciente(error.message || 'Error inesperado');
      console.error('Error al crear paciente:', error);
    }
  };

  const handlePacienteEncontrado = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setMostrarBuscador(false);
    setMostrarAgendarCita(true);
  };

  const handleNuevoPaciente = () => {
    setMostrarBuscador(false);
    setMostrarFormularioPaciente(true);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Contar citas por estado
  const citasConfirmadas = citas.filter(c => c.estado === 'CONFIRMADA').length;
  const citasPendientes = citas.filter(c => c.estado === 'PENDIENTE').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-2 h-10 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full"></div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
              Agenda Inteligente
            </h1>
          </div>
          <p className="text-gray-400 ml-6 text-lg">⚡ Control automático, rápido y elegante de tus citas</p>
        </motion.div>

        {/* Stats Premium - Acorde al Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, staggerChildren: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Citas Hoy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-yellow-400/80 text-sm font-semibold uppercase tracking-wider">Citas Hoy</p>
                  <p className="text-4xl font-bold text-white mt-2">{citas.length}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-3 rounded-xl">
                  <Zap className="text-yellow-400" size={28} />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Confirmadas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-400/80 text-sm font-semibold uppercase tracking-wider">Confirmadas</p>
                  <p className="text-4xl font-bold text-white mt-2">{citasConfirmadas}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 p-3 rounded-xl">
                  <CheckCircle className="text-emerald-400" size={28} />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Pendientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-orange-400/80 text-sm font-semibold uppercase tracking-wider">Pendientes</p>
                  <p className="text-4xl font-bold text-white mt-2">{citasPendientes}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 p-3 rounded-xl">
                  <AlertCircle className="text-orange-400" size={28} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario Premium */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-sm shadow-2xl shadow-yellow-500/20"
          >
            {/* Header del calendario */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-yellow-500/10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevMonth}
                className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 hover:from-yellow-500/40 hover:to-amber-600/40 p-2 rounded-full transition-all"
              >
                <ChevronLeft className="text-yellow-400" size={20} />
              </motion.button>
              <h2 className="text-white font-bold text-lg bg-gradient-to-r from-yellow-300 to-amber-600 bg-clip-text text-transparent">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextMonth}
                className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 hover:from-yellow-500/40 hover:to-amber-600/40 p-2 rounded-full transition-all"
              >
                <ChevronRight className="text-yellow-400" size={20} />
              </motion.button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map((day, i) => (
                <div key={`day-${i}`} className="text-center text-yellow-400 text-xs font-bold py-2 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Días */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => (
                <motion.div
                  key={idx}
                  whileHover={day ? { scale: 1.1, backgroundColor: 'rgba(250, 204, 21, 0.2)' } : {}}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                    day === null
                      ? ''
                      : day === 17
                        ? 'bg-gradient-to-br from-yellow-500/40 to-amber-600/40 border-2 border-yellow-400 text-yellow-300 cursor-pointer'
                        : 'bg-slate-700/30 hover:bg-slate-600/50 text-gray-300 cursor-pointer border border-slate-600/20'
                  }`}
                >
                  {day}
                </motion.div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="mt-8 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNuevoPaciente}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 border border-cyan-500/50"
              >
                <Plus size={20} />
                Nuevo Paciente
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMostrarBuscador(true)}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 border border-yellow-500/50"
              >
                <Zap size={20} />
                Agendar Cita
              </motion.button>
            </div>
          </motion.div>

          {/* Panel de Citas Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full"></div>
                Citas de Hoy
              </h3>
              <p className="text-gray-400 ml-6">Gestiona todas tus citas programadas</p>
            </div>

            <div className="space-y-3">
              {citas.map((cita, idx) => (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.08 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  className={`bg-gradient-to-br rounded-2xl p-5 border transition-all duration-300 group cursor-pointer overflow-hidden relative ${
                    cita.estado === 'CONFIRMADA'
                      ? 'from-slate-800/40 to-slate-900/40 border-emerald-500/20 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20'
                      : 'from-slate-800/40 to-slate-900/40 border-orange-500/20 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-500/20'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 ${
                    cita.estado === 'CONFIRMADA'
                      ? 'bg-gradient-to-br from-emerald-500/10 to-transparent'
                      : 'bg-gradient-to-br from-orange-500/10 to-transparent'
                  }`}></div>

                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm uppercase tracking-wider font-semibold mb-2">
                          {cita.estado === 'CONFIRMADA' ? '✓ Confirmada' : '⚠ Pendiente'}
                        </p>
                        <p className="text-white font-bold text-2xl flex items-center gap-2 mb-1">
                          <Clock size={20} className={cita.estado === 'CONFIRMADA' ? 'text-emerald-400' : 'text-orange-400'} />
                          {cita.hora}
                        </p>
                        <p className="text-gray-400 text-xs ml-7">{cita.duracion}</p>
                      </div>
                    </div>

                    <div className="space-y-2 ml-0">
                      <p className="text-white font-semibold flex items-center gap-2 text-base">
                        <User size={16} className="text-blue-400" />
                        {cita.paciente}
                      </p>
                      <p className="text-gray-300 text-sm ml-6">{cita.procedimiento}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-2 ml-6">
                        <MapPin size={14} className="text-purple-400" />
                        {cita.ubicacion}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Control Postoperatorio - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full"></div>
              Seguimiento Postoperatorio
            </h2>
            <p className="text-gray-400 ml-6">Control automático de los pacientes después de la cirugía</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { dia: 'Día 1', item: 'Revisión Post-Op', icon: '🩹' },
              { dia: 'Día 3', item: 'Cambio de Vendajes', icon: '📷' },
              { dia: 'Día 7', item: 'Evaluación Clínica', icon: '👁️' },
              { dia: 'Día 15', item: 'Control de Cicatrización', icon: '📈' },
              { dia: 'Día 30', item: 'Alta Médica', icon: '✅' },
            ].map((control, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-5 text-center hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-300"></div>
                <div className="relative">
                  <p className="text-3xl mb-3">{control.icon}</p>
                  <p className="text-emerald-400 font-bold text-base">{control.dia}</p>
                  <p className="text-gray-400 text-xs mt-2 leading-tight">{control.item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {mostrarBuscador && (
          <BuscadorPaciente
            onPacienteEncontrado={handlePacienteEncontrado}
            onNuevoPaciente={handleNuevoPaciente}
            onClose={() => setMostrarBuscador(false)}
          />
        )}
        {mostrarFormularioPaciente && (
          <>
            {errorPaciente && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] bg-red-900/90 border border-red-500/50 text-red-200 px-5 py-3 rounded-xl text-sm shadow-xl backdrop-blur-sm max-w-md text-center">
                ⚠️ {errorPaciente}
              </div>
            )}
            <FormularioPaciente
              onClose={() => { setMostrarFormularioPaciente(false); setErrorPaciente(''); }}
              onSubmit={handleCrearPaciente}
              titulo="Crear Nuevo Paciente - Agenda"
            />
          </>
        )}
        {mostrarAgendarCita && pacienteSeleccionado && (
          <AgendarCita
            pacienteId={pacienteSeleccionado.id}
            pacienteNombre={pacienteSeleccionado.nombreCompleto}
            onClose={() => {
              setMostrarAgendarCita(false);
              setMostrarBuscador(true);
              setPacienteSeleccionado(null);
            }}
            onSuccess={() => {
              console.log('Cita agendada exitosamente');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
