import React from 'react';
import { ListChecks } from 'lucide-react';
import type { SubmoduloProps } from '../registry';
import type { RevisionSistemasData } from '@/types/historiaClinica.types';
import { ESTILO_LABEL, ESTILO_TEXTAREA } from '../components/common/campos';

export type { RevisionSistemasData };

export type SistemaKey = keyof RevisionSistemasData;

export const SISTEMAS: { id: SistemaKey; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'cardiovascular', label: 'Cardiovascular' },
  { id: 'respiratorio', label: 'Respiratorio' },
  { id: 'gastrointestinal', label: 'Gastrointestinal' },
  { id: 'genitourinario', label: 'Genitourinario' },
  { id: 'neurologico', label: 'Neurológico' },
  { id: 'dermatologico', label: 'Dermatológico' },
  { id: 'osteomuscular', label: 'Osteomuscular' },
  { id: 'endocrino', label: 'Endocrino' },
  { id: 'organosSentidos', label: 'Órganos de los Sentidos' },
  { id: 'psiquiatrico', label: 'Psiquiátrico' },
  { id: 'linfatico', label: 'Linfático' },
];

export const RevisionSistemasModule: React.FC<SubmoduloProps<RevisionSistemasData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => (
  <div className="space-y-3">
    <p className="text-xs text-muted flex items-center gap-1.5">
      <ListChecks size={13} className="text-primary" />
      Registre los síntomas referidos por sistema. Deje en blanco los sistemas no interrogados.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {SISTEMAS.map(({ id, label }) => (
        <div key={id} className="space-y-1.5">
          <label htmlFor={`rxs-${id}`} className={`${ESTILO_LABEL} block`}>
            {label}
          </label>
          <textarea
            id={`rxs-${id}`}
            value={data[id] ?? ''}
            onChange={(e) => onChange({ [id]: e.target.value })}
            disabled={readOnly}
            rows={2}
            placeholder="Niega / hallazgos referidos..."
            className={ESTILO_TEXTAREA}
          />
        </div>
      ))}
    </div>
  </div>
);

export default RevisionSistemasModule;
