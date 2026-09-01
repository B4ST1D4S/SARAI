import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AccesoVascular } from '../../types';
import { ACCESO_LABELS } from '../../types';
import { EstadoBadge } from '../shared/Badges';

interface Props {
  accesos: AccesoVascular[];
  loading?: boolean;
  onNuevo?: () => void;
  onEditar?: (a: AccesoVascular) => void;
}

function AccesoIcon({ tipo }: { tipo: string }) {
  if (tipo.includes('FAV') || tipo.includes('INJERTO')) {
    return <span className="text-emerald-400 text-lg">🔗</span>;
  }
  return <span className="text-amber-400 text-lg">🩸</span>;
}

const ESTADO_ORDEN: Record<string, number> = {
  ACTIVO: 0, MADURACIÓN: 1, DISFUNCIONAL: 2, TROMBOSADO: 3, INFECTADO: 4, RETIRADO: 5,
};

export function AccesoVascularCard({ accesos, loading, onNuevo, onEditar }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...accesos].sort(
    (a, b) => (ESTADO_ORDEN[a.estado] ?? 9) - (ESTADO_ORDEN[b.estado] ?? 9)
  );

  return (
    <div className="rounded-xl border border-white/8 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[#00B4D8] text-sm">🔗</span>
          <span className="text-white font-semibold text-sm">Accesos Vasculares</span>
          <span className="text-white/40 text-xs">({accesos.length})</span>
        </div>
        {onNuevo && (
          <button
            onClick={onNuevo}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30
              hover:bg-[#00B4D8]/20 transition-colors font-medium"
          >
            + Nuevo acceso
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-white/40 text-sm">Cargando accesos…</div>
      ) : accesos.length === 0 ? (
        <div className="p-8 text-center text-white/40 text-sm">
          No hay accesos vasculares registrados
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {sorted.map((a) => (
            <motion.div
              key={a.id}
              className="px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer"
              onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            >
              <div className="flex items-center gap-3">
                <AccesoIcon tipo={a.tipo} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">
                      {ACCESO_LABELS[a.tipo] ?? a.tipo}
                    </span>
                    {a.lateralidad && (
                      <span className="text-white/50 text-xs">({a.lateralidad})</span>
                    )}
                    <EstadoBadge estado={a.estado} />
                  </div>
                  {a.sitio && (
                    <p className="text-white/40 text-xs mt-0.5">{a.sitio}</p>
                  )}
                </div>
                {a.flujoActual && (
                  <div className="text-right shrink-0">
                    <p className="text-[#00B4D8] font-bold text-sm">{a.flujoActual} mL/min</p>
                    {a.recirculacion && (
                      <p className={`text-xs ${a.recirculacion > 15 ? 'text-amber-400' : 'text-white/40'}`}>
                        Recirc: {a.recirculacion}%
                      </p>
                    )}
                  </div>
                )}
                <span className="text-white/30 text-xs ml-2">
                  {expanded === a.id ? '▲' : '▼'}
                </span>
              </div>

              <AnimatePresence>
                {expanded === a.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-hidden"
                  >
                    {[
                      { l: 'Creación', v: a.fechaCreacion ? new Date(a.fechaCreacion).toLocaleDateString('es-CO') : '—' },
                      { l: 'Primer uso', v: a.fechaUso ? new Date(a.fechaUso).toLocaleDateString('es-CO') : '—' },
                      { l: 'Flujo', v: a.flujoActual ? `${a.flujoActual} mL/min` : '—' },
                      { l: 'Recirculación', v: a.recirculacion ? `${a.recirculacion}%` : '—' },
                    ].map((item) => (
                      <div key={item.l} className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/40 text-xs">{item.l}</p>
                        <p className="text-white text-sm font-medium">{item.v}</p>
                      </div>
                    ))}
                    {a.observaciones && (
                      <div className="col-span-2 sm:col-span-4 bg-white/5 rounded-lg p-2">
                        <p className="text-white/40 text-xs">Observaciones</p>
                        <p className="text-white/80 text-sm">{a.observaciones}</p>
                      </div>
                    )}
                    {onEditar && (
                      <div className="col-span-2 sm:col-span-4 flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditar(a); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10
                            hover:bg-white/10 transition-colors"
                        >
                          Editar acceso
                        </button>
                      </div>
                    )}
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
