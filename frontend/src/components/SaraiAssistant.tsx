import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SaraiECGIcon from './SaraiECGIcon';

// ─── Constantes de endpoints ──────────────────────────────────────────────────
import { API_BASE_URL as _API_BASE, WHISPER_BASE_URL as _WHISPER } from '../config';
const WHISPER_URL = `${_WHISPER}/transcribir`;
const GEMMA_URL   = `${_API_BASE}/sarai/procesar-voz`;

interface SaraiAssistantProps {
  onCamposDetectados: (campos: Record<string, string>) => void;
  token: string;
  contexto?: string;
  onNavegar?: (pagina: string) => void;
  onAbrirNuevaHistoria?: () => void;   // abre el formulario de nueva HC
  onIrSeccion?: (id: string) => void;  // navega a sección HC por ID del DOM
  onImprimir?: () => void;             // imprime la vista actual
}

// Mapa de comandos de voz → página
// ⚠️ ORDEN IMPORTA: entradas más específicas (con más palabras) deben ir ANTES
//    que las genéricas para evitar que 'agenda' capture 'agenda profesional'.
const COMANDOS_NAV = [
  { palabras: ['dashboard', 'inicio', 'panel principal', 'panel'],                                             pagina: 'dashboard',          label: 'Dashboard' },
  { palabras: ['pacientes', 'lista pacientes', 'lista de pacientes'],                                          pagina: 'pacientes',          label: 'Pacientes' },
  { palabras: ['historia clínica', 'historia clinica', 'historial', 'historia'],                              pagina: 'historia',           label: 'Historia Clínica' },
  // Agenda Profesional ANTES de Agenda para evitar colisión
  { palabras: ['agenda profesional', 'agenda del médico', 'agenda del medico', 'agenda medico'],              pagina: 'agendaProfesional',  label: 'Agenda Profesional' },
  { palabras: ['configurar agenda', 'config agenda', 'configuracion agenda', 'configuración agenda'],         pagina: 'config-agenda',      label: 'Config Agenda' },
  { palabras: ['agenda paciente', 'agenda del paciente', 'agenda', 'citas'],                                  pagina: 'agenda',             label: 'Agenda Paciente' },
  { palabras: ['admisión', 'admision', 'admitir'],                                                            pagina: 'admision',           label: 'Admisión' },
  { palabras: ['quirófano', 'quirofano', 'cirujano', 'vista cirujano', 'sala de cirugía', 'sala cirugia'],   pagina: 'vista-cirujano',     label: 'Quirófano' },
  { palabras: ['seguimiento', 'follow up', 'followup', 'control'],                                            pagina: 'followup',           label: 'Seguimiento' },
  { palabras: ['consentimiento', 'consentimientos', 'consentimiento informado'],                              pagina: 'consentimiento',     label: 'Consentimiento' },
  { palabras: ['crm', 'gestión de relaciones', 'gestion de relaciones'],                                     pagina: 'crm',                label: 'CRM' },
  { palabras: ['facturación', 'facturacion', 'facturas', 'factura'],                                         pagina: 'facturacion',        label: 'Facturación' },
  { palabras: ['plantillas', 'plantilla'],                                                                    pagina: 'plantillas',         label: 'Plantillas' },
  { palabras: ['fotos', 'fotografías', 'fotografias', 'galería', 'galeria'],                                 pagina: 'fotos',              label: 'Fotos' },
  { palabras: ['mapa corporal', 'mapa del cuerpo', 'mapa'],                                                   pagina: 'mapa-corporal',      label: 'Mapa Corporal' },
  { palabras: ['admin', 'administración', 'administracion', 'parametrización', 'parametrizacion', 'sistema'], pagina: 'admin',              label: 'Administración' },
];

// Mapa de secciones de Historia Clínica → IDs del DOM
// ⚠️ Palabras más específicas primero para evitar colisiones
const SECCIONES_HC_VOZ: { palabras: string[]; id: string; label: string }[] = [
  { palabras: ['motivo de consulta', 'motivo', 'queja principal', 'queja'],                            id: 'motivo-consulta', label: 'Motivo de Consulta'    },
  { palabras: ['signos vitales', 'signos', 'vitales', 'presion arterial', 'frecuencia cardiaca'],      id: 'signos-vitales',  label: 'Signos Vitales'        },
  { palabras: ['antecedentes personales', 'antecedentes personales'],                                  id: 'antec-pers',      label: 'Antec. Personales'     },
  { palabras: ['antecedentes familiares', 'familiares', 'familia'],                                    id: 'antec-fam',       label: 'Antec. Familiares'     },
  { palabras: ['gineco', 'ginecologico', 'ginecoobstetrico', 'obstetricia', 'fum', 'menstruacion'],    id: 'antec-gineco',    label: 'Gineco Obstétrico'     },
  { palabras: ['evolucion cirugia', 'evolucion cirugia plastica', 'evolucion estetica', 'postoperatorio', 'postop'], id: 'evolucion-cx', label: 'Evolución Cirugía' },
  { palabras: ['finalidad de atencion', 'finalidad'],                                                  id: 'finalidad',       label: 'Finalidad de Atención' },
  { palabras: ['origen de atencion', 'origen'],                                                        id: 'origen',          label: 'Origen de Atención'    },
  { palabras: ['diagnostico', 'impresion diagnostica', 'cie diez', 'cie10', 'diagnostico principal'],  id: 'diagnostico',     label: 'Diagnóstico'           },
  { palabras: ['plan terapeutico', 'plan', 'conducta', 'tratamiento', 'manejo'],                       id: 'plan',            label: 'Plan Terapéutico'      },
  { palabras: ['recomendaciones', 'recomendacion', 'indicaciones'],                                    id: 'recomendaciones', label: 'Recomendaciones'        },
  { palabras: ['apoyos diagnosticos', 'laboratorio', 'laboratorios', 'examenes', 'imagen diagnostica'], id: 'apoyos-diag',    label: 'Apoyos Diagnósticos'   },
  { palabras: ['procedimientos quirurgicos', 'procedimiento quirurgico', 'procedimiento qx'],          id: 'proc-qx',         label: 'Procedimientos Qx'     },
  { palabras: ['medicamentos', 'formulacion', 'medicamento', 'medicina', 'farmaco'],                   id: 'medicamentos',    label: 'Formulación Meds'      },
  { palabras: ['interconsulta', 'interconsultas', 'especialista', 'especialidad'],                     id: 'interconsulta',   label: 'Interconsulta'         },
];

const PALABRAS_ACTIVACION = ['sarai', 'hey sarai', 'oye sarai', 'grabar', 'iniciar grabación', 'iniciar grabacion', 'escuchar'];

// ⚠️ REGEX CENTRAL — cubre variantes fonéticas del STT español:
//   sarai, sara, saray, sarah, sarahi, sarahy, zarai, sary, sari ...
//   {0,4} = hasta 4 letras extra tras "sara" + word boundary
const MATCH_ACTIVACION_SARAI = /^sara[a-z]{0,4}\b\s*|^(hey|oye|hola)\s+sara[a-z]{0,4}\b\s*/;

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

type Estado = 'esperando' | 'grabando' | 'transcribiendo' | 'procesando' | 'listo' | 'error';

export default function SaraiAssistant({ onCamposDetectados, token, contexto, onNavegar, onAbrirNuevaHistoria, onIrSeccion, onImprimir }: SaraiAssistantProps) {
  const [estado, setEstado]               = useState<Estado>('esperando');
  const [transcripcion, setTranscripcion] = useState('');
  const [resultado, setResultado]         = useState('');
  const [error, setError]                 = useState('');
  const [segundos, setSegundos]           = useState(0);
  const [barras, setBarras]               = useState<number[]>(Array(20).fill(4));
  const [minimizado, setMinimizado]       = useState(true);
  const [vistaMinima, setVistaMinima]     = useState<'icono' | 'pulso'>('pulso');
  const [modoTexto, setModoTexto]         = useState(false);
  const [inputManual, setInputManual]     = useState('');
  const [whisperStatus, setWhisperStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [escuchandoComandos, setEscuchandoComandos] = useState(false);
  const [ultimoComando, setUltimoComando] = useState('');
  const [ultimoSTT, setUltimoSTT] = useState('');  // último texto bruto del STT
  const [estadoComandos, setEstadoComandos] = useState<'idle' | 'starting' | 'active' | 'blocked' | 'unsupported'>('idle');
  const [inputComandoTexto, setInputComandoTexto] = useState(''); // fallback comandos por texto
  // Para hacer el widget arrastrable — persistente en sessionStorage
  // Posicionar junto al panel ONLINE/Disponible del Dashboard (top-right)
  // En pantallas lg+: calcula la x para quedar a la izquierda del panel ONLINE
  // (max-w-7xl=1280px centrado, p-6=24px, panel ONLINE ≈170px)
  const calcPosInicial = () => {
    const w = window.innerWidth;
    if (w >= 1024) {
      const containerW    = Math.min(w, 1280);
      const containerLeft = (w - containerW) / 2;
      const contentRight  = containerLeft + containerW - 24; // p-6
      const onlinePanelW  = 170;
      const saraiW        = 130;
      return {
        x: Math.max(0, contentRight - onlinePanelW - 10 - saraiW),
        y: 80,
      };
    }
    // móvil/tablet: esquina superior derecha
    return {
      x: Math.max(0, w - 110),
      y: 72,
    };
  };
  const [posicion, setPosicion] = useState(calcPosInicial);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Limpiar posición guardada de sesiones anteriores para que siempre
  // arranque junto al panel ONLINE/Disponible
  useEffect(() => {
    sessionStorage.removeItem('SARAI_POSICION');
  }, []);

  // Re-calcular posición si la ventana cambia de tamaño
  useEffect(() => {
    const onResize = () => setPosicion(calcPosInicial());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const streamRef    = useRef<MediaStream | null>(null);
  const timerRef     = useRef<any>(null);
  const barAnimRef   = useRef<number>(0);
  const estadoRef    = useRef<Estado>('esperando');
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const peakLevelRef = useRef<number>(0);  // nivel máximo visto durante la grabación
  const recognitionRef = useRef<any>(null);
  const procesarComandoRef = useRef<(texto: string) => void>(() => {});
  const debeReiniciarComandosRef = useRef(false);
  const iniciarComandosVozRef = useRef<() => void>(() => {});
  const detenerComandosVozRef = useRef<() => void>(() => {});

  const setEst = useCallback((e: Estado) => {
    estadoRef.current = e;
    setEstado(e);
  }, []);

  // ── Check Whisper health con reintentos y timeout mejorado ────────────────
  useEffect(() => {
    const HEALTH_URL = WHISPER_URL.replace('/transcribir', '/health');
    const TIMEOUT_MS = 3000; // 3 segundos máximo
    const RETRY_OFFLINE_MS = 8000; // reintentar cada 8s si offline
    const RETRY_ONLINE_MS = 45000; // revisar cada 45s si online
    
    let abortController: AbortController | null = null;
    let timeoutHandle: NodeJS.Timeout | null = null;
    
    const check = async () => {
      try {
        abortController = new AbortController();
        timeoutHandle = setTimeout(() => abortController?.abort(), TIMEOUT_MS);
        
        const response = await fetch(HEALTH_URL, {
          method: 'GET',
          signal: abortController.signal,
          cache: 'no-store', // evitar caché que pueda dar falsos positivos
        });
        
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        if (response.ok) {
          setWhisperStatus('online');
          console.log('[SARAI] ✅ Whisper Online');
        } else {
          setWhisperStatus('offline');
          console.warn(`[SARAI] ⚠️ Whisper Health Check: HTTP ${response.status}`);
        }
      } catch (err: any) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        if (err.name === 'AbortError') {
          console.warn('[SARAI] ⚠️ Whisper Health Check Timeout (3s)');
        } else {
          console.error('[SARAI] ⚠️ Whisper Health Check Error:', err.message);
        }
        setWhisperStatus('offline');
      } finally {
        abortController = null;
        timeoutHandle = null;
      }
    };
    
    // Ejecutar check inmediatamente
    check();
    
    // Reintentar según el estado actual
    const interval = setInterval(check, whisperStatus === 'online' ? RETRY_ONLINE_MS : RETRY_OFFLINE_MS);
    
    return () => {
      clearInterval(interval);
      if (abortController) abortController.abort();
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [whisperStatus]);

  // ── Barras animadas con nivel real de audio ───────────────────────────────
  const iniciarVisualizador = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;   // más resolución para mejor detección de voz
      source.connect(analyser);
      analyserRef.current = analyser;

      const freqBuf  = new Uint8Array(analyser.frequencyBinCount);
      const timeBuf  = new Uint8Array(analyser.fftSize);

      const tick = () => {
        // Frecuencias → visualización de barras
        analyser.getByteFrequencyData(freqBuf);
        const avg = freqBuf.reduce((a, b) => a + b, 0) / freqBuf.length;
        const norm = Math.min(100, avg * 2);
        setBarras(Array(20).fill(0).map((_, i) => {
          const center = Math.abs(i - 9.5) / 9.5;
          return Math.max(4, norm * (1 - center * 0.4) * (0.6 + Math.random() * 0.4));
        }));

        // Dominio temporal → RMS real para detección de voz
        analyser.getByteTimeDomainData(timeBuf);
        const rms = Math.sqrt(
          timeBuf.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / timeBuf.length
        );
        if (rms > peakLevelRef.current) peakLevelRef.current = rms;

        barAnimRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* AudioContext no disponible */ }
  }, []);

  const detenerVisualizador = useCallback(() => {
    cancelAnimationFrame(barAnimRef.current);
    setBarras(Array(20).fill(4));
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;
  }, []);

  // ── Limpiar todo el media ─────────────────────────────────────────────────
  const limpiarMedia = useCallback(() => {
    detenerVisualizador();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    mediaRecRef.current = null;
    setSegundos(0);
  }, [detenerVisualizador]);

  // ── Enviar texto a Gemma/Gemini ───────────────────────────────────────────
  const enviarTexto = useCallback(async (texto: string) => {
    setEst('procesando');
    try {
      const res = await fetch(GEMMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto, contexto }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.campos && Object.keys(data.campos).length > 0) {
        onCamposDetectados(data.campos);
        const n = Object.keys(data.campos).length;
        setResultado(`✓ ${n} campos completados`);
        setEst('listo');
        setTimeout(() => { setEst('esperando'); setResultado(''); setTranscripcion(''); }, 7000);
      } else {
        setError('Sin campos detectados. Habla con más detalle clínico.');
        setEst('error');
        setTimeout(() => { setEst('esperando'); setError(''); }, 5000);
      }
    } catch (err: any) {
      setError(`Error al procesar: ${err?.message || 'sin conexión'}`);
      setEst('error');
      setTimeout(() => { setEst('esperando'); setError(''); }, 5000);
    }
  }, [token, contexto, onCamposDetectados, setEst]);

  // ── Iniciar grabación ─────────────────────────────────────────────────────
  const iniciarGrabacion = useCallback(async () => {
    // ── Validación Pre-grabación ──────────────────────────────────────────────

    // 1. Verificar que Whisper está online
    if (whisperStatus !== 'online') {
      setError(
        whisperStatus === 'offline' 
          ? '❌ Whisper no está disponible. Inicia el servicio: python whisper_service/main.py'
          : '⏳ Whisper se está conectando... espera 3 segundos'
      );
      return;
    }

    // 2. Verificar que el navegador soporta getUserMedia
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('❌ Tu navegador no soporta grabación de audio. Usa Chrome, Edge o Firefox recientes.');
      return;
    }

    setError('');
    setResultado('');
    setTranscripcion('');
    chunksRef.current = [];
    peakLevelRef.current = 0;   // reset nivel máximo

    try {
      // Enumerar dispositivos para evitar "Mezcla estéreo" / "Stereo Mix"
      let audioConstraints: MediaStreamConstraints['audio'] = true;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === 'audioinput');
        
        if (mics.length === 0) {
          setError('❌ No se detectó ningún micrófono en tu sistema. Conecta un micrófono e intenta de nuevo.');
          return;
        }

        const EXCLUIR = ['mezcla', 'stereo mix', 'what u hear', 'wave out', 'loopback'];
        const micReal = mics.find(d =>
          d.label && !EXCLUIR.some(ex => d.label.toLowerCase().includes(ex))
        );
        if (micReal?.deviceId) {
          // Desactivar procesado de Chrome que distorsiona el audio para Whisper
          audioConstraints = {
            deviceId: { exact: micReal.deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          };
          console.log('[SARAI] Usando micrófono:', micReal.label);
        } else {
          audioConstraints = {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          };
          console.warn('[SARAI] No se encontró micrófono físico, usando dispositivo predeterminado');
        }
      } catch { /* enumerateDevices falló, usar default */ }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      streamRef.current = stream;

      // Log del dispositivo capturado para diagnóstico
      const track = stream.getAudioTracks()[0];
      console.log('[SARAI] Dispositivo de audio:', track?.label, track?.getSettings());
      
      // ── Validación de micrófono activo (pre-grabación) ────────────────────────
      // Verificar que el micrófono está capturando audio antes de comenzar
      const validarMicrofonoActivo = await new Promise<boolean>((resolve) => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          
          let checkCount = 0;
          const maxChecks = 10; // 1 segundo (100ms × 10)
          let tieneAudio = false;
          
          const validateInterval = setInterval(() => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            if (average > 5) tieneAudio = true;
            checkCount++;
            
            if (checkCount >= maxChecks) {
              clearInterval(validateInterval);
              audioContext.close().catch(() => {});
              resolve(tieneAudio);
            }
          }, 100);
        } catch (err) {
          console.warn('[SARAI] Error validando micrófono:', err);
          resolve(true); // permitir de todas formas si hay error
        }
      });
      
      if (!validarMicrofonoActivo) {
        // Micrófono silenciado o desconectado
        stream.getTracks().forEach(track => track.stop());
        setError(
          '⚠️ El micrófono no está capturando audio.\n\n' +
          'Verifica en Windows:\n' +
          '• Configuración → Sonido → Entrada\n' +
          '• Asegúrate que el micrófono correcto está seleccionado\n' +
          '• Sube el volumen del micrófono al 80-100%\n' +
          '• Desactiva "mejoras de audio" en propiedades'
        );
        return;
      }

      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
          .find(m => MediaRecorder.isTypeSupported(m)) || '';

      const rec = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128000,
      });
      mediaRecRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.start(500); // chunk cada 500ms
      setEst('grabando');
      iniciarVisualizador(stream);
      // Contador + autodetener a los 60 segundos
      const MAX_SEG = 60;
      timerRef.current = setInterval(() => {
        setSegundos(s => {
          if (s + 1 >= MAX_SEG) {
            // Autodetener cuando llega al límite
            setTimeout(() => detenerYAnalizar(), 50);
          }
          return s + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('❌ Micrófono bloqueado. Haz clic en el candado de la URL → Micrófono → Permitir → recarga la página.');
      } else if (err.name === 'NotFoundError') {
        setError('❌ No se encontró micrófono. Conecta un micrófono e intenta de nuevo.');
      } else {
        setError(`❌ Error de micrófono: ${err.message}`);
      }
    }
  }, [setEst, iniciarVisualizador, whisperStatus]);

  // ── Detener, enviar a Whisper, luego a Gemma ──────────────────────────────
  const detenerYAnalizar = useCallback(() => {
    const rec = mediaRecRef.current;
    if (!rec || rec.state === 'inactive') return;

    // Capturar chunks ANTES de limpiar
    rec.onstop = async () => {
      const capturedChunks = [...chunksRef.current];
      const peakCapturado  = peakLevelRef.current;  // guardar antes de limpiar
      chunksRef.current = [];
      limpiarMedia();

      const mimeType = rec.mimeType || 'audio/webm';
      const blob = new Blob(capturedChunks, { type: mimeType });

      console.log(`[SARAI] Blob: ${blob.size} bytes | Peak mic: ${(peakCapturado * 100).toFixed(1)}%`);

      if (blob.size < 500) {
        setError('No se grabó audio. Verifica el micrófono y habla al menos 2 segundos.');
        setEst('esperando');
        return;
      }

      // ── Verificación de nivel de micrófono en el navegador ────────────────
      // Sólo bloquear si el nivel es absolutamente cero (micrófono mudo/desconectado)
      // Niveles bajos (>0%) se envían a Whisper — el servidor decide con RMS
      if (peakCapturado === 0) {
        setError(
          `⚠️ Micrófono silenciado o desconectado (nivel 0%).\n\n` +
          `Verifica en Windows:\n` +
          `• Configuración → Sistema → Sonido → Entrada\n` +
          `• El micrófono correcto debe ser el predeterminado\n` +
          `• Sube el volumen del micrófono al 80-100%\n` +
          `• Desactiva "mejoras de audio" que silencian la voz`
        );
        setEst('error');
        setTimeout(() => { setEst('esperando'); setError(''); }, 12000);
        return;
      }
      // Avisar nivel bajo pero dejar pasar a Whisper
      if (peakCapturado < 0.015) {
        console.warn(`[SARAI] Nivel bajo (${(peakCapturado*100).toFixed(1)}%) — enviando igual a Whisper`);
      }

      setEst('transcribiendo');

      // ── Enviar a Whisper ──────────────────────────────────────────────────
      try {
        const form = new FormData();
        form.append('audio', blob, 'grabacion.webm');

        const res = await fetch(WHISPER_URL, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(180000),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(`Whisper error ${res.status}: ${msg}`);
        }

        const data = await res.json();

        // Advertencia de audio silencioso desde el servidor
        if (data.advertencia === 'audio_silencio') {
          console.warn(`[SARAI] Servidor dice: audio silencioso RMS=${data.nivel_pct}%`);
          setError(
            `⚠️ Micrófono demasiado bajo — nivel cliente: ${(peakCapturado * 100).toFixed(1)}%, nivel servidor: ${data.nivel_pct?.toFixed(1) ?? '?'}%\n\n` +
            `Sube el volumen del micrófono en:\n` +
            `• Windows → Configuración → Sistema → Sonido → Entrada → sube al 80-100%\n` +
            `• O usa "Escribir texto" como alternativa.`
          );
          setEst('error');
          setTimeout(() => { setEst('esperando'); setError(''); }, 12000);
          return;
        }

        const texto = (data.texto || '').trim();
        console.log(`[SARAI] Whisper (${data.confianza * 100 | 0}% confianza, RMS=${data.nivel_pct}%): "${texto}"`);

        if (!texto || texto.length < 3) {
          setError('Whisper procesó el audio pero no detectó palabras. Habla más claro y cerca del micrófono.');
          setEst('esperando');
          return;
        }

        setTranscripcion(texto);

        // ── Interceptar comando de activación antes de enviar a Gemma ──────────
        const tNormWhisp = normalizarTexto(texto);
        const cmdWhisp = tNormWhisp.replace(MATCH_ACTIVACION_SARAI, '').trim() || tNormWhisp;
        const ACTIVAR_CMDS = ['activar comandos', 'activar voz', 'activar comando de voz', 'activar comandos de voz', 'comandos de voz', 'encender comandos'];
        if (ACTIVAR_CMDS.some(p => cmdWhisp.includes(normalizarTexto(p)))) {
          // El permiso de micrófono ya fue concedido al grabar con Whisper,
          // por lo que SpeechRecognition.start() funciona sin click adicional.
          setResultado('✅ Comandos de voz activados');
          setEst('listo');
          iniciarComandosVozRef.current();
          setTimeout(() => setEst('esperando'), 3000);
          return;
        }

        await enviarTexto(texto);

      } catch (err: any) {
        if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
          setError('Whisper tardó demasiado. Acorta el audio o usa texto.');
        } else if (err.message?.includes('fetch')) {
          setError('Servicio Whisper offline. Ejecuta: cd whisper_service && .\\start.ps1');
          setWhisperStatus('offline');
        } else {
          setError(`Error: ${err.message}`);
        }
        setEst('error');
        setTimeout(() => { setEst('esperando'); setError(''); }, 8000);
      }
    };

    try { rec.stop(); } catch { limpiarMedia(); }
  }, [limpiarMedia, setEst, enviarTexto]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(barAnimRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecRef.current?.state !== 'inactive') { try { mediaRecRef.current?.stop(); } catch {} }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} }
      try { recognitionRef.current?.abort(); } catch {}
    };
  }, []);

  // ── Mantener referencia al procesador de comandos actualizada ────────────
  useEffect(() => {
    procesarComandoRef.current = (texto: string) => {
      const t = normalizarTexto(texto);

      // Log siempre para depuración (muestra lo que el API de voz transcribió)
      console.log('[SARAI CMD] recibido:', JSON.stringify(texto), '→ normalizado:', t);

      // ❗ Usar REGEX CENTRALIZADO para consistencia
      if (!MATCH_ACTIVACION_SARAI.test(t)) {
        console.log('[SARAI CMD] ignorado — no empieza con SARAI/SARA. Texto recibido:', t);
        return;
      }

      // Eliminar prefijo (cualquier variación reconocida)
      const cmd = t.replace(MATCH_ACTIVACION_SARAI, '').trim();
      console.log('[SARAI CMD] activado — cmd extraído:', cmd);

      // ── PASO 0: Activar / Desactivar comandos de voz ──────────────────────
      if (['desactivar comandos', 'desactivar voz', 'apagar comandos', 'detener comandos de voz', 'desactivar'].some(p => cmd.startsWith(p))) {
        setUltimoComando('🔴 Comandos de voz desactivados');
        setTimeout(() => detenerComandosVozRef.current(), 500);
        setTimeout(() => setUltimoComando(''), 3000);
        return;
      }

      // ── PASO 1: Detener grabación ─────────────────────────────────────────
      if (['parar', 'detener', 'para', 'stop'].some(p => cmd.startsWith(p))) {
        if (estadoRef.current === 'grabando') {
          setUltimoComando('⏹ Deteniendo grabación...');
          setTimeout(() => detenerYAnalizar(), 100);
          setTimeout(() => setUltimoComando(''), 3000);
        }
        return;
      }

      // ── PASO 2: Iniciar grabación Whisper ─────────────────────────────────
      if (['escucha', 'escuchar', 'graba', 'grabar', 'iniciar', 'inicia', 'comienza', 'comenzar', 'rec'].some(p => cmd.startsWith(p))) {
        if (estadoRef.current === 'esperando') {
          setUltimoComando('🎤 Iniciando grabación...');
          setTimeout(() => iniciarGrabacion(), 300);
          setTimeout(() => setUltimoComando(''), 3000);
        }
        return;
      }

      // ── PASO 3: Modo texto manual ─────────────────────────────────────────
      if (['escribe', 'escribir', 'texto', 'modo texto'].some(p => cmd.startsWith(p))) {
        setUltimoComando('⌨ Modo texto activado');
        setModoTexto(true);
        setTimeout(() => setUltimoComando(''), 3000);
        return;
      }

      // ── PASO 4: Quitar prefijo de navegación ──────────────────────────────
      // Hacemos el strip UNA SOLA VEZ aquí, y usamos navCmd para todo lo siguiente
      const PREFIJOS_NAV = ['ir a ', 'abrir ', 'navegar a ', 'mostrar ', 've a ', 'abre ', 'llevar a ', 'ir '];
      let navCmd = cmd;
      for (const p of PREFIJOS_NAV) {
        if (cmd.startsWith(p)) { navCmd = cmd.slice(p.length).trim(); break; }
      }

      // ── PASO 5: Nueva historia (ANTES de comparar módulos) ────────────────
      if (
        navCmd.includes('nueva historia') ||
        (navCmd.includes('historia') && (navCmd.includes('nueva') || navCmd.includes('nuevo') || navCmd.includes('crear')))
      ) {
        setUltimoComando('→ Nueva Historia Clínica');
        onNavegar?.('historia');
        setTimeout(() => onAbrirNuevaHistoria?.(), 350);
        setTimeout(() => setUltimoComando(''), 3000);
        return;
      }

      // ── PASO 6: Módulos de la app (PRIMERO que secciones del form) ─────────
      // ⚠️ Este bloque va ANTES de SECCIONES_VOZ para que "pacientes" no colisione
      //    con la palabra "paciente" de la sección de datos generales.
      for (const nav of COMANDOS_NAV) {
        if (nav.palabras.some(p => {
          const pn = normalizarTexto(p);
          // Coincidencia exacta o que navCmd contenga la palabra completa del módulo
          return navCmd === pn || navCmd.startsWith(pn + ' ') || navCmd.endsWith(' ' + pn) || navCmd.includes(' ' + pn + ' ');
        })) {
          setUltimoComando(`→ ${nav.label}`);
          onNavegar?.(nav.pagina);
          setTimeout(() => setUltimoComando(''), 3000);
          return;
        }
      }
      // Segunda pasada: coincidencia parcial (para palabras de 1 token como "dashboard")
      for (const nav of COMANDOS_NAV) {
        if (nav.palabras.some(p => navCmd.includes(normalizarTexto(p)))) {
          setUltimoComando(`→ ${nav.label}`);
          onNavegar?.(nav.pagina);
          setTimeout(() => setUltimoComando(''), 3000);
          return;
        }
      }

      // ── PASO 7: Imprimir ──────────────────────────────────────────────────
      if (['imprimir', 'imprime', 'print', 'imprimir historia', 'imprimir ordenes'].some(p => navCmd.includes(p))) {
        setUltimoComando('🖨 Imprimiendo...');
        onImprimir?.();
        setTimeout(() => setUltimoComando(''), 3000);
        return;
      }

      // ── PASO 8: Secciones del formulario de Historia Clínica ──────────────
      for (const sec of SECCIONES_HC_VOZ) {
        if (sec.palabras.some(p => navCmd.includes(normalizarTexto(p)))) {
          setUltimoComando(`→ HC: ${sec.label}`);
          onIrSeccion?.(sec.id);
          setTimeout(() => setUltimoComando(''), 3000);
          return;
        }
      }

      // Comando no reconocido
      setUltimoComando(`? "${cmd}" — no reconocido`);
      setTimeout(() => setUltimoComando(''), 3000);
    };
  }, [iniciarGrabacion, detenerYAnalizar, onNavegar, onAbrirNuevaHistoria, onIrSeccion]);

  const iniciarComandosVoz = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setEstadoComandos('unsupported');
      setError('Este navegador no soporta comandos de voz. Usa Google Chrome o Microsoft Edge.');
      return;
    }

    // ── SIEMPRE crear instancia nueva ──────────────────────────────────────
    // Si hay una instancia vieja (bloqueada o caída), descartarla para evitar
    // que el estado "not-allowed" persista entre intentos.
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    const rec = new SR();
    // 'es' cubre todos los dialectos hispanos y es más confiable que 'es-CO'
    // que no siempre está disponible en Chrome. La pronunciación colombiana
    // funciona perfectamente con 'es'.
    rec.lang = 'es';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onstart = () => {
      setEscuchandoComandos(true);
      setEstadoComandos('active');
      setError('');
      console.log('[SARAI CMD] SpeechRecognition iniciado — lang: es');
    };

    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const alternativas: string[] = [];
          for (let j = 0; j < e.results[i].length; j++) {
            alternativas.push(e.results[i][j].transcript);
          }
          console.log('[SARAI CMD] STT transcribió:', alternativas);

          // Buscar alternativa que contenga "sara" (wake word)
          const alternativasNorm = alternativas.map(a => normalizarTexto(a));
          const idxActivador = alternativasNorm.findIndex(a => MATCH_ACTIVACION_SARAI.test(a));
          const textoFinal = idxActivador >= 0 ? alternativas[idxActivador] : alternativas[0];
          const activado = idxActivador >= 0;

          // Mostrar en UI: verde si activó, rojo si no
          setUltimoSTT(`${activado ? '🟢' : '🔴'} "${textoFinal.slice(0, 60)}"`);
          setTimeout(() => setUltimoSTT(''), 6000);

          console.log('[SARAI CMD] activó:', activado, '→', textoFinal);
          procesarComandoRef.current(textoFinal);
        }
      }
    };

    rec.onerror = (e: any) => {
      console.warn('[SARAI CMD] error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        debeReiniciarComandosRef.current = false;
        setEstadoComandos('blocked');
        setEscuchandoComandos(false);
        // Limpiar instancia para forzar recreación en siguiente intento
        recognitionRef.current = null;
        setError('Micrófono bloqueado en Chrome. Clic en 🔒 → Micrófono → Permitir → recarga con F5.');
        return;
      }
      if (e.error === 'network') {
        // Error de red en STT — reintentar
        console.warn('[SARAI CMD] error de red, reintentando...');
        return;
      }
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[SARAI CMD] Error inesperado:', e.error);
      }
    };

    rec.onend = () => {
      setEscuchandoComandos(false);
      if (debeReiniciarComandosRef.current && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 500);
      }
    };

    recognitionRef.current = rec;
    debeReiniciarComandosRef.current = true;
    setEstadoComandos('starting');
    setError('');
    try {
      rec.start();
    } catch (err) {
      console.error('[SARAI CMD] No se pudo iniciar:', err);
      setError('No se pudo iniciar el reconocimiento de voz. Recarga la página.');
      setEstadoComandos('blocked');
      recognitionRef.current = null;
    }
  }, []);

  const detenerComandosVoz = useCallback(() => {
    debeReiniciarComandosRef.current = false;
    setEscuchandoComandos(false);
    if (estadoComandos !== 'unsupported') {
      setEstadoComandos('idle');
    }
    try { recognitionRef.current?.abort(); } catch {}
  }, [estadoComandos]);

  // Mantener ref actualizada para usarla desde el flujo Whisper (detenerYAnalizar)
  useEffect(() => { iniciarComandosVozRef.current = iniciarComandosVoz; }, [iniciarComandosVoz]);
  useEffect(() => { detenerComandosVozRef.current = detenerComandosVoz; }, [detenerComandosVoz]);

  // ── SpeechRecognition: preparada, pero activada por gesto del usuario ───
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setEstadoComandos('unsupported');
    }
  }, []);

  // ── Colores y estilos según estado ───────────────────────────────────────
  const borde =
    estado === 'grabando'      ? 'border-red-500/60' :
    estado === 'transcribiendo'? 'border-purple-500/50' :
    estado === 'procesando'    ? 'border-yellow-500/50' :
    estado === 'listo'         ? 'border-emerald-500/50' :
    estado === 'error'         ? 'border-red-400/40' : 'border-white/10';

  const fondo =
    estado === 'grabando'      ? 'bg-red-950/30' :
    estado === 'transcribiendo'? 'bg-purple-950/20' :
    estado === 'procesando'    ? 'bg-yellow-950/20' :
    estado === 'listo'         ? 'bg-emerald-950/20' :
    estado === 'error'         ? 'bg-red-950/10' : 'bg-slate-900/80';

  const dotColor =
    estado === 'grabando'      ? 'bg-red-400' :
    estado === 'transcribiendo'? 'bg-purple-400' :
    estado === 'procesando'    ? 'bg-yellow-400' :
    estado === 'listo'         ? 'bg-emerald-400' :
    estado === 'error'         ? 'bg-red-300' :
    whisperStatus === 'online' ? 'bg-blue-400' : 'bg-gray-600';

  const etiqueta =
    estado === 'grabando'      ? { text: `⏺ REC ${fmt(segundos)}`,  cls: 'text-red-400 border-red-500/20 bg-red-500/10' } :
    estado === 'transcribiendo'? { text: 'Transcribiendo…',           cls: 'text-purple-400 border-purple-500/20 bg-purple-500/10 animate-pulse' } :
    estado === 'procesando'    ? { text: 'Analizando IA…',            cls: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10 animate-pulse' } :
    estado === 'listo'         ? { text: '✓ Completado',              cls: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' } :
    null;

  const nivelMax        = Math.max(...barras);
  const nivelColor      = nivelMax > 50 ? 'text-emerald-400' : nivelMax > 20 ? 'text-yellow-400' : 'text-red-400';
  const nivelLabel      = nivelMax > 50 ? '● VOZ DETECTADA'  : nivelMax > 20 ? '◐ señal débil'   : '○ sin señal';
  const barraGlobalColor = nivelMax > 50 ? 'bg-emerald-400'  : nivelMax > 20 ? 'bg-yellow-400'   : 'bg-red-500';

  // ── Handlers para drag + click en ícono contraído ───────────────────────────
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // En expandido: no draggear sobre botones/inputs
    if (!minimizado && (e.target as HTMLElement).closest('button, textarea, input, [role="button"]')) return;
    if (!widgetRef.current) return;

    e.preventDefault();
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    setDragOffset({ x: e.clientX - posicion.x, y: e.clientY - posicion.y });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      // Marcar como arrastre real si se movió >5px
      if (Math.sqrt(dx * dx + dy * dy) > 5) dragMovedRef.current = true;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - (minimizado ? 64 : 320);
      const maxY = window.innerHeight - 80;
      setPosicion({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
      // Si fue clic (sin arrastre) sobre el ícono contraído → expandir
      if (!dragMovedRef.current && minimizado) {
        setMinimizado(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset, minimizado]);

  return (
    <div
      ref={widgetRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        top: `${posicion.y}px`,
        left: `${posicion.x}px`,
        cursor: dragging ? 'grabbing' : minimizado ? 'grab' : 'default',
        zIndex: 9999,
        filter: minimizado
          ? 'none'
          : 'drop-shadow(0 0 8px rgba(212,175,55,0.35))',
      }}
      className="select-none"
    >

      {/* ══ CONTRAÍDO — ícono fiel al logo (arrastrable + clic para expandir) ══ */}
      {minimizado && vistaMinima === 'icono' && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          className="relative select-none"
          title="SARAI — clic para expandir · arrastrar para mover"
        >
          {/* Halo neon exterior animado */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: estado === 'grabando'
                ? '0 0 0 3px rgba(239,68,68,0.5), 0 0 18px 6px rgba(239,68,68,0.35), 0 0 40px 10px rgba(239,68,68,0.15)'
                : estado === 'transcribiendo' || estado === 'procesando'
                ? '0 0 0 3px rgba(168,85,247,0.5), 0 0 18px 6px rgba(168,85,247,0.35), 0 0 40px 10px rgba(168,85,247,0.15)'
                : escuchandoComandos
                ? '0 0 0 3px rgba(99,102,241,0.55), 0 0 18px 6px rgba(99,102,241,0.35), 0 0 40px 10px rgba(99,102,241,0.15)'
                : whisperStatus === 'online'
                ? '0 0 0 3px rgba(59,130,246,0.5), 0 0 20px 8px rgba(59,130,246,0.3), 0 0 45px 12px rgba(59,130,246,0.12)'
                : '0 0 0 3px rgba(239,68,68,0.4), 0 0 14px 4px rgba(239,68,68,0.2)',
            }}
          />

          <svg
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            style={{ display: 'block' }}
          >
            <defs>
              {/* Gradiente radial fondo — igual al logo: centro más claro, bordes oscuros */}
              <radialGradient id="saraiCircleBg" cx="42%" cy="36%" r="62%">
                <stop offset="0%"   stopColor={
                  estado === 'grabando' ? '#450a0a' :
                  estado === 'transcribiendo' || estado === 'procesando' ? '#3b0764' :
                  escuchandoComandos ? '#1e1b4b' : '#1e3a5f'
                }/>
                <stop offset="55%"  stopColor={
                  estado === 'grabando' ? '#1c0a0a' :
                  estado === 'transcribiendo' || estado === 'procesando' ? '#1a0030' :
                  escuchandoComandos ? '#0f0e27' : '#0c1a2e'
                }/>
                <stop offset="100%" stopColor="#050810"/>
              </radialGradient>
              {/* Highlight interior superior (efecto brillo como en el logo) */}
              <radialGradient id="saraiInnerGlow" cx="50%" cy="15%" r="50%">
                <stop offset="0%"   stopColor={
                  estado === 'grabando' ? 'rgba(239,68,68,0.18)' :
                  whisperStatus === 'online' ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.05)'
                }/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
              {/* Gradiente para el micrófono */}
              <linearGradient id="saraiMicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor={whisperStatus === 'online' ? '#2563eb' : '#4b5563'}/>
                <stop offset="100%" stopColor={whisperStatus === 'online' ? '#1d4ed8' : '#374151'}/>
              </linearGradient>
              {/* Gradiente badge azul */}
              <radialGradient id="saraiBadgeBlue" cx="35%" cy="30%" r="70%">
                <stop offset="0%"   stopColor="#60a5fa"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </radialGradient>
              {/* Gradiente badge rojo */}
              <radialGradient id="saraiBadgeRed" cx="35%" cy="30%" r="70%">
                <stop offset="0%"   stopColor="#f87171"/>
                <stop offset="100%" stopColor="#b91c1c"/>
              </radialGradient>
              {/* Filtro blur para el glow del círculo principal */}
              <filter id="saraiGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* ── Círculo base con fondo gradiente ── */}
            <circle cx="38" cy="38" r="34" fill="url(#saraiCircleBg)"/>
            {/* Capa highlight interior */}
            <circle cx="38" cy="38" r="34" fill="url(#saraiInnerGlow)"/>
            {/* Borde neon principal */}
            <circle cx="38" cy="38" r="34"
              fill="none"
              stroke={
                estado === 'grabando'       ? '#ef4444' :
                estado === 'transcribiendo' || estado === 'procesando' ? '#a855f7' :
                escuchandoComandos          ? '#818cf8' :
                whisperStatus === 'online'  ? '#3b82f6' : '#dc2626'
              }
              strokeWidth="2"
            />
            {/* Borde interior sutil para profundidad */}
            <circle cx="38" cy="38" r="31"
              fill="none"
              stroke={
                whisperStatus === 'online' ? 'rgba(147,197,253,0.12)' : 'rgba(255,255,255,0.04)'
              }
              strokeWidth="1"
            />

            {/* ── Ondas izquierda — 3 arcos como el logo ── */}
            <path d="M16 32 Q14 38 16 44"
              stroke={whisperStatus === 'online' ? '#93c5fd' : '#4b5563'}
              strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M11.5 27.5 Q8.5 38 11.5 48.5"
              stroke={whisperStatus === 'online' ? '#60a5fa' : '#374151'}
              strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M7.5 23 Q3.5 38 7.5 53"
              stroke={whisperStatus === 'online' ? '#3b82f6' : '#1f2937'}
              strokeWidth="2" strokeLinecap="round" fill="none"/>

            {/* ── Ondas derecha — 3 arcos ── */}
            <path d="M60 32 Q62 38 60 44"
              stroke={whisperStatus === 'online' ? '#93c5fd' : '#4b5563'}
              strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M64.5 27.5 Q67.5 38 64.5 48.5"
              stroke={whisperStatus === 'online' ? '#60a5fa' : '#374151'}
              strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M68.5 23 Q72.5 38 68.5 53"
              stroke={whisperStatus === 'online' ? '#3b82f6' : '#1f2937'}
              strokeWidth="2" strokeLinecap="round" fill="none"/>

            {/* ── Micrófono / estado activo ── */}
            {estado === 'grabando' ? (
              <>
                <circle cx="38" cy="35" r="10" fill="rgba(239,68,68,0.15)"/>
                <rect x="32.5" y="29.5" width="11" height="11" rx="2.5" fill="#ef4444"/>
                <rect x="34.5" y="31.5" width="7" height="7" rx="1.5" fill="#fca5a5"/>
              </>
            ) : estado === 'transcribiendo' || estado === 'procesando' ? (
              <>
                <circle cx="38" cy="35" r="10"
                  fill={estado === 'transcribiendo' ? 'rgba(168,85,247,0.1)' : 'rgba(234,179,8,0.1)'}/>
                <circle cx="38" cy="35" r="8"
                  stroke={estado === 'transcribiendo' ? '#a855f7' : '#eab308'}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="38" strokeDashoffset="14" fill="none"/>
              </>
            ) : (
              <>
                {/* Cuerpo micrófono con gradiente */}
                <rect x="31" y="19" width="14" height="20" rx="7"
                  fill="url(#saraiMicGrad)"
                  stroke={whisperStatus === 'online' ? '#93c5fd' : '#6b7280'}
                  strokeWidth="1.5"
                />
                {/* Highlight superior del mic */}
                <rect x="33" y="21" width="5" height="6" rx="2.5"
                  fill={whisperStatus === 'online' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}
                />
                {/* Arco inferior del micrófono */}
                <path d="M25 36 Q25 48 38 48 Q51 48 51 36"
                  stroke={whisperStatus === 'online' ? '#93c5fd' : '#6b7280'}
                  strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                {/* Pie vertical */}
                <line x1="38" y1="48" x2="38" y2="53"
                  stroke={whisperStatus === 'online' ? '#93c5fd' : '#6b7280'}
                  strokeWidth="2.2" strokeLinecap="round"/>
                {/* Base horizontal */}
                <line x1="31" y1="53" x2="45" y2="53"
                  stroke={whisperStatus === 'online' ? '#93c5fd' : '#6b7280'}
                  strokeWidth="2.2" strokeLinecap="round"/>
              </>
            )}

            {/* ── Badge ✓ azul / ✕ rojo — SIEMPRE basado en whisperStatus ── */}
            {/* Sombra badge */}
            <circle cx="62" cy="62" r="13" fill="rgba(0,0,0,0.55)"/>
            {/* Badge relleno */}
            <circle cx="62" cy="62" r="11"
              fill={whisperStatus === 'online' ? 'url(#saraiBadgeBlue)' : 'url(#saraiBadgeRed)'}
            />
            {/* Borde blanco badge */}
            <circle cx="62" cy="62" r="11" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
            {/* Highlight superior badge */}
            <ellipse cx="60" cy="58" rx="4" ry="2.5"
              fill="rgba(255,255,255,0.2)" transform="rotate(-15 60 58)"/>
            {/* Símbolo ✓ o ✕ */}
            {whisperStatus === 'online' ? (
              <path d="M57 62L60.5 65.5L67 58"
                stroke="white" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <>
                <line x1="58" y1="58" x2="66" y2="66" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
                <line x1="66" y1="58" x2="58" y2="66" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              </>
            )}
          </svg>

          {/* Pulso animado mientras graba o escucha comandos de voz */}
          {(estado === 'grabando' || escuchandoComandos) && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `2px solid ${estado === 'grabando' ? 'rgba(239,68,68,0.8)' : 'rgba(99,102,241,0.8)'}`,
              }}
            />
          )}
        </motion.div>
      )}

      {/* ══ VISTA PULSO — logo SARAI ECG flotante (responsive) ══ */}
      {minimizado && vistaMinima === 'pulso' && (
        <div className="w-24 sm:w-28 md:w-32">
          <SaraiECGIcon
            color={
              estado === 'grabando'        ? '#f87171' :
              escuchandoComandos           ? '#a78bfa' :
              estado === 'transcribiendo'  ? '#c084fc' :
              estado === 'procesando'      ? '#fbbf24' :
              whisperStatus === 'online'   ? '#00f5ff' : '#f87171'
            }
            speed={
              estado === 'grabando'                                  ? 'fast' :
              escuchandoComandos || estado === 'transcribiendo' || estado === 'procesando' ? 'active' :
              'idle'
            }
            pulse={estado === 'grabando' || escuchandoComandos || estado === 'transcribiendo' || estado === 'procesando'}
            title="SARAI — clic para expandir"
          />
        </div>
      )}

      {/* ══ EXPANDIDO — panel completo ══ */}
      {!minimizado && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border-2 w-[92vw] max-w-[300px] sm:w-72 ${
          estado === 'grabando'       ? 'border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.4)]' :
          estado === 'transcribiendo' ? 'border-purple-500/80 shadow-[0_0_16px_rgba(168,85,247,0.4)]' :
          estado === 'procesando'     ? 'border-yellow-400/80 shadow-[0_0_16px_rgba(250,204,21,0.4)]' :
          estado === 'listo'          ? 'border-emerald-400/80 shadow-[0_0_16px_rgba(52,211,153,0.4)]' :
          escuchandoComandos          ? 'border-indigo-400/70 shadow-[0_0_14px_rgba(129,140,248,0.4)]' :
          'border-yellow-600/50 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
        } ${fondo} backdrop-blur-md transition-all duration-300`}
      >
      {/* ── Header — clic en zona de drag colapsa, sin botón flecha separado ─ */}
      <div
        className="flex items-center justify-between px-3 py-3 cursor-pointer select-none rounded-t-2xl hover:bg-white/[0.03] transition-colors"
        onClick={(e) => {
          // Colapsar si el clic NO fue sobre un botón/input interno
          if (!(e.target as HTMLElement).closest('button, input, textarea')) {
            setMinimizado(true);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: ['grabando','procesando','transcribiendo'].includes(estado) ? [1, 1.6, 1] : 1 }}
            transition={{ repeat: ['grabando','procesando','transcribiendo'].includes(estado) ? Infinity : 0, duration: 0.8 }}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold text-xs tracking-wide">SARAI</span>
            <span className="text-gray-600 text-[10px]">Asistente · Whisper + IA</span>
            {escuchandoComandos && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-[9px] text-indigo-400 font-mono"
              >
                ♥ escucha
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {etiqueta && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${etiqueta.cls}`}>
              {etiqueta.text}
            </span>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
            whisperStatus === 'online'  ? 'text-emerald-500 border-emerald-500/20' :
            whisperStatus === 'offline' ? 'text-red-500 border-red-500/20' :
            'text-gray-600 border-gray-700'
          }`}>
            {whisperStatus === 'online' ? 'W✓' : whisperStatus === 'offline' ? 'W✗' : '…'}
          </span>
          {/* Indicador colapsar — solo visual, el clic es en todo el header */}
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-gray-600">
            <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Cuerpo ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 space-y-3">

              {/* Último comando de voz reconocido */}
              {ultimoComando && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  🎙 {ultimoComando}
                </motion.p>
              )}

              {/* Lo que escuchó el STT — ayuda al usuario a saber qué se transcribió */}
              {ultimoSTT && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 font-mono">
                  STT oyó: {ultimoSTT}
                </motion.p>
              )}

              {estadoComandos !== 'unsupported' && (
                <div className="space-y-2">
                  {/* Botón activar/detener */}
                  <div className="flex gap-2">
                    {!escuchandoComandos ? (
                      <button
                        onClick={iniciarComandosVoz}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                          estadoComandos === 'blocked'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                        }`}
                      >
                        {estadoComandos === 'blocked' ? '🔓 Reintentar comandos de voz' : '🔊 Activar comandos de voz'}
                      </button>
                    ) : (
                      <button
                        onClick={detenerComandosVoz}
                        className="flex-1 py-2 rounded-lg text-[11px] font-semibold border bg-slate-500/10 border-slate-500/20 text-slate-300 hover:bg-slate-500/20 transition-all"
                      >
                        Detener comandos de voz
                      </button>
                    )}
                    <div className="px-3 py-2 rounded-lg border border-white/10 text-[10px] text-gray-400 bg-white/5 flex items-center">
                      {escuchandoComandos ? '🟢 escuchando...' : 'SARAI + cmd'}
                    </div>
                  </div>

                  {/* INSTRUCCIONES si el mic está bloqueado */}
                  {estadoComandos === 'blocked' && (
                    <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 space-y-1">
                      <p className="font-bold">🔐 Micrófono bloqueado en Chrome:</p>
                      <p>1. Clic en el 🔒 candado junto a la URL</p>
                      <p>2. Micrófono → <strong>Permitir</strong></p>
                      <p>3. Recargar la página (F5)</p>
                      <p>4. Pulsar "Reintentar comandos de voz"</p>
                    </div>
                  )}

                  {/* FALLBACK: comandos por teclado (siempre visible) */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={inputComandoTexto}
                      onChange={e => setInputComandoTexto(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && inputComandoTexto.trim()) {
                          procesarComandoRef.current(inputComandoTexto.trim());
                          setInputComandoTexto('');
                        }
                      }}
                      placeholder='Ej: sarai ir a pacientes'
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-[11px] placeholder-gray-700 focus:outline-none focus:border-indigo-500/50"
                    />
                    <button
                      onClick={() => {
                        if (inputComandoTexto.trim()) {
                          procesarComandoRef.current(inputComandoTexto.trim());
                          setInputComandoTexto('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/30 transition-all"
                    >
                      ▶
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-600 px-1">Escribe "sarai ir a pacientes" y pulsa Enter — funciona aunque el mic esté bloqueado</p>
                </div>
              )}

              {/* Resultado OK */}
              {resultado && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {resultado}
                </motion.p>
              )}

              {/* Error */}
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 leading-relaxed whitespace-pre-line">
                  {error}
                </motion.p>
              )}

              {/* Transcripción Whisper */}
              {transcripcion && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Transcripción Whisper</p>
                  <p className="text-gray-300 text-xs leading-relaxed italic">"{transcripcion.slice(-500)}"</p>
                </div>
              )}

              {/* Validador de voz — barras animadas */}
              {estado === 'grabando' && (
                <div className="space-y-1.5">
                  {/* Etiqueta nivel */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Nivel de micrófono</span>
                    <span className={`text-[10px] font-mono font-bold ${nivelColor}`}>{nivelLabel}</span>
                  </div>

                  {/* Barras */}
                  <div className="flex items-end justify-center gap-px h-14 px-2 py-1.5 bg-black/30 rounded-xl border border-white/5">
                    {barras.map((h, i) => {
                      const pct = Math.max(4, h);
                      const barColor =
                        pct > 70 ? '#f87171' :   // rojo — muy alto
                        pct > 40 ? '#34d399' :   // verde — bueno
                        pct > 15 ? '#fbbf24' :   // amarillo — débil
                        '#374151';               // gris — silencio
                      return (
                        <motion.div
                          key={i}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.04, ease: 'linear' }}
                          className="flex-1 rounded-full"
                          style={{ backgroundColor: barColor, minHeight: 3 }}
                        />
                      );
                    })}
                  </div>

                  {/* Barra de nivel global */}
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(100, nivelMax)}%` }}
                      transition={{ duration: 0.1 }}
                      className={`h-full rounded-full ${barraGlobalColor}`}
                    />
                  </div>

                  {/* Countdown barra de tiempo */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-gray-600 font-mono">
                      {segundos}s / 60s — di "SARAI parar" o "SARA parar" o pulsa detener
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">
                      {60 - segundos}s restantes
                    </span>
                  </div>
                  <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      animate={{ width: `${(segundos / 60) * 100}%` }}
                      transition={{ duration: 0.9, ease: 'linear' }}
                      className={`h-full rounded-full ${segundos >= 55 ? 'bg-red-500' : 'bg-yellow-500/60'}`}
                    />
                  </div>
                </div>
              )}

              {/* Spinner estados intermedios */}
              {(estado === 'transcribiendo' || estado === 'procesando') && (
                <div className={`flex items-center justify-center gap-2 py-2 text-xs ${
                  estado === 'transcribiendo' ? 'text-purple-400' : 'text-yellow-400'
                }`}>
                  <motion.span animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>◌</motion.span>
                  {estado === 'transcribiendo' ? 'Whisper procesando audio…' : 'SARAI analizando con IA…'}
                </div>
              )}

              {/* ── Botones de voz ─────────────────────────────────────────── */}
              {!modoTexto && estado !== 'procesando' && estado !== 'transcribiendo' && (
                <div className="space-y-2">
                  {estado === 'grabando' ? (
                    <button onClick={detenerYAnalizar}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 transition-all">
                      <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>⏹</motion.span>
                      Detener y analizar
                    </button>
                  ) : (
                    <>
                      <button onClick={iniciarGrabacion}
                        disabled={estado === 'error'}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all active:scale-95 ${
                          whisperStatus === 'offline'
                            ? 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-600/20 border-red-500/40 text-red-300 hover:from-red-500/30 hover:to-rose-600/30'
                        }`}
                      >
                        <span className="text-lg">⏺</span>
                        {whisperStatus === 'offline' ? 'Iniciar Whisper primero' : 'Iniciar grabación'}
                      </button>

                      <button onClick={() => { setModoTexto(true); setError(''); }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        ⌨ Escribir texto
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Modo texto ─────────────────────────────────────────────── */}
              {modoTexto && estado !== 'procesando' && estado !== 'transcribiendo' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <textarea autoFocus rows={4} value={inputManual}
                    onChange={(e) => setInputManual(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && inputManual.trim().length > 3) {
                        enviarTexto(inputManual.trim());
                        setInputManual('');
                        setModoTexto(false);
                      }
                    }}
                    placeholder="Ej: Mujer 35 años con flacidez abdominal post embarazo. PA 120/80, peso 68 kg, talla 162 cm, sin alergias. Toma metformina 500mg. Diagnóstico lipedema grado 2. Plan: liposucción abdominal."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-yellow-500/50 resize-none leading-relaxed"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (inputManual.trim().length > 3) {
                          enviarTexto(inputManual.trim());
                          setInputManual('');
                          setModoTexto(false);
                        }
                      }}
                      disabled={inputManual.trim().length < 3}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-40 transition-all">
                      Analizar (Ctrl+Enter)
                    </button>
                    <button onClick={() => { setModoTexto(false); setInputManual(''); }}
                      className="px-3 py-2 rounded-lg text-xs border border-white/10 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Instrucción Whisper offline ─────────────────────────────── */}
              {whisperStatus === 'offline' && estado === 'esperando' && !modoTexto && (
                <div className="bg-orange-950/30 border border-orange-500/20 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Whisper offline — voz no disponible</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Abre una terminal y ejecuta:<br />
                    <code className="text-orange-300">cd whisper_service</code><br />
                    <code className="text-orange-300">.\start.ps1</code>
                  </p>
                  <p className="text-[10px] text-gray-600">Primera vez descarga ~500MB. Usa "Escribir texto" mientras tanto.</p>
                </div>
              )}

              {/* Hint cuando todo está listo */}
              {whisperStatus === 'online' && estado === 'esperando' && !modoTexto && !error && !resultado && (
                <p className="text-[10px] text-gray-700 text-center">
                  Presiona grabar y dicta la historia clínica en voz alta
                </p>
              )}

        </div>
      </motion.div>
      )}
    </div>
  );
}