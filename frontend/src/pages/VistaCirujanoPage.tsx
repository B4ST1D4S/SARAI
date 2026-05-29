import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

interface Paciente {
  foto: string;
  nombre: string;
  edad: number;
  documento: string;
  procedimientos: string;
  proximoControl: string;
  diasDesdeOperacion: number;
}

const tabs = [
  { id: 'vision', label: 'Visión General', icon: '👁️' },
  { id: 'fotos', label: 'Fotos Clínicas', icon: '📸' },
  { id: 'consentimientos', label: 'Cons. Firmados', icon: '✍️' },
  { id: 'agenda', label: 'Agenda y Controles', icon: '📅' },
  { id: 'facturacion', label: 'Facturación', icon: '💳' },
];

const plantillas = [
  { label: 'Plantillas Rápidas', icon: '📋' },
  { label: 'Consentimientos Digitales', icon: '📄' },
  { label: 'Plantilla Seguimiento Postop/Lipo-30d', icon: '👤' },
];

const automatizaciones = [
  { label: 'Valeria, recuerda masajear la faja hoy', icon: '✅' },
  { label: 'Retiro de drenes, programado en 3 días', icon: '📅' },
  { label: 'Tratamiento compresión: Subir Foto en 7 días', icon: '📸' },
];

export default function VistaCirujanoPage() {
  const [paciente] = useState<Paciente>({
    foto: '👩',
    nombre: 'Tatiana Quintero',
    edad: 31,
    documento: '1.234.567',
    procedimientos: 'Abdominoplastia + Liposucción',
    proximoControl: '15 de Mayo',
    diasDesdeOperacion: 5,
  });

  const [activeTab, setActiveTab] = useState('vision');
  const [imageIndex, setImageIndex] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto"
      >
        {/* HEADER PRINCIPAL */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold text-white">
            Interfaz <span className="text-yellow-500">Detallada</span> para Cirujanos
          </h1>
        </motion.div>

        {/* LAYOUT: 3 SECCIONES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">
          {/* === SIDEBAR LEFT === */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-3 space-y-6"
          >
            {/* PACIENTE CARD */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-b from-slate-800 to-slate-700 rounded-xl p-5 border border-yellow-600/30 shadow-2xl"
            >
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center text-2xl">
                  {paciente.foto}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{paciente.nombre}</h2>
                  <p className="text-gray-400 text-sm">Edad: {paciente.edad} años</p>
                  <p className="text-yellow-500 text-xs font-semibold mt-2">Doc: {paciente.documento}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 mb-3">
                <p className="text-gray-300 text-sm font-medium">{paciente.procedimientos}</p>
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Próximo Control: <span className="text-white font-bold">{paciente.proximoControl}</span></span>
                <span className="text-yellow-500 font-bold">Día {paciente.diasDesdeOperacion}</span>
              </div>
            </motion.div>

            {/* NAVEGACIÓN LATERAL */}
            <div className="space-y-2">
              {[
                { icon: '👁️', label: 'Visión General' },
                { icon: '📸', label: 'Fotos Clínicas', badge: true },
                { icon: '✍️', label: 'Cons. Firmados' },
                { icon: '📅', label: 'Agenda y Controles' },
                { icon: '💳', label: 'Facturación', cost: '$192.000 COP' },
              ].map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-yellow-600/20 border hover:border-yellow-600/50 rounded-lg text-left transition text-white text-sm font-medium"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">2</span>}
                  {item.cost && <span className="text-yellow-500 text-xs font-bold">{item.cost}</span>}
                </motion.button>
              ))}
            </div>

            {/* ALERTAS */}
            <motion.div
              variants={itemVariants}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <div className="flex gap-2 items-start mb-2">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-300 font-bold text-sm">Alertas</span>
              </div>
              <div className="text-red-200 text-xs space-y-1">
                <p>⚠️ Retiro de Drenes en 3 Días</p>
                <p>⚠️ Sin Confirmar Cita</p>
              </div>
            </motion.div>

            {/* NOTAS CLÍNICAS */}
            <motion.div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
              <h3 className="text-white font-bold text-sm mb-3">📝 Notas Clínicas</h3>
              <textarea
                placeholder="Agregar observaciones..."
                className="w-full bg-slate-600/50 text-white text-xs px-3 py-2 rounded border border-slate-500/30 focus:border-yellow-600 outline-none resize-none h-20"
              />
            </motion.div>

            {/* COSTO */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4 text-center"
            >
              <p className="text-yellow-100 text-xs font-semibold mb-1">Costo Total</p>
              <p className="text-white text-2xl font-bold">$192.000 COP</p>
            </motion.div>
          </motion.div>

          {/* === MAIN CONTENT === */}
          <motion.div variants={itemVariants} className="lg:col-span-6">
            {/* TABS */}
            <div className="flex gap-2 mb-6 bg-slate-700/50 p-2 rounded-lg border border-slate-600/30">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* CONTENIDO TABS */}
            {activeTab === 'vision' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30"
                >
                  <h3 className="text-white font-bold mb-4 text-lg">⏰ Última Evaluación</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Fecha:</span>
                      <span className="text-white font-semibold">25 Abril 2024</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Estado:</span>
                      <span className="text-yellow-500 font-semibold">✓ Consentimiento Firmado</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Alerta:</span>
                      <span className="text-red-400 font-semibold">⚠️ Alergia a Lidocaína</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'fotos' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* ANTES Y DESPUÉS */}
                <motion.div
                  className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600/30"
                >
                  <div className="relative w-full aspect-[3/4] bg-slate-800 flex items-center justify-center overflow-hidden group">
                    {/* Imagen: ANTES Y DESPUÉS */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-gray-500 text-sm">
                      📷 Galería Antes/Después (Deslizar)
                    </div>

                    {/* Botones Navegación */}
                    <motion.button
                      whileHover={{ scale: 1.1, x: -4 }}
                      onClick={() => setImageIndex(Math.max(0, imageIndex - 1))}
                      className="absolute left-4 z-10 bg-white/20 hover:bg-yellow-600/50 p-3 rounded-full text-white transition"
                    >
                      <ChevronLeft size={24} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, x: 4 }}
                      onClick={() => setImageIndex(imageIndex + 1)}
                      className="absolute right-4 z-10 bg-white/20 hover:bg-yellow-600/50 p-3 rounded-full text-white transition"
                    >
                      <ChevronRight size={24} />
                    </motion.button>

                    {/* Etiquetas: Antes / Después */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 z-5">
                      <span className="text-white font-bold text-sm bg-black/40 px-3 py-1 rounded-full">Antes</span>
                      <span className="text-white font-bold text-sm bg-black/40 px-3 py-1 rounded-full">Después</span>
                    </div>
                  </div>

                  {/* INFO IMAGEN */}
                  <div className="p-4 bg-slate-800/50 border-t border-slate-600/30">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Zona: Abdominoplastia</span>
                      <span>Lipoescultura Cintura</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>✓ Consentimiento Firmado</p>
                      <p>⚠️ Alergia a Lidocaína</p>
                    </div>
                  </div>
                </motion.div>

                {/* CONTROLES */}
                <div className="grid grid-cols-3 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                  >
                    Comparar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Clock size={16} /> Línea de Tiempo
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-semibold text-sm transition"
                  >
                    Más Opciones
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* AGREGAR EVOLUCIÓN */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full mt-6 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Agregar Evolución
            </motion.button>
          </motion.div>

          {/* === SIDEBAR RIGHT === */}
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
            {/* BOTONES DE ACCIÓN RÁPIDA */}
            <div className="space-y-3">
              {[
                { label: 'Vista Cirujano', icon: '👁️', bg: 'from-blue-600 to-blue-700' },
                { label: 'Firma + Selfie', icon: '🖼️', bg: 'from-purple-600 to-purple-700' },
                { label: 'Agregar Control', icon: '+', bg: 'from-yellow-600 to-yellow-700', highlight: true },
              ].map((btn, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 rounded-lg font-bold text-white transition shadow-lg flex items-center justify-center gap-2 ${
                    btn.highlight
                      ? `bg-gradient-to-r ${btn.bg} text-lg`
                      : `bg-gradient-to-r ${btn.bg} text-sm`
                  }`}
                >
                  <span>{btn.icon}</span>
                  {btn.label}
                </motion.button>
              ))}
            </div>

            {/* ÚLTIMO CONTROL */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30"
            >
              <p className="text-gray-400 text-xs font-semibold mb-1">Último Control:</p>
              <p className="text-white font-bold">Hace 5 días</p>
              <p className="text-gray-400 text-xs mt-2">📅 Próximo: 15 de mayo</p>
            </motion.div>

            {/* PLANTILLAS RÁPIDAS */}
            <motion.div className="space-y-3">
              <h3 className="text-white font-bold text-sm">📋 Plantillas Rápidas</h3>
              {plantillas.map((p, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-yellow-600/20 border hover:border-yellow-600/50 rounded-lg text-white text-xs font-medium transition flex items-center gap-2"
                >
                  <span className="text-base">{p.icon}</span>
                  <span>{p.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* AUTOMATIZACIONES */}
            <motion.div className="space-y-3">
              <h3 className="text-white font-bold text-sm">🤖 Automatizaciones</h3>
              {automatizaciones.map((auto, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg"
                >
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-200 text-xs">{auto.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* ENVIAR WHATSAPP */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
            >
              💬 Enviar WhatsApp
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

