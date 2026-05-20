import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCw, Download, TrendingDown, Calendar, Plus, Save, ChevronDown, ChevronUp, AlertTriangle, ClipboardList, FileText, Activity, Eye, Box, Share2 } from 'lucide-react';
import { Body3D } from '../components/Body3D';
import { createHistoriaClinica } from '../services/api';

interface Mark {
  id: string;
  tipo: 'LIPOSUCCION' | 'IMPLANTE_MAMARIO' | 'LIFTING_FACIAL' | 'RINOPLASTIA' | 'ABDOMINOPLASTIA' | 'CICATRIZ' | 'HEMATOMA' | 'CELULITIS_EDEMA' | 'EDEMA' | 'FIBROSIS' | 'DOLOR' | 'AREA_TRATADA';
  posicionX: number;
  posicionY: number;
  intensidad: number;
  zona: string;
  fecha?: string;
  vista?: 'FRONTAL' | 'POSTERIOR';
  nota?: string;
}

interface Evolucion {
  id: string;
  numeroEvolucion: number;
  fechaEvolucion: string;
  planQuirurgico: string;
  planPrequirurgico: {
    examenesPrequirurgicos: boolean;
    valoracionEnfermeria: boolean;
    valoracionPreanestesica: boolean;
    otros: string;
  };
  observacionesFrontal: string;
  observacionesPosterior: string;
  recomendaciones: string;
  riesgosComplicaciones: string[];
  finalidadAtencion: string;
  marcas: Mark[];
  creadoEn: string;
}

export default function MapaCorporalPage() {
  const [marks, setMarks] = useState<Mark[]>([
    { id: '1', tipo: 'IMPLANTE_MAMARIO', posicionX: 105, posicionY: 130, intensidad: 6, fecha: '2026-03-25', zona: 'Mama Izquierda', nota: '320cc - Post-op día 2' },
    { id: '2', tipo: 'IMPLANTE_MAMARIO', posicionX: 195, posicionY: 130, intensidad: 6, fecha: '2026-04-01', zona: 'Mama Derecha', nota: '320cc - Evolución favorable' },
    { id: '3', tipo: 'LIPOSUCCION', posicionX: 150, posicionY: 275, intensidad: 5, fecha: '2026-04-10', zona: 'Abdomen', nota: 'Liposucción 400ml' },
  ]);

  const [selectedTipo, setSelectedTipo] = useState<Mark['tipo']>('IMPLANTE_MAMARIO');
  const [intensidadActual, setIntensidadActual] = useState(5);
  const [mode, setMode] = useState<'VISTA' | 'EDITAR' | 'COMPARAR'>('VISTA');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [comparisonDates, setComparisonDates] = useState<[string, string]>(['2026-03-25', '2026-04-10']);
  const [view360, setView360] = useState<'TODAS' | 'FRONTAL' | 'POSTERIOR' | 'LATERAL'>('TODAS');
  const [viewType, setViewType] = useState<'2D' | '3D'>('2D');
  const canvasRef = useRef<SVGSVGElement>(null);

  // ── Evolución Cirugía Plástica ──
  const [evoluciones, setEvoluciones] = useState<Evolucion[]>([]);
  const [showEvolucionForm, setShowEvolucionForm] = useState(false);
  const [evolucionForm, setEvolucionForm] = useState({
    fechaEvolucion: new Date().toISOString().split('T')[0],
    planQuirurgico: '',
    planPrequirurgico: {
      examenesPrequirurgicos: false,
      valoracionEnfermeria: false,
      valoracionPreanestesica: false,
      otros: '',
    },
    observacionesFrontal: '',
    observacionesPosterior: '',
    recomendaciones: '',
    riesgosComplicaciones: [] as string[],
    finalidadAtencion: '',
  });
  const [newRiesgo, setNewRiesgo] = useState('');

  const marcasTipos = [
    { tipo: 'IMPLANTE_MAMARIO', color: 'from-pink-600 to-pink-500', label: 'Aumento Mamario', icon: '💗', descripcion: 'Implante mamario', rango: 'POST-OP 0-90 días' },
    { tipo: 'LIPOSUCCION', color: 'from-cyan-600 to-cyan-500', label: 'Liposucción', icon: '🔵', descripcion: 'Contorneado corporal', rango: 'POST-OP 0-60 días' },
    { tipo: 'LIFTING_FACIAL', color: 'from-amber-600 to-amber-500', label: 'Lifting Facial', icon: '⭐', descripcion: 'Rejuvenecimiento facial', rango: 'POST-OP 0-90 días' },
    { tipo: 'ABDOMINOPLASTIA', color: 'from-emerald-600 to-emerald-500', label: 'Abdominoplastia', icon: '💚', descripcion: 'Estiramiento abdominal', rango: 'POST-OP 0-120 días' },
    { tipo: 'CICATRIZ', color: 'from-yellow-600 to-yellow-500', label: 'Cicatriz', icon: '✂️', descripcion: 'Evolución de cicatriz', rango: 'POST-OP 24+ horas' },
    { tipo: 'HEMATOMA', color: 'from-red-700 to-red-600', label: 'Hematoma', icon: '🔴', descripcion: 'Moretones post-op', rango: 'POST-OP 0-21 días' },
    { tipo: 'CELULITIS_EDEMA', color: 'from-red-600 to-red-500', label: 'Edema/Inflamación', icon: '⚠️', descripcion: 'Inflamación post-op', rango: 'POST-OP 0-30 días' },
  ];

  const bodyZones = [
    { id: 'cabeza', name: 'Cabeza', x: 50, y: 12, r: 7 },
    { id: 'frente', name: 'Frente', x: 50, y: 6, r: 4 },
    { id: 'mejillas', name: 'Mejillas', x: 42, y: 12, r: 3.5 },
    { id: 'barbilla', name: 'Barbilla', x: 50, y: 18, r: 3 },
    { id: 'cuello', name: 'Cuello', x: 50, y: 24, r: 3 },
    { id: 'hombro-izq', name: 'Hombro Izq', x: 38, y: 28, r: 4 },
    { id: 'hombro-der', name: 'Hombro Der', x: 62, y: 28, r: 4 },
    { id: 'pecho', name: 'Pecho', x: 50, y: 38, r: 5 },
    { id: 'axila-izq', name: 'Axila Izq', x: 40, y: 38, r: 3 },
    { id: 'axila-der', name: 'Axila Der', x: 60, y: 38, r: 3 },
    { id: 'abdomen', name: 'Abdomen', x: 50, y: 70, r: 5 },
    { id: 'abdomen-superior', name: 'Abdomen Superior', x: 50, y: 55, r: 4 },
    { id: 'brazo-izq', name: 'Brazo Izq', x: 28, y: 45, r: 3.5 },
    { id: 'brazo-der', name: 'Brazo Der', x: 72, y: 45, r: 3.5 },
    { id: 'cadera', name: 'Cadera', x: 50, y: 110, r: 5 },
    { id: 'muslo-izq', name: 'Muslo Izq', x: 42, y: 130, r: 4.5 },
    { id: 'muslo-der', name: 'Muslo Der', x: 58, y: 130, r: 4.5 },
    { id: 'rodilla-izq', name: 'Rodilla Izq', x: 42, y: 145, r: 3 },
    { id: 'rodilla-der', name: 'Rodilla Der', x: 58, y: 145, r: 3 },
    { id: 'pantorrilla-izq', name: 'Pantorrilla Izq', x: 40, y: 155, r: 2.5 },
    { id: 'pantorrilla-der', name: 'Pantorrilla Der', x: 60, y: 155, r: 2.5 },
  ];

  // Análisis de evolución
  const analyzeEvolution = () => {
    const marcasOrdenadas = [...marks].sort((a, b) => new Date(a.fecha ?? '').getTime() - new Date(b.fecha ?? '').getTime());
    const mejoras: string[] = [];
    
    for (let i = 0; i < marcasOrdenadas.length - 1; i++) {
      const actual = marcasOrdenadas[i];
      const siguiente = marcasOrdenadas[i + 1];
      
      if (actual.zona === siguiente.zona && siguiente.intensidad < actual.intensidad) {
        const mejora = actual.intensidad - siguiente.intensidad;
        mejoras.push(`${siguiente.zona}: -${mejora} puntos`);
      }
    }
    
    return mejoras.length > 0 ? mejoras : ['Sin cambios significativos'];
  };

  const handleBodyClick = (zone: { name: string; x: number; y: number }) => {
    if (mode !== 'EDITAR') return;

    const newMark: Mark = {
      id: Date.now().toString(),
      tipo: selectedTipo as Mark['tipo'],
      posicionX: zone.x,
      posicionY: zone.y,
      intensidad: intensidadActual,
      fecha: new Date().toISOString().split('T')[0],
      zona: zone.name,
      nota: '',
    };

    setMarks([...marks, newMark]);
    crearRegistroHistoria(newMark);
  };

  // Wrapper para 3D body zone clicks
  const handleBody3DZoneClick = (x: number, y: number, zona: string) => {
    if (mode !== 'EDITAR') return;

    const newMark: Mark = {
      id: Date.now().toString(),
      tipo: selectedTipo as Mark['tipo'],
      posicionX: x,
      posicionY: y,
      intensidad: intensidadActual,
      fecha: new Date().toISOString().split('T')[0],
      zona: zona,
      nota: '',
    };

    setMarks([...marks, newMark]);
    
    // Crear registro en Historia Clínica
    crearRegistroHistoria(newMark);
  };

  // Función para crear registro en Historia Clínica
  const crearRegistroHistoria = async (mark: Mark) => {
    try {
      const token = localStorage.getItem('accessToken') || '';
      const pacienteId = localStorage.getItem('pacienteId') || 'demo-paciente';
      
      const procedimiento = marcasTipos.find(m => m.tipo === mark.tipo);
      const nombreProcedimiento = procedimiento?.label || mark.tipo;
      
      const historiadata = {
        pacienteId,
        tipoConsulta: 'SEGUIMIENTO',
        quejaPrincipal: `Registro de procedimiento: ${nombreProcedimiento}`,
        historiaEnfermedad: `Procedimiento registrado en mapa corporal`,
        observacionesAntropometricas: `Zona: ${mark.zona} | Intensidad: ${mark.intensidad}/10 | Procedimiento: ${nombreProcedimiento}`,
        diagnostico: `${nombreProcedimiento} en ${mark.zona}`,
        tratamientoRecomendado: `Seguimiento de ${nombreProcedimiento} - Intensidad: ${mark.intensidad}/10`,
      };
      
      const response = await createHistoriaClinica(historiadata, token);
      
      if (!response.error) {
        console.log('Registro en Historia Clínica creado exitosamente:', response);
      }
    } catch (error) {
      console.error('Error al crear registro en Historia Clínica:', error);
    }
  };

  const removeMark = (id: string) => {
    setMarks(marks.filter((m) => m.id !== id));
  };

  const getMarkConfig = (tipo: Mark['tipo']) => {
    return marcasTipos.find((m) => m.tipo === tipo) || marcasTipos[0];
  };

  const getDaysFromFirst = (fecha: string | undefined) => {
    if (!fecha) return 0;
    const first = new Date(marks[0]?.fecha ?? new Date());
    const current = new Date(fecha);
    return Math.ceil((current.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Mapa Corporal 360°
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm">Documentación digital profesional</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTimeline(!showTimeline)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition flex items-center gap-2 text-sm"
              >
                <Calendar size={16} /> Timeline
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === 'COMPARAR' ? 'VISTA' : 'COMPARAR')}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
                  mode === 'COMPARAR'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <Eye size={16} /> Comparar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === 'EDITAR' ? 'VISTA' : 'EDITAR')}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
                  mode === 'EDITAR'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {mode === 'EDITAR' ? '✎ Editar' : '✎ Editar'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewType(viewType === '2D' ? '3D' : '2D')}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
                  viewType === '3D'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <Box size={16} /> {viewType === '2D' ? '3D' : '2D'}
              </motion.button>
            </div>
          </div>

          {/* Quick Stats */}
          {marks.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Total Marcas</p>
                <p className="text-2xl font-bold text-white">{marks.length}</p>
              </div>
              <div className="bg-slate-800/80 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Zonas Afectadas</p>
                <p className="text-2xl font-bold text-white">{new Set(marks.map(m => m.zona)).size}</p>
              </div>
              <div className="bg-slate-800/80 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Intensidad Promedio</p>
                <p className="text-2xl font-bold text-white">{(marks.reduce((a, b) => a + b.intensidad, 0) / marks.length).toFixed(1)}</p>
              </div>
              <div className="bg-slate-800/80 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Días de Seguimiento</p>
                <p className="text-2xl font-bold text-white">{getDaysFromFirst(marks[marks.length - 1]?.fecha)}</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6"
        >
          {/* Sidebar Izquierdo - Controles y Análisis */}
          <motion.div variants={itemVariants} className="space-y-6 col-span-1">
            {/* Selector de Tipo */}
            {mode === 'EDITAR' && (
              <motion.div className="bg-slate-800/80 backdrop-blur border border-yellow-600/30 rounded-xl p-5 space-y-3">
                <h3 className="text-white font-bold text-lg">Tipo de Marca</h3>
                <div className="space-y-2">
                  {marcasTipos.map((item) => (
                    <motion.button
                      key={item.tipo}
                      onClick={() => setSelectedTipo(item.tipo as Mark['tipo'])}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-lg border-2 text-left transition text-xs ${
                        selectedTipo === item.tipo
                          ? `bg-gradient-to-r ${item.color} border-white text-white shadow-lg`
                          : 'bg-slate-700 border-slate-600 hover:border-yellow-600/50 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-xs opacity-75">{item.rango}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Control de Intensidad */}
            {mode === 'EDITAR' && (
              <motion.div className="bg-slate-800/80 backdrop-blur border border-yellow-600/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">Intensidad</h3>
                  <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    {intensidadActual}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensidadActual}
                  onChange={(e) => setIntensidadActual(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                />
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-400">
                  <div>🟢 Leve (1-3)</div>
                  <div>🟡 Moderado (4-6)</div>
                  <div>🟠 Severo (7-8)</div>
                  <div>🔴 Crítico (9-10)</div>
                </div>
              </motion.div>
            )}

            {/* Análisis de Evolución */}
            {marks.length > 1 && (
              <motion.div className="bg-gradient-to-b from-green-900/40 to-emerald-900/20 border border-emerald-600/30 rounded-xl p-5">
                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                  <TrendingDown size={18} className="text-emerald-400" />
                  Evolución
                </h3>
                <div className="space-y-2">
                  {analyzeEvolution().map((mejora, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-emerald-300 bg-slate-800/50 p-2 rounded border border-emerald-600/20"
                    >
                      ✓ {mejora}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Acciones */}
            <div className="flex flex-col gap-2">
              {marks.length > 0 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} /> Exportar PDF
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Share2 size={16} /> Compartir
                  </motion.button>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMarks([])}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
              >
                <RotateCw size={16} /> Limpiar
              </motion.button>
            </div>

            {/* Marcas Activas */}
            <motion.div className="bg-slate-800/80 backdrop-blur border border-yellow-600/30 rounded-xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">
                Registro ({marks.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {marks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    {mode === 'EDITAR' ? 'Selecciona zonas del cuerpo' : 'Sin registros'}
                  </p>
                ) : (
                  marks
                    .sort((a, b) => new Date(b.fecha ?? '').getTime() - new Date(a.fecha ?? '').getTime())
                    .map((mark) => (
                      <motion.div
                        key={mark.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedMark(mark.id)}
                        className={`bg-gradient-to-r ${getMarkConfig(mark.tipo).color} p-3 rounded-lg border cursor-pointer transition ${
                          selectedMark === mark.id ? 'border-white' : 'border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{mark.zona}</p>
                            <p className="text-xs opacity-90">{getMarkConfig(mark.tipo).label}</p>
                            <p className="text-xs opacity-75">Día {getDaysFromFirst(mark.fecha)} • {mark.fecha}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{mark.intensidad}</p>
                            <p className="text-xs opacity-75">/10</p>
                          </div>
                        </div>
                        {mode === 'EDITAR' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMark(mark.id);
                            }}
                            className="mt-2 text-white hover:text-yellow-300 transition"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Centro - Mapa Corporal (Cols 2-5) */}
          <motion.div variants={itemVariants} className="col-span-4">
            <div className="space-y-6">
              {/* Modo Comparación */}
              {mode === 'COMPARAR' && (
                <motion.div className="bg-slate-800/80 border border-blue-600/30 rounded-xl p-5">
                  <h3 className="text-white font-bold mb-3">Comparar Fechas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Desde</label>
                      <select
                        value={comparisonDates[0]}
                        onChange={(e) => setComparisonDates([e.target.value, comparisonDates[1]])}
                        className="w-full mt-1 bg-slate-700 text-white rounded p-2 text-sm border border-slate-600"
                      >
                        {marks.map((m) => (
                          <option key={m.id} value={m.fecha}>
                            {m.fecha}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Hasta</label>
                      <select
                        value={comparisonDates[1]}
                        onChange={(e) => setComparisonDates([comparisonDates[0], e.target.value])}
                        className="w-full mt-1 bg-slate-700 text-white rounded p-2 text-sm border border-slate-600"
                      >
                        {marks.map((m) => (
                          <option key={m.id} value={m.fecha}>
                            {m.fecha}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Timeline */}
              {showTimeline && marks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/80 border border-slate-700/30 rounded-xl p-5"
                >
                  <h3 className="text-white font-bold mb-4">Línea de Tiempo</h3>
                  <div className="relative">
                    {[...marks]
                      .sort((a, b) => new Date(a.fecha ?? '').getTime() - new Date(b.fecha ?? '').getTime())
                      .map((mark, i, arr) => (
                        <div key={mark.id} className="flex gap-4 pb-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getMarkConfig(mark.tipo).color} border-2 border-white`} />
                            {i < arr.length - 1 && <div className="w-1 h-8 bg-slate-700 mt-1" />}
                          </div>
                          <div className="pt-1">
                            <p className="text-white font-semibold text-sm">{mark.zona}</p>
                            <p className="text-gray-400 text-xs">{mark.fecha} • Día {getDaysFromFirst(mark.fecha)}</p>
                            <p className="text-yellow-400 text-xs mt-1">
                              {getMarkConfig(mark.tipo).label} - Intensidad {mark.intensidad}/10
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Mapa Corporal Principal */}
              <motion.div className="bg-slate-800/80 backdrop-blur border border-yellow-600/30 rounded-xl p-8">
                <div className="mb-6">
                  <h3 className="text-white font-bold text-xl mb-4">
                    {viewType === '3D' 
                      ? '🎯 Modelo 3D Interactivo' 
                      : mode === 'EDITAR' ? '👆 Haz clic en zonas' : mode === 'COMPARAR' ? '🔍 Comparación Visual' : '👀 Vistas 360°'}
                  </h3>
                  
                  {/* Mostrar vista 3D */}
                  {viewType === '3D' && (
                    <div className="w-full rounded-lg overflow-hidden mb-6 bg-slate-900">
                      <Body3D 
                        marks={marks}
                        mode={mode}
                        selectedTipo={selectedTipo}
                        intensidad={intensidadActual}
                        onBodyZoneClick={handleBody3DZoneClick}
                      />
                    </div>
                  )}

                  {/* Selector de vistas 360 (solo en modo 2D) */}
                  {viewType === '2D' && (
                    <div className="flex gap-2 flex-wrap justify-center mb-6">
                      {[
                        { view: 'TODAS', label: '🔄 Todas', icon: '360°' },
                        { view: 'FRONTAL', label: '👀 Frontal' },
                        { view: 'POSTERIOR', label: '🔙 Posterior' },
                        { view: 'LATERAL', label: '↔️ Lateral' },
                      ].map((btn) => (
                        <motion.button
                          key={btn.view}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setView360(btn.view as any)}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            view360 === btn.view
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                          }`}
                        >
                          {btn.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid de Vistas 360 */}
                {viewType === '2D' && view360 === 'TODAS' && (
                  <div className="grid grid-cols-2 gap-6">
                    <BodyViewSVG viewLabel="FRONTAL" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                    <BodyViewSVG viewLabel="POSTERIOR" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                  </div>
                )}

                {viewType === '2D' && view360 === 'FRONTAL' && (
                  <BodyViewSVG viewLabel="FRONTAL" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize={true} />
                )}

                {viewType === '2D' && view360 === 'POSTERIOR' && (
                  <BodyViewSVG viewLabel="POSTERIOR" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize={true} />
                )}

                {viewType === '2D' && view360 === 'LATERAL' && (
                  <div className="grid grid-cols-2 gap-6">
                    <BodyViewSVG viewLabel="LATERAL IZQ" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                    <BodyViewSVG viewLabel="LATERAL DER" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                  </div>
                )}
              </motion.div>

              {/* ===== EVOLUCIÓN CIRUGÍA PLÁSTICA ===== */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/80 backdrop-blur border border-purple-600/40 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-purple-600/20">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
                    <div>
                      <h3 className="text-white font-bold text-lg">Evolución Cirugía Plástica</h3>
                      <p className="text-gray-400 text-xs">Control post-operatorio y seguimiento clínico</p>
                    </div>
                    {evoluciones.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                        {evoluciones.length} evoluciones
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEvolucionForm(!showEvolucionForm)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      showEvolucionForm
                        ? 'bg-slate-600 hover:bg-slate-500 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-900/30'
                    }`}
                  >
                    {showEvolucionForm ? (
                      <><ChevronUp size={16} /> Cerrar</>
                    ) : (
                      <><Plus size={16} /> Nueva Evolución</>
                    )}
                  </motion.button>
                </div>

                {/* Formulario nueva evolución */}
                <AnimatePresence>
                  {showEvolucionForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 space-y-5 border-b border-purple-600/20 bg-slate-900/30">
                        {/* Fecha + N° evolución */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">📅 Fecha de Control</label>
                            <input
                              type="date"
                              value={evolucionForm.fechaEvolucion}
                              onChange={e => setEvolucionForm(f => ({ ...f, fechaEvolucion: e.target.value }))}
                              className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">🔢 N° Evolución</label>
                            <input
                              type="text"
                              readOnly
                              value={`Evolución #${evoluciones.length + 1}`}
                              className="w-full bg-slate-700/50 border border-slate-600 text-gray-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Plan Quirúrgico */}
                        <div>
                          <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">🔪 Plan Quirúrgico / Procedimiento Realizado</label>
                          <input
                            type="text"
                            placeholder="Ej: Liposucción abdominal, Abdominoplastia, Rinoplastia..."
                            value={evolucionForm.planQuirurgico}
                            onChange={e => setEvolucionForm(f => ({ ...f, planQuirurgico: e.target.value }))}
                            className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-gray-500"
                          />
                        </div>

                        {/* Plan Prequirúrgico */}
                        <div>
                          <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-2 block">📋 Plan Prequirúrgico</label>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {([
                              { key: 'examenesPrequirurgicos', label: '🧪 Exámenes Prequirúrgicos' },
                              { key: 'valoracionEnfermeria', label: '💉 Valoración Enfermería' },
                              { key: 'valoracionPreanestesica', label: '😷 Valoración Preanestésica' },
                            ] as const).map(({ key, label }) => (
                              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={evolucionForm.planPrequirurgico[key]}
                                  onChange={e => setEvolucionForm(f => ({
                                    ...f,
                                    planPrequirurgico: { ...f.planPrequirurgico, [key]: e.target.checked },
                                  }))}
                                  className="w-4 h-4 accent-purple-500 rounded"
                                />
                                <span className="text-sm text-gray-300 group-hover:text-white transition">{label}</span>
                              </label>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Otros aspectos prequirúrgicos..."
                            value={evolucionForm.planPrequirurgico.otros}
                            onChange={e => setEvolucionForm(f => ({
                              ...f,
                              planPrequirurgico: { ...f.planPrequirurgico, otros: e.target.value },
                            }))}
                            className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-gray-500"
                          />
                        </div>

                        {/* Observaciones Frontal / Posterior */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">👀 Observaciones Vista Frontal</label>
                            <textarea
                              rows={3}
                              placeholder="Evolución de cicatriz, edema, hematoma vista frontal..."
                              value={evolucionForm.observacionesFrontal}
                              onChange={e => setEvolucionForm(f => ({ ...f, observacionesFrontal: e.target.value }))}
                              className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-gray-500 resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">🔙 Observaciones Vista Posterior</label>
                            <textarea
                              rows={3}
                              placeholder="Evolución de cicatriz, edema, hematoma vista posterior..."
                              value={evolucionForm.observacionesPosterior}
                              onChange={e => setEvolucionForm(f => ({ ...f, observacionesPosterior: e.target.value }))}
                              className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-gray-500 resize-none"
                            />
                          </div>
                        </div>

                        {/* Riesgos / Complicaciones */}
                        <div>
                          <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">⚠️ Riesgos / Complicaciones Identificadas</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Agregar riesgo o complicación y presionar Enter..."
                              value={newRiesgo}
                              onChange={e => setNewRiesgo(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && newRiesgo.trim()) {
                                  setEvolucionForm(f => ({ ...f, riesgosComplicaciones: [...f.riesgosComplicaciones, newRiesgo.trim()] }));
                                  setNewRiesgo('');
                                }
                              }}
                              className="flex-1 bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-gray-500"
                            />
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (newRiesgo.trim()) {
                                  setEvolucionForm(f => ({ ...f, riesgosComplicaciones: [...f.riesgosComplicaciones, newRiesgo.trim()] }));
                                  setNewRiesgo('');
                                }
                              }}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                            >
                              <Plus size={16} />
                            </motion.button>
                          </div>
                          {evolucionForm.riesgosComplicaciones.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {evolucionForm.riesgosComplicaciones.map((r, i) => (
                                <span key={i} className="flex items-center gap-1.5 bg-red-900/40 border border-red-700/40 text-red-300 text-xs px-2 py-1 rounded-full">
                                  <AlertTriangle size={11} /> {r}
                                  <button
                                    onClick={() => setEvolucionForm(f => ({ ...f, riesgosComplicaciones: f.riesgosComplicaciones.filter((_, idx) => idx !== i) }))}
                                    className="ml-0.5 hover:text-white transition"
                                  >×</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recomendaciones */}
                        <div>
                          <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">💊 Recomendaciones y Plan de Manejo</label>
                          <textarea
                            rows={3}
                            placeholder="Tratamiento, medicación, cuidados post-op, próxima cita..."
                            value={evolucionForm.recomendaciones}
                            onChange={e => setEvolucionForm(f => ({ ...f, recomendaciones: e.target.value }))}
                            className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-gray-500 resize-none"
                          />
                        </div>

                        {/* Finalidad de Atención */}
                        <div>
                          <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-1.5 block">🎯 Finalidad de Atención</label>
                          <select
                            value={evolucionForm.finalidadAtencion}
                            onChange={e => setEvolucionForm(f => ({ ...f, finalidadAtencion: e.target.value }))}
                            className="w-full bg-slate-700 border border-slate-600 focus:border-purple-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition"
                          >
                            <option value="">Seleccionar finalidad...</option>
                            <option value="CONTROL_POSTOPERATORIO">Control Postoperatorio</option>
                            <option value="RETIRO_PUNTOS">Retiro de Puntos</option>
                            <option value="VALORACION_RESULTADO">Valoración de Resultado</option>
                            <option value="TRATAMIENTO_COMPLICACION">Tratamiento de Complicación</option>
                            <option value="SEGUIMIENTO_CICATRIZ">Seguimiento de Cicatriz</option>
                            <option value="ALTA_MEDICA">Alta Médica</option>
                          </select>
                        </div>

                        {/* Acciones del formulario */}
                        <div className="flex justify-end gap-3 pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setEvolucionForm({
                                fechaEvolucion: new Date().toISOString().split('T')[0],
                                planQuirurgico: '',
                                planPrequirurgico: { examenesPrequirurgicos: false, valoracionEnfermeria: false, valoracionPreanestesica: false, otros: '' },
                                observacionesFrontal: '',
                                observacionesPosterior: '',
                                recomendaciones: '',
                                riesgosComplicaciones: [],
                                finalidadAtencion: '',
                              });
                              setNewRiesgo('');
                            }}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold text-sm transition"
                          >
                            Limpiar
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (!evolucionForm.planQuirurgico && !evolucionForm.observacionesFrontal && !evolucionForm.recomendaciones) return;
                              const nueva: Evolucion = {
                                id: Date.now().toString(),
                                numeroEvolucion: evoluciones.length + 1,
                                fechaEvolucion: evolucionForm.fechaEvolucion,
                                planQuirurgico: evolucionForm.planQuirurgico,
                                planPrequirurgico: evolucionForm.planPrequirurgico,
                                observacionesFrontal: evolucionForm.observacionesFrontal,
                                observacionesPosterior: evolucionForm.observacionesPosterior,
                                recomendaciones: evolucionForm.recomendaciones,
                                riesgosComplicaciones: evolucionForm.riesgosComplicaciones,
                                finalidadAtencion: evolucionForm.finalidadAtencion,
                                marcas: marks,
                                creadoEn: new Date().toISOString(),
                              };
                              setEvoluciones(prev => [nueva, ...prev]);
                              setShowEvolucionForm(false);
                              setEvolucionForm({
                                fechaEvolucion: new Date().toISOString().split('T')[0],
                                planQuirurgico: '',
                                planPrequirurgico: { examenesPrequirurgicos: false, valoracionEnfermeria: false, valoracionPreanestesica: false, otros: '' },
                                observacionesFrontal: '',
                                observacionesPosterior: '',
                                recomendaciones: '',
                                riesgosComplicaciones: [],
                                finalidadAtencion: '',
                              });
                              setNewRiesgo('');
                            }}
                            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-semibold text-sm transition shadow-lg shadow-purple-900/30 flex items-center gap-2"
                          >
                            <Save size={16} /> Guardar Evolución
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lista de evoluciones registradas */}
                <div className="p-5">
                  {evoluciones.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-900/30 border border-purple-600/30 flex items-center justify-center">
                        <ClipboardList size={28} className="text-purple-400" />
                      </div>
                      <p className="text-gray-400 text-sm font-semibold">Sin evoluciones registradas</p>
                      <p className="text-gray-500 text-xs mt-1">Usa "Nueva Evolución" para registrar el seguimiento post-operatorio</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {evoluciones.map(ev => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-700/60 border border-purple-600/20 rounded-xl p-4 hover:border-purple-600/40 transition"
                        >
                          {/* Encabezado tarjeta */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400/30 flex items-center justify-center text-white font-bold text-sm shadow">
                                #{ev.numeroEvolucion}
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm">{ev.planQuirurgico || 'Sin procedimiento especificado'}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1">
                                  <Calendar size={11} /> {ev.fechaEvolucion}
                                  {ev.finalidadAtencion && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full text-xs border border-purple-700/30">
                                      {ev.finalidadAtencion.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Activity size={12} /> {ev.marcas.length} marcas
                            </div>
                          </div>

                          {/* Observaciones */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {ev.observacionesFrontal && (
                              <div className="bg-slate-800/60 rounded-lg p-2.5">
                                <p className="text-purple-300 font-semibold mb-1">Vista Frontal</p>
                                <p className="text-gray-300 leading-relaxed">{ev.observacionesFrontal}</p>
                              </div>
                            )}
                            {ev.observacionesPosterior && (
                              <div className="bg-slate-800/60 rounded-lg p-2.5">
                                <p className="text-purple-300 font-semibold mb-1">Vista Posterior</p>
                                <p className="text-gray-300 leading-relaxed">{ev.observacionesPosterior}</p>
                              </div>
                            )}
                            {ev.recomendaciones && (
                              <div className="bg-slate-800/60 rounded-lg p-2.5 col-span-2">
                                <p className="text-emerald-300 font-semibold mb-1 flex items-center gap-1"><FileText size={11} /> Recomendaciones</p>
                                <p className="text-gray-300 leading-relaxed">{ev.recomendaciones}</p>
                              </div>
                            )}
                          </div>

                          {/* Riesgos */}
                          {ev.riesgosComplicaciones.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {ev.riesgosComplicaciones.map((r, i) => (
                                <span key={i} className="flex items-center gap-1 bg-red-900/30 border border-red-700/30 text-red-300 text-xs px-2 py-0.5 rounded-full">
                                  <AlertTriangle size={10} /> {r}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Checklist prequirúrgico */}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {ev.planPrequirurgico.examenesPrequirurgicos && (
                              <span className="text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-700/20">✓ Exámenes</span>
                            )}
                            {ev.planPrequirurgico.valoracionEnfermeria && (
                              <span className="text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-700/20">✓ Val. Enfermería</span>
                            )}
                            {ev.planPrequirurgico.valoracionPreanestesica && (
                              <span className="text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-700/20">✓ Val. Preanestésica</span>
                            )}
                            {ev.planPrequirurgico.otros && (
                              <span className="text-gray-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-600/30">{ev.planPrequirurgico.otros}</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Mapa de colores por tipo de marca ──
const MARK_COLORS: Record<string, string> = {
  IMPLANTE_MAMARIO: '#ec4899',
  LIPOSUCCION: '#06b6d4',
  LIFTING_FACIAL: '#f59e0b',
  RINOPLASTIA: '#8b5cf6',
  ABDOMINOPLASTIA: '#10b981',
  CICATRIZ: '#eab308',
  HEMATOMA: '#ef4444',
  CELULITIS_EDEMA: '#f97316',
  EDEMA: '#a855f7',
  FIBROSIS: '#b45309',
  DOLOR: '#dc2626',
  AREA_TRATADA: '#3b82f6',
};

// ── Componente cuerpo SVG inline ──
interface BodyViewSVGProps {
  viewLabel: string;
  isBack?: boolean;
  marks: Mark[];
  mode: 'VISTA' | 'EDITAR' | 'COMPARAR';
  handleBodyClick: (zone: { name: string; x: number; y: number }) => void;
  getMarkConfig: (tipo: Mark['tipo']) => any;
  fullSize?: boolean;
}

function BodyViewSVG({ viewLabel, isBack = false, marks, mode, handleBodyClick, getMarkConfig, fullSize = false }: BodyViewSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Imagen según vista (usar PNG realistas si existen, fallback a SVG)
  const imageUrl = (() => {
    if (viewLabel.includes('LATERAL IZQ')) return '/body-left-3d.png';
    if (viewLabel.includes('LATERAL DER')) return '/body-right-3d.png';
    if (isBack) return '/body-back-3d.png';
    return '/body-front-3d.png';
  })();

  // Imagen SVG de respaldo si el PNG no existe
  const fallbackUrl = (() => {
    if (viewLabel.includes('LATERAL IZQ')) return '/female-body-left.svg';
    if (viewLabel.includes('LATERAL DER')) return '/female-body-right.svg';
    if (isBack) return '/female-body-back.svg';
    return '/female-body-silhouette.svg';
  })();

  const detectZona = (x: number, y: number): string => {
    if (viewLabel.includes('LATERAL')) {
      if (y < 86) return 'Cabeza';
      if (y < 120) return 'Cuello';
      if (y < 230) return 'Torso';
      if (y < 340) return 'Abdomen';
      if (y < 470) return 'Muslo';
      return 'Pantorrilla';
    }
    if (y < 86)  return 'Cabeza';
    if (y < 120) return 'Cuello';
    if (y < 180) return x < 110 ? 'Hombro Izquierdo' : x > 190 ? 'Hombro Derecho' : 'Clavícula';
    if (y < 270) {
      if (x < 75 || x > 225) return x < 150 ? 'Brazo Izquierdo' : 'Brazo Derecho';
      if (!isBack) {
        if (x < 140) return 'Mama Izquierda';
        if (x > 160) return 'Mama Derecha';
      }
      return isBack ? 'Espalda Superior' : 'Pecho';
    }
    if (y < 342) return isBack ? 'Espalda Baja' : 'Abdomen';
    if (y < 390) return 'Pelvis / Cadera';
    if (y < 470) return x < 150 ? 'Muslo Izquierdo' : 'Muslo Derecho';
    if (y < 545) return x < 150 ? 'Pierna Izquierda' : 'Pierna Derecha';
    return x < 150 ? 'Pie Izquierdo' : 'Pie Derecho';
  };

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'EDITAR') return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    handleBodyClick({ name: detectZona(svgP.x, svgP.y), x: Math.round(svgP.x), y: Math.round(svgP.y) });
  };

  const w = fullSize ? 260 : 180;
  const h = fullSize ? 540 : 374;

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 text-center">
      <p className="text-white font-semibold mb-3 text-sm tracking-wide">
        {viewLabel}
        {mode === 'EDITAR' && <span className="text-yellow-400 text-xs ml-2">👆 clic para marcar</span>}
      </p>
      {/* Contenedor relativo: imagen realista + SVG de marcas superpuesto */}
      <div
        ref={containerRef}
        className="relative inline-block mx-auto"
        style={{ width: w, height: h }}
      >
        {/* Imagen fotorealista de fondo, con fallback al SVG */}
        <img
          src={imageUrl}
          alt={viewLabel}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.7))' }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== window.location.origin + fallbackUrl) {
              img.src = fallbackUrl;
            }
          }}
        />
        {/* SVG transparente encima para capturar clics y renderizar marcas */}
        <svg
          ref={svgRef}
          viewBox="0 0 300 580"
          width={w}
          height={h}
          onClick={handleSVGClick}
          className="absolute inset-0"
          style={{
            cursor: mode === 'EDITAR' ? 'crosshair' : 'default',
            background: 'transparent',
          }}
        >
          {/* ── Marcas ── */}
          {marks.map((mark) => {
            const color = MARK_COLORS[mark.tipo] ?? '#6366f1';
            return (
              <g key={mark.id}>
                {/* Halo */}
                <circle cx={mark.posicionX} cy={mark.posicionY} r={20} fill={color} opacity={0.2} />
                {/* Círculo principal */}
                <circle
                  cx={mark.posicionX}
                  cy={mark.posicionY}
                  r={13}
                  fill={color}
                  stroke="white"
                  strokeWidth="2.5"
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
                {/* Número intensidad */}
                <text
                  x={mark.posicionX}
                  y={mark.posicionY + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {mark.intensidad}
                </text>
                <title>{mark.zona} — {getMarkConfig(mark.tipo).label} · Intensidad {mark.intensidad}/10</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
