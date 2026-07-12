import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, Loader2, Copy, Check, AlertTriangle, ShieldCheck,
  ShieldAlert, FileJson, Server,
} from 'lucide-react';
import {
  getRipsPruebas, enviarRipsPrueba,
  type RipsPrueba, type ResultadoEnvioFevRips, type Ambiente,
} from '../services/fevRipsService';

function fdateHora(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ════════════════════════════════════════════════════════════════
//  Panel: ventana para enviar RIPS de prueba a FEV-RIPS
// ════════════════════════════════════════════════════════════════
export default function FevRipsPanel() {
  const [pruebas, setPruebas] = useState<RipsPrueba[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ data: ResultadoEnvioFevRips; ambiente: Ambiente; nombre: string } | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    setLoading(true);
    getRipsPruebas().then(setPruebas).catch(() => setPruebas([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const enviar = async (prueba: RipsPrueba, ambiente: Ambiente) => {
    if (ambiente === 'produccion' && !confirm(
      `⚠️ Vas a enviar "${prueba.nombre}" al ambiente de PRODUCCIÓN del Ministerio de Salud.\n\nEsto es un envío REAL, no una prueba. ¿Continuar?`
    )) return;

    setError('');
    setEnviandoId(prueba.id);
    try {
      const data = await enviarRipsPrueba(ambiente, prueba.id);
      setResultado({ data, ambiente, nombre: prueba.nombre });
      cargar();
    } catch (e: any) {
      setError(e.message || 'Error al enviar el RIPS de prueba');
    } finally {
      setEnviandoId(null);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="text-yellow-500" size={18} />
          <div>
            <div className="text-white font-semibold text-sm">Pruebas de envío FEV-RIPS</div>
            <div className="text-gray-500 text-xs">Payloads de prueba para validar la integración con el Mecanismo Único de Validación del MSPS</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-xs">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-yellow-500" /></div>
      ) : pruebas.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">No hay RIPS de prueba configurados.</div>
      ) : (
        <div className="space-y-2">
          {pruebas.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{p.nombre}</div>
                <div className="text-gray-500 text-xs flex items-center gap-2 flex-wrap">
                  <span className="font-mono">{p.modulo}</span>
                  {p.numFactura && <span>· Factura {p.numFactura}</span>}
                  {p.cuv && (
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                      p.ultimoResultado?.ResultState
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/40 text-red-300'
                    }`}>
                      {p.ultimoResultado?.ResultState ? 'Último envío: aprobado' : 'Último envío: rechazado'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {p.ultimoResultado && (
                  <button
                    onClick={() => setResultado({ data: p.ultimoResultado!, ambiente: 'stage', nombre: p.nombre })}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded">
                    Ver último resultado
                  </button>
                )}
                <button
                  disabled={enviandoId === p.id}
                  onClick={() => enviar(p, 'stage')}
                  className="px-2.5 py-1 text-xs bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white rounded inline-flex items-center gap-1">
                  {enviandoId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Enviar a Pruebas
                </button>
                <button
                  disabled={enviandoId === p.id}
                  onClick={() => enviar(p, 'produccion')}
                  className="px-2.5 py-1 text-xs bg-red-700/80 hover:bg-red-700 disabled:opacity-50 text-white rounded inline-flex items-center gap-1">
                  {enviandoId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Enviar a Producción
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resultado && (
        <FevRipsResultModal
          resultado={resultado.data}
          ambiente={resultado.ambiente}
          nombre={resultado.nombre}
          onClose={() => setResultado(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Modal de resultado — inspirado en la interfaz del validador MSPS
// ════════════════════════════════════════════════════════════════
function FevRipsResultModal({
  resultado, ambiente, nombre, onClose,
}: { resultado: ResultadoEnvioFevRips; ambiente: Ambiente; nombre: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false);

  const aprobado = resultado.ResultState;
  const tieneCuv = aprobado && resultado.CodigoUnicoValidacion && !resultado.CodigoUnicoValidacion.startsWith('No aplica');

  const copiarCuv = () => {
    navigator.clipboard.writeText(resultado.CodigoUnicoValidacion).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  };

  const descargarJson = () => {
    const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fevrips_${ambiente}_${resultado.NumFactura || 'respuesta'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

          {/* Encabezado */}
          <div className={`px-5 py-4 rounded-t-xl border-b flex items-center justify-between ${
            aprobado ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-red-900/30 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2.5">
              {aprobado ? <ShieldCheck className="text-emerald-400" size={22} /> : <ShieldAlert className="text-red-400" size={22} />}
              <div>
                <div className="text-white font-bold text-sm">Resultado FEV-RIPS — {nombre}</div>
                <div className="text-xs text-gray-400">
                  Ambiente <span className="uppercase font-semibold">{ambiente}</span> · Módulo {resultado.Modulo || '—'}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>

          <div className="p-5 space-y-4">
            {/* Datos generales */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Dato label="Factura / Documento" value={resultado.NumFactura || '—'} mono />
              <Dato label="Proceso ID" value={String(resultado.ProcesoId ?? '—')} />
              <Dato label="Fecha de radicación" value={fdateHora(resultado.FechaRadicacion)} />
              <Dato label="Modalidad de pago" value={resultado.ModalidadPago || '—'} />
              <Dato label="Periodo de atención (inicio)" value={fdateHora(resultado.PeriodoAtencion?.FechaInicio)} />
              <Dato label="Periodo de atención (fin)" value={fdateHora(resultado.PeriodoAtencion?.FechaFin)} />
            </div>

            {/* CUV */}
            <div className={`rounded-lg border p-3 ${
              tieneCuv ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide font-bold text-gray-400">
                  Código Único de Validación (CUV)
                </span>
                {tieneCuv && (
                  <button onClick={copiarCuv} className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px]">
                    {copiado ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
              <div className={`font-mono text-xs break-all ${tieneCuv ? 'text-emerald-300' : 'text-gray-400'}`}>
                {resultado.CodigoUnicoValidacion}
              </div>
            </div>

            {/* Validaciones */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                Validaciones ({resultado.ResultadosValidacion?.length ?? 0})
              </div>
              {(!resultado.ResultadosValidacion || resultado.ResultadosValidacion.length === 0) ? (
                <div className="text-gray-500 text-xs italic">Sin observaciones ni rechazos.</div>
              ) : (
                <div className="space-y-2">
                  {resultado.ResultadosValidacion.map((v, i) => {
                    const esRechazo = v.Clase === 'RECHAZADO';
                    return (
                      <div key={i} className={`rounded-lg border p-3 text-xs ${
                        esRechazo
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            esRechazo ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'
                          }`}>{v.Clase}</span>
                          <span className="font-mono text-gray-400">{v.Codigo}</span>
                          <span className="text-gray-500">· Fuente: {v.Fuente}</span>
                        </div>
                        <div className="text-gray-200">{v.Descripcion}</div>
                        {v.Observaciones && <div className="text-gray-400 mt-1">Observación: {v.Observaciones}</div>}
                        {v.PathFuente && <div className="text-gray-500 font-mono mt-1 truncate">Ruta: {v.PathFuente}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
            <button onClick={descargarJson}
              className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg inline-flex items-center gap-1.5">
              <FileJson size={14} /> Descargar JSON
            </button>
            <button onClick={onClose}
              className="px-3 py-2 text-xs bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-semibold rounded-lg">
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Dato({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-slate-900/60 border border-white/5 rounded p-2">
      <div className="text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">{label}</div>
      <div className={`text-gray-100 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
