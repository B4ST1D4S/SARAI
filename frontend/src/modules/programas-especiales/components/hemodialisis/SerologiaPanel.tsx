// P3 – Panel de Estado Serológico con semáforo de colores
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SerologiaData, ResultadoSerologia } from '../../types';
import {
  MARCADOR_LABELS,
  RESULTADO_SEROLOGIA_COLOR,
  RESULTADO_SEROLOGIA_LABEL,
} from '../../types';

interface Props {
  data: SerologiaData | null;
  loading?: boolean;
  guardando?: boolean;
  onGuardar: (data: {
    marcador: string;
    resultado: string;
    valorNumerico?: number;
    fechaToma?: string;
    fechaResultado?: string;
    laboratorio?: string;
    observaciones?: string;
  }) => Promise<void>;
}

interface FormState {
  marcador: string;
  resultado: ResultadoSerologia;
  valorNumerico: string;
  fechaToma: string;
  fechaResultado: string;
  laboratorio: string;
  observaciones: string;
}

const RESULTADO_OPCIONES: ResultadoSerologia[] = [
  'NO_REACTIVO', 'REACTIVO', 'INDETERMINADO', 'PENDIENTE',
];

export function SerologiaPanel({ data, loading, guardando, onGuardar }: Props) {
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    marcador: '',
    resultado: 'PENDIENTE',
    valorNumerico: '',
    fechaToma: '',
    fechaResultado: '',
    laboratorio: '',
    observaciones: '',
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/4 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  function abrirEdicion(marcador: string) {
    const existente = data!.mapa[marcador];
    setForm({
      marcador,
      resultado: (existente?.resultado as ResultadoSerologia) ?? 'PENDIENTE',
      valorNumerico: existente?.valorNumerico?.toString() ?? '',
      fechaToma: existente?.fechaToma?.substring(0, 10) ?? '',
      fechaResultado: existente?.fechaResultado?.substring(0, 10) ?? '',
      laboratorio: existente?.laboratorio ?? '',
      observaciones: existente?.observaciones ?? '',
    });
    setEditando(marcador);
  }

  async function handleGuardar() {
    await onGuardar({
      marcador: form.marcador,
      resultado: form.resultado,
      valorNumerico: form.valorNumerico ? Number(form.valorNumerico) : undefined,
      fechaToma: form.fechaToma || undefined,
      fechaResultado: form.fechaResultado || undefined,
      laboratorio: form.laboratorio || undefined,
      observaciones: form.observaciones || undefined,
    });
    setEditando(null);
  }

  const pendientesCount = data.marcadores.filter(
    (m) => !data.mapa[m] || data.mapa[m]?.resultado === 'PENDIENTE'
  ).length;

  const reactivosCount = data.marcadores.filter(
    (m) => data.mapa[m]?.resultado === 'REACTIVO'
  ).length;

  return (
    <div>
      {/* Resumen rápido */}
      {(pendientesCount > 0 || reactivosCount > 0) && (
        <div className="flex gap-2 mb-3">
          {reactivosCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              ⚠️ {reactivosCount} reactivo{reactivosCount > 1 ? 's' : ''}
            </span>
          )}
          {pendientesCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/6 text-white/40 border border-white/10">
              {pendientesCount} pendiente{pendientesCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Tabla de marcadores */}
      <div className="space-y-1.5">
        {data.marcadores.map((marcador) => {
          const r = data.mapa[marcador];
          const resultado = (r?.resultado ?? 'PENDIENTE') as ResultadoSerologia;
          const estilos = RESULTADO_SEROLOGIA_COLOR[resultado];
          const esEditando = editando === marcador;

          return (
            <motion.div key={marcador} layout>
              {/* Fila principal */}
              <button
                onClick={() => esEditando ? setEditando(null) : abrirEdicion(marcador)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                  esEditando
                    ? 'border-[#00B4D8]/40 bg-[#00B4D8]/8'
                    : 'border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15'
                }`}
              >
                {/* Semáforo */}
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  resultado === 'REACTIVO'      ? 'bg-red-400' :
                  resultado === 'NO_REACTIVO'   ? 'bg-green-400' :
                  resultado === 'INDETERMINADO' ? 'bg-yellow-400' :
                  'bg-white/20'
                }`} />

                {/* Nombre del marcador */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">{marcador}</p>
                  <p className="text-white/30 text-[11px] truncate leading-tight">
                    {MARCADOR_LABELS[marcador]?.split(' – ')[1] ?? ''}
                  </p>
                </div>

                {/* Resultado badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${estilos.bg} ${estilos.text} ${estilos.border}`}>
                  {RESULTADO_SEROLOGIA_LABEL[resultado]}
                </span>

                {/* Fecha */}
                {r?.fechaResultado && (
                  <span className="text-white/30 text-xs shrink-0">
                    {new Date(r.fechaResultado).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short',
                    })}
                  </span>
                )}

                {/* Chevron */}
                <svg className={`w-3.5 h-3.5 text-white/20 shrink-0 transition-transform ${esEditando ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Formulario de edición */}
              <AnimatePresence>
                {esEditando && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 p-3 rounded-lg bg-white/3 border border-white/8 space-y-3">
                      {/* Resultado */}
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Resultado</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {RESULTADO_OPCIONES.map((op) => {
                            const est = RESULTADO_SEROLOGIA_COLOR[op];
                            return (
                              <button
                                key={op}
                                onClick={() => setForm((f) => ({ ...f, resultado: op }))}
                                className={`py-1.5 px-2 rounded-lg text-xs border transition-all ${
                                  form.resultado === op
                                    ? `${est.bg} ${est.text} ${est.border}`
                                    : 'bg-white/3 text-white/40 border-white/8 hover:bg-white/6'
                                }`}
                              >
                                {RESULTADO_SEROLOGIA_LABEL[op]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* AntiHBs valor numérico */}
                      {marcador === 'AntiHBs' && (
                        <div>
                          <label className="block text-xs text-white/50 mb-1">
                            Título AntiHBs (UI/mL)
                            <span className="text-white/30 ml-1">— protegido si ≥ 10 UI/mL</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={form.valorNumerico}
                            onChange={(e) => setForm((f) => ({ ...f, valorNumerico: e.target.value }))}
                            placeholder="ej: 100"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                      )}

                      {/* Fechas + Laboratorio */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-white/50 mb-1">Fecha de toma</label>
                          <input
                            type="date"
                            value={form.fechaToma}
                            onChange={(e) => setForm((f) => ({ ...f, fechaToma: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1">Fecha resultado</label>
                          <input
                            type="date"
                            value={form.fechaResultado}
                            onChange={(e) => setForm((f) => ({ ...f, fechaResultado: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-white/50 mb-1">Laboratorio</label>
                        <input
                          type="text"
                          value={form.laboratorio}
                          onChange={(e) => setForm((f) => ({ ...f, laboratorio: e.target.value }))}
                          placeholder="Nombre del laboratorio"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm"
                        />
                      </div>

                      {/* Botones */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditando(null)}
                          className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleGuardar}
                          disabled={guardando}
                          className="px-4 py-1.5 rounded-lg bg-[#00B4D8] text-white text-xs font-medium hover:bg-[#00B4D8]/80 disabled:opacity-50 transition-colors"
                        >
                          {guardando ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
