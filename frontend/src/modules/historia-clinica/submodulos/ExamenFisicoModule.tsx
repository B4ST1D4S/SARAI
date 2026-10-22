import React from 'react';
import { Stethoscope, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import type { ExamenFisicoData } from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_TEXTAREA, clasesCampo } from '../components/common/campos';

export type ExamenFisicoKey = keyof ExamenFisicoData;

/** Frase clínica estándar de un segmento sin hallazgos. */
export const TEXTO_NORMAL = 'Sin alteraciones evidentes al examen físico.';

export const SEGMENTOS: { id: ExamenFisicoKey; label: string }[] = [
  { id: 'estadoGeneral', label: 'Estado General' },
  { id: 'cabezaCuello', label: 'Cabeza y Cuello' },
  { id: 'toraxCardiopulmonar', label: 'Tórax y Cardiopulmonar' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'extremidades', label: 'Extremidades' },
  { id: 'neurologico', label: 'Neurológico' },
  { id: 'osteomuscular', label: 'Osteomuscular' },
];

type EstadoSegmento = 'vacio' | 'normal' | 'anormal';

const estadoDe = (valor: string | undefined): EstadoSegmento => {
  const texto = (valor ?? '').trim();
  if (texto === '') return 'vacio';
  return texto === TEXTO_NORMAL ? 'normal' : 'anormal';
};

/**
 * Objeto completo para el botón maestro. Si todo está normal, limpia todo;
 * si no, marca como normales solo los segmentos vacíos y conserva los
 * hallazgos anormales ya redactados.
 */
export function examenConNormales(data: ExamenFisicoData): ExamenFisicoData {
  const todosNormales = SEGMENTOS.every((s) => estadoDe(data[s.id]) === 'normal');
  return Object.fromEntries(
    SEGMENTOS.map(({ id }) => {
      if (todosNormales) return [id, ''];
      return [id, estadoDe(data[id]) === 'vacio' ? TEXTO_NORMAL : data[id]];
    }),
  ) as ExamenFisicoData;
}

const TARJETA: Record<EstadoSegmento, string> = {
  vacio: 'bg-subtle/40 border-border',
  normal: 'bg-subtle/40 border-primary/30',
  anormal: 'bg-warning/5 border-warning/40',
};

const PILDORA: Record<EstadoSegmento, string> = {
  vacio: 'bg-surface text-secondary border-border hover:border-primary hover:text-primary',
  normal: 'bg-primary text-primary-foreground border-primary',
  anormal: 'bg-warning/10 text-warning border-warning/40 hover:bg-warning/20',
};

const TEXTAREA: Record<EstadoSegmento, string> = {
  vacio: '',
  normal: '!text-secondary',
  anormal: '!border-warning focus:!border-warning focus:!ring-warning/40 font-semibold',
};

export const ExamenFisicoModule: React.FC<SubmoduloProps<ExamenFisicoData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const estados = SEGMENTOS.map((s) => estadoDe(data[s.id]));
  const todosNormales = estados.every((e) => e === 'normal');
  const sinVacios = estados.every((e) => e !== 'vacio');

  // Alterna un segmento entre normal y vacío; al pasar a vacío enfoca para redactar el hallazgo.
  const alternarSegmento = (id: ExamenFisicoKey) => {
    if (estadoDe(data[id]) === 'normal') {
      onChange({ [id]: '' });
      document.getElementById(`ef-${id}`)?.focus();
    } else {
      onChange({ [id]: TEXTO_NORMAL });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted">
          Describa los hallazgos al examen físico. Use los botones para alternar hallazgos normales o anormales.
        </p>
        <button
          type="button"
          onClick={() => onChange(examenConNormales(data))}
          disabled={readOnly || (!todosNormales && sinVacios)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
            todosNormales
              ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/15'
              : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
          }`}
        >
          {todosNormales ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
          <span>{todosNormales ? 'Desmarcar todo' : 'Marcar vacíos como normales'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SEGMENTOS.map(({ id, label }, i) => {
          const estado = estados[i];
          return (
            <div key={id} className={`space-y-2 p-3.5 rounded-xl border transition-all ${TARJETA[estado]}`}>
              <div className="flex items-center justify-between">
                <label htmlFor={`ef-${id}`} className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Stethoscope size={14} className={estado === 'anormal' ? 'text-warning' : 'text-primary'} />
                  {label}
                </label>

                <button
                  type="button"
                  onClick={() => alternarSegmento(id)}
                  disabled={readOnly}
                  title={estado === 'normal' ? 'Desmarcar para redactar un hallazgo anormal' : 'Marcar como normal'}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all select-none disabled:opacity-60 disabled:cursor-not-allowed ${PILDORA[estado]}`}
                >
                  {estado === 'normal' && <CheckCircle2 size={11} />}
                  {estado === 'anormal' && <AlertTriangle size={11} />}
                  <span>{estado === 'normal' ? 'Normal' : estado === 'anormal' ? 'Anormal' : 'Marcar normal'}</span>
                </button>
              </div>

              <textarea
                id={`ef-${id}`}
                value={data[id] ?? ''}
                onChange={(e) => onChange({ [id]: e.target.value })}
                disabled={readOnly}
                rows={2}
                placeholder="Describa hallazgos clínicos o anormalidades..."
                className={clasesCampo(ESTILO_TEXTAREA, TEXTAREA[estado])}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamenFisicoModule;
