import { motion } from 'framer-motion';

interface KPICardProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  alert?: boolean;
  meta?: string;
  small?: boolean;
}

export function KPICard({
  label,
  value,
  unit,
  icon,
  color = '#00B4D8',
  trend,
  trendLabel,
  alert,
  meta,
  small,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-2 overflow-hidden
        ${alert ? 'border-red-500/40 bg-red-500/5' : 'border-white/8'}`}
    >
      {/* Glow superior */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-2">
        <span className={`text-white/60 font-medium leading-tight ${small ? 'text-xs' : 'text-xs'}`}>
          {label}
        </span>
        {icon && (
          <span className="text-lg shrink-0" style={{ color }}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span
          className={`font-black tracking-tight ${small ? 'text-2xl' : 'text-3xl'}`}
          style={{ color: alert ? '#ef4444' : color }}
        >
          {value != null ? value : '—'}
        </span>
        {unit && <span className="text-white/50 text-sm mb-0.5">{unit}</span>}
      </div>

      {(trend || trendLabel || meta) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={`text-xs font-semibold ${
                trend === 'up' ? 'text-emerald-400' :
                trend === 'down' ? 'text-red-400' :
                'text-white/40'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}{' '}
              {trendLabel}
            </span>
          )}
          {meta && <span className="text-white/30 text-xs">{meta}</span>}
        </div>
      )}
    </motion.div>
  );
}
