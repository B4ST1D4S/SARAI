import React from 'react';
import type { PiezaHallazgo, OdontoHallazgo } from '../../services/odontologiaService';

// ════════════════════════════════════════════════════════════════
//  ODONTOGRAMA INTERACTIVO (Numeración FDI · 5 superficies por pieza)
//  - Vestibular (V) · Lingual/Palatina (L) · Oclusal/Incisal (O)
//  - Mesial (M) · Distal (D)  → calculado por cuadrante
//  Touch-friendly · pinta con el hallazgo/estado seleccionado (máx. 2 clics)
// ════════════════════════════════════════════════════════════════

export const SUPERFICIES = [
  { code: 'V', label: 'Vestibular' },
  { code: 'L', label: 'Lingual / Palatina' },
  { code: 'O', label: 'Oclusal / Incisal' },
  { code: 'M', label: 'Mesial' },
  { code: 'D', label: 'Distal' },
];

// Cuadrantes FDI (permanente y temporal)
const PERMANENTE = {
  supDerecha: [18, 17, 16, 15, 14, 13, 12, 11],
  supIzquierda: [21, 22, 23, 24, 25, 26, 27, 28],
  infDerecha: [48, 47, 46, 45, 44, 43, 42, 41],
  infIzquierda: [31, 32, 33, 34, 35, 36, 37, 38],
};
const TEMPORAL = {
  supDerecha: [55, 54, 53, 52, 51],
  supIzquierda: [61, 62, 63, 64, 65],
  infDerecha: [85, 84, 83, 82, 81],
  infIzquierda: [71, 72, 73, 74, 75],
};

// Mesial: cuadrantes 1,4,5,8 → zona derecha · cuadrantes 2,3,6,7 → zona izquierda
function ladoMesial(diente: number): 'right' | 'left' {
  const q = Math.floor(diente / 10);
  return q === 1 || q === 4 || q === 5 || q === 8 ? 'right' : 'left';
}

interface ToothProps {
  diente: number;
  piezas: PiezaHallazgo[];
  onSurface: (diente: number, superficie: string | null) => void;
  readOnly?: boolean;
}

const Tooth: React.FC<ToothProps> = ({ diente, piezas, onSurface, readOnly }) => {
  const mesialRight = ladoMesial(diente) === 'right';
  // map zona física → superficie anatómica
  const rightCode = mesialRight ? 'M' : 'D';
  const leftCode = mesialRight ? 'D' : 'M';

  const findSurface = (code: string | null) =>
    piezas.find((p) => p.diente === diente && (p.superficie || null) === code);

  const whole = findSurface(null);
  const colorFor = (code: string | null) => {
    const f = findSurface(code);
    if (!f) return undefined;
    return f.colorOverride || f.estado?.color || f.hallazgo?.color || '#ef4444';
  };

  const S = 40;
  const a = 12; // inset del centro
  const zone = (code: string, points: string) => {
    const fill = colorFor(code);
    return (
      <polygon
        points={points}
        fill={fill || 'transparent'}
        stroke="#475569"
        strokeWidth={0.6}
        className={readOnly ? '' : 'cursor-pointer hover:opacity-80 transition-opacity'}
        onClick={readOnly ? undefined : (e) => { e.stopPropagation(); onSurface(diente, code); }}
      />
    );
  };

  const wholeColor = whole ? whole.colorOverride || whole.hallazgo?.color || '#1f2937' : undefined;

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <span className="text-[10px] font-bold text-gray-400 tabular-nums">{diente}</span>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} className="rounded-sm overflow-visible">
        {/* fondo pieza completa */}
        <rect
          x={0} y={0} width={S} height={S} rx={3}
          fill={wholeColor ? `${wholeColor}22` : 'rgba(255,255,255,0.02)'}
          stroke={wholeColor || '#334155'}
          strokeWidth={wholeColor ? 1.4 : 0.8}
        />
        {/* Vestibular (arriba) */}
        {zone('V', `0,0 ${S},0 ${S - a},${a} ${a},${a}`)}
        {/* Lingual/Palatina (abajo) */}
        {zone('L', `0,${S} ${S},${S} ${S - a},${S - a} ${a},${S - a}`)}
        {/* Zona derecha */}
        {zone(rightCode, `${S},0 ${S},${S} ${S - a},${S - a} ${S - a},${a}`)}
        {/* Zona izquierda */}
        {zone(leftCode, `0,0 0,${S} ${a},${S - a} ${a},${a}`)}
        {/* Oclusal/Incisal (centro) */}
        <rect
          x={a} y={a} width={S - 2 * a} height={S - 2 * a}
          fill={colorFor('O') || 'transparent'}
          stroke="#475569" strokeWidth={0.6}
          className={readOnly ? '' : 'cursor-pointer hover:opacity-80 transition-opacity'}
          onClick={readOnly ? undefined : (e) => { e.stopPropagation(); onSurface(diente, 'O'); }}
        />
        {/* marcador pieza completa: X si ausente */}
        {whole && whole.hallazgo?.codigo === 'AUSENTE' && (
          <g stroke={whole.hallazgo?.color || '#1f2937'} strokeWidth={2.4} strokeLinecap="round">
            <line x1={6} y1={6} x2={S - 6} y2={S - 6} />
            <line x1={S - 6} y1={6} x2={6} y2={S - 6} />
          </g>
        )}
        {/* círculo para corona/implante/protesis completas */}
        {whole && ['CORONA', 'IMPLANTE', 'PROTESIS'].includes(whole.hallazgo?.codigo || '') && (
          <circle cx={S / 2} cy={S / 2} r={S / 2 - 5} fill="none" stroke={whole.hallazgo?.color || '#6b7280'} strokeWidth={2} />
        )}
      </svg>
      {/* botón pieza completa */}
      {!readOnly && (
        <button
          onClick={() => onSurface(diente, null)}
          title="Marcar pieza completa"
          className="w-full h-1.5 rounded-full bg-white/5 hover:bg-yellow-500/40 transition-colors"
        />
      )}
    </div>
  );
};

interface OdontogramaProps {
  piezas: PiezaHallazgo[];
  onSurface: (diente: number, superficie: string | null) => void;
  denticion?: string;
  readOnly?: boolean;
}

const Fila: React.FC<{ dientes: number[]; piezas: PiezaHallazgo[]; onSurface: OdontogramaProps['onSurface']; readOnly?: boolean }> = ({ dientes, piezas, onSurface, readOnly }) => (
  <div className="flex gap-1">
    {dientes.map((d) => (
      <Tooth key={d} diente={d} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
    ))}
  </div>
);

const OdontogramaInteractivo: React.FC<OdontogramaProps> = ({ piezas, onSurface, denticion = 'PERMANENTE', readOnly }) => {
  const mostrarPerm = denticion === 'PERMANENTE' || denticion === 'MIXTA';
  const mostrarTemp = denticion === 'TEMPORAL' || denticion === 'MIXTA';

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-3 p-4 rounded-2xl bg-[#0d0f14] border border-white/10 min-w-max">
        {mostrarPerm && (
          <>
            {/* Arcada superior */}
            <div className="flex items-center gap-3">
              <Fila dientes={PERMANENTE.supDerecha} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
              <div className="w-px self-stretch bg-yellow-500/30" />
              <Fila dientes={PERMANENTE.supIzquierda} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
            </div>
            <div className="h-px bg-white/10" />
            {/* Arcada inferior */}
            <div className="flex items-center gap-3">
              <Fila dientes={PERMANENTE.infDerecha} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
              <div className="w-px self-stretch bg-yellow-500/30" />
              <Fila dientes={PERMANENTE.infIzquierda} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
            </div>
          </>
        )}
        {mostrarTemp && (
          <>
            {mostrarPerm && <div className="h-px bg-white/10 my-1" />}
            <p className="text-[10px] font-bold text-cyan-400/70 tracking-widest">DENTICIÓN TEMPORAL</p>
            <div className="flex items-center gap-3">
              <Fila dientes={TEMPORAL.supDerecha} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
              <div className="w-px self-stretch bg-cyan-500/30" />
              <Fila dientes={TEMPORAL.supIzquierda} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Fila dientes={TEMPORAL.infDerecha} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
              <div className="w-px self-stretch bg-cyan-500/30" />
              <Fila dientes={TEMPORAL.infIzquierda} piezas={piezas} onSurface={onSurface} readOnly={readOnly} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OdontogramaInteractivo;
export { PERMANENTE, TEMPORAL };
