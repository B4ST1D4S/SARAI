import React from 'react';
import { AlertTriangle, User, Users, HeartPulse } from 'lucide-react';
import { SubmoduloProps } from '../registry';
import { AntecedentesData, GinecoObstetricosData } from '@/types/historiaClinica.types';

export const AntecedentesModule: React.FC<SubmoduloProps<AntecedentesData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const handleFieldChange = (field: keyof Omit<AntecedentesData, 'ginecoObstetricos'>, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleGinecoChange = (field: keyof GinecoObstetricosData, value: string | number | undefined) => {
    onChange({
      ...data,
      ginecoObstetricos: {
        ...(data.ginecoObstetricos || {}),
        [field]: value,
      },
    });
  };

  const gineco = data.ginecoObstetricos || {};

  return (
    <div className="space-y-5">
      {/* 1. Antecedentes Personales */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/50">
          <User size={14} className="text-primary" />
          <span>Antecedentes Personales</span>
        </h4>

        {/* Alerta Crítica: Alergias con indicador/badge visual de seguridad asistencial */}
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label htmlFor="ant-alergicos" className="text-xs font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
              <span>Alérgicos</span>
              <span className="text-danger">*</span>
            </label>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger/15 border border-danger/30 text-danger text-[10px] font-bold">
              <AlertTriangle size={12} />
              <span>Seguridad Asistencial / Alerta Crítica</span>
            </div>
          </div>
          <textarea
            id="ant-alergicos"
            aria-label="Antecedentes Alérgicos"
            value={data.alergicos || ''}
            onChange={(e) => handleFieldChange('alergicos', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-surface border border-danger/30 rounded-lg p-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/40 transition-all disabled:opacity-60 resize-y"
            placeholder="Medicamentos (penicilina, AINEs), alimentos, látex, sustancias de contraste..."
          />
        </div>

        {/* Grid de Personales: Patológicos, Farmacológicos, Quirúrgicos, Tóxicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ant-patologicos" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Patológicos
            </label>
            <textarea
              id="ant-patologicos"
              aria-label="Antecedentes Patológicos"
              value={data.patologicos || ''}
              onChange={(e) => handleFieldChange('patologicos', e.target.value)}
              disabled={readOnly}
              rows={2}
              className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
              placeholder="HTA, diabetes, cardiopatías, asma, renales..."
            />
          </div>

          <div>
            <label htmlFor="ant-farmacologicos" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Farmacológicos
            </label>
            <textarea
              id="ant-farmacologicos"
              aria-label="Antecedentes Farmacológicos"
              value={data.farmacologicos || ''}
              onChange={(e) => handleFieldChange('farmacologicos', e.target.value)}
              disabled={readOnly}
              rows={2}
              className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
              placeholder="Medicamentos habituales, dosis, posología..."
            />
          </div>

          <div>
            <label htmlFor="ant-quirurgicos" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Quirúrgicos
            </label>
            <textarea
              id="ant-quirurgicos"
              aria-label="Antecedentes Quirúrgicos"
              value={data.quirurgicos || ''}
              onChange={(e) => handleFieldChange('quirurgicos', e.target.value)}
              disabled={readOnly}
              rows={2}
              className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
              placeholder="Procedimientos quirúrgicos previos, fecha, complicaciones..."
            />
          </div>

          <div>
            <label htmlFor="ant-toxicos" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Tóxicos
            </label>
            <textarea
              id="ant-toxicos"
              aria-label="Antecedentes Tóxicos"
              value={data.toxicos || ''}
              onChange={(e) => handleFieldChange('toxicos', e.target.value)}
              disabled={readOnly}
              rows={2}
              className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
              placeholder="Tabaquismo, alcohol, sustancias psicoactivas..."
            />
          </div>
        </div>
      </div>

      {/* 2. Antecedentes Familiares */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/50">
          <Users size={14} className="text-primary" />
          <span>Antecedentes Familiares</span>
        </h4>
        <div>
          <label htmlFor="ant-familiares" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
            Familiares (Línea directa)
          </label>
          <textarea
            id="ant-familiares"
            aria-label="Antecedentes Familiares"
            value={data.familiares || ''}
            onChange={(e) => handleFieldChange('familiares', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
            placeholder="HTA, diabetes, cáncer, cardiopatías en padres o hermanos..."
          />
        </div>
      </div>

      {/* 3. Antecedentes Gineco-Obstétricos */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/50">
          <HeartPulse size={14} className="text-primary" />
          <span>Antecedentes Gineco-Obstétricos (Si aplica)</span>
        </h4>
        <div className="bg-subtle/40 border border-border/70 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label htmlFor="gineco-fum" className="block text-[11px] font-medium text-secondary mb-1">
                FUM
              </label>
              <input
                id="gineco-fum"
                type="date"
                aria-label="Fecha Última Menstruación"
                value={gineco.fum || ''}
                onChange={(e) => handleGinecoChange('fum', e.target.value)}
                disabled={readOnly}
                className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-primary outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="gineco-gravidez" className="block text-[11px] font-medium text-secondary mb-1">
                Gravidez (G)
              </label>
              <input
                id="gineco-gravidez"
                type="number"
                min="0"
                aria-label="Gravidez"
                placeholder="0"
                value={gineco.gravidez ?? ''}
                onChange={(e) => handleGinecoChange('gravidez', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                disabled={readOnly}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="gineco-partos" className="block text-[11px] font-medium text-secondary mb-1">
                Partos (P)
              </label>
              <input
                id="gineco-partos"
                type="number"
                min="0"
                aria-label="Partos"
                placeholder="0"
                value={gineco.partos ?? ''}
                onChange={(e) => handleGinecoChange('partos', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                disabled={readOnly}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="gineco-cesareas" className="block text-[11px] font-medium text-secondary mb-1">
                Cesáreas (C)
              </label>
              <input
                id="gineco-cesareas"
                type="number"
                min="0"
                aria-label="Cesáreas"
                placeholder="0"
                value={gineco.cesareas ?? ''}
                onChange={(e) => handleGinecoChange('cesareas', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                disabled={readOnly}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="gineco-abortos" className="block text-[11px] font-medium text-secondary mb-1">
                Abortos (A)
              </label>
              <input
                id="gineco-abortos"
                type="number"
                min="0"
                aria-label="Abortos"
                placeholder="0"
                value={gineco.abortos ?? ''}
                onChange={(e) => handleGinecoChange('abortos', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                disabled={readOnly}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="gineco-planificacion" className="block text-[11px] font-medium text-secondary mb-1">
                Planificación
              </label>
              <input
                id="gineco-planificacion"
                type="text"
                aria-label="Método de Planificación"
                placeholder="ACO, DIU, etc."
                value={gineco.planificacion || ''}
                onChange={(e) => handleGinecoChange('planificacion', e.target.value)}
                disabled={readOnly}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary outline-none focus:border-primary disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntecedentesModule;
