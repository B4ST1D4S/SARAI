import React from 'react';
import { SubmoduloProps } from '../registry';

export interface MotivoConsultaData {
  motivo?: string;
  enfermedadActual?: string;
}

export const MotivoConsultaModule: React.FC<SubmoduloProps<MotivoConsultaData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
          Motivo de Consulta <span className="text-danger">*</span>
        </label>
        <textarea
          value={data.motivo || ''}
          onChange={(e) => onChange({ motivo: e.target.value })}
          disabled={readOnly}
          rows={2}
          className="w-full bg-subtle border border-border rounded-xl p-3.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
          placeholder="Describa textualmente el motivo expresado por el paciente..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
          Enfermedad Actual <span className="text-danger">*</span>
        </label>
        <textarea
          value={data.enfermedadActual || ''}
          onChange={(e) => onChange({ enfermedadActual: e.target.value })}
          disabled={readOnly}
          rows={4}
          className="w-full bg-subtle border border-border rounded-xl p-3.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
          placeholder="Evolución cronológica del cuadro clínico, síntomas asociados, tratamientos previos recibidos..."
        />
      </div>
    </div>
  );
};

export default MotivoConsultaModule;