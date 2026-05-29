import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCw, Download, TrendingDown, Calendar, Plus, Save, ChevronDown, ChevronUp, AlertTriangle, ClipboardList, FileText, Activity, Eye, Box, Share2 } from 'lucide-react';
import { Body3D } from '../components/Body3D';
import { saveMapaCorporal, getMapaCorporalPorPaciente, searchPacientes } from '../services/api';
import bodyFrontImg from './images/body-front-3d.png';
import bodyBackImg from './images/body-back-3d.png';
import bodyLeftImg from './images/body-left-3d.png';
import bodyRightImg from './images/body-right-3d.png';

interface Mark {
  id: string;
  tipo: 'LIPOSUCCION' | 'IMPLANTE_MAMARIO' | 'LIFTING_FACIAL' | 'RINOPLASTIA' | 'ABDOMINOPLASTIA' | 'CICATRIZ' | 'HEMATOMA' | 'CELULITIS_EDEMA' | 'EDEMA' | 'FIBROSIS' | 'DOLOR' | 'AREA_TRATADA';
  posicionX: number;
  posicionY: number;
  intensidad: number;
  zona: string;
  fecha?: string;
  vista: 'FRONTAL' | 'POSTERIOR' | 'LATERAL_IZQ' | 'LATERAL_DER'; // Vista donde se registró la marca
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
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pacienteId, setPacienteId] = useState<string>('');
  const [procedimientoId, setProcedimientoId] = useState<string>('');
  const [procedimientoNombre, setProcedimientoNombre] = useState<string>('');
  const [mapaCorporalId, setMapaCorporalId] = useState<string | null>(null);
  
  // Modal para procedimiento duplicado
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingMark, setPendingMark] = useState<Mark | null>(null);
  const [duplicateType, setDuplicateType] = useState<string>('');
  const [oldMarkId, setOldMarkId] = useState<string | null>(null);
  const [replacementTipo, setReplacementTipo] = useState<Mark['tipo'] | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'delete' | 'replace' | null>(null);

  const [selectedTipo, setSelectedTipo] = useState<Mark['tipo']>('IMPLANTE_MAMARIO');
  const [intensidadActual, setIntensidadActual] = useState(5);
  const [mode, setMode] = useState<'VISTA' | 'EDITAR' | 'COMPARAR'>('VISTA');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [comparisonDates, setComparisonDates] = useState<[string, string]>(['2026-03-25', '2026-04-10']);
  const [view360, setView360] = useState<'TODAS' | 'FRONTAL' | 'POSTERIOR' | 'LATERAL'>('FRONTAL');
  const [viewType, setViewType] = useState<'2D' | '3D'>('2D');
  const canvasRef = useRef<SVGSVGElement>(null);
  // ── Refs para save-on-unmount (evitar stale closures) ──
  const marksRef = useRef<Mark[]>([]);
  const evolucionDataRef = useRef({ evolucion: '', recomendaciones: '' });
  const saveEvolucionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pacienteIdRef = useRef('');
  const procedimientoIdRef = useRef('');
  // Guard: evita que React StrictMode (doble-mount) borre datos al hacer cleanup antes de cargar
  const hasLoadedRef = useRef(false);

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

  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacienteNombreDisplay, setPacienteNombreDisplay] = useState('');
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacientesBuscados, setPacientesBuscados] = useState<any[]>([]);

  // ── Historial de guardados ──
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialMapas, setHistorialMapas] = useState<any[]>([]);

  const marcasTipos = [
    { tipo: 'IMPLANTE_MAMARIO', color: 'from-pink-600 to-pink-500', solidColor: '#ec4899', label: 'Aumento Mamario', icon: '💗', descripcion: 'Implante mamario', rango: 'POST-OP 0-90 días' },
    { tipo: 'LIPOSUCCION', color: 'from-cyan-600 to-cyan-500', solidColor: '#06b6d4', label: 'Liposucción', icon: '🔵', descripcion: 'Contorneado corporal', rango: 'POST-OP 0-60 días' },
    { tipo: 'LIFTING_FACIAL', color: 'from-amber-600 to-amber-500', solidColor: '#f59e0b', label: 'Lifting Facial', icon: '⭐', descripcion: 'Rejuvenecimiento facial', rango: 'POST-OP 0-90 días' },
    { tipo: 'ABDOMINOPLASTIA', color: 'from-emerald-600 to-emerald-500', solidColor: '#10b981', label: 'Abdominoplastia', icon: '💚', descripcion: 'Estiramiento abdominal', rango: 'POST-OP 0-120 días' },
    { tipo: 'CICATRIZ', color: 'from-yellow-600 to-yellow-500', solidColor: '#eab308', label: 'Cicatriz', icon: '✂️', descripcion: 'Evolución de cicatriz', rango: 'POST-OP 24+ horas' },
    { tipo: 'HEMATOMA', color: 'from-red-700 to-red-600', solidColor: '#dc2626', label: 'Hematoma', icon: '🔴', descripcion: 'Moretones post-op', rango: 'POST-OP 0-21 días' },
    { tipo: 'CELULITIS_EDEMA', color: 'from-red-600 to-red-500', solidColor: '#ef4444', label: 'Edema/Inflamación', icon: '⚠️', descripcion: 'Inflamación post-op', rango: 'POST-OP 0-30 días' },
  ];

  // ── Recomendaciones quirúrgicas predefinidas (parametrizables) ──
  const RECOMENDACIONES_PREDEFINIDAS = [
    'Reposo relativo por 48 horas',
    'Evitar exposición solar por 30 días',
    'Usar faja de compresión 24/7 por 4 semanas',
    'No actividad física de alto impacto por 3 semanas',
    'Cita de control en 7 días',
    'Cambio de apósitos cada 48 horas',
    'Hidratación abundante (2L agua/día)',
    'Tomar medicación según horario prescrito',
    'No fumar ni alcohol por 4 semanas',
    'Masaje drenaje linfático desde día 5 post-op',
    'Vigilar: fiebre >38°C, sangrado activo o dolor intenso',
    'Dieta blanda las primeras 24h post-anestesia',
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

  // ═══════════════════════════════════════
  // CARGAR DATOS DEL BACKEND AL MONTAR
  // ═══════════════════════════════════════
  useEffect(() => {
    // No hay pacienteId en localStorage — la selección es explícita en esta página
    hasLoadedRef.current = true; // Marcar como listo (no hay nada que cargar al montar)
  }, []);

  // ── Buscar paciente ──
  const buscarPaciente = async () => {
    const q = pacienteSearch.trim();
    if (!q) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setBuscandoPaciente(true);
    try {
      const response = await searchPacientes(q, token);
      if (response.data) {
        const list = Array.isArray(response.data) ? response.data : [response.data];
        setPacientesBuscados(list);
      } else {
        setPacientesBuscados([]);
      }
    } catch {
      setPacientesBuscados([]);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  // ── Seleccionar paciente y cargar su mapa ──
  const seleccionarPaciente = async (paciente: any) => {
    setPacienteId(paciente.id);
    setPacienteNombreDisplay(paciente.nombreCompleto);
    setPacientesBuscados([]);
    setPacienteSearch('');
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setLoading(true);
    try {
      const response = await getMapaCorporalPorPaciente(paciente.id, token);
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Guardar historial completo
        setHistorialMapas(response.data.data);
        const mapaReciente = response.data.data[0];
        setMarks(mapaReciente.zonasMarcadas as Mark[]);
        setMapaCorporalId(mapaReciente.id);
        if (mapaReciente.anotacionesClinics) {
          try {
            const extra = JSON.parse(mapaReciente.anotacionesClinics);
            setEvolucionForm(prev => ({
              ...prev,
              observacionesFrontal: extra.evolucion || '',
              recomendaciones: extra.recomendaciones || '',
            }));
          } catch {}
        }
      } else {
        setHistorialMapas([]);
        setMarks([]);
        setMapaCorporalId(null);
      }
    } catch (error) {
      console.error('Error cargando mapa del paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Cargar un guardado anterior del historial ──
  const cargarDesdeHistorial = (mapa: any) => {
    setMarks(mapa.zonasMarcadas as Mark[]);
    setMapaCorporalId(mapa.id);
    if (mapa.anotacionesClinics) {
      try {
        const extra = JSON.parse(mapa.anotacionesClinics);
        setEvolucionForm(prev => ({
          ...prev,
          observacionesFrontal: extra.evolucion || '',
          recomendaciones: extra.recomendaciones || '',
        }));
      } catch {}
    }
    setShowHistorial(false);
  };

  // ═══════════════════════════════════════
  // SINCRONIZAR REFS CON STATE
  // ═══════════════════════════════════════
  useEffect(() => { marksRef.current = marks; }, [marks]);
  useEffect(() => { pacienteIdRef.current = pacienteId; }, [pacienteId]);
  useEffect(() => { procedimientoIdRef.current = procedimientoId; }, [procedimientoId]);
  useEffect(() => {
    evolucionDataRef.current = {
      evolucion: evolucionForm.observacionesFrontal,
      recomendaciones: evolucionForm.recomendaciones,
    };
  }, [evolucionForm.observacionesFrontal, evolucionForm.recomendaciones]);

  // ═══════════════════════════════════════
  // GUARDAR AL SALIR DEL MÓDULO (beforeunload + unmount)
  // ═══════════════════════════════════════
  useEffect(() => {
    const saveOnExit = () => {
      // No guardar si los datos nunca se cargaron (evita borrar datos con React StrictMode)
      if (!hasLoadedRef.current) return;
      const token = localStorage.getItem('accessToken');
      const pid = pacienteIdRef.current;
      if (!token || !pid) return;
      const { evolucion, recomendaciones } = evolucionDataRef.current;
      const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api';
      fetch(`${BASE_URL}/mapa-corporal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          pacienteId: pid,
          procedimientoId: procedimientoIdRef.current || undefined,
          zonasMarcadas: marksRef.current,
          edemaZonas: [],
          fibrosisZonas: [],
          dolorZonas: [],
          anotacionesClinics: JSON.stringify({ evolucion, recomendaciones }),
        }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', saveOnExit);
    return () => {
      window.removeEventListener('beforeunload', saveOnExit);
      saveOnExit(); // Guardar también al navegar entre rutas (React unmount)
    };
  }, []);

  // ═══════════════════════════════════════
  // AUTO-GUARDAR CUANDO HAY CAMBIOS
  // ═══════════════════════════════════════
  const autoSaveMapaCorporal = async (marksToSave: Mark[]) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Si falta pacienteId, no guardar
      if (!token || !pacienteId) {
        return;
      }

      setSaving(true);

      const response = await saveMapaCorporal(
        {
          pacienteId,
          procedimientoId: procedimientoId || undefined,
          zonasMarcadas: marksToSave,
          edemaZonas: [],
          fibrosisZonas: [],
          dolorZonas: [],
          anotacionesClinics: JSON.stringify({
            evolucion: evolucionDataRef.current.evolucion,
            recomendaciones: evolucionDataRef.current.recomendaciones,
          }),
        },
        token
      );

      if (response.data) {
        // El backend devuelve { success, message, data: mapaCorporal }, apiCall lo envuelve en { data: {...} }
        const savedId = (response.data as any)?.data?.id || (response.data as any)?.id;
        if (savedId) {
          setMapaCorporalId(savedId);
          // Actualizar historial: reemplazar si ya existe, o agregar al principio
          setHistorialMapas(prev => {
            const savedMapa = (response.data as any)?.data || response.data;
            const exists = prev.find(m => m.id === savedId);
            if (exists) {
              return prev.map(m => m.id === savedId ? { ...m, ...savedMapa } : m);
            }
            return [savedMapa, ...prev];
          });
        }
        console.log('✅ Mapa corporal guardado automáticamente');
      } else {
        console.error('❌ Error al guardar:', response.error);
      }
    } catch (error: any) {
      console.error('Error en auto-guardado:', error);
    } finally {
      setSaving(false);
    }
  };

  // ── Auto-guardar evolución/recomendaciones con debounce de 1.5s ──
  const autoSaveEvolucion = (evolucion: string, recomendaciones: string) => {
    evolucionDataRef.current = { evolucion, recomendaciones };
    if (saveEvolucionTimerRef.current) clearTimeout(saveEvolucionTimerRef.current);
    saveEvolucionTimerRef.current = setTimeout(() => {
      autoSaveMapaCorporal(marksRef.current);
    }, 1500);
  };

  // ═══════════════════════════════════════
  // VALIDAR PROCEDIMIENTO DUPLICADO
  // ═══════════════════════════════════════
  // Detectar duplicado: MISMO tipo + MISMA zona + MISMA vista + posición muy cercana (< 35px)
  const findDuplicateMark = (
    tipo: string,
    zona: string,
    x: number,
    y: number,
    vista: Mark['vista']
  ): Mark | undefined => {
    const PROXIMITY = 35;
    return marks.find(m =>
      m.tipo === tipo &&
      m.zona === zona &&
      m.vista === vista &&
      Math.sqrt(Math.pow(m.posicionX - x, 2) + Math.pow(m.posicionY - y, 2)) < PROXIMITY
    );
  };

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

  const handleBodyClick = (zone: { name: string; x: number; y: number }, vistaActual: 'FRONTAL' | 'POSTERIOR' | 'LATERAL_IZQ' | 'LATERAL_DER' = 'FRONTAL') => {
    if (mode !== 'EDITAR') return;

    const newMark: Mark = {
      id: Date.now().toString(),
      tipo: selectedTipo as Mark['tipo'],
      posicionX: zone.x,
      posicionY: zone.y,
      intensidad: intensidadActual,
      fecha: new Date().toISOString().split('T')[0],
      zona: zone.name,
      vista: vistaActual,
      nota: '',
    };

    // Validar duplicado: MISMO tipo + zona + vista + posición cercana
    const duplicado = findDuplicateMark(selectedTipo, zone.name, zone.x, zone.y, vistaActual);
    if (duplicado) {
      const procName = marcasTipos.find(m => m.tipo === selectedTipo)?.label || selectedTipo;
      setDuplicateType(procName);
      setPendingMark(newMark);
      setOldMarkId(duplicado.id);
      setReplacementTipo(null);
      setDuplicateAction(null);
      setShowDuplicateModal(true);
      return;
    }

    // Si no hay duplicado, agregar marca normalmente
    const updatedMarks = [...marks, newMark];
    setMarks(updatedMarks);
    
    // AUTO-GUARDAR automáticamente
    autoSaveMapaCorporal(updatedMarks);
  };

  // Wrapper para 3D body zone clicks
  const handleBody3DZoneClick = (x: number, y: number, zona: string, vista: Mark['vista'] = 'FRONTAL') => {
    if (mode !== 'EDITAR') return;

    const newMark: Mark = {
      id: Date.now().toString(),
      tipo: selectedTipo as Mark['tipo'],
      posicionX: x,
      posicionY: y,
      intensidad: intensidadActual,
      fecha: new Date().toISOString().split('T')[0],
      zona: zona,
      vista,
      nota: '',
    };

    // Validar duplicado: MISMO tipo + zona + vista + posición cercana
    const duplicado = findDuplicateMark(selectedTipo, zona, x, y, vista);
    if (duplicado) {
      const procName = marcasTipos.find(m => m.tipo === selectedTipo)?.label || selectedTipo;
      setDuplicateType(procName);
      setPendingMark(newMark);
      setOldMarkId(duplicado.id);
      setReplacementTipo(null);
      setDuplicateAction(null);
      setShowDuplicateModal(true);
      return;
    }

    // Si no hay duplicado, agregar marca normalmente
    const updatedMarks = [...marks, newMark];
    setMarks(updatedMarks);
    
    // AUTO-GUARDAR automáticamente
    autoSaveMapaCorporal(updatedMarks);
  };

  /* 
  // ❌ FUNCIÓN DESHABILITADA - Ya no se crea Historia Clínica automáticamente
  // Ahora los registros se persisten en MapaCorporal al guardar
  // y se pueden generar reportes desde allí si es necesario
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
  */

  const removeMark = (id: string) => {
    const updatedMarks = marks.filter((m) => m.id !== id);
    setMarks(updatedMarks);
    // Auto-guardar al eliminar
    autoSaveMapaCorporal(updatedMarks);
  };

  const handleDuplicateAction = (action: 'delete' | 'replace') => {
    if (!oldMarkId || !pendingMark) return;

    let updatedMarks = marks.filter(m => m.id !== oldMarkId);

    if (action === 'replace' && replacementTipo) {
      const newMark: Mark = {
        ...pendingMark,
        tipo: replacementTipo,
      };
      updatedMarks = [...updatedMarks, newMark];
    }

    setMarks(updatedMarks);
    autoSaveMapaCorporal(updatedMarks);
    setShowDuplicateModal(false);
    setPendingMark(null);
    setOldMarkId(null);
    setReplacementTipo(null);
    setDuplicateAction(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 overflow-y-auto lg:h-screen lg:overflow-hidden">
      <div className="flex flex-col gap-2 lg:h-full">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HEADER COMPACTO - Control rápido */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 border border-yellow-600/30 rounded-lg p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Logo + Titulo */}
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Mapa Corporal 360°
              </h1>
            </div>

            {/* Buscador / Paciente seleccionado */}
            <div className="w-full order-last sm:order-none sm:flex-1 sm:max-w-xs relative">
              {pacienteId ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs font-bold truncate">👤 {pacienteNombreDisplay}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setPacienteId('');
                      setPacienteNombreDisplay('');
                      setMarks([]);
                      setMapaCorporalId(null);
                      setEvolucionForm(f => ({ ...f, observacionesFrontal: '', recomendaciones: '' }));
                    }}
                    className="text-gray-500 hover:text-red-400 text-xs px-1"
                    title="Cambiar paciente"
                  >✕</motion.button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={pacienteSearch}
                      onChange={e => setPacienteSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscarPaciente()}
                      placeholder="Buscar paciente (nombre o cédula)…"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 min-w-0"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={buscarPaciente}
                      disabled={buscandoPaciente}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-bold flex-shrink-0 disabled:opacity-50"
                    >
                      {buscandoPaciente ? '…' : '🔍'}
                    </motion.button>
                  </div>
                  {/* Resultados */}
                  {pacientesBuscados.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-yellow-600/40 rounded shadow-xl z-50 max-h-40 overflow-y-auto">
                      {pacientesBuscados.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => seleccionarPaciente(p)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-700 text-xs text-white border-b border-slate-700/50 last:border-0"
                        >
                          <span className="font-bold">{p.nombreCompleto}</span>
                          <span className="text-gray-400 ml-2">{p.tipoDocumento} {p.numeroDocumento}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!buscandoPaciente && pacienteSearch && pacientesBuscados.length === 0 && (
                    <p className="absolute top-full mt-1 left-0 text-xs text-gray-500 bg-slate-800 border border-slate-700 rounded px-2 py-1 z-50">
                      Sin resultados — presiona 🔍
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modo actual + Stats */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              {marks.length > 0 && (
                <>
                  <span className="text-gray-400">Marcas: <span className="text-white font-bold">{marks.length}</span></span>
                  <span className="text-gray-400">Intensidad promedio: <span className="text-white font-bold">{(marks.reduce((a, b) => a + b.intensidad, 0) / marks.length).toFixed(1)}</span></span>
                </>
              )}
            </div>

            {/* Botones Control Rápido */}
            <div className="flex gap-1.5 relative flex-shrink-0">
              {/* Botón historial de guardados */}
              {pacienteId && historialMapas.length > 0 && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowHistorial(prev => !prev)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                      showHistorial
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-200 border border-slate-600'
                    }`}
                    title="Ver historial de guardados"
                  >
                    🗂️ <span>{historialMapas.length}</span>
                  </motion.button>
                  {/* Panel desplegable historial */}
                  <AnimatePresence>
                    {showHistorial && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 w-72 max-w-[calc(100vw-1rem)] bg-slate-800 border border-purple-600/40 rounded-lg shadow-2xl z-50 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="px-3 py-2 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300">📋 Historial de guardados</span>
                          <button onClick={() => setShowHistorial(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {historialMapas.map((mapa: any, idx: number) => (
                            <button
                              key={mapa.id}
                              onClick={() => cargarDesdeHistorial(mapa)}
                              className={`w-full text-left px-3 py-2.5 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 transition ${
                                mapa.id === mapaCorporalId ? 'bg-purple-900/30 border-l-2 border-l-purple-500' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">
                                  {idx === 0 ? '⭐ Más reciente' : `Guardado #${historialMapas.length - idx}`}
                                </span>
                                {mapa.id === mapaCorporalId && (
                                  <span className="text-xs text-purple-400">← actual</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {new Date(mapa.updatedAt).toLocaleString('es-CO', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </div>
                              <div className="text-xs text-cyan-400 mt-0.5">
                                {Array.isArray(mapa.zonasMarcadas) ? mapa.zonasMarcadas.length : 0} marcas
                                {mapa.procedimiento && ` · ${mapa.procedimiento.nombreProcedimiento}`}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === 'EDITAR' ? 'VISTA' : 'EDITAR')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition ${
                  mode === 'EDITAR'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {mode === 'EDITAR' ? '✓ Editar' : '✎ Editar'}
              </motion.button>

              {mode === 'EDITAR' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMarks([]);
                    autoSaveMapaCorporal([]);
                  }}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition"
                >
                  🗑️ Limpiar
                </motion.button>
              )}

              {saving ? (
                <span className="px-2 py-1 rounded-full bg-blue-900/30 border border-blue-600/50 text-blue-300 text-xs animate-pulse">
                  💾 Guardando...
                </span>
              ) : mapaCorporalId ? (
                <span className="px-2 py-1 rounded-full bg-green-900/30 border border-green-600/50 text-green-300 text-xs">
                  ✅ Guardado
                </span>
              ) : null}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CONTENIDO PRINCIPAL - Grid 2 columnas */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!pacienteId ? (
          /* ── Sin paciente: pantalla de bienvenida ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">🩺</div>
              <h2 className="text-xl font-bold text-white">Mapa Corporal 360°</h2>
              <p className="text-gray-400 text-sm max-w-xs">
                Busca y selecciona un paciente en la barra superior para visualizar o registrar su mapa corporal.
              </p>
              <p className="text-yellow-500 text-xs animate-pulse">↑ Usa el buscador de arriba</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-4xl animate-spin">⏳</div>
              <p className="text-gray-400 text-sm">Cargando mapa de {pacienteNombreDisplay}…</p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:flex-1 lg:overflow-hidden">
          {/* COLUMNA 1: Selector de Procedimiento + Intensidad */}
          <motion.div className="bg-slate-900/60 border border-slate-700/30 rounded-lg p-3 flex flex-col gap-2 overflow-y-auto max-h-[55vh] lg:max-h-none">
            {/* Tipo de Marca - Tarjetas de acceso rápido */}
            <div>
              <label className="text-xs font-bold text-yellow-400 block mb-1.5">PROCEDIMIENTO</label>
              <div className="grid grid-cols-2 gap-1">
                {marcasTipos.map((tipo) => (
                  <motion.button
                    key={tipo.tipo}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => mode === 'EDITAR' && setSelectedTipo(tipo.tipo as Mark['tipo'])}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                      selectedTipo === tipo.tipo
                        ? `bg-gradient-to-r ${tipo.color} text-white shadow-md ring-1 ring-white/20`
                        : 'bg-slate-800/80 hover:bg-slate-700 text-gray-300 border border-slate-600/50'
                    } ${mode !== 'EDITAR' ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="text-base leading-none">{tipo.icon}</span>
                    <span className="font-medium leading-tight truncate">{tipo.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Intensidad */}
            {mode === 'EDITAR' && (
              <div>
                <label className="text-xs font-bold text-cyan-400 block mb-1">INTENSIDAD: {intensidadActual}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensidadActual}
                  onChange={(e) => setIntensidadActual(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Registros Activos */}
            <div>
              <label className="text-xs font-bold text-purple-400 block mb-1">REGISTROS ({marks.length})</label>
              <div className="space-y-1 overflow-y-auto max-h-28">
                {marks.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-3">Sin registros</p>
                ) : (
                  marks.map((mark) => {
                    const config = getMarkConfig(mark.tipo);
                    return (
                      <div
                        key={mark.id}
                        className="bg-slate-800 border-l-2 rounded px-2 py-1 text-xs flex justify-between items-center hover:bg-slate-700"
                        style={{ borderLeftColor: config.solidColor || '#d4af37' }}
                      >
                        <div>
                          <p className="font-bold text-white">{config.label}</p>
                          <p className="text-gray-400 text-xs">{mark.zona} • Int: {mark.intensidad}</p>
                        </div>
                        {mode === 'EDITAR' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeMark(mark.id)}
                            className="p-1 hover:bg-red-600/30 rounded text-red-400"
                          >
                            ✕
                          </motion.button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Evolución */}
            <div className="border-t border-slate-700/50 pt-2">
              <label className="text-xs font-bold text-emerald-400 block mb-1">📋 EVOLUCIÓN</label>
              <textarea
                value={evolucionForm.observacionesFrontal}
                onChange={(e) => {
                  setEvolucionForm(prev => ({ ...prev, observacionesFrontal: e.target.value }));
                  autoSaveEvolucion(e.target.value, evolucionForm.recomendaciones);
                }}
                rows={3}
                placeholder="Registrar evolución del tratamiento..."
                className="w-full bg-slate-700/80 border border-slate-600 focus:border-emerald-500 text-white rounded px-2 py-1.5 text-xs outline-none resize-y placeholder-gray-500 transition min-h-[60px]"
              />
            </div>

            {/* Recomendaciones */}
            <div>
              <label className="text-xs font-bold text-blue-400 block mb-1.5">💡 RECOMENDACIONES QUIRÚRGICAS</label>
              {/* Chips predefinidos — clic para agregar/quitar */}
              <div className="flex flex-wrap gap-1 mb-1.5">
                {RECOMENDACIONES_PREDEFINIDAS.map((rec, i) => {
                  const isSelected = evolucionForm.recomendaciones.includes(rec);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const current = evolucionForm.recomendaciones;
                        let newVal: string;
                        if (isSelected) {
                          // Quitar la recomendación del texto
                          newVal = current
                            .replace('\n• ' + rec, '')
                            .replace('• ' + rec, '')
                            .trim();
                        } else {
                          // Agregar la recomendación
                          newVal = current ? current + '\n• ' + rec : '• ' + rec;
                        }
                        setEvolucionForm(prev => ({ ...prev, recomendaciones: newVal }));
                        autoSaveEvolucion(evolucionForm.observacionesFrontal, newVal);
                      }}
                      className={`px-1.5 py-0.5 border text-[10px] rounded-full transition cursor-pointer leading-tight font-semibold ${
                        isSelected
                          ? 'bg-emerald-700/70 hover:bg-red-700/70 border-emerald-500/70 text-emerald-200 hover:text-red-200 hover:border-red-500/70'
                          : 'bg-blue-900/40 hover:bg-blue-700/60 border-blue-600/40 text-blue-300'
                      }`}
                      title={isSelected ? 'Clic para eliminar' : 'Clic para agregar'}
                    >
                      {isSelected ? '− ' : '+ '}{rec}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={evolucionForm.recomendaciones}
                onChange={(e) => {
                  setEvolucionForm(prev => ({ ...prev, recomendaciones: e.target.value }));
                  autoSaveEvolucion(evolucionForm.observacionesFrontal, e.target.value);
                }}
                rows={3}
                placeholder="Recomendaciones para el paciente..."
                className="w-full bg-slate-700/80 border border-slate-600 focus:border-blue-500 text-white rounded px-2 py-1.5 text-xs outline-none resize-y placeholder-gray-500 transition min-h-[60px]"
              />
            </div>
          </motion.div>

          {/* COLUMNAS 2+3: Vistas corporales con filtro por pestaña */}
          <motion.div className="lg:col-span-2 bg-slate-900/60 border border-slate-700/30 rounded-lg p-2 flex flex-col gap-2 min-h-[360px] lg:min-h-0 lg:overflow-hidden">
            {/* Tabs de vista */}
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              <span className="text-xs text-gray-400 mr-1">👆 Haz clic en zonas</span>
              {(['FRONTAL','LATERAL','TODAS'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView360(v as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    view360 === v
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                      : 'bg-slate-700/80 text-gray-300 hover:bg-slate-600 border border-slate-600/50'
                  }`}
                >
                  {v === 'FRONTAL' ? '⊞ Frontal' : v === 'LATERAL' ? '⊞ Lateral' : '⊞ Todas'}
                </button>
              ))}
            </div>

            {/* TODAS: 4 columnas en fila (2 en móvil) */}
            {view360 === 'TODAS' && (
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 overflow-hidden min-h-0">
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[160px] lg:min-h-0">
                  <BodyViewSVG viewLabel="FRONTAL" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                </div>
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[160px] lg:min-h-0">
                  <BodyViewSVG viewLabel="POSTERIOR" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                </div>
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[160px] lg:min-h-0">
                  <BodyViewSVG viewLabel="LATERAL IZQ" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                </div>
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[160px] lg:min-h-0">
                  <BodyViewSVG viewLabel="LATERAL DER" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} />
                </div>
              </div>
            )}

            {/* FRONTAL: Frontal + Posterior juntos */}
            {(view360 === 'FRONTAL' || view360 === 'POSTERIOR') && (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden min-h-0">
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[280px] sm:min-h-0">
                  <BodyViewSVG viewLabel="FRONTAL" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize />
                </div>
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[280px] sm:min-h-0">
                  <BodyViewSVG viewLabel="POSTERIOR" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize />
                </div>
              </div>
            )}

            {/* LATERAL: IZQ + DER lado a lado grandes */}
            {view360 === 'LATERAL' && (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden min-h-0">
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[280px] sm:min-h-0">
                  <BodyViewSVG viewLabel="LATERAL IZQ" isBack={false} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize />
                </div>
                <div className="bg-slate-800/80 rounded-lg overflow-hidden flex flex-col min-h-[280px] sm:min-h-0">
                  <BodyViewSVG viewLabel="LATERAL DER" isBack={true} marks={marks} mode={mode} handleBodyClick={handleBodyClick} getMarkConfig={getMarkConfig} fullSize />
                </div>
              </div>
            )}
          </motion.div>
        </div>
        )} {/* fin ternario pacienteId / loading / mapa */}
      </div>
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Procedimiento Duplicado */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showDuplicateModal && pendingMark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowDuplicateModal(false);
                setPendingMark(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-slate-900 border-2 border-yellow-600/50 rounded-2xl shadow-2xl max-w-sm w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-900/50 border-2 border-yellow-600/50 flex items-center justify-center">
                    <AlertTriangle size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Procedimiento Duplicado</h3>
                    <p className="text-gray-400 text-xs">En la misma zona</p>
                  </div>
                </div>

                {/* Mensaje */}
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-300 text-sm">
                    Ya existe un registro de <span className="font-bold">{duplicateType}</span> en <span className="font-bold">{pendingMark.zona}</span>.
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    ¿Qué deseas hacer?
                  </p>
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  {/* Opción 1: Cancelar */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDuplicateModal(false);
                      setPendingMark(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition text-center"
                  >
                    ❌ Cancelar
                  </motion.button>

                  {/* Opción 2: Eliminar anterior */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDuplicateAction('delete')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-semibold transition text-center"
                  >
                    🗑️ Eliminar el anterior
                  </motion.button>

                  {/* Opción 3: Reemplazar por otro procedimiento */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300 block">🔄 Reemplazar por otro procedimiento:</label>
                    <select
                      value={replacementTipo || ''}
                      onChange={(e) => setReplacementTipo(e.target.value as Mark['tipo'])}
                      className="w-full bg-slate-700 border border-slate-600 focus:border-amber-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition"
                    >
                      <option value="">-- Seleccionar procedimiento --</option>
                      {marcasTipos.map((tipo) => (
                        <option key={tipo.tipo} value={tipo.tipo}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDuplicateAction('replace')}
                      disabled={!replacementTipo}
                      className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-semibold transition text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✅ Reemplazar procedimiento
                    </motion.button>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-gray-500 text-xs text-center">
                    Los cambios se guardarán automáticamente
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
  handleBodyClick: (zone: { name: string; x: number; y: number }, vista: 'FRONTAL' | 'POSTERIOR' | 'LATERAL_IZQ' | 'LATERAL_DER') => void;
  getMarkConfig: (tipo: Mark['tipo']) => any;
  fullSize?: boolean;
}

function BodyViewSVG({ viewLabel, isBack = false, marks, mode, handleBodyClick, getMarkConfig, fullSize = false }: BodyViewSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determinar la vista actual (FRONTAL, POSTERIOR, LATERAL_IZQ, LATERAL_DER)
  const getVistaActual = (): 'FRONTAL' | 'POSTERIOR' | 'LATERAL_IZQ' | 'LATERAL_DER' => {
    if (viewLabel.includes('LATERAL IZQ')) return 'LATERAL_IZQ';
    if (viewLabel.includes('LATERAL DER')) return 'LATERAL_DER';
    if (isBack) return 'POSTERIOR';
    return 'FRONTAL';
  };

  const vistaActual = getVistaActual();

  // Imagen según vista — importadas desde src/pages/images/
  const imageUrl = (() => {
    if (viewLabel.includes('LATERAL IZQ')) return bodyLeftImg;
    if (viewLabel.includes('LATERAL DER')) return bodyRightImg;
    if (isBack) return bodyBackImg;
    return bodyFrontImg;
  })();

  // Filtrar marcas que pertenecen a esta vista
  const marksDelVistaActual = marks.filter(m => m.vista === vistaActual);

  // Coordenadas directas: la marca se renderiza en el mismo punto donde el usuario hizo clic
  const getCoordTransformada = (mark: Mark): { x: number; y: number } => {
    return { x: mark.posicionX, y: mark.posicionY };
  };

  const detectZona = (x: number, y: number): string => {
    // Con object-fill la imagen llena el viewBox completo (0-300 × 0-580)
    // Umbrales calibrados sobre el cuerpo real en los PNG

    // === VISTA LATERAL ===
    if (viewLabel.includes('LATERAL')) {
      if (y < 75)  return 'Cabeza';
      if (y < 112) return 'Cuello';
      if (y < 260) return 'Torso';
      if (y < 348) return 'Abdomen';
      if (y < 455) return 'Muslo';
      return 'Pantorrilla';
    }

    // === VISTA FRONTAL / POSTERIOR ===
    // Cabeza (~0-13 % de altura = 0-75)
    if (y < 75)  return 'Cabeza';
    // Cuello (~13-20 % = 75-115)
    if (y < 115) return 'Cuello';
    // Hombros / clavícula (~20-25 % = 115-145)
    if (y < 145) return x < 82 ? 'Hombro Izquierdo' : x > 218 ? 'Hombro Derecho' : 'Clavícula';
    // Torso superior + brazos (~25-55 % = 145-320)
    if (y < 320) {
      // Brazos a los lados del torso
      if (x < 65 || x > 235) return x < 150 ? 'Brazo Izquierdo' : 'Brazo Derecho';
      // Zona pecho (solo vista frontal)
      if (!isBack && y < 240) {
        if (x < 143) return 'Mama Izquierda';
        if (x > 157) return 'Mama Derecha';
        return 'Pecho';
      }
      return isBack ? 'Espalda Superior' : 'Abdomen Superior';
    }
    // Abdomen bajo / espalda baja (~55-60 % = 320-348)
    if (y < 348) return isBack ? 'Espalda Baja' : 'Abdomen';
    // Pelvis / cadera (~60-70 % = 348-406)
    if (y < 406) return 'Pelvis / Cadera';
    // Muslos (~70-78 % = 406-452)
    if (y < 452) return x < 150 ? 'Muslo Izquierdo' : 'Muslo Derecho';
    // Piernas (~78-92 % = 452-534)
    if (y < 534) return x < 150 ? 'Pierna Izquierda' : 'Pierna Derecha';
    // Pies (~92-100 % = 534-580)
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
    // Pasar la vista actual a handleBodyClick
    handleBodyClick(
      { name: detectZona(svgP.x, svgP.y), x: Math.round(svgP.x), y: Math.round(svgP.y) },
      vistaActual
    );
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      {/* Título compacto */}
      <p className="shrink-0 text-white font-semibold text-xs tracking-wide text-center py-1 px-2">
        {viewLabel}
        {mode === 'EDITAR' && <span className="text-yellow-400 ml-1">👆 clic</span>}
      </p>
      {/* Contenedor relativo que llena todo el espacio restante */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full"
      >
        {/* Imagen fotorealista de fondo */}
        <img
          src={imageUrl}
          alt={viewLabel}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.7))' }}
        />
        {/* SVG transparente encima para capturar clics y renderizar marcas */}
        <svg
          ref={svgRef}
          viewBox="0 0 300 580"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSVGClick}
          className="absolute inset-0 w-full h-full"
          style={{
            cursor: mode === 'EDITAR' ? 'crosshair' : 'default',
            background: 'transparent',
            pointerEvents: mode === 'EDITAR' ? 'all' : 'none',
          }}
        >
          {/* ── Marcas (solo de esta vista) ── */}
          {marksDelVistaActual.map((mark) => {
            const color = MARK_COLORS[mark.tipo] ?? '#6366f1';
            const { x, y } = getCoordTransformada(mark);
            return (
              <g key={mark.id}>
                {/* Halo */}
                <circle cx={x} cy={y} r={20} fill={color} opacity={0.2} />
                {/* Círculo principal */}
                <circle
                  cx={x}
                  cy={y}
                  r={13}
                  fill={color}
                  stroke="white"
                  strokeWidth="2.5"
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
                {/* Número intensidad */}
                <text
                  x={x}
                  y={y + 5}
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
