import React, { useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Heart, Scale } from 'lucide-react';
import { SubmoduloProps } from '../registry';

export interface SignosVitalesData {
  fc?: number;           // Frecuencia Cardíaca (lpm)
  fr?: number;           // Frecuencia Respiratoria (rpm)
  paSistolica?: number;  // Presión Sistólica (mmHg)
  paDiastolica?: number; // Presión Diastólica (mmHg)
  temp?: number;         // Temperatura (°C)
  spo2?: number;         // Saturación O2 (%)
  pesoKg?: number;       // Peso (kg)
  tallaCm?: number;      // Talla (cm)
  imc?: number;          // Calculado
  perimetroAbdominal?: number;
}

export const SignosVitalesModule: React.FC<SubmoduloProps<SignosVitalesData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  // Cálculo reactivo del IMC: Peso / (Talla en metros)^2
  const imcCalculado = useMemo(() => {
    if (!data.pesoKg || !data.tallaCm || data.tallaCm <= 0) return null;
    const tallaMetros = data.tallaCm / 100;
    const val = data.pesoKg / (tallaMetros * tallaMetros);
    return Math.round(val * 10) / 10;
  }, [data.pesoKg, data.tallaCm]);

  // Clasificación Nutricional OMS
  const clasificacionImc = useMemo(() => {
    if (!imcCalculado) return null;
    if (imcCalculado < 18.5) return { label: 'Bajo peso', color: 'text-warning' };
    if (imcCalculado < 25) return { label: 'Peso normal', color: 'text-success' };
    if (imcCalculado < 30) return { label: 'Sobrepeso', color: 'text-warning' };
    if (imcCalculado < 35) return { label: 'Obesidad I', color: 'text-danger' };
    return { label: 'Obesidad II / Mórbida', color: 'text-danger' };
  }, [imcCalculado]);

  // Alerta básica de Tensión Arterial
  const alertaPresion = useMemo(() => {
    if (!data.paSistolica || !data.paDiastolica) return null;
    if (data.paSistolica >= 140 || data.paDiastolica >= 90) {
      return { label: 'Posible Crisis / Hipertensión', icon: AlertTriangle, status: 'danger' };
    }
    if (data.paSistolica < 90 || data.paDiastolica < 60) {
      return { label: 'Hipotensión', icon: AlertTriangle, status: 'warning' };
    }
    return { label: 'Normotenso', icon: CheckCircle2, status: 'success' };
  }, [data.paSistolica, data.paDiastolica]);

  const handleFieldChange = (field: keyof SignosVitalesData, rawVal: string) => {
    const val = rawVal === '' ? undefined : parseFloat(rawVal);
    const updated = { ...data, [field]: val };

    // Si se modifican peso o talla, recalcular IMC y propagar al draft
    if (field === 'pesoKg' || field === 'tallaCm') {
      const peso = field === 'pesoKg' ? val : data.pesoKg;
      const talla = field === 'tallaCm' ? val : data.tallaCm;
      if (peso && talla && talla > 0) {
        const tM = talla / 100;
        updated.imc = Math.round((peso / (tM * tM)) * 10) / 10;
      }
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Frecuencia Cardíaca */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>FC (Pulso)</span>
            <span className="text-[10px] text-muted">lpm</span>
          </label>
          <input
            type="number"
            disabled={readOnly}
            value={data.fc ?? ''}
            onChange={(e) => handleFieldChange('fc', e.target.value)}
            placeholder="60 - 100"
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono text-primary outline-none focus:border-primary"
          />
        </div>

        {/* Frecuencia Respiratoria */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>FR</span>
            <span className="text-[10px] text-muted">rpm</span>
          </label>
          <input
            type="number"
            disabled={readOnly}
            value={data.fr ?? ''}
            onChange={(e) => handleFieldChange('fr', e.target.value)}
            placeholder="12 - 20"
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono text-primary outline-none focus:border-primary"
          />
        </div>

        {/* Presión Arterial */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border col-span-2 sm:col-span-1">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>Presión (S/D)</span>
            <span className="text-[10px] text-muted">mmHg</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              disabled={readOnly}
              value={data.paSistolica ?? ''}
              onChange={(e) => handleFieldChange('paSistolica', e.target.value)}
              placeholder="120"
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm font-mono text-primary text-center outline-none focus:border-primary"
            />
            <span className="text-secondary font-bold">/</span>
            <input
              type="number"
              disabled={readOnly}
              value={data.paDiastolica ?? ''}
              onChange={(e) => handleFieldChange('paDiastolica', e.target.value)}
              placeholder="80"
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm font-mono text-primary text-center outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Temperatura */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>Temperatura</span>
            <span className="text-[10px] text-muted">°C</span>
          </label>
          <input
            type="number"
            step="0.1"
            disabled={readOnly}
            value={data.temp ?? ''}
            onChange={(e) => handleFieldChange('temp', e.target.value)}
            placeholder="36.5"
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono text-primary outline-none focus:border-primary"
          />
        </div>

        {/* Oximetría / SpO2 */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>SpO2</span>
            <span className="text-[10px] text-muted">%</span>
          </label>
          <input
            type="number"
            disabled={readOnly}
            value={data.spo2 ?? ''}
            onChange={(e) => handleFieldChange('spo2', e.target.value)}
            placeholder="95 - 100"
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono text-primary outline-none focus:border-primary"
          />
        </div>

        {/* Peso */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>Peso</span>
            <span className="text-[10px] text-muted">kg</span>
          </label>
          <input
            type="number"
            step="0.1"
            disabled={readOnly}
            value={data.pesoKg ?? ''}
            onChange={(e) => handleFieldChange('pesoKg', e.target.value)}
            placeholder="70.0"
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono text-primary outline-none focus:border-primary"
          />
        </div>

        {/* Talla */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span>Talla</span>
            <span className="text-[10px] text-muted">cm</span>
          </label>
          <input
            type="number"
            disabled={readOnly}
            value={data.tallaCm ?? ''}
            onChange={(e) => handleFieldChange('tallaCm', e.target.value)}
            placeholder="170"
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono text-primary outline-none focus:border-primary"
          />
        </div>

        {/* IMC (Calculado y Read-Only) */}
        <div className="bg-subtle/50 p-3 rounded-xl border border-border">
          <label className="text-[11px] font-medium text-secondary flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1">
              <Scale size={13} className="text-primary" />
              <span>IMC</span>
            </span>
            {clasificacionImc && (
              <span className={`text-[10px] font-bold ${clasificacionImc.color}`}>
                {clasificacionImc.label}
              </span>
            )}
          </label>
          <div className="h-9 flex items-center px-3 rounded-lg bg-surface/80 border border-border font-mono text-sm font-bold text-primary">
            {imcCalculado ? imcCalculado : '—'}
          </div>
        </div>
      </div>

      {/* Badge de Alerta Clínica */}
      {alertaPresion && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${
            alertaPresion.status === 'danger'
              ? 'bg-danger/10 border-danger/20 text-danger'
              : alertaPresion.status === 'warning'
              ? 'bg-warning/10 border-warning/20 text-warning'
              : 'bg-success/10 border-success/20 text-success'
          }`}
        >
          <alertaPresion.icon size={15} />
          <span>Alerta Tensión Arterial: {alertaPresion.label}</span>
        </div>
      )}
    </div>
  );
};
export default SignosVitalesModule;