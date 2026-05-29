import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, User, MapPin, CheckCircle, AlertCircle, Zap, Search, RefreshCw } from 'lucide-react';
import { FormularioPaciente } from '../components/FormularioPaciente';
import { BuscadorPaciente } from '../components/BuscadorPaciente';
import AgendarCitaWizard from '../components/AgendarCitaWizard';
import { createPaciente } from '../services/api';

export default function AgendaPage() {
  const hoy = new Date();
  const [currentDate, setCurrentDate] = useState(hoy);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate());
  const [mostrarBuscador, setMostrarBuscador] = useState(true);
  const [mostrarFormularioPaciente, setMostrarFormularioPaciente] = useState(false);
  const [mostrarAgendarCita, setMostrarAgendarCita] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [pacienteParaEditar, setPacienteParaEditar] = useState<any>(null);
  const [errorPaciente, setErrorPaciente] = useState<string>('');
  const [citas, setCitas] = useState<any[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  // Cargar citas del día seleccionado desde la API
  const cargarCitas = useCallback(async () => {
    setLoadingCitas(true);
    try {
      const token = getToken();
      const anio = currentDate.getFullYear();
      const mes = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dia = String(diaSeleccionado).padStart(2, '0');
      // Usar hora LOCAL (no UTC) para no perder citas por desfase de zona horaria
      const inicioLocal = new Date(anio, currentDate.getMonth(), diaSeleccionado, 0, 0, 0, 0);
      const finLocal    = new Date(anio, currentDate.getMonth(), diaSeleccionado, 23, 59, 59, 999);
      const fechaInicio = inicioLocal.toISOString();
      const fechaFin    = finLocal.toISOString();
      const res = await fetch(
        `/api/citas/medico/agenda?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error al obtener citas');
      const data = await res.json();
      const lista = data.citas || [];
      // Normalizar para la vista
      const normalizadas = lista.map((c: any) => ({
        id: c.id,
        paciente: c.paciente?.nombreCompleto || 'Paciente',
        hora: new Date(c.fechaHora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
        duracion: `${c.duracionMinutos || 30} min`,
        procedimiento: c.tipoCita || c.motivo || 'Consulta',
        estado: c.estado || 'PENDIENTE',
        ubicacion: c.salaQuirofanoId ? `Sala ${c.salaQuirofanoId}` : (c.entidadSalud || 'Consultorio'),
        entidadSalud: c.entidadSalud || '',
        notas: c.notas || '',
        rawFecha: c.fechaHora,
      }));
      // Ordenar por hora
      normalizadas.sort((a: any, b: any) => a.hora.localeCompare(b.hora));
      setCitas(normalizadas);
    } catch (e) {
      console.error('Error cargando citas:', e);
      setCitas([]);
    } finally {
      setLoadingCitas(false);
    }
  }, [currentDate, diaSeleccionado]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    const nueva = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(nueva);
    setDiaSeleccionado(1);
  };

  const handleNextMonth = () => {
    const nueva = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(nueva);
    setDiaSeleccionado(1);
  };

  // Leer token en cada operación (no en render) para que nunca sea stale
  const getToken = () => localStorage.getItem('accessToken') || '';

  // Convierte el objeto paciente de la API a campos del FormularioPaciente
  const mapPacienteApiAForm = (paciente: any) => {
    const nombreParts = (paciente.nombreCompleto || '').trim().split(' ');
    const primerNombre = nombreParts[0] || '';
    const apellidoPaterno = nombreParts.length > 1 ? nombreParts[nombreParts.length - 1] : '';
    const fechaIso = paciente.fechaNacimiento
      ? new Date(paciente.fechaNacimiento).toISOString().split('T')[0]
      : '';
    return {
      tipoDocumento: paciente.tipoDocumento || '',
      numeroDocumento: paciente.numeroDocumento || '',
      primerNombre,
      apellidoPaterno,
      fechaNacimiento: fechaIso,
      numeroCelular: paciente.telefonos?.[0] || '',
      telefonoFijo: paciente.telefonoFijo || '',
      correoElectronico: paciente.email || '',
      ciudadResidencia: paciente.ciudad || '',
      domicilioActual: paciente.direccion || '',
      barrioSector: paciente.barrio || '',
      profesionOcupacion: paciente.ocupacion || '',
      estadoCivil: paciente.estadoCivil || '',
      grupoEtnico: paciente.etnia || '',
      nivelEducacion: paciente.nivelEducacion || '',
      discapacidadDiagnosticada: paciente.discapacidad || '',
      entidadSalud: paciente.entidadSalud || '',
      notasPaciente: paciente.observaciones || '',
      generoBiologico: paciente.genero || '',
    };
  };

  const handleCrearPaciente = async (formData: any) => {
    setErrorPaciente('');

    // MODO EDICIÓN: paciente ya existe, sólo confirmar y pasar a agendar
    if (pacienteParaEditar) {
      setMostrarFormularioPaciente(false);
      setPacienteSeleccionado(pacienteParaEditar);
      setPacienteParaEditar(null);
      setMostrarAgendarCita(true);
      return;
    }

    // MODO CREACIÓN: paciente nuevo, llamar a la API
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

  // Paciente encontrado → CONFIRMAR DIRECTO y abrir AgendarCita sin pasar por el formulario
  const handleConfirmarYAgendar = (paciente: any) => {
    setMostrarBuscador(false);
    setPacienteSeleccionado(paciente);
    setPacienteParaEditar(null);
    setMostrarAgendarCita(true);
  };

  // Paciente encontrado en búsqueda → mostrar formulario PRE-LLENADO para revisar
  const handlePacienteEncontrado = (paciente: any) => {
    setPacienteParaEditar(paciente);
    setMostrarBuscador(false);
    setMostrarFormularioPaciente(true);
  };

  // Paciente no encontrado → mostrar formulario VACIÓ para crear
  const handleNuevoPaciente = () => {
    setPacienteParaEditar(null);
    setMostrarBuscador(false);
    setMostrarFormularioPaciente(true);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const citasConfirmadas = citas.filter(c => c.estado === 'CONFIRMADA').length;
  const citasPendientes = citas.filter(c => c.estado === 'PENDIENTE').length;
  const citasAtendidas = citas.filter(c => c.estado === 'COMPLETADA').length;

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA':  return { label: '✓ Confirmada',    color: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/60 hover:shadow-emerald-500/20', glow: 'from-emerald-500/10', clock: 'text-emerald-400' };
      case 'EN_SALA':    return { label: '🏥 En Sala',       color: 'text-cyan-400',    border: 'border-cyan-500/20    hover:border-cyan-500/60    hover:shadow-cyan-500/20',    glow: 'from-cyan-500/10',    clock: 'text-cyan-400'    };
      case 'COMPLETADA': return { label: '✅ Atendida',       color: 'text-purple-400',  border: 'border-purple-500/20  hover:border-purple-500/60  hover:shadow-purple-500/20',  glow: 'from-purple-500/10',  clock: 'text-purple-400'  };
      case 'CANCELADA':  return { label: '✕ Cancelada',      color: 'text-red-400',     border: 'border-red-500/20     hover:border-red-500/60     hover:shadow-red-500/20',     glow: 'from-red-500/10',     clock: 'text-red-400'     };
      default:           return { label: '⚠ Pendiente',      color: 'text-orange-400',  border: 'border-orange-500/20  hover:border-orange-500/60  hover:shadow-orange-500/20',  glow: 'from-orange-500/10',  clock: 'text-orange-400'  };
    }
  };

  const labelFechaCitas = () => {
    const anio = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    const d = new Date(anio, mes, diaSeleccionado);
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 sm:w-2 h-8 sm:h-10 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full flex-shrink-0"></div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
              Agenda
            </h1>
          </div>
          <p className="text-gray-400 ml-5 sm:ml-6 text-xs sm:text-base">⚡ Control automático de tus citas</p>
        </motion.div>

        {/* Stats Premium - Acorde al Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, staggerChildren: 0.05 }}
          className="grid grid-cols-3 gap-2 sm:gap-6 mb-5 sm:mb-8"
        >
          {/* Citas Hoy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-yellow-400/80 text-[9px] sm:text-sm font-semibold uppercase tracking-wider">Hoy</p>
                  <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{citas.length}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-1.5 sm:p-3 rounded-xl">
                  <Zap className="text-yellow-400" size={18} />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Confirmadas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-400/80 text-[9px] sm:text-sm font-semibold uppercase tracking-wider">Confirm.</p>
                  <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{citasConfirmadas}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 p-1.5 sm:p-3 rounded-xl">
                  <CheckCircle className="text-emerald-400" size={18} />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Pendientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 group-hover:scale-150 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-orange-400/80 text-[9px] sm:text-sm font-semibold uppercase tracking-wider">Pendient.</p>
                  <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{citasPendientes}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 p-1.5 sm:p-3 rounded-xl">
                  <AlertCircle className="text-orange-400" size={18} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
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
              {days.map((day, idx) => {
                const esHoy = day === hoy.getDate() && currentDate.getMonth() === hoy.getMonth() && currentDate.getFullYear() === hoy.getFullYear();
                const esSel = day === diaSeleccionado;
                return (
                  <motion.div
                    key={idx}
                    whileHover={day ? { scale: 1.1 } : {}}
                    onClick={() => day && setDiaSeleccionado(day)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition cursor-pointer ${
                      day === null
                        ? 'cursor-default'
                        : esSel
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-black border-2 border-yellow-400'
                          : esHoy
                            ? 'bg-yellow-500/20 border-2 border-yellow-500/60 text-yellow-300'
                            : 'bg-slate-700/30 hover:bg-slate-600/50 text-gray-300 border border-slate-600/20'
                    }`}
                  >
                    {day}
                  </motion.div>
                );
              })}
            </div>

            {/* Botón de acción único */}
            <div className="mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMostrarBuscador(true)}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 border border-yellow-500/50"
              >
                <Search size={20} />
                Buscar Paciente / Agendar
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
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full"></div>
                  Citas del Día
                </h3>
                <p className="text-gray-400 ml-6 capitalize">{labelFechaCitas()}</p>
              </div>
              <button onClick={cargarCitas} title="Actualizar" className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors mt-1">
                <RefreshCw size={16} className={`text-gray-400 ${loadingCitas ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3">
              {loadingCitas && (
                <div className="flex items-center justify-center py-12 text-gray-500 gap-3">
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="text-sm">Cargando citas...</span>
                </div>
              )}
              {!loadingCitas && citas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 text-gray-600 gap-3">
                  <Clock size={40} className="opacity-30" />
                  <p className="text-sm">Sin citas agendadas para este día</p>
                  <button onClick={() => setMostrarBuscador(true)}
                    className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2">
                    + Agendar nueva cita
                  </button>
                </div>
              )}
              {!loadingCitas && citas.map((cita, idx) => {
                const cfg = getEstadoConfig(cita.estado);
                return (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.08 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-5 border transition-all duration-300 group cursor-pointer overflow-hidden relative hover:shadow-2xl ${cfg.border}`}
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 bg-gradient-to-br ${cfg.glow} to-transparent`}></div>

                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className={`text-sm uppercase tracking-wider font-semibold mb-2 ${cfg.color}`}>
                          {cfg.label}
                        </p>
                        <p className="text-white font-bold text-2xl flex items-center gap-2 mb-1">
                          <Clock size={20} className={cfg.clock} />
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
                      {cita.entidadSalud && (
                        <p className="text-gray-400 text-xs ml-6">{cita.entidadSalud}</p>
                      )}
                      <p className="text-gray-500 text-xs flex items-center gap-2 ml-6">
                        <MapPin size={14} className="text-purple-400" />
                        {cita.ubicacion}
                      </p>
                    </div>
                  </div>
                </motion.div>
                );
              })}
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
            onConfirmarYAgendar={handleConfirmarYAgendar}
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
              onClose={() => { setMostrarFormularioPaciente(false); setErrorPaciente(''); setPacienteParaEditar(null); setMostrarBuscador(true); }}
              onSubmit={handleCrearPaciente}
              titulo={pacienteParaEditar ? 'Revisar Datos del Paciente' : 'Crear Nuevo Paciente - Agenda'}
              pacienteInicial={pacienteParaEditar ? mapPacienteApiAForm(pacienteParaEditar) : undefined}
              modoEdicion={!!pacienteParaEditar}
            />
          </>
        )}
        {mostrarAgendarCita && pacienteSeleccionado && (
          <AgendarCitaWizard
            pacienteId={pacienteSeleccionado.id}
            pacienteNombre={pacienteSeleccionado.nombreCompleto}
            entidadSaludInicial={pacienteSeleccionado.entidadSalud || ''}
            medicoIdPre={(() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.rol === 'MEDICO' ? (u.id || u.userId || '') : ''; } catch { return ''; } })()}
            onClose={() => {
              setMostrarAgendarCita(false);
              setMostrarBuscador(true);
              setPacienteSeleccionado(null);
            }}
            onSuccess={() => {
              cargarCitas();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
