import React from 'react';
import {
  ClipboardList,
  FileText,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import { SubmoduloProps } from '../registry';
import { PlanManejoData, IncapacidadMedicaData } from '@/types/historiaClinica.types';

export const PlanManejoModule: React.FC<SubmoduloProps<PlanManejoData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const handleFieldChange = (field: keyof Omit<PlanManejoData, 'incapacidad'>, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleIncapacidadChange = (patch: Partial<IncapacidadMedicaData>) => {
    onChange({
      ...data,
      incapacidad: {
        ...(data.incapacidad || {}),
        ...patch,
      },
    });
  };

  const incapacidad = data.incapacidad || {};
  const requiereIncapacidad = Boolean(incapacidad.requiere);

  return (
    <div className="space-y-5">
      {/* 1. Conducta Médica */}
      <div className="space-y-1.5">
        <label htmlFor="pm-conducta" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList size={14} className="text-primary" />
          <span>Conducta Médica / Plan de Acción</span>
          <span className="text-danger">*</span>
        </label>
        <textarea
          id="pm-conducta"
          aria-label="Conducta Médica"
          value={data.conducta || ''}
          onChange={(e) => handleFieldChange('conducta', e.target.value)}
          disabled={readOnly}
          rows={3}
          className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
          placeholder="Definir conducta terapéutica, plan farmacológico ambulatorio, solicitudes paraclínicas, remisiones o controles..."
        />
      </div>

      {/* 2. Recomendaciones Generales */}
      <div className="space-y-1.5">
        <label htmlFor="pm-recomendaciones" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} className="text-primary" />
          <span>Recomendaciones Generales</span>
        </label>
        <textarea
          id="pm-recomendaciones"
          aria-label="Recomendaciones Generales"
          value={data.recomendaciones || ''}
          onChange={(e) => handleFieldChange('recomendaciones', e.target.value)}
          disabled={readOnly}
          rows={3}
          className="w-full bg-subtle border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 resize-y"
          placeholder="Indicaciones higiénico-dietéticas, actividad física recomendada, pautas de estilo de vida y cuidados domiciliarios..."
        />
      </div>

      {/* 3. Signos de Alarma */}
      <div className="bg-warning/5 border border-warning/20 rounded-xl p-3.5 space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label htmlFor="pm-signos-alarma" className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-warning" />
            <span>Signos de Alarma / Cuándo acudir a urgencias</span>
          </label>
          <span className="text-[10px] font-semibold text-warning px-2 py-0.5 rounded-full bg-warning/10 border border-warning/20">
            Educación al Paciente
          </span>
        </div>
        <textarea
          id="pm-signos-alarma"
          aria-label="Signos de Alarma"
          value={data.signosAlarma || ''}
          onChange={(e) => handleFieldChange('signosAlarma', e.target.value)}
          disabled={readOnly}
          rows={2}
          className="w-full bg-surface border border-warning/30 rounded-lg p-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-warning focus:ring-1 focus:ring-warning/40 transition-all disabled:opacity-60 resize-y"
          placeholder="Consultar inmediatamente al servicio de urgencias en caso de fiebre persistente >38.5°C, dificultad respiratoria, dolor torácico..."
        />
      </div>

      {/* 4. Bloque de Incapacidad Médica */}
      <div className="bg-subtle/50 border border-border rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Incapacidad Médica</h4>
              <p className="text-[11px] text-muted">¿La condición clínica del paciente amerita reposo laboral o escolar?</p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="pm-incapacidad-requiere"
              aria-label="¿Genera incapacidad médica?"
              checked={requiereIncapacidad}
              onChange={(e) => handleIncapacidadChange({ requiere: e.target.checked })}
              disabled={readOnly}
              className="w-4 h-4 rounded text-primary focus:ring-primary/40 border-border bg-surface cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="text-xs font-semibold text-primary">Generar Incapacidad</span>
          </label>
        </div>

        {requiereIncapacidad && (
          <div className="pt-3 border-t border-border/70 space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="pm-incapacidad-dias" className="block text-[11px] font-medium text-secondary mb-1">
                  Días de Incapacidad
                </label>
                <input
                  type="number"
                  id="pm-incapacidad-dias"
                  aria-label="Días de Incapacidad"
                  min="1"
                  placeholder="1"
                  value={incapacidad.dias ?? ''}
                  onChange={(e) => handleIncapacidadChange({ dias: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  disabled={readOnly}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="pm-incapacidad-inicio" className="block text-[11px] font-medium text-secondary mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-muted" />
                  <span>Fecha de Inicio</span>
                </label>
                <input
                  type="date"
                  id="pm-incapacidad-inicio"
                  aria-label="Fecha de Inicio"
                  value={incapacidad.fechaInicio || ''}
                  onChange={(e) => handleIncapacidadChange({ fechaInicio: e.target.value })}
                  disabled={readOnly}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-primary outline-none focus:border-primary disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="pm-incapacidad-fin" className="block text-[11px] font-medium text-secondary mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-muted" />
                  <span>Fecha de Fin</span>
                </label>
                <input
                  type="date"
                  id="pm-incapacidad-fin"
                  aria-label="Fecha de Fin"
                  value={incapacidad.fechaFin || ''}
                  onChange={(e) => handleIncapacidadChange({ fechaFin: e.target.value })}
                  disabled={readOnly}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-primary outline-none focus:border-primary disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pm-incapacidad-observaciones" className="block text-[11px] font-medium text-secondary mb-1">
                Observaciones / Recomendaciones de Incapacidad
              </label>
              <textarea
                id="pm-incapacidad-observaciones"
                aria-label="Observaciones de Incapacidad"
                value={incapacidad.observaciones || ''}
                onChange={(e) => handleIncapacidadChange({ observaciones: e.target.value })}
                disabled={readOnly}
                rows={2}
                className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary transition-all disabled:opacity-60 resize-y"
                placeholder="Motivo clínico justificado, limitaciones físicas o prescripciones laborales específicas..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanManejoModule;
