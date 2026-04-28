import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCw, Download, TrendingDown, ZoomIn, Calendar, Share2, Eye, Beaker, Box } from 'lucide-react';
import { Body3D } from '../components/Body3D';
import { createHistoriaClinica } from '../services/api';

interface Mark {
  id: string;
  tipo: 'LIPOSUCCION' | 'IMPLANTE_MAMARIO' | 'LIFTING_FACIAL' | 'RINOPLASTIA' | 'ABDOMINOPLASTIA' | 'CICATRIZ' | 'HEMATOMA' | 'CELULITIS_EDEMA' | 'EDEMA' | 'FIBROSIS' | 'DOLOR' | 'AREA_TRATADA';
  posicionX: number;
  posicionY: number;
  intensidad: number;
  fecha: string;
  zona: string;
  nota?: string;
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
    const marcasOrdenadas = [...marks].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
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

  const handleBodyClick = (zone: typeof bodyZones[0]) => {
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
    
    // Crear registro en Historia Clínica
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

  const getDaysFromFirst = (fecha: string) => {
    const first = new Date(marks[0]?.fecha || new Date());
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
                Mapa Corporal 360°
              </h1>
              <p className="text-gray-400">Documentación digital profesional con análisis de evolución post-operatoria</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
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
          className="grid grid-cols-5 gap-6"
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
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
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
                      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
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
                    {/* Frontal */}
                    <BodyView imageUrl="/female-body-silhouette.svg" viewLabel="FRONTAL" marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                    {/* Posterior */}
                    <BodyView imageUrl="/female-body-back.svg" viewLabel="POSTERIOR" marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                  </div>
                )}

                {viewType === '2D' && view360 === 'FRONTAL' && (
                  <BodyView imageUrl="/female-body-silhouette.svg" viewLabel="FRONTAL" marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize={true} />
                )}

                {viewType === '2D' && view360 === 'POSTERIOR' && (
                  <BodyView imageUrl="/female-body-back.svg" viewLabel="POSTERIOR" marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize={true} />
                )}

                {viewType === '2D' && view360 === 'LATERAL' && (
                  <div className="grid grid-cols-2 gap-6">
                    <BodyView imageUrl="/female-body-left.svg" viewLabel="LATERAL IZQ" marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                    <BodyView imageUrl="/female-body-right.svg" viewLabel="LATERAL DER" marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                  </div>
                )}
              </motion.div>

              {/* Componente reutilizable para cada vista */}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Componente para mostrar cada vista corporal
interface BodyViewProps {
  imageUrl: string;
  viewLabel: string;
  marks: Mark[];
  mode: 'VISTA' | 'EDITAR' | 'COMPARAR';
  handleBodyClick: (zone: any) => void;
  getMarkConfig: (tipo: Mark['tipo']) => any;
  fullSize?: boolean;
}

function BodyView({ imageUrl, viewLabel, marks, mode, handleBodyClick, getMarkConfig, fullSize }: BodyViewProps) {
  // Detectar zona automáticamente basada en coordenadas
  const detectZoneName = (x: number, y: number) => {
    // Detectar zona basada en la posición aproximada
    if (viewLabel.includes('LATERAL')) {
      if (y < 20) return 'Cabeza';
      if (y < 30) return 'Cuello';
      if (y < 50) return 'Torso';
      if (y < 70) return 'Abdomen';
      if (y < 85) return 'Muslo';
      return 'Pantorrilla';
    }

    // Para vistas frontales/posteriores
    if (y < 20) return 'Cabeza';
    if (y < 28) return 'Cuello';
    if (y < 45) {
      return x < 50 ? 'Mama Izquierda' : 'Mama Derecha';
    }
    if (y < 65) {
      if (x < 30) return 'Brazo Izquierdo';
      if (x > 70) return 'Brazo Derecho';
      return 'Abdomen';
    }
    if (y < 85) {
      return x < 50 ? 'Muslo Izquierdo' : 'Muslo Derecho';
    }
    return x < 50 ? 'Pantorrilla Izquierda' : 'Pantorrilla Derecha';
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'EDITAR') return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Calcular coordenadas relativas al container
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Convertir a porcentaje
    const percentX = (offsetX / rect.width) * 100;
    const percentY = (offsetY / rect.height) * 100;
    
    // Detectar zona automáticamente
    const detectedZone = detectZoneName(percentX, percentY);
    
    // Crear objeto zona con coordenadas exactas
    const clickedZone = {
      id: `custom-${Date.now()}`,
      name: detectedZone,
      x: percentX,
      y: percentY,
    };
    
    handleBodyClick(clickedZone);
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
      <p className="text-white font-semibold mb-4">
        {viewLabel}
        {mode === 'EDITAR' && <span className="text-purple-400 text-sm ml-2">👆 Haz clic en cualquier zona</span>}
      </p>
      <div 
        className="relative mx-auto"
        onClick={handleImageClick}
        style={{ 
          width: fullSize ? '400px' : '280px', 
          height: fullSize ? '600px' : '400px',
          cursor: mode === 'EDITAR' ? 'crosshair' : 'default',
        }}
      >
        {/* Imagen de Fondo */}
        <img
          src={imageUrl}
          alt={viewLabel}
          className="w-full h-full object-contain absolute pointer-events-none"
          style={{
            filter: mode === 'EDITAR' ? 'drop-shadow(0 0 20px rgba(168,85,247,0.3))' : 'drop-shadow(0 0 10px rgba(168,85,247,0.15))',
            opacity: 0.85,
          }}
        />

        {/* Marcas superpuestas */}
        {marks.map((mark) => {
          const config = getMarkConfig(mark.tipo);
          return (
            <motion.div
              key={mark.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.15 }}
              style={{
                position: 'absolute',
                left: `${(mark.posicionX / 300) * 100}%`,
                top: `${(mark.posicionY / 600) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`rounded-full bg-gradient-to-r ${config.color} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer`}
                style={{
                  width: fullSize ? '40px' : '32px',
                  height: fullSize ? '40px' : '32px',
                  boxShadow: `0 0 15px rgba(${
                    config.tipo === 'EDEMA' ? '168,85,247' : config.tipo === 'FIBROSIS' ? '217,119,6' : config.tipo === 'DOLOR' ? '220,38,38' : config.tipo === 'CICATRIZ' ? '234,88,12' : '37,99,235'
                  }, 0.6)`,
                }}
                title={`${mark.zona} - Intensidad ${mark.intensidad}/10`}
              >
                {mark.intensidad}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
