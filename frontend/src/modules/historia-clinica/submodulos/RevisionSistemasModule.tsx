import React from 'react';
import {
  Activity,
  Heart,
  Wind,
  Utensils,
  Droplets,
  Brain,
  Bone,
  Sparkles,
} from 'lucide-react';
import { SubmoduloProps } from '../registry';
import { RevisionSistemasData } from '@/types/historiaClinica.types';

export const RevisionSistemasModule: React.FC<SubmoduloProps<RevisionSistemasData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const handleFieldChange = (field: keyof RevisionSistemasData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted mb-1">
        Interrogatorio por sistemas orientado a la identificación de sintomatología concomitante o no referida en el motivo de consulta.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. General */}
        <div className="space-y-1.5">
          <label htmlFor="rs-general" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="text-primary" />
            <span>General / Constitucional</span>
          </label>
          <textarea
            id="rs-general"
            aria-label="General / Constitucional"
            value={data.general || ''}
            onChange={(e) => handleFieldChange('general', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Sin astenia, adinamia, fiebre ni pérdida de peso no justificada..."
          />
        </div>

        {/* 2. Cardiovascular */}
        <div className="space-y-1.5">
          <label htmlFor="rs-cardiovascular" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Heart size={13} className="text-primary" />
            <span>Cardiovascular</span>
          </label>
          <textarea
            id="rs-cardiovascular"
            aria-label="Cardiovascular"
            value={data.cardiovascular || ''}
            onChange={(e) => handleFieldChange('cardiovascular', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega dolor torácico precordial, palpitaciones, ortopnea o disnea de esfuerzo..."
          />
        </div>

        {/* 3. Respiratorio */}
        <div className="space-y-1.5">
          <label htmlFor="rs-respiratorio" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Wind size={13} className="text-primary" />
            <span>Respiratorio</span>
          </label>
          <textarea
            id="rs-respiratorio"
            aria-label="Respiratorio"
            value={data.respiratorio || ''}
            onChange={(e) => handleFieldChange('respiratorio', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega tos, disnea, expectoración, sibilancias o hemoptisis..."
          />
        </div>

        {/* 4. Gastrointestinal */}
        <div className="space-y-1.5">
          <label htmlFor="rs-gastrointestinal" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Utensils size={13} className="text-primary" />
            <span>Gastrointestinal</span>
          </label>
          <textarea
            id="rs-gastrointestinal"
            aria-label="Gastrointestinal"
            value={data.gastrointestinal || ''}
            onChange={(e) => handleFieldChange('gastrointestinal', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega pirosis, disfagia, náuseas, emesis, dolor epigástrico o cambios en hábito intestinal..."
          />
        </div>

        {/* 5. Genitourinario */}
        <div className="space-y-1.5">
          <label htmlFor="rs-genitourinario" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Droplets size={13} className="text-primary" />
            <span>Genitourinario</span>
          </label>
          <textarea
            id="rs-genitourinario"
            aria-label="Genitourinario"
            value={data.genitourinario || ''}
            onChange={(e) => handleFieldChange('genitourinario', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega disuria, polaquiuria, hematuria, tenesmo vesical ni secreciones uretrales/vaginales..."
          />
        </div>

        {/* 6. Neurológico */}
        <div className="space-y-1.5">
          <label htmlFor="rs-neurologico" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Brain size={13} className="text-primary" />
            <span>Neurológico</span>
          </label>
          <textarea
            id="rs-neurologico"
            aria-label="Neurológico"
            value={data.neurologico || ''}
            onChange={(e) => handleFieldChange('neurologico', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega cefalea, mareo, síncope, convulsiones, parestesias ni déficit motor o sensitivo..."
          />
        </div>

        {/* 7. Osteomuscular */}
        <div className="space-y-1.5">
          <label htmlFor="rs-osteomuscular" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Bone size={13} className="text-primary" />
            <span>Osteomuscular</span>
          </label>
          <textarea
            id="rs-osteomuscular"
            aria-label="Osteomuscular"
            value={data.osteomuscular || ''}
            onChange={(e) => handleFieldChange('osteomuscular', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega artralgias, mialgias, rigidez matutina, inflamación articular ni limitación funcional..."
          />
        </div>

        {/* 8. Dermatológico */}
        <div className="space-y-1.5">
          <label htmlFor="rs-dermatologico" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            <span>Dermatológico</span>
          </label>
          <textarea
            id="rs-dermatologico"
            aria-label="Dermatológico"
            value={data.dermatologico || ''}
            onChange={(e) => handleFieldChange('dermatologico', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Niega lesiones dérmicas, prurito, cambios en lunares/nevos o alteraciones ungueales..."
          />
        </div>
      </div>
    </div>
  );
};

export default RevisionSistemasModule;
