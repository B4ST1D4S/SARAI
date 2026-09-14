import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SubmoduloProps } from '../registry';

export interface DiagnosticoItem {
  id: string;
  codigoCie10: string;
  descripcion: string;
  tipo: 'IMPRESION_DIAGNOSTICA' | 'CONFIRMADO_NUEVO' | 'CONFIRMADO_REPETIDO';
}

export interface DiagnosticosData {
  principal?: DiagnosticoItem;
  relacionados?: DiagnosticoItem[];
}

export const DiagnosticosModule: React.FC<SubmoduloProps<DiagnosticosData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const principal = data.principal || {
    id: 'diag_p',
    codigoCie10: '',
    descripcion: '',
    tipo: 'IMPRESION_DIAGNOSTICA',
  };
  const relacionados = data.relacionados || [];

  const handlePrincipalChange = (field: keyof DiagnosticoItem, val: string) => {
    onChange({ principal: { ...principal, [field]: val } });
  };

  const addRelacionado = () => {
    const newItem: DiagnosticoItem = {
      id: `diag_rel_${Date.now()}`,
      codigoCie10: '',
      descripcion: '',
      tipo: 'CONFIRMADO_NUEVO',
    };
    onChange({ relacionados: [...relacionados, newItem] });
  };

  const removeRelacionado = (idx: number) => {
    onChange({ relacionados: relacionados.filter((_, i) => i !== idx) });
  };

  const updateRelacionado = (idx: number, field: keyof DiagnosticoItem, val: string) => {
    const next = [...relacionados];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ relacionados: next });
  };

  return (
    <div className="space-y-4">
      {/* Diagnóstico Principal */}
      <div className="p-4 rounded-xl bg-subtle/80 border border-primary/30 ring-1 ring-primary/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Diagnóstico Principal <span className="text-danger">*</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
            CIE-10 Principal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
              Código CIE-10
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={principal.codigoCie10}
              onChange={(e) => handlePrincipalChange('codigoCie10', e.target.value.toUpperCase())}
              placeholder="Ej. K35.8"
              className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-primary placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
              Descripción Diagnóstica
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={principal.descripcion}
              onChange={(e) => handlePrincipalChange('descripcion', e.target.value)}
              placeholder="Nombre de la patología..."
              className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
              Tipo Diagnóstico
            </label>
            <select
              disabled={readOnly}
              value={principal.tipo}
              onChange={(e) => handlePrincipalChange('tipo', e.target.value as any)}
              className="w-full bg-subtle border border-border rounded-lg px-2.5 py-2 text-xs text-primary focus:outline-none focus:border-primary"
            >
              <option value="IMPRESION_DIAGNOSTICA">Impresión Diagnóstica</option>
              <option value="CONFIRMADO_NUEVO">Confirmado Nuevo</option>
              <option value="CONFIRMADO_REPETIDO">Confirmado Repetido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diagnósticos Relacionados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Diagnósticos Relacionados (Opcional)
          </label>
          {!readOnly && (
            <button
              type="button"
              onClick={addRelacionado}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 border border-primary/30 transition-colors"
            >
              <Plus size={14} />
              <span>Añadir Diagnóstico</span>
            </button>
          )}
        </div>

        {relacionados.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-3 rounded-xl bg-subtle/40 border border-border flex flex-col sm:flex-row gap-2 items-start sm:items-center"
          >
            <input
              type="text"
              disabled={readOnly}
              value={item.codigoCie10}
              onChange={(e) => updateRelacionado(idx, 'codigoCie10', e.target.value.toUpperCase())}
              placeholder="CIE-10"
              className="w-24 bg-subtle border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-primary"
            />
            <input
              type="text"
              disabled={readOnly}
              value={item.descripcion}
              onChange={(e) => updateRelacionado(idx, 'descripcion', e.target.value)}
              placeholder="Descripción del diagnóstico secundario..."
              className="flex-1 bg-subtle border border-border rounded-lg px-3 py-1.5 text-xs text-primary"
            />
            <select
              disabled={readOnly}
              value={item.tipo}
              onChange={(e) => updateRelacionado(idx, 'tipo', e.target.value as any)}
              className="w-44 bg-subtle border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary"
            >
              <option value="CONFIRMADO_NUEVO">Confirmado Nuevo</option>
              <option value="CONFIRMADO_REPETIDO">Confirmado Repetido</option>
              <option value="IMPRESION_DIAGNOSTICA">Impresión Diagnóstica</option>
            </select>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeRelacionado(idx)}
                className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                title="Eliminar diagnóstico"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagnosticosModule;