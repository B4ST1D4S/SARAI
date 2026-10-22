import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import type { SubmoduloProps } from '../registry';
import {
  ESTILO_CAMPO_ERROR,
  ESTILO_ERROR_MSG,
  ESTILO_INPUT,
  ESTILO_LABEL,
  ESTILO_SELECT,
  clasesCampo,
} from '../components/common/campos';

export type TipoDiagnostico = 'IMPRESION_DIAGNOSTICA' | 'CONFIRMADO_NUEVO' | 'CONFIRMADO_REPETIDO';

export interface DiagnosticoItem {
  id: string;
  codigoCie10: string;
  /** Equivalencia CIE-11, opcional. */
  codigoCie11?: string;
  descripcion: string;
  tipo: TipoDiagnostico;
}

/** draft.datos.diagnosticos: un principal destacado y una lista de relacionados. */
export interface DiagnosticosData {
  principal?: DiagnosticoItem;
  relacionados?: DiagnosticoItem[];
}

const TIPOS: { valor: TipoDiagnostico; etiqueta: string }[] = [
  { valor: 'IMPRESION_DIAGNOSTICA', etiqueta: 'Impresión Diagnóstica' },
  { valor: 'CONFIRMADO_NUEVO', etiqueta: 'Confirmado Nuevo' },
  { valor: 'CONFIRMADO_REPETIDO', etiqueta: 'Confirmado Repetido' },
];

/** Código CIE-10 con o sin punto: J06, J069, J06.9 (misma regla que la incapacidad en validaciones.ts). */
const CIE10 = /^[A-Z]\d{2}(\.?[0-9A-Z]{1,2})?$/;

const nuevoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `diag-${crypto.randomUUID()}`
    : `diag-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const diagnosticoVacio = (tipo: TipoDiagnostico = 'IMPRESION_DIAGNOSTICA'): DiagnosticoItem => ({
  id: nuevoId(),
  codigoCie10: '',
  descripcion: '',
  tipo,
});

/** Principal en blanco mientras el borrador no lo tenga (id fijo: no se remonta entre renders). */
const PRINCIPAL_VACIO: DiagnosticoItem = { id: 'diag-principal', codigoCie10: '', descripcion: '', tipo: 'IMPRESION_DIAGNOSTICA' };

/** '' sin error (se exige al cierre); un código escrito debe tener formato CIE-10. */
const errorCodigo = (codigo: string) =>
  codigo.trim() !== '' && !CIE10.test(codigo.trim()) ? 'Código CIE-10 inválido (ej. I10, J06.9).' : undefined;

interface FilaProps {
  diag: DiagnosticoItem;
  prefijo: string;
  onCambiar: (cambios: Partial<DiagnosticoItem>) => void;
}

/** Campos de un diagnóstico; comunes al principal y a los relacionados. */
function CamposDiagnostico({ diag, prefijo, onCambiar }: FilaProps) {
  const error = errorCodigo(diag.codigoCie10);
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
      <div className="md:col-span-2 space-y-1">
        <label htmlFor={`${prefijo}-cie10`} className={ESTILO_LABEL}>
          CIE-10
        </label>
        <input
          id={`${prefijo}-cie10`}
          value={diag.codigoCie10}
          onChange={(e) => onCambiar({ codigoCie10: e.target.value.trim().toUpperCase() })}
          maxLength={6}
          placeholder="Ej: I10"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${prefijo}-cie10-error` : undefined}
          className={clasesCampo(ESTILO_INPUT, 'font-mono', error && ESTILO_CAMPO_ERROR)}
        />
      </div>
      <div className="md:col-span-5 space-y-1">
        <label htmlFor={`${prefijo}-descripcion`} className={ESTILO_LABEL}>
          Descripción
        </label>
        <input
          id={`${prefijo}-descripcion`}
          value={diag.descripcion}
          onChange={(e) => onCambiar({ descripcion: e.target.value })}
          placeholder="Ej: Hipertensión esencial (primaria)"
          className={ESTILO_INPUT}
        />
      </div>
      <div className="md:col-span-2 space-y-1">
        <label htmlFor={`${prefijo}-cie11`} className={ESTILO_LABEL}>
          CIE-11 Eq.
        </label>
        <input
          id={`${prefijo}-cie11`}
          value={diag.codigoCie11 ?? ''}
          onChange={(e) => onCambiar({ codigoCie11: e.target.value.trim().toUpperCase() })}
          placeholder="Ej: BA00"
          className={clasesCampo(ESTILO_INPUT, 'font-mono')}
        />
      </div>
      <div className="md:col-span-3 space-y-1">
        <label htmlFor={`${prefijo}-tipo`} className={ESTILO_LABEL}>
          Tipo
        </label>
        <select
          id={`${prefijo}-tipo`}
          value={diag.tipo}
          onChange={(e) => onCambiar({ tipo: e.target.value as TipoDiagnostico })}
          className={ESTILO_SELECT}
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p id={`${prefijo}-cie10-error`} role="alert" className={`${ESTILO_ERROR_MSG} md:col-span-12`}>
          {error}
        </p>
      )}
    </div>
  );
}

export const DiagnosticosModule: React.FC<SubmoduloProps<DiagnosticosData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const principal = data.principal ?? PRINCIPAL_VACIO;
  const relacionados = data.relacionados ?? [];

  // El principal se emite como objeto nuevo; los relacionados, como array clonado.
  const cambiarPrincipal = (cambios: Partial<DiagnosticoItem>) => onChange({ principal: { ...principal, ...cambios } });
  const cambiarRelacionado = (index: number, cambios: Partial<DiagnosticoItem>) =>
    onChange({ relacionados: relacionados.map((d, i) => (i === index ? { ...d, ...cambios } : d)) });
  const agregarRelacionado = () => onChange({ relacionados: [...relacionados, diagnosticoVacio('CONFIRMADO_NUEVO')] });
  const quitarRelacionado = (index: number) => onChange({ relacionados: relacionados.filter((_, i) => i !== index) });

  return (
    <fieldset disabled={readOnly} className="space-y-4 min-w-0 border-0 p-0 m-0">
      {/* Diagnóstico principal */}
      <section aria-labelledby="diag-principal-titulo" className="p-4 rounded-xl bg-primary/5 border border-primary/30 space-y-3">
        <h4 id="diag-principal-titulo" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Star size={14} /> Diagnóstico Principal <span className="text-danger">*</span>
        </h4>
        <CamposDiagnostico diag={principal} prefijo="diag-principal" onCambiar={cambiarPrincipal} />
      </section>

      {/* Diagnósticos relacionados */}
      <section aria-labelledby="diag-relacionados-titulo" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 id="diag-relacionados-titulo" className="text-xs font-bold text-secondary uppercase tracking-wider">
            Diagnósticos Relacionados ({relacionados.length})
          </h4>
          {!readOnly && (
            <button
              type="button"
              onClick={agregarRelacionado}
              className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Plus size={14} /> Agregar relacionado
            </button>
          )}
        </div>

        {relacionados.length === 0 ? (
          <p className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted">
            Sin diagnósticos relacionados.
          </p>
        ) : (
          relacionados.map((diag, index) => (
            <div key={diag.id} className="p-4 rounded-xl border border-border bg-subtle/40 flex gap-3 items-start">
              <CamposDiagnostico
                diag={diag}
                prefijo={`diag-rel-${index}`}
                onCambiar={(cambios) => cambiarRelacionado(index, cambios)}
              />
              {!readOnly && (
                <button
                  type="button"
                  aria-label={`Quitar relacionado ${index + 1}`}
                  onClick={() => quitarRelacionado(index)}
                  className="mt-5 h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </section>
    </fieldset>
  );
};

export default DiagnosticosModule;
