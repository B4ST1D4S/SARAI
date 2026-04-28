import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConsentimientoPage() {
  const [selectedProc, setSelectedProc] = useState('LIPOSUCCION');
  const [firmado, setFirmado] = useState(false);
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [consentimientos, setConsentimientos] = useState<any[]>([]);

  const procedimientos = [
    { id: 'LIPOSUCCION', nombre: 'Liposucción' },
    { id: 'ABDOMINOPLASTIA', nombre: 'Abdominoplastia' },
    { id: 'MAMOPLASTIA', nombre: 'Mamoplastia' },
    { id: 'RINOPLASTIA', nombre: 'Rinoplastia' },
    { id: 'BLEFAROPLASTIA', nombre: 'Blefaroplastia' },
    { id: 'BOTOX', nombre: 'Botox' },
  ];

  const riesgos = {
    LIPOSUCCION: [
      'Hematoma y equimosis',
      'Seroma (acumulación de líquido)',
      'Irregular contour',
      'Adormecimiento temporal',
      'Infección (raro)',
      'Embolia grasa (muy raro)',
    ],
    ABDOMINOPLASTIA: [
      'Seroma',
      'Dehiscencia de herida',
      'Necrosis de piel',
      'Complicaciones anestésicas',
      'Cambio en sensibilidad',
    ],
    MAMOPLASTIA: [
      'Cambio en sensibilidad',
      'Contractura capsular',
      'Ruptura de implante',
      'Asimetría',
      'Necrosis de pezón',
    ],
    RINOPLASTIA: [
      'Obstrucción nasal',
      'Irregularidades',
      'Cambio en función respiratoria',
      'Sinusitis',
    ],
    BLEFAROPLASTIA: [
      'Lagrimeo excesivo',
      'Ectropión',
      'Hematoma',
      'Visión borrosa temporal',
    ],
    BOTOX: [
      'Efectos asimétricos',
      'Ptosis (caída)',
      'Reacciones alérgicas',
      'Efectos temporales variables',
    ],
  };

  const handleFirmar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (e.buttons === 1) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleGenerarConsentimiento = () => {
    const newConsent = {
      id: Date.now(),
      procedimiento: selectedProc,
      fecha: new Date(),
      paciente: 'Paciente (Sin datos)',
      medico: 'Médico (Sin datos)',
      firmado: firmado,
    };
    setConsentimientos(prev => [...prev, newConsent]);
    alert('Consentimiento generado exitosamente');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Consentimiento Informado</h1>
          <p className="text-gray-400">
            Generación automática blindada legalmente
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de procedimientos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <h2 className="text-xl font-bold text-white mb-4">Procedimientos</h2>
            <div className="space-y-2">
              {procedimientos.map((proc) => (
                <button
                  key={proc.id}
                  onClick={() => setSelectedProc(proc.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedProc === proc.id
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
                  }`}
                >
                  {proc.nombre}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Contenido principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Documento de consentimiento */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 mb-6">
              <h3 className="text-2xl font-bold text-white mb-6">
                CONSENTIMIENTO INFORMADO -{' '}
                {procedimientos.find(p => p.id === selectedProc)?.nombre.toUpperCase()}
              </h3>

              <div className="space-y-6 text-gray-300 mb-8 max-h-96 overflow-y-auto">
                <div>
                  <h4 className="text-yellow-600 font-bold mb-2">1. NATURALEZA DEL PROCEDIMIENTO</h4>
                  <p className="text-sm">
                    Se realizará el procedimiento de {procedimientos.find(p => p.id === selectedProc)?.nombre} de acuerdo con los estándares de calidad y seguridad establecidos.
                  </p>
                </div>

                <div>
                  <h4 className="text-yellow-600 font-bold mb-2">2. RIESGOS Y COMPLICACIONES</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    {riesgos[selectedProc as keyof typeof riesgos]?.map((riesgo, idx) => (
                      <li key={idx}>• {riesgo}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-yellow-600 font-bold mb-2">3. BENEFICIOS ESPERADOS</h4>
                  <p className="text-sm">
                    Se espera lograr los objetivos estéticos y funcionales discutidos previamente en consulta.
                  </p>
                </div>

                <div>
                  <h4 className="text-yellow-600 font-bold mb-2">4. ALTERNATIVAS</h4>
                  <p className="text-sm">
                    Se han discutido otras opciones de tratamiento incluyendo no hacer nada.
                  </p>
                </div>

                <div>
                  <h4 className="text-yellow-600 font-bold mb-2">5. AUTORIZACIÓN</h4>
                  <p className="text-sm">
                    Autorizo la realización del procedimiento y entiendo los riesgos asociados.
                  </p>
                </div>
              </div>

              {/* Datos del paciente y médico */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
                  <p className="text-gray-400 text-xs mb-1">PACIENTE</p>
                  <p className="text-white font-semibold">Nombre del Paciente</p>
                  <p className="text-gray-400 text-xs mt-2">Documento: CC 1.234.567</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
                  <p className="text-gray-400 text-xs mb-1">MÉDICO</p>
                  <p className="text-white font-semibold">Dr. Nombre Médico</p>
                  <p className="text-gray-400 text-xs mt-2">Registro: RE-123456</p>
                </div>
              </div>

              {/* Canvas para firma */}
              <div className="mb-6">
                <label className="text-white font-semibold block mb-2">Firma Digital</label>
                <canvas
                  ref={setSignatureCanvas}
                  width={500}
                  height={150}
                  onMouseMove={handleFirmar}
                  className="w-full border-2 border-dashed border-yellow-600/30 bg-slate-900/50 rounded-lg cursor-crosshair"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFirmado(true);
                    handleGenerarConsentimiento();
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Firmar y Guardar
                </button>
                <button
                  onClick={() => {
                    if (signatureCanvas) {
                      const ctx = signatureCanvas.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                      }
                    }
                  }}
                  className="bg-slate-700/50 hover:bg-slate-600/50 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 border border-blue-500/30">
                <Download size={20} />
                Descargar PDF
              </button>
              <button className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 border border-emerald-500/30">
                <Copy size={20} />
                Copia
              </button>
            </div>
          </motion.div>
        </div>

        {/* Historial de consentimientos */}
        {consentimientos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Consentimientos Firmados</h2>
            <div className="space-y-3">
              {consentimientos.map((cons) => (
                <motion.div
                  key={cons.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30 flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-semibold">{cons.procedimiento}</p>
                    <p className="text-gray-400 text-sm">{cons.fecha.toLocaleDateString()}</p>
                  </div>
                  {cons.firmado && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle size={20} />
                      <span className="text-sm font-semibold">Firmado</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
