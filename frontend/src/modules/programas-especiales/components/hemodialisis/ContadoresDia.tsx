// P6 – Contadores en tiempo real de la jornada HD
import { motion } from 'framer-motion';
import type { ContadoresDia } from '../../types';

interface Contador {
  label: string;
  valor: number;
  color: string;
  dot: string;
  icon: string;
}

interface Props {
  contadores: ContadoresDia;
  loading?: boolean;
  onRefresh?: () => void;
}

export function ContadoresDia({ contadores, loading, onRefresh }: Props) {
  const items: Contador[] = [
    {
      label:  'Programados hoy',
      valor:  contadores.programadosHoy,
      color:  'text-white/70',
      dot:    'bg-white/30',
      icon:   '🗓',
    },
    {
      label:  'En sala',
      valor:  contadores.enSala,
      color:  'text-emerald-400',
      dot:    'bg-emerald-400',
      icon:   '🟢',
    },
    {
      label:  'Finalizados',
      valor:  contadores.finalizados,
      color:  'text-[#00B4D8]',
      dot:    'bg-[#00B4D8]',
      icon:   '✅',
    },
    {
      label:  'Ausentes',
      valor:  contadores.ausentes,
      color:  contadores.ausentes > 0 ? 'text-red-400' : 'text-white/40',
      dot:    contadores.ausentes > 0 ? 'bg-red-400' : 'bg-white/20',
      icon:   '⚠️',
    },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
          <span className={`text-lg font-bold leading-none ${item.color}`}>
            {loading ? '–' : item.valor}
          </span>
          <span className="text-white/40 text-xs">{item.label}</span>
        </motion.div>
      ))}

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          title="Actualizar contadores"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
}
