import React from 'react';
import { Plus, Trash2, Syringe, FileText } from 'lucide-react';
import { SubmoduloProps } from '../registry';
import { SolicitudProcedimientosData, ProcedimientoItem } from '@/types/historiaClinica.types';

export const SolicitudProcedimientosModule: React.FC<SubmoduloProps<SolicitudProcedimientosData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const items = data.items || [];

  const handleAddItem = () => {
    if (readOnly) return;
    const newItem: ProcedimientoItem = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      codigoCups: '',
      descripcion: '',
      cantidad: 1,
      tipoAmbito: 'AMBULATORIO',
      justificacion: '',
    };
    onChange({
      ...data,
      items: [...items, newItem],
    });
  };

  const handleUpdateItem = (id: string, patch: Partial<ProcedimientoItem>) => {
    if (readOnly) return;
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    onChange({
      ...data,
      items: updated,
    });
  };

  const handleRemoveItem = (id: string) => {
    if (readOnly) return;
    const updated = items.filter((item) => item.id !== id);
    onChange({
      ...data,
      items: updated,
    });
  };

  const handleObservacionesChange = (observacionesGenerales: string) => {
    onChange({
      ...data,
      observacionesGenerales,
    });
  };

  return (
    <div className="space-y-4">
      {/* Cabecera y Botón de adición */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Syringe size={16} className="text-primary" />
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
            Solicitud de Procedimientos & Órdenes CUPS
          </h4>
          <span className="text-[11px] text-muted">({items.length} {items.length === 1 ? 'procedimiento' : 'procedimientos'})</span>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all"
            aria-label="Agregar Procedimiento / Orden CUPS"
          >
            <Plus size={14} />
            <span>Agregar Procedimiento / Orden CUPS</span>
          </button>
        )}
      </div>

      {/* Lista de procedimientos */}
      {items.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border/80 bg-subtle/30 text-center space-y-1">
          <p className="text-xs text-muted">
            No se han ordenado procedimientos o intervenciones
          </p>
          {!readOnly && (
            <p className="text-[11px] text-secondary">
              Haga clic en &ldquo;Agregar Procedimiento / Orden CUPS&rdquo; para registrar solicitudes quirúrgicas o ambulatorias.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-subtle/50 border border-border rounded-xl p-3.5 space-y-3 relative group transition-all hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Procedimiento #{index + 1}
                </span>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={`Eliminar procedimiento ${index + 1}`}
                    title="Eliminar procedimiento"
                    className="p-1 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Código CUPS */}
                <div className="sm:col-span-3">
                  <label htmlFor={`cups-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                    Código CUPS
                  </label>
                  <input
                    type="text"
                    id={`cups-${item.id}`}
                    aria-label="Código CUPS"
                    value={item.codigoCups || ''}
                    onChange={(e) => handleUpdateItem(item.id, { codigoCups: e.target.value })}
                    disabled={readOnly}
                    placeholder="Ej: 890201"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>

                {/* Descripción / Nombre del procedimiento */}
                <div className="sm:col-span-5">
                  <label htmlFor={`desc-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                    Descripción del Procedimiento <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id={`desc-${item.id}`}
                    aria-label="Descripción del Procedimiento"
                    value={item.descripcion || ''}
                    onChange={(e) => handleUpdateItem(item.id, { descripcion: e.target.value })}
                    disabled={readOnly}
                    placeholder="Ej: Consulta de primera vez, Cauterización, Resección..."
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>

                {/* Cantidad */}
                <div className="sm:col-span-2">
                  <label htmlFor={`cant-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    id={`cant-${item.id}`}
                    aria-label="Cantidad"
                    min="1"
                    value={item.cantidad ?? 1}
                    onChange={(e) => handleUpdateItem(item.id, { cantidad: e.target.value === '' ? 1 : parseInt(e.target.value, 10) })}
                    disabled={readOnly}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>

                {/* Ámbito de Realización */}
                <div className="sm:col-span-2">
                  <label htmlFor={`ambito-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                    Ámbito
                  </label>
                  <select
                    id={`ambito-${item.id}`}
                    aria-label="Ámbito de Realización"
                    value={item.tipoAmbito || 'AMBULATORIO'}
                    onChange={(e) => handleUpdateItem(item.id, { tipoAmbito: e.target.value as ProcedimientoItem['tipoAmbito'] })}
                    disabled={readOnly}
                    className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-primary outline-none focus:border-primary disabled:opacity-60"
                  >
                    <option value="AMBULATORIO">Ambulatorio</option>
                    <option value="HOSPITALARIO">Hospitalario</option>
                    <option value="URGENCIAS">Urgencias</option>
                    <option value="QUIRURGICO">Quirúrgico</option>
                  </select>
                </div>
              </div>

              {/* Justificación Clínica */}
              <div>
                <label htmlFor={`just-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                  Justificación Clínica / Objetivo Terapéutico
                </label>
                <textarea
                  id={`just-${item.id}`}
                  aria-label="Justificación Clínica"
                  rows={2}
                  value={item.justificacion || ''}
                  onChange={(e) => handleUpdateItem(item.id, { justificacion: e.target.value })}
                  disabled={readOnly}
                  placeholder="Justificación del procedimiento, diagnóstico asociado o técnica propuesta..."
                  className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary disabled:opacity-60 resize-y"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Observaciones Generales */}
      <div className="pt-2">
        <label htmlFor="procs-obs-gen" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          <FileText size={13} className="text-primary" />
          <span>Observaciones Generales de Procedimientos</span>
        </label>
        <textarea
          id="procs-obs-gen"
          aria-label="Observaciones Generales"
          rows={2}
          value={data.observacionesGenerales || ''}
          onChange={(e) => handleObservacionesChange(e.target.value)}
          disabled={readOnly}
          placeholder="Condiciones previas, requerimiento de consentimiento informado, preparación o anestesia..."
          className="w-full bg-subtle border border-border rounded-xl p-3 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary disabled:opacity-60 resize-y"
        />
      </div>
    </div>
  );
};

export default SolicitudProcedimientosModule;
