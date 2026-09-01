import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SesionHemodialisis } from '../../types';
import { EstadoBadge, KtVIndicator } from '../shared/Badges';

interface Props {
  sesiones: SesionHemodialisis[];
  total: number;
  loading?: boolean;
  onNueva?: () => void;
  onVer?: (s: SesionHemodialisis) => void;
  onEditar?: (s: SesionHemodialisis) => void;
}

const TURNO_LABEL: Record<string, string> = {
  MANANA: '☀️ Mañana',
  TARDE:  '🌤️ Tarde',
  NOCHE:  '🌙 Noche',
};

function ParamPill({ label, value, alert }: { label: string; value: string | null; alert?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${alert ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
      <p className="text-white/40 text-xs leading-none mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value ?? '—'}</p>
    </div>
  );
}

export function SesionDialisisList({ sesiones, total, loading, onNueva, onVer, onEditar }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-white/8 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[#00B4D8]">💧</span>
          <span className="text-white font-semibold text-sm">Sesiones de Hemodiálisis</span>
          <span className="text-white/40 text-xs">({total} total)</span>
        </div>
        {onNueva && (
          <button
            onClick={onNueva}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30
              hover:bg-[#00B4D8]/20 transition-colors font-medium"
          >
            + Nueva sesión
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-white/40 text-sm">Cargando sesiones…</div>
      ) : sesiones.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-white/40 text-sm">No hay sesiones registradas</p>
          {onNueva && (
            <button
              onClick={onNueva}
              className="mt-3 text-xs px-4 py-2 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30
                hover:bg-[#00B4D8]/20 transition-colors"
            >
              Registrar primera sesión
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {sesiones.map((s) => (
            <motion.div
              key={s.id}
              className="hover:bg-white/3 transition-colors"
            >
              {/* Fila principal */}
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                {/* Número de sesión */}
                <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/15 border border-[#00B4D8]/25 flex items-center justify-center shrink-0">
                  <span className="text-[#00B4D8] font-bold text-sm">
                    {s.numeroSesion ?? '#'}
                  </span>
                </div>

                {/* Fecha y turno */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">
                      {new Date(s.fechaSesion).toLocaleDateString('es-CO', {
                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                    {s.turno && (
                      <span className="text-white/50 text-xs">{TURNO_LABEL[s.turno] ?? s.turno}</span>
                    )}
                    <EstadoBadge estado={s.estadoSesion} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {s.maquina && (
                      <span className="text-white/40 text-xs">🖥 {s.maquina.codigo} – Sillón {s.sillon ?? s.maquina.sillon ?? '?'}</span>
                    )}
                    {s.enfermero && (
                      <span className="text-white/40 text-xs">👩‍⚕️ {s.enfermero}</span>
                    )}
                  </div>
                </div>

                {/* Parámetros clave */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Peso */}
                  <div className="text-right">
                    <p className="text-white/40 text-xs">Peso pre/post</p>
                    <p className="text-white text-sm font-medium">
                      {s.pesoPre} / {s.pesoPost ?? '?'} kg
                    </p>
                    {s.pesoSeco && (
                      <p className="text-white/40 text-xs">Seco: {s.pesoSeco} kg</p>
                    )}
                  </div>
                  {/* UF */}
                  <div className="text-right">
                    <p className="text-white/40 text-xs">UF</p>
                    <p className="text-white text-sm font-medium">
                      {s.ufReal ?? s.ufPrescrita ?? '?'} L
                    </p>
                    <p className="text-white/40 text-xs">
                      {s.tiempoReal ?? s.tiempoPrescrito ?? '?'} min
                    </p>
                  </div>
                  {/* Kt/V */}
                  <div className="text-right">
                    <p className="text-white/40 text-xs">Kt/V</p>
                    <KtVIndicator valor={s.ktVSesion} />
                    {s.urrSesion != null && (
                      <p className={`text-xs ${s.urrSesion >= 65 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        URR {s.urrSesion.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-white/30 text-xs ml-2">{expanded === s.id ? '▲' : '▼'}</span>
              </div>

              {/* Detalle expandible */}
              <AnimatePresence>
                {expanded === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="px-4 py-4 bg-white/3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                        <ParamPill label="PA Pre" value={s.taSistolicaPre ? `${s.taSistolicaPre}/${s.taDiastolicaPre}` : null} />
                        <ParamPill label="PA Post" value={s.taSistolicaPost ? `${s.taSistolicaPost}/${s.taDiastolicaPost}` : null} />
                        <ParamPill label="FC Pre" value={s.frecCardiacaPre ? `${s.frecCardiacaPre} lpm` : null} />
                        <ParamPill label="FC Post" value={s.frecCardiacaPost ? `${s.frecCardiacaPost} lpm` : null} />
                        <ParamPill label="QB prescrito" value={s.qbPrescrito ? `${s.qbPrescrito} mL/min` : null} />
                        <ParamPill label="QB real" value={s.qbReal ? `${s.qbReal} mL/min` : null} />
                        <ParamPill label="UF prescrita" value={s.ufPrescrita ? `${s.ufPrescrita} L` : null} />
                        <ParamPill label="UF lograda" value={s.ufReal ? `${s.ufReal} L` : null} />
                        <ParamPill label="Filtro" value={s.filtroTipo ?? null} />
                        <ParamPill label="Heparina total" value={s.heparinaTotal ? `${s.heparinaTotal} UI` : null} />
                        <ParamPill
                          label="Tolerancia"
                          value={s.toleranciaDialisis ?? null}
                          alert={s.toleranciaDialisis === 'MALA'}
                        />
                        <ParamPill label="Temp. pre" value={s.temperaturaPre ? `${s.temperaturaPre}°C` : null} />
                      </div>

                      {s.incidencias && s.incidencias.length > 0 && (
                        <div className="mb-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <p className="text-amber-400 text-xs font-semibold mb-1">⚠️ Incidencias</p>
                          <div className="flex flex-wrap gap-2">
                            {s.incidencias.map((inc, i) => (
                              <span key={i} className="text-xs bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full">
                                {inc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.observaciones && (
                        <div className="p-3 bg-white/5 rounded-lg mb-3">
                          <p className="text-white/40 text-xs mb-1">Observaciones</p>
                          <p className="text-white/80 text-sm">{s.observaciones}</p>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        {onVer && (
                          <button
                            onClick={() => onVer(s)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30
                              hover:bg-[#00B4D8]/20 transition-colors"
                          >
                            Ver detalle completo
                          </button>
                        )}
                        {onEditar && s.estadoSesion !== 'COMPLETADA' && (
                          <button
                            onClick={() => onEditar(s)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10
                              hover:bg-white/10 transition-colors"
                          >
                            Editar sesión
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
