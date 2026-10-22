import React from 'react';
import { Plus, Trash2, FlaskConical, type LucideIcon } from 'lucide-react';
import type { AyudaDiagnosticaItem, SolicitudAyudasDiagData } from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_INPUT, ESTILO_LABEL, ESTILO_TEXTAREA, clasesCampo } from '../components/common/campos';

export type { AyudaDiagnosticaItem, SolicitudAyudasDiagData };

/** Campos comunes a toda orden CUPS (ayuda diagnóstica o procedimiento). */
export interface OrdenCups {
  id: string;
  codigoCups?: string;
  descripcion: string;
  /** 0 = sin cantidad (el campo se muestra vacío mientras se escribe). */
  cantidad: number;
  justificacion?: string;
}

export interface DatosOrdenesCups<T extends OrdenCups> {
  items?: T[];
  observacionesGenerales?: string;
}

export const nuevoIdOrden = (prefijo: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefijo}-${crypto.randomUUID()}`
    : `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface ListaOrdenesCupsProps<T extends OrdenCups> extends SubmoduloProps<DatosOrdenesCups<T>> {
  titulo: string;
  icono: LucideIcon;
  unidad: [singular: string, plural: string];
  textoAgregar: string;
  prefijoId: string;
  ordenVacia: () => T;
  placeholderCodigo: string;
  placeholderDescripcion: string;
  placeholderJustificacion: string;
  placeholderObservaciones: string;
  /** Campos propios del tipo de orden (p. ej. el ámbito de un procedimiento). */
  camposExtra?: (orden: T, index: number, actualizar: (cambios: Partial<T>) => void) => React.ReactNode;
}

/**
 * Base común de las solicitudes CUPS. Sin estado local: toda mutación clona
 * `data.items` y emite el array completo por `onChange`.
 */
export function ListaOrdenesCups<T extends OrdenCups>({
  data = {},
  onChange,
  readOnly = false,
  titulo,
  icono: Icono,
  unidad,
  textoAgregar,
  prefijoId,
  ordenVacia,
  placeholderCodigo,
  placeholderDescripcion,
  placeholderJustificacion,
  placeholderObservaciones,
  camposExtra,
}: ListaOrdenesCupsProps<T>) {
  const ordenes = data.items ?? [];

  const actualizar = (index: number, cambios: Partial<T>) =>
    onChange({ items: ordenes.map((o, i) => (i === index ? { ...o, ...cambios } : o)) });
  const agregar = () => onChange({ items: [...ordenes, ordenVacia()] });
  const quitar = (index: number) => onChange({ items: ordenes.filter((_, i) => i !== index) });

  return (
    <fieldset disabled={readOnly} className="space-y-4 min-w-0 border-0 p-0 m-0">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Icono size={16} className="text-primary" />
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{titulo}</h4>
          <span className="text-[11px] text-muted">
            ({ordenes.length} {ordenes.length === 1 ? unidad[0] : unidad[1]})
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={agregar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all"
          >
            <Plus size={14} /> {textoAgregar}
          </button>
        )}
      </div>

      {ordenes.length === 0 ? (
        <p className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted">
          Sin {unidad[1]} solicitados.
        </p>
      ) : (
        ordenes.map((orden, index) => (
          <div key={orden.id} className="p-4 rounded-xl border border-border bg-subtle/40 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-start">
              <div className="w-full md:w-36 space-y-1">
                <label htmlFor={`${prefijoId}-cups-${index}`} className={ESTILO_LABEL}>
                  Código CUPS
                </label>
                <input
                  id={`${prefijoId}-cups-${index}`}
                  value={orden.codigoCups ?? ''}
                  onChange={(e) => actualizar(index, { codigoCups: e.target.value.trim().toUpperCase() } as Partial<T>)}
                  placeholder={placeholderCodigo}
                  className={clasesCampo(ESTILO_INPUT, 'font-mono')}
                />
              </div>
              <div className="flex-1 w-full space-y-1">
                <label htmlFor={`${prefijoId}-descripcion-${index}`} className={ESTILO_LABEL}>
                  Descripción <span className="text-danger">*</span>
                </label>
                <input
                  id={`${prefijoId}-descripcion-${index}`}
                  value={orden.descripcion}
                  onChange={(e) => actualizar(index, { descripcion: e.target.value } as Partial<T>)}
                  placeholder={placeholderDescripcion}
                  className={ESTILO_INPUT}
                />
              </div>
              <div className="w-full md:w-20 space-y-1">
                <label htmlFor={`${prefijoId}-cantidad-${index}`} className={ESTILO_LABEL}>
                  Cant.
                </label>
                <input
                  id={`${prefijoId}-cantidad-${index}`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={orden.cantidad || ''}
                  onChange={(e) => actualizar(index, { cantidad: Number.parseInt(e.target.value, 10) || 0 } as Partial<T>)}
                  className={clasesCampo(ESTILO_INPUT, 'text-center font-bold')}
                />
              </div>
              {camposExtra?.(orden, index, (cambios) => actualizar(index, cambios))}
              {!readOnly && (
                <button
                  type="button"
                  aria-label={`Quitar orden ${index + 1}`}
                  onClick={() => quitar(index)}
                  className="mt-5 h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor={`${prefijoId}-justificacion-${index}`} className={ESTILO_LABEL}>
                Justificación clínica
              </label>
              <textarea
                id={`${prefijoId}-justificacion-${index}`}
                value={orden.justificacion ?? ''}
                onChange={(e) => actualizar(index, { justificacion: e.target.value } as Partial<T>)}
                rows={2}
                placeholder={placeholderJustificacion}
                className={ESTILO_TEXTAREA}
              />
            </div>
          </div>
        ))
      )}

      <div className="space-y-1">
        <label htmlFor={`${prefijoId}-observaciones`} className={ESTILO_LABEL}>
          Observaciones generales
        </label>
        <textarea
          id={`${prefijoId}-observaciones`}
          value={data.observacionesGenerales ?? ''}
          onChange={(e) => onChange({ observacionesGenerales: e.target.value })}
          rows={2}
          placeholder={placeholderObservaciones}
          className={ESTILO_TEXTAREA}
        />
      </div>
    </fieldset>
  );
}

const ayudaVacia = (): AyudaDiagnosticaItem => ({
  id: nuevoIdOrden('ayuda'),
  codigoCups: '',
  descripcion: '',
  cantidad: 1,
  justificacion: '',
});

/** Solicitud de ayudas diagnósticas: laboratorios, imágenes, ecografías. */
export const SolicitudAyudasDiagModule: React.FC<SubmoduloProps<SolicitudAyudasDiagData>> = (props) => (
  <ListaOrdenesCups<AyudaDiagnosticaItem>
    {...props}
    titulo="Órdenes de Laboratorio & Ayudas Diagnósticas"
    icono={FlaskConical}
    unidad={['estudio', 'estudios']}
    textoAgregar="Agregar estudio / paraclínico"
    prefijoId="ayuda"
    ordenVacia={ayudaVacia}
    placeholderCodigo="Ej: 903841"
    placeholderDescripcion="Ej: Hemograma tipo IV, Radiografía de tórax..."
    placeholderJustificacion="Sospecha diagnóstica, seguimiento evolutivo, prequirúrgico..."
    placeholderObservaciones="Instrucciones de preparación (ayuno, cita previa), indicaciones de entrega..."
  />
);

export default SolicitudAyudasDiagModule;
