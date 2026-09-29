import { motion } from 'framer-motion';
import type { RiesgoKDIGO } from '../../types';
import { RIESGO_KDIGO_COLORS } from '../../types';

interface BadgeProps {
  riesgo: RiesgoKDIGO;
  size?: 'sm' | 'md';
}

const LABELS: Record<RiesgoKDIGO, string> = {
  BAJO: 'Riesgo Bajo',
  MODERADO: 'Riesgo Moderado',
  ALTO: 'Riesgo Alto',
  MUY_ALTO: 'Riesgo Muy Alto',
  DESCONOCIDO: 'Sin clasificar',
};

export function RiesgoKDIGOBadge({ riesgo, size = 'md' }: BadgeProps) {
  const color = RIESGO_KDIGO_COLORS[riesgo];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
      style={{ color, borderColor: `${color}55`, background: `${color}15` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {LABELS[riesgo]}
    </span>
  );
}

interface EstadoBadgeProps {
  estado: string;
  tipo?: 'inscripcion' | 'acceso' | 'sesion' | 'tamizaje';
}

const ESTADO_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVO:       { color: '#22c55e', bg: '#22c55e15', border: '#22c55e55' },
  RETIRADO:     { color: '#ef4444', bg: '#ef444415', border: '#ef444455' },
  TRASLADADO:   { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b55' },
  FALLECIDO:    { color: '#6b7280', bg: '#6b728015', border: '#6b728055' },
  ALTA:         { color: '#00B4D8', bg: '#00B4D815', border: '#00B4D855' },
  DISFUNCIONAL: { color: '#f97316', bg: '#f9731615', border: '#f9731655' },
  TROMBOSADO:   { color: '#ef4444', bg: '#ef444415', border: '#ef444455' },
  INFECTADO:    { color: '#ef4444', bg: '#ef444415', border: '#ef444455' },
  MADURACIÓN:   { color: '#a855f7', bg: '#a855f715', border: '#a855f755' },
  PROGRAMADA:   { color: '#00B4D8', bg: '#00B4D815', border: '#00B4D855' },
  EN_CURSO:     { color: '#22c55e', bg: '#22c55e15', border: '#22c55e55' },
  COMPLETADA:   { color: '#22c55e', bg: '#22c55e15', border: '#22c55e55' },
  SUSPENDIDA:   { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b55' },
  CANCELADA:    { color: '#6b7280', bg: '#6b728015', border: '#6b728055' },
  PENDIENTE:    { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b55' },
  REALIZADO:    { color: '#22c55e', bg: '#22c55e15', border: '#22c55e55' },
  NO_APLICA:    { color: '#6b7280', bg: '#6b728015', border: '#6b728055' },
};

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const s = ESTADO_STYLES[estado] ?? { color: '#9ca3af', bg: '#9ca3af15', border: '#9ca3af55' };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-xs font-semibold border px-2.5 py-0.5"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {estado.replace(/_/g, ' ')}
    </span>
  );
}

// Badge de alerta clínica
interface AlertaBadgeProps {
  tipo: 'info' | 'warning' | 'danger' | 'success';
  texto: string;
  icono?: string;
}

export function AlertaBadge({ tipo, texto, icono }: AlertaBadgeProps) {
  const styles = {
    info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    danger:  'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${styles[tipo]}`}
    >
      {icono && <span>{icono}</span>}
      <span>{texto}</span>
    </motion.div>
  );
}

// KtV indicator con semáforo
interface KtVIndicatorProps {
  valor?: number | null;
  meta?: number;
}

export function KtVIndicator({ valor, meta = 1.2 }: KtVIndicatorProps) {
  if (valor == null) {
    return <span className="text-white/40 text-sm">—</span>;
  }
  const ok = valor >= meta;
  const color = ok ? '#22c55e' : valor >= meta * 0.9 ? '#f59e0b' : '#ef4444';
  return (
    <span className="flex items-center gap-1.5 font-bold text-sm" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {valor.toFixed(2)}
      <span className="font-normal text-white/40 text-xs">/ meta {meta}</span>
    </span>
  );
}
