import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface PacienteData {
  tipoDocumento: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  edadCalculada: number;
  lugarNacimiento: string;
  domicilioActual: string;
  barrioSector: string;
  telefonoFijo: string;
  numeroCelular: string;
  ciudadResidencia: string;
  correoElectronico: string;
  profesionOcupacion: string;
  direccionTrabajo: string;
  telefonoLaboral: string;
  generoBiologico: string;
  generoSentido: string;
  estadoCivil: string;
  tipoConsulta: string;
  grupoEtnico: string;
  creenciaReligiosa: string;
  nivelEducacion: string;
  orientacionSexual: string;
  discapacidadDiagnosticada: string;
  entidadSalud: string;
  notasPaciente: string;
  formaAsignacion: string;
  observacionesAdicionales: string;
}

interface FormularioPacienteProps {
  onClose: () => void;
  onSubmit: (data: PacienteData) => void;
  titulo?: string;
}

export function FormularioPaciente({ onClose, onSubmit, titulo = 'Crear Nuevo Paciente' }: FormularioPacienteProps) {
  const [formData, setFormData] = useState<PacienteData>({
    tipoDocumento: '',
    numeroDocumento: '',
    primerNombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    edadCalculada: 0,
    lugarNacimiento: '',
    domicilioActual: '',
    barrioSector: '',
    telefonoFijo: '',
    numeroCelular: '',
    ciudadResidencia: '',
    correoElectronico: '',
    profesionOcupacion: '',
    direccionTrabajo: '',
    telefonoLaboral: '',
    generoBiologico: '',
    generoSentido: '',
    estadoCivil: '',
    tipoConsulta: '',
    grupoEtnico: '',
    creenciaReligiosa: '',
    nivelEducacion: '',
    orientacionSexual: '',
    discapacidadDiagnosticada: '',
    entidadSalud: '',
    notasPaciente: '',
    formaAsignacion: '',
    observacionesAdicionales: '',
  });

  const calcularEdad = (fechaNac: string) => {
    if (!fechaNac) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'fechaNacimiento') {
        updated.edadCalculada = calcularEdad(value);
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur border-b border-slate-700/50 p-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">👨‍⚕️</span>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {titulo}
              </h2>
            </div>
            <p className="text-slate-300 text-sm">Información completa y organizada para mejor seguimiento médico</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
          >
            <X size={28} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: DOCUMENTACIÓN */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30 hover:border-slate-600/50 transition">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                📋 Documentación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Tipo de Documento de Identidad *
                  </label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="PA">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    placeholder="Ej: 1234567890"
                    required
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS PERSONALES */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">👤 Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="primerNombre"
                  value={formData.primerNombre}
                  onChange={handleInputChange}
                  placeholder="Primer Nombre *"
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="segundoNombre"
                  value={formData.segundoNombre}
                  onChange={handleInputChange}
                  placeholder="Segundo Nombre"
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={handleInputChange}
                  placeholder="Apellido Paterno *"
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={handleInputChange}
                  placeholder="Apellido Materno *"
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Edad (Calculada)</label>
                  <input
                    type="number"
                    value={formData.edadCalculada}
                    disabled
                    className="w-full bg-slate-600 text-slate-300 px-4 py-2 rounded-lg border border-slate-600"
                  />
                </div>
                <input
                  type="text"
                  name="lugarNacimiento"
                  value={formData.lugarNacimiento}
                  onChange={handleInputChange}
                  placeholder="Lugar de Nacimiento"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none md:col-span-2"
                />
              </div>
            </div>

            {/* SECCIÓN 3: CONTACTO */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">📞 Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="domicilioActual"
                  value={formData.domicilioActual}
                  onChange={handleInputChange}
                  placeholder="Domicilio Actual"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="barrioSector"
                  value={formData.barrioSector}
                  onChange={handleInputChange}
                  placeholder="Barrio/Sector"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="telefonoFijo"
                  value={formData.telefonoFijo}
                  onChange={handleInputChange}
                  placeholder="Teléfono Fijo"
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="tel"
                  name="numeroCelular"
                  value={formData.numeroCelular}
                  onChange={handleInputChange}
                  placeholder="Número Celular *"
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="ciudadResidencia"
                  value={formData.ciudadResidencia}
                  onChange={handleInputChange}
                  placeholder="Ciudad de Residencia"
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="email"
                  name="correoElectronico"
                  value={formData.correoElectronico}
                  onChange={handleInputChange}
                  placeholder="Correo Electrónico *"
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN 4: DATOS LABORALES */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">💼 Información Laboral</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="profesionOcupacion"
                  value={formData.profesionOcupacion}
                  onChange={handleInputChange}
                  placeholder="Profesión/Ocupación"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="direccionTrabajo"
                  value={formData.direccionTrabajo}
                  onChange={handleInputChange}
                  placeholder="Dirección Laboral"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="tel"
                  name="telefonoLaboral"
                  value={formData.telefonoLaboral}
                  onChange={handleInputChange}
                  placeholder="Teléfono Laboral"
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN 5: DATOS DEMOGRÁFICOS Y MÉDICOS */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">🏥 Datos Demográficos y Médicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select
                  name="generoBiologico"
                  value={formData.generoBiologico}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Género Biológico *</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                <select
                  name="generoSentido"
                  value={formData.generoSentido}
                  onChange={handleInputChange}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Género Sentido</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="NoConforme">No Conforme</option>
                  <option value="NoResponde">Prefiero No Responder</option>
                </select>
                <select
                  name="estadoCivil"
                  value={formData.estadoCivil}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Estado Civil *</option>
                  <option value="Soltero">Soltero/a</option>
                  <option value="Casado">Casado/a</option>
                  <option value="Divorciado">Divorciado/a</option>
                  <option value="Viudo">Viudo/a</option>
                  <option value="Unión">Unión Libre</option>
                </select>
                <select
                  name="grupoEtnico"
                  value={formData.grupoEtnico}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Grupo Étnico *</option>
                  <option value="Mestizo">Mestizo</option>
                  <option value="Afrodescendiente">Afrodescendiente</option>
                  <option value="Indígena">Indígena</option>
                  <option value="Blanco">Blanco</option>
                  <option value="Otros">Otros</option>
                </select>
                <input
                  type="text"
                  name="creenciaReligiosa"
                  value={formData.creenciaReligiosa}
                  onChange={handleInputChange}
                  placeholder="Creencia Religiosa"
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <select
                  name="nivelEducacion"
                  value={formData.nivelEducacion}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Nivel de Educación *</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Tecnico">Técnico</option>
                  <option value="Pregrado">Pregrado</option>
                  <option value="Postgrado">Postgrado</option>
                </select>
                <select
                  name="orientacionSexual"
                  value={formData.orientacionSexual}
                  onChange={handleInputChange}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Orientación Sexual</option>
                  <option value="Heterosexual">Heterosexual</option>
                  <option value="Homosexual">Homosexual</option>
                  <option value="Bisexual">Bisexual</option>
                  <option value="NoResponde">Prefiero No Responder</option>
                </select>
                <select
                  name="discapacidadDiagnosticada"
                  value={formData.discapacidadDiagnosticada}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Discapacidad Diagnosticada *</option>
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>
            </div>

            {/* SECCIÓN 6: INFORMACIÓN MÉDICA */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">📋 Información de Consulta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select
                  name="tipoConsulta"
                  value={formData.tipoConsulta}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Tipo de Consulta *</option>
                  <option value="INICIAL">Consulta Inicial</option>
                  <option value="SEGUIMIENTO">Seguimiento</option>
                  <option value="CONTROL">Control</option>
                </select>
                <select
                  name="formaAsignacion"
                  value={formData.formaAsignacion}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Forma de Asignación *</option>
                  <option value="Directa">Asignación Directa</option>
                  <option value="Referencia">Por Referencia</option>
                  <option value="Agenda">Por Agenda</option>
                </select>
              </div>
            </div>

            {/* SECCIÓN 7: DATOS DE SALUD */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">🏥 Datos de Salud</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  EPS / Plan / Entidad de Salud
                </label>
                <input
                  type="text"
                  name="entidadSalud"
                  value={formData.entidadSalud}
                  onChange={handleInputChange}
                  placeholder="Ej: SaludCoop, Axa Colpatria, Alianza, etc."
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Ingresa el nombre de la EPS, plan de salud o contrato
                </p>
              </div>
            </div>

            {/* SECCIÓN 8: OBSERVACIONES */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">📝 Observaciones</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Notas del Paciente *
                  </label>
                  <textarea
                    name="notasPaciente"
                    value={formData.notasPaciente}
                    onChange={handleInputChange}
                    placeholder="Escriba observaciones del paciente..."
                    required
                    rows={4}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Observaciones Adicionales
                  </label>
                  <textarea
                    name="observacionesAdicionales"
                    value={formData.observacionesAdicionales}
                    onChange={handleInputChange}
                    placeholder="Información adicional relevante..."
                    rows={3}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg"
              >
                Crear Paciente
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
