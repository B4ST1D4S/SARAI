import React from 'react';
import { Activity, Heart, Brain, Bone, Eye, UserCheck, Stethoscope } from 'lucide-react';
import { SubmoduloProps } from '../registry';
import { ExamenFisicoData } from '@/types/historiaClinica.types';

export const ExamenFisicoModule: React.FC<SubmoduloProps<ExamenFisicoData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const handleFieldChange = (field: keyof ExamenFisicoData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Estado General (Ancho completo arriba) */}
      <div className="bg-subtle/40 border border-border/80 rounded-xl p-3.5 space-y-1.5">
        <label htmlFor="ef-estado-general" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck size={14} className="text-primary" />
          <span>Estado General</span>
        </label>
        <textarea
          id="ef-estado-general"
          aria-label="Estado General"
          value={data.estadoGeneral || ''}
          onChange={(e) => handleFieldChange('estadoGeneral', e.target.value)}
          disabled={readOnly}
          rows={2}
          className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
          placeholder="Paciente alerta, orientado en sus tres esferas, afebril, hidratado, buen estado nutricional, sin signos de dificultad respiratoria..."
        />
      </div>

      {/* Grid segmentario: 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cabeza y Cuello */}
        <div className="space-y-1.5">
          <label htmlFor="ef-cabeza-cuello" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={13} className="text-primary" />
            <span>Cabeza y Cuello</span>
          </label>
          <textarea
            id="ef-cabeza-cuello"
            aria-label="Cabeza y Cuello"
            value={data.cabezaCuello || ''}
            onChange={(e) => handleFieldChange('cabezaCuello', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Normocéfalo, pupilas isocóricas reactivas a la luz, conjuntivas normocrómicas, mucosas húmedas, cuello móvil sin masas ni adenopatías..."
          />
        </div>

        {/* Tórax y Cardiopulmonar */}
        <div className="space-y-1.5">
          <label htmlFor="ef-torax-cardiopulmonar" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Heart size={13} className="text-primary" />
            <span>Tórax y Cardiopulmonar</span>
          </label>
          <textarea
            id="ef-torax-cardiopulmonar"
            aria-label="Tórax y Cardiopulmonar"
            value={data.toraxCardiopulmonar || ''}
            onChange={(e) => handleFieldChange('toraxCardiopulmonar', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Ruidos cardíacos rítmicos bien timbrados sin soplos, ruidos respiratorios con murmullo vesicular conservado sin agregados..."
          />
        </div>

        {/* Abdomen */}
        <div className="space-y-1.5">
          <label htmlFor="ef-abdomen" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="text-primary" />
            <span>Abdomen</span>
          </label>
          <textarea
            id="ef-abdomen"
            aria-label="Abdomen"
            value={data.abdomen || ''}
            onChange={(e) => handleFieldChange('abdomen', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Blando, depresible, no doloroso a la palpación superficial ni profunda, ruidos hidroaéreos presentes, sin megalias ni masas..."
          />
        </div>

        {/* Extremidades */}
        <div className="space-y-1.5">
          <label htmlFor="ef-extremidades" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope size={13} className="text-primary" />
            <span>Extremidades</span>
          </label>
          <textarea
            id="ef-extremidades"
            aria-label="Extremidades"
            value={data.extremidades || ''}
            onChange={(e) => handleFieldChange('extremidades', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Simétricas, eutróficas, pulsos periféricos presentes y simétricos, llenado capilar menor a 2 segundos, sin edemas..."
          />
        </div>

        {/* Neurológico */}
        <div className="space-y-1.5">
          <label htmlFor="ef-neurologico" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Brain size={13} className="text-primary" />
            <span>Neurológico</span>
          </label>
          <textarea
            id="ef-neurologico"
            aria-label="Neurológico"
            value={data.neurologico || ''}
            onChange={(e) => handleFieldChange('neurologico', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Escala de Glasgow 15/15, funciones mentales superiores conservadas, pares craneales sin alteraciones, sin signos meníngeos ni focalización..."
          />
        </div>

        {/* Osteomuscular */}
        <div className="space-y-1.5">
          <label htmlFor="ef-osteomuscular" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Bone size={13} className="text-primary" />
            <span>Osteomuscular</span>
          </label>
          <textarea
            id="ef-osteomuscular"
            aria-label="Osteomuscular"
            value={data.osteomuscular || ''}
            onChange={(e) => handleFieldChange('osteomuscular', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Arcos de movimiento activos y pasivos conservados, tono y fuerza muscular 5/5, sin deformidades óseas ni signos de inflamación articular..."
          />
        </div>
      </div>
    </div>
  );
};

export default ExamenFisicoModule;
