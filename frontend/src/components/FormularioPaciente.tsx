import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, User, Upload, Video, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  OPCIONES PARAMETRIZABLES
// ─────────────────────────────────────────────────────────────────────────────
export const TIPOS_DOCUMENTO = [
  { value: 'CC',  label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI',  label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE',  label: 'Cédula de Extranjería (CE)' },
  { value: 'PA',  label: 'Pasaporte (PA)' },
  { value: 'RC',  label: 'Registro Civil (RC)' },
  { value: 'NIT', label: 'NIT' },
];
export const GENEROS_BIOLOGICOS = [
  { value: 'M',           label: 'Masculino' },
  { value: 'F',           label: 'Femenino' },
  { value: 'Intersexual', label: 'Intersexual' },
];
export const GENEROS_SENTIDOS = [
  { value: 'Masculino',  label: 'Masculino' },
  { value: 'Femenino',   label: 'Femenino' },
  { value: 'NoConforme', label: 'No Binario / No Conforme' },
  { value: 'Otro',       label: 'Otro' },
];
export const ESTADOS_CIVILES = [
  { value: 'Soltero',    label: 'Soltero/a' },
  { value: 'Casado',     label: 'Casado/a' },
  { value: 'Union',      label: 'Unión Libre' },
  { value: 'Divorciado', label: 'Divorciado/a' },
  { value: 'Separado',   label: 'Separado/a' },
  { value: 'Viudo',      label: 'Viudo/a' },
];
export const GRUPOS_ETNICOS = [
  { value: 'Mestizo',          label: 'Mestizo' },
  { value: 'Afrodescendiente', label: 'Afrodescendiente' },
  { value: 'Indigena',         label: 'Indígena' },
  { value: 'Blanco',           label: 'Blanco' },
  { value: 'Raizal',           label: 'Raizal' },
  { value: 'Palenquero',       label: 'Palenquero' },
  { value: 'ROM',              label: 'ROM / Gitano' },
  { value: 'Otros',            label: 'Otros' },
];
export const NIVELES_EDUCACION = [
  { value: 'Ninguno',    label: 'Ninguno' },
  { value: 'Primaria',   label: 'Primaria' },
  { value: 'Secundaria', label: 'Secundaria' },
  { value: 'Tecnico',    label: 'Técnico / Tecnólogo' },
  { value: 'Pregrado',   label: 'Pregrado / Universitario' },
  { value: 'Postgrado',  label: 'Posgrado / Especialización' },
  { value: 'Doctorado',  label: 'Maestría / Doctorado' },
];
export const ORIENTACIONES_SEXUALES = [
  { value: 'Heterosexual', label: 'Heterosexual' },
  { value: 'Homosexual',   label: 'Homosexual' },
  { value: 'Bisexual',     label: 'Bisexual' },
  { value: 'Asexual',      label: 'Asexual' },
  { value: 'Otro',         label: 'Otro' },
];
export const DISCAPACIDADES = [
  { value: 'No',        label: 'No presenta discapacidad' },
  { value: 'Auditiva',  label: 'Auditiva' },
  { value: 'Visual',    label: 'Visual' },
  { value: 'Motriz',    label: 'Motriz / Física' },
  { value: 'Cognitiva', label: 'Cognitiva / Intelectual' },
  { value: 'Multiple',  label: 'Múltiple' },
  { value: 'Si',        label: 'Sí (otro tipo)' },
];
export const TIPOS_CONSULTA = [
  { value: 'INICIAL',       label: 'Consulta Inicial' },
  { value: 'SEGUIMIENTO',   label: 'Seguimiento' },
  { value: 'CONTROL',       label: 'Control' },
  { value: 'URGENCIA',      label: 'Urgencia' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
];
export const FORMAS_ASIGNACION = [
  { value: 'Directa',    label: 'Asignación Directa' },
  { value: 'Referencia', label: 'Por Referencia Médica' },
  { value: 'Agenda',     label: 'Por Agenda / Web' },
  { value: 'Espontanea', label: 'Demanda Espontánea' },
  { value: 'Remision',   label: 'Remisión de otra IPS' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────────────────────────────────────
export interface PacienteData {
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
  pacienteInicial?: Partial<PacienteData>;
  modoEdicion?: boolean;
}

const REQUERIDOS: (keyof PacienteData)[] = [
  'tipoDocumento', 'numeroDocumento',
  'primerNombre', 'apellidoPaterno', 'apellidoMaterno',
  'fechaNacimiento', 'generoBiologico', 'estadoCivil',
  'numeroCelular', 'correoElectronico',
  'tipoConsulta', 'formaAsignacion', 'notasPaciente',
];

// ─────────────────────────────────────────────────────────────────────────────
//  ESTILOS COMPARTIDOS
// ─────────────────────────────────────────────────────────────────────────────
const INP =
  'w-full bg-slate-900 text-white text-sm px-3.5 py-2.5 rounded-lg ' +
  'border border-slate-700/60 hover:border-slate-600 ' +
  'focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/8 ' +
  'transition-all placeholder-slate-600';

const SEL =
  'w-full bg-slate-900 text-white text-sm px-3.5 py-2.5 rounded-lg ' +
  'border border-slate-700/60 hover:border-slate-600 ' +
  'focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/8 ' +
  'transition-all cursor-pointer';

// Label + campo
function Campo({ label, req, span, children }: {
  label: string; req?: boolean; span?: '2' | '3'; children: React.ReactNode;
}) {
  const colSpan = span === '2' ? 'sm:col-span-2' : span === '3' ? 'sm:col-span-3' : '';
  return (
    <div className={colSpan}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}
        {req && <span className="text-yellow-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// Select helper
function Opt({ name, value, onChange, opts, req, ph = 'Seleccionar...' }: {
  name: string; value: string; req?: boolean; ph?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  opts: { value: string; label: string }[];
}) {
  return (
    <select name={name} value={value} onChange={onChange} required={req} className={SEL}>
      <option value="">{ph}</option>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Tarjeta de sección
function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
      {/* cabecera de sección */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/30">
        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-amber-500" />
        <span className="text-xs font-bold text-yellow-400/80 uppercase tracking-widest">{titulo}</span>
      </div>
      {/* cuerpo */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function FormularioPaciente({
  onClose, onSubmit,
  titulo = 'Registro de Paciente',
  pacienteInicial,
  modoEdicion = false,
}: FormularioPacienteProps) {
  const [error, setError] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [camaraError, setCamaraError] = useState('');
  const [omonimos, setOmonimos] = useState<any[]>([]);
  const [omonimosRevisados, setOmonimosRevisados] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const abrirCamara = async () => {
    setCamaraError('');
    setCamaraAbierta(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCamaraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  const cerrarCamara = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamaraAbierta(false);
    setCamaraError('');
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setFoto(canvas.toDataURL('image/jpeg', 0.85));
    cerrarCamara();
  };

  // Limpiar stream al desmontar
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const [d, setD] = useState<PacienteData>({
    tipoDocumento: '', numeroDocumento: '',
    primerNombre: '', segundoNombre: '',
    apellidoPaterno: '', apellidoMaterno: '',
    fechaNacimiento: '', edadCalculada: 0,
    lugarNacimiento: '', domicilioActual: '',
    barrioSector: '', telefonoFijo: '',
    numeroCelular: '', ciudadResidencia: '',
    correoElectronico: '', profesionOcupacion: '',
    direccionTrabajo: '', telefonoLaboral: '',
    generoBiologico: '', generoSentido: '',
    estadoCivil: '', tipoConsulta: '',
    grupoEtnico: '', creenciaReligiosa: '',
    nivelEducacion: '', orientacionSexual: '',
    discapacidadDiagnosticada: '', entidadSalud: '',
    notasPaciente: '', formaAsignacion: '',
    observacionesAdicionales: '',
    ...pacienteInicial,
  });

  const calcularEdad = (f: string) => {
    if (!f) return 0;
    const h = new Date(); const n = new Date(f);
    let e = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--;
    return e;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // ── Sanitización por tipo de campo ──
    let v = value;

    const esNombre = ['primerNombre', 'segundoNombre', 'apellidoPaterno', 'apellidoMaterno',
      'lugarNacimiento', 'ciudadResidencia', 'barrioSector',
      'profesionOcupacion', 'entidadSalud', 'creenciaReligiosa'].includes(name);
    const esDocumento = name === 'numeroDocumento';
    const esTelefono = ['numeroCelular', 'telefonoFijo', 'telefonoLaboral'].includes(name);
    const esDireccion = ['domicilioActual', 'direccionTrabajo'].includes(name);

    if (esNombre) {
      v = v
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-']/g, '') // solo letras, espacios, guión, apóstrofo
        .replace(/^\s+/, '')                              // sin espacio al inicio
        .replace(/\s{2,}/g, ' ');                         // sin espacios dobles en el medio
    } else if (esDocumento) {
      v = v.replace(/[^a-zA-Z0-9]/g, '');               // solo alfanumérico, sin espacios
    } else if (esTelefono) {
      v = v.replace(/[^0-9+\-()\s]/g, '')
        .replace(/^\s+/, '')
        .replace(/\s{2,}/g, ' ');
    } else if (esDireccion) {
      v = v
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-#\.,]/g, '')
        .replace(/^\s+/, '')
        .replace(/\s{2,}/g, ' ');
    }

    setD(prev => {
      const next = { ...prev, [name]: v };
      if (name === 'fechaNacimiento') next.edadCalculada = calcularEdad(v);
      return next;
    });
    setError('');
  };

  // Trim final al salir del campo (quitar espacios al final)
  const onBlurTrim = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const trimmed = value.trimEnd();
    if (trimmed !== value) setD(prev => ({ ...prev, [name]: trimmed }));
  };

  const onFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setFoto(ev.target?.result as string);
    r.readAsDataURL(file);
  };

  // Verificar homónimos por nombre cuando se completan los apellidos
  const verificarOmonimosNombre = async (datos: PacienteData) => {
    const nombre = [datos.primerNombre, datos.apellidoPaterno].filter(Boolean).join(' ').trim();
    if (nombre.length < 4) return;
    try {
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(
        `/api/pacientes/verificar-duplicados?nombre=${encodeURIComponent(nombre)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const encontrados: any[] = data.mismoNombre ?? [];
      // Excluir si estamos editando el mismo paciente (por documento)
      const filtrados = encontrados.filter(
        p => !(p.numeroDocumento === datos.numeroDocumento && p.tipoDocumento === datos.tipoDocumento)
      );
      setOmonimos(filtrados);
      if (filtrados.length > 0) setOmonimosRevisados(false);
    } catch {
      // Silenciar errores de red — no bloquear el formulario
    }
  };

  const onBlurApellido = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlurTrim(e);
    // Usamos el estado más reciente via callback para garantizar el valor ya trimmeado
    setD(prev => {
      verificarOmonimosNombre(prev);
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const falta = REQUERIDOS.filter(k => !String(d[k]).trim());
    if (falta.length) { setError('Completa todos los campos obligatorios marcados con *'); return; }
    if (omonimos.length > 0 && !omonimosRevisados) {
      setError('Revisa los posibles homónimos antes de guardar. Confirma que no es un paciente ya registrado.');
      return;
    }
    onSubmit(d);
  };

  const nombrePreview = [d.primerNombre, d.apellidoPaterno].filter(Boolean).join(' ') || 'Nuevo Paciente';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={e => e.stopPropagation()}
        className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden"
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600 flex-shrink-0" />
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{titulo}</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {modoEdicion
                  ? 'Revisa y confirma los datos antes de agendar'
                  : 'Complete el formulario — los campos marcados con * son obligatorios'}
              </p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-all">
            <X size={18} />
          </motion.button>
        </div>

        {/* ═══ CUERPO CON 2 COLUMNAS ═══ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── PANEL FOTO (izquierdo fijo) ── */}
          <div className="flex-shrink-0 w-44 bg-slate-900 border-r border-slate-800 flex flex-col items-center pt-8 pb-6 px-4 gap-5">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Preview */}
              <div className="relative w-28 h-28 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
                {foto
                  ? <img src={foto} alt="Foto" className="w-full h-full object-cover" />
                  : <User size={38} className="text-slate-600" />
                }
                {foto && (
                  <motion.button
                    whileTap={{ scale: 0.9 }} type="button"
                    onClick={() => setFoto(null)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition-all">
                    <X size={12} />
                  </motion.button>
                )}
              </div>

              {/* Dos botones */}
              <div className="w-full space-y-1.5">
                <motion.button whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all">
                  <Upload size={13} />
                  Cargar imagen
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} type="button"
                  onClick={abrirCamara}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs font-medium transition-all">
                  <Camera size={13} />
                  Usar cámara
                </motion.button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFoto} />
            </div>
            <p className="text-xs text-slate-600 text-center">Foto del paciente</p>

            {/* ── MODAL CÁMARA ── */}
            <AnimatePresence>
              {camaraAbierta && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                    className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden w-full max-w-lg"
                  >
                    {/* Header cámara */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-yellow-400" />
                        <span className="text-sm font-semibold text-white">Capturar foto</span>
                      </div>
                      <button type="button" onClick={cerrarCamara}
                        className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all">
                        <X size={16} />
                      </button>
                    </div>

                    {/* Video / error */}
                    <div className="relative bg-black">
                      {camaraError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
                          <Camera size={40} className="text-slate-600" />
                          <p className="text-red-400 text-sm">{camaraError}</p>
                          <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={abrirCamara}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all">
                            <RefreshCw size={14} /> Reintentar
                          </motion.button>
                        </div>
                      ) : (
                        <video
                          ref={videoRef}
                          autoPlay playsInline muted
                          className="w-full aspect-video object-cover"
                        />
                      )}
                    </div>

                    {/* Canvas oculto para captura */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Acciones cámara */}
                    {!camaraError && (
                      <div className="flex items-center justify-center gap-3 px-5 py-4">
                        <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={cerrarCamara}
                          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all border border-slate-700">
                          Cancelar
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={capturarFoto}
                          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-sm shadow-lg shadow-yellow-900/30 transition-all">
                          <Camera size={16} />
                          Tomar foto
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resumen dinámico */}
            <div className="w-full space-y-2 mt-auto">
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Paciente</p>
                <p className="text-sm font-bold text-white leading-snug break-words">{nombrePreview}</p>
              </div>
              {d.tipoDocumento && d.numeroDocumento && (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Documento</p>
                  <p className="text-xs font-bold text-yellow-400">{d.tipoDocumento} {d.numeroDocumento}</p>
                </div>
              )}
              {d.edadCalculada > 0 && (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Edad</p>
                  <p className="text-lg font-bold text-white leading-none">
                    {d.edadCalculada} <span className="text-xs text-slate-400 font-normal">años</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── FORMULARIO (derecho con scroll) ── */}
          <form id="form-pac" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-4">

              {/* ──────────────── SECCIÓN 1: IDENTIFICACIÓN ──────────────── */}
              <Seccion titulo="Identificación">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Campo label="Tipo de Documento" req>
                    <Opt name="tipoDocumento" value={d.tipoDocumento} onChange={onChange}
                      opts={TIPOS_DOCUMENTO} req />
                  </Campo>
                  <Campo label="Número de Documento" req span="2">
                    <input type="text" name="numeroDocumento" value={d.numeroDocumento} onChange={onChange}
                      placeholder="Ej: 1012345678" required className={INP} />
                  </Campo>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                  <Campo label="Primer Nombre" req>
                    <input type="text" name="primerNombre" value={d.primerNombre} onChange={onChange}
                      onBlur={onBlurApellido}
                      placeholder="Ej: María" required className={INP} />
                  </Campo>
                  <Campo label="Segundo Nombre">
                    <input type="text" name="segundoNombre" value={d.segundoNombre} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Opcional" className={INP} />
                  </Campo>
                  <Campo label="Primer Apellido" req>
                    <input type="text" name="apellidoPaterno" value={d.apellidoPaterno} onChange={onChange}
                      onBlur={onBlurApellido}
                      placeholder="Ej: García" required className={INP} />
                  </Campo>
                  <Campo label="Segundo Apellido" req>
                    <input type="text" name="apellidoMaterno" value={d.apellidoMaterno} onChange={onChange}
                      onBlur={onBlurApellido}
                      placeholder="Ej: López" required className={INP} />
                  </Campo>
                </div>

                {/* ── PANEL HOMÓNIMOS POR NOMBRE ── */}
                <AnimatePresence>
                  {omonimos.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-xl border border-red-500/40 bg-red-900/10 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-900/25 border-b border-red-500/20">
                        <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                        <span className="text-red-300 text-xs font-bold uppercase tracking-wide flex-1">
                          Posible homónimo detectado — paciente con mismo nombre ya registrado
                        </span>
                        {omonimosRevisados && (
                          <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle size={12} /> Revisado
                          </span>
                        )}
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <p className="text-red-200/70 text-xs mb-2">
                          Se encontr{omonimos.length === 1 ? 'ó' : 'aron'} <strong>{omonimos.length}</strong> paciente
                          {omonimos.length > 1 ? 's' : ''} con nombre similar. Verifica que no estés registrando
                          un paciente que ya existe.
                        </p>
                        {omonimos.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-red-800/40 flex items-center justify-center flex-shrink-0">
                              <User size={14} className="text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{p.nombreCompleto}</p>
                              <p className="text-slate-400 text-xs">
                                {p.tipoDocumento} {p.numeroDocumento}
                                {p.fechaNacimiento && ` · Nac: ${new Date(p.fechaNacimiento).toLocaleDateString('es-CO')}`}
                              </p>
                            </div>
                          </div>
                        ))}
                        {!omonimosRevisados && (
                          <button
                            type="button"
                            onClick={() => setOmonimosRevisados(true)}
                            className="w-full mt-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-all"
                          >
                            He revisado — confirmo que es un paciente diferente, continuar registro
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <Campo label="Fecha de Nacimiento" req>
                    <input type="date" name="fechaNacimiento" value={d.fechaNacimiento} onChange={onChange}
                      required className={INP} />
                  </Campo>
                  <Campo label="Edad (calculada automáticamente)">
                    <input type="number" value={d.edadCalculada} disabled
                      className="w-full bg-slate-900/40 text-slate-500 text-sm px-3.5 py-2.5 rounded-lg border border-slate-700/30 cursor-not-allowed" />
                  </Campo>
                  <Campo label="Lugar de Nacimiento">
                    <input type="text" name="lugarNacimiento" value={d.lugarNacimiento} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ciudad / Municipio" className={INP} />
                  </Campo>
                </div>
              </Seccion>

              {/* ──────────────── SECCIÓN 2: DATOS PERSONALES ──────────────── */}
              <Seccion titulo="Datos Personales">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Campo label="Género Biológico" req>
                    <Opt name="generoBiologico" value={d.generoBiologico} onChange={onChange}
                      opts={GENEROS_BIOLOGICOS} req />
                  </Campo>
                  <Campo label="Identidad de Género">
                    <Opt name="generoSentido" value={d.generoSentido} onChange={onChange}
                      opts={GENEROS_SENTIDOS} ph="No especifica" />
                  </Campo>
                  <Campo label="Orientación Sexual">
                    <Opt name="orientacionSexual" value={d.orientacionSexual} onChange={onChange}
                      opts={ORIENTACIONES_SEXUALES} ph="No especifica" />
                  </Campo>
                  <Campo label="Estado Civil" req>
                    <Opt name="estadoCivil" value={d.estadoCivil} onChange={onChange}
                      opts={ESTADOS_CIVILES} req />
                  </Campo>
                  <Campo label="Grupo Étnico">
                    <Opt name="grupoEtnico" value={d.grupoEtnico} onChange={onChange}
                      opts={GRUPOS_ETNICOS} />
                  </Campo>
                  <Campo label="Nivel de Educación">
                    <Opt name="nivelEducacion" value={d.nivelEducacion} onChange={onChange}
                      opts={NIVELES_EDUCACION} />
                  </Campo>
                  <Campo label="Discapacidad Diagnosticada">
                    <Opt name="discapacidadDiagnosticada" value={d.discapacidadDiagnosticada} onChange={onChange}
                      opts={DISCAPACIDADES} />
                  </Campo>
                  <Campo label="Creencia Religiosa">
                    <input type="text" name="creenciaReligiosa" value={d.creenciaReligiosa} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Opcional" className={INP} />
                  </Campo>
                </div>
              </Seccion>

              {/* ──────────────── SECCIÓN 3: CONTACTO ──────────────── */}
              <Seccion titulo="Contacto y Dirección">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Campo label="Celular" req>
                    <input type="tel" name="numeroCelular" value={d.numeroCelular} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ej: 3001234567" required className={INP} />
                  </Campo>
                  <Campo label="Teléfono Fijo">
                    <input type="text" name="telefonoFijo" value={d.telefonoFijo} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ej: 6012345678" className={INP} />
                  </Campo>
                  <Campo label="Correo Electrónico" req>
                    <input type="email" name="correoElectronico" value={d.correoElectronico} onChange={onChange}
                      placeholder="correo@ejemplo.com" required className={INP} />
                  </Campo>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <Campo label="Domicilio Actual" span="2">
                    <input type="text" name="domicilioActual" value={d.domicilioActual} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Calle / Carrera / Número" className={INP} />
                  </Campo>
                  <Campo label="Barrio / Sector">
                    <input type="text" name="barrioSector" value={d.barrioSector} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Nombre del barrio" className={INP} />
                  </Campo>
                  <Campo label="Ciudad de Residencia">
                    <input type="text" name="ciudadResidencia" value={d.ciudadResidencia} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ej: Bogotá" className={INP} />
                  </Campo>
                </div>
              </Seccion>

              {/* ──────────────── SECCIÓN 4: LABORAL & SALUD ──────────────── */}
              <Seccion titulo="Laboral y Salud">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Campo label="Profesión / Ocupación">
                    <input type="text" name="profesionOcupacion" value={d.profesionOcupacion} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ej: Ingeniería, Comercio..." className={INP} />
                  </Campo>
                  <Campo label="Dirección Laboral" span="2">
                    <input type="text" name="direccionTrabajo" value={d.direccionTrabajo} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Dirección empresa / trabajo" className={INP} />
                  </Campo>
                  <Campo label="Teléfono Laboral">
                    <input type="tel" name="telefonoLaboral" value={d.telefonoLaboral} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ej: 6012345678" className={INP} />
                  </Campo>
                  <Campo label="EPS / Entidad de Salud" span="2">
                    <input type="text" name="entidadSalud" value={d.entidadSalud} onChange={onChange}
                      onBlur={onBlurTrim}
                      placeholder="Ej: Sanitas, Nueva EPS, Particular..." className={INP} />
                  </Campo>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Campo label="Tipo de Consulta" req>
                    <Opt name="tipoConsulta" value={d.tipoConsulta} onChange={onChange}
                      opts={TIPOS_CONSULTA} req />
                  </Campo>
                  <Campo label="Vía de Asignación" req>
                    <Opt name="formaAsignacion" value={d.formaAsignacion} onChange={onChange}
                      opts={FORMAS_ASIGNACION} req />
                  </Campo>
                </div>
              </Seccion>

              {/* ──────────────── SECCIÓN 5: OBSERVACIONES ──────────────── */}
              <Seccion titulo="Observaciones">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Campo label="Motivo de Consulta / Notas del Paciente" req>
                    <textarea name="notasPaciente" value={d.notasPaciente} onChange={onChange} required rows={4}
                      onBlur={onBlurTrim}
                      placeholder="Motivo de consulta, antecedentes relevantes, alergias conocidas, medicamentos actuales..."
                      className={`${INP} resize-none`} />
                  </Campo>
                  <Campo label="Observación Interna del Equipo Médico">
                    <textarea name="observacionesAdicionales" value={d.observacionesAdicionales} onChange={onChange} rows={4}
                      onBlur={onBlurTrim}
                      placeholder="Información adicional para el equipo médico (no visible al paciente)..."
                      className={`${INP} resize-none`} />
                  </Campo>
                </div>
              </Seccion>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-900/20 border border-red-500/25 text-red-400 text-sm px-4 py-3 rounded-xl">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </form>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-700/40 bg-slate-900/80">
          <p className="text-xs text-slate-600">
            Los campos marcados con <span className="text-yellow-400 font-bold">*</span> son obligatorios
          </p>
          <div className="flex items-center gap-3">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all border border-slate-700/50">
              Cancelar
            </motion.button>
            <motion.button type="submit" form="form-pac" whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-sm font-bold shadow-lg shadow-yellow-900/20 transition-all">
              <Check size={16} />
              {modoEdicion ? 'Confirmar y Agendar' : 'Guardar Paciente'}
            </motion.button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
