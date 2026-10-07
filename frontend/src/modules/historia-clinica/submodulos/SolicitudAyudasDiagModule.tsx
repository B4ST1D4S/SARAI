import React from 'react';
import { Plus, Trash2, FlaskConical, FileText } from 'lucide-react';
import { SubmoduloProps } from '../registry';
import { SolicitudAyudasDiagData, AyudaDiagnosticaItem } from '@/types/historiaClinica.types';

export const SolicitudAyudasDiagModule: React.FC<SubmoduloProps<SolicitudAyudasDiagData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const items = data.items || [];

  const handleAddItem = () => {
    if (readOnly) return;
    const newItem: AyudaDiagnosticaItem = {
      id: `ayuda_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      codigoCups: '',
      descripcion: '',
      cantidad: 1,
      justificacion: '',
    };
    onChange({
      ...data,
      items: [...items, newItem],
    });
  };

  const handleUpdateItem = (id: string, patch: Partial<AyudaDiagnosticaItem>) => {
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
          <FlaskConical size={16} className="text-primary" />
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
            Órdenes de Laboratorio & Ayudas Diagnósticas
          </h4>
          <span className="text-[11px] text-muted">({items.length} {items.length === 1 ? 'estudio' : 'estudios'})</span>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all"
            aria-label="Agregar Estudio / Paraclínico"
          >
            <Plus size={14} />
            <span>Agregar Estudio / Paraclínico</span>
          </button>
        )}
      </div>

      {/* Lista de estudios */}
      {items.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border/80 bg-subtle/30 text-center space-y-1">
          <p className="text-xs text-muted">
            No se han ordenado paraclínicos o ayudas diagnósticas
          </p>
          {!readOnly && (
            <p className="text-[11px] text-secondary">
              Haga clic en &ldquo;Agregar Estudio / Paraclínico&rdquo; para ordenar pruebas complementarias.
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
                  Estudio #{index + 1}
                </span>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={`Eliminar estudio ${index + 1}`}
                    title="Eliminar estudio"
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
                    placeholder="Ej: 903841"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>

                {/* Descripción / Nombre del estudio */}
                <div className="sm:col-span-7">
                  <label htmlFor={`desc-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                    Descripción del Estudio <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id={`desc-${item.id}`}
                    aria-label="Descripción del Estudio"
                    value={item.descripcion || ''}
                    onChange={(e) => handleUpdateItem(item.id, { descripcion: e.target.value })}
                    disabled={readOnly}
                    placeholder="Ej: Hemograma tipo IV, Radiografía de tórax..."
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
              </div>

              {/* Justificación Clínica */}
              <div>
                <label htmlFor={`just-${item.id}`} className="block text-[11px] font-medium text-secondary mb-1">
                  Justificación Clínica / Indicación
                </label>
                <textarea
                  id={`just-${item.id}`}
                  aria-label="Justificación Clínica"
                  rows={2}
                  value={item.justificacion || ''}
                  onChange={(e) => handleUpdateItem(item.id, { justificacion: e.target.value })}
                  disabled={readOnly}
                  placeholder="Sospecha diagnóstica, seguimiento evolutivo, prequirúrgico..."
                  className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary disabled:opacity-60 resize-y"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Observaciones Generales */}
      <div className="pt-2">
        <label htmlFor="ayudas-obs-gen" className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          <FileText size={13} className="text-primary" />
          <span>Observaciones Generales de Ayudas Diagnósticas</span>
        </label>
        <textarea
          id="ayudas-obs-gen"
          aria-label="Observaciones Generales"
          rows={2}
          value={data.observacionesGenerales || ''}
          onChange={(e) => handleObservacionesChange(e.target.value)}
          disabled={readOnly}
          placeholder="Instrucciones de preparación (ayuno, cita previa), indicaciones de entrega..."
          className="w-full bg-subtle border border-border rounded-xl p-3 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary disabled:opacity-60 resize-y"
        />
      </div>
    </div>
  );
};

export default SolicitudAyudasDiagModule;
