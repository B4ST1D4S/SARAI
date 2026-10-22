import React from 'react';
import { ShieldCheck, Plus, Trash2, Search, History } from 'lucide-react';
import type {
  AntecedentePersonalItem,
  AntecedentePrevio,
  AntecedentesPersonalesData,
} from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_INPUT, ESTILO_LABEL, ESTILO_SELECT, clasesCampo } from '../components/common/campos';

export type { AntecedentePersonalItem, AntecedentePrevio, AntecedentesPersonalesData };

const nuevoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `antecedente-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const antecedentePersonalVacio = (): AntecedentePersonalItem => ({
  id: nuevoId(),
  diagnostico: '',
  estadoClinico: 'active',
  verificacion: 'confirmed',
});

/** Antecedentes realmente diligenciados: lo que debe persistirse y validarse al cierre. */
export const antecedentesPersonalesDiligenciados = (data: AntecedentesPersonalesData | null | undefined) =>
  (data?.antecedentesPersonales ?? []).filter((a) => a.diagnostico.trim() !== '');

/** '' del input → undefined (sin dato). */
const aEntero = (texto: string): number | undefined => (texto.trim() === '' ? undefined : Number.parseInt(texto, 10));

const CATEGORIA_TEXTO: Record<string, string> = {
  PATOLOGICO: 'Patológico',
  QUIRURGICO: 'Quirúrgico',
  FARMACOLOGICO: 'Farmacológico',
  TOXICO_ALERGICO: 'Tóxico-alérgico',
  TRAUMATOLOGICO: 'Traumatológico',
  GINECOOBSTETRICO: 'Ginecoobstétrico',
  OTRO: 'Otro',
};

export const AntecedentesPersonalesModule: React.FC<SubmoduloProps<AntecedentesPersonalesData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const niega = Boolean(data.niegaAntecedentes);
  // Sin filas guardadas se muestra una fila en blanco derivada (id fijo); entra al array al editarla.
  const filas = data.antecedentesPersonales?.length
    ? data.antecedentesPersonales
    : [{ ...antecedentePersonalVacio(), id: 'antecedente-inicial' }];
  // Los familiares tienen su propio submódulo; aquí van los personales de cualquier categoría.
  const previos = (data.antecedentesPrevios ?? []).filter((a) => a.categoria !== 'FAMILIAR');

  // Toda mutación clona el array y lo emite completo; `data` nunca se modifica.
  const actualizarFila = (index: number, cambios: Partial<AntecedentePersonalItem>) =>
    onChange({ antecedentesPersonales: filas.map((f, i) => (i === index ? { ...f, ...cambios } : f)) });
  const agregarFila = () => onChange({ antecedentesPersonales: [...filas, antecedentePersonalVacio()] });
  const eliminarFila = (index: number) => onChange({ antecedentesPersonales: filas.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4">
      <AntecedentesPrevios antecedentes={previos} />

      {/* Negatividad explícita */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-subtle border border-border">
        <input
          type="checkbox"
          id="niega_patologicos"
          checked={niega}
          onChange={(e) => onChange({ niegaAntecedentes: e.target.checked })}
          disabled={readOnly}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
        />
        <label htmlFor="niega_patologicos" className="text-xs font-semibold text-secondary flex items-center gap-1.5 cursor-pointer">
          <ShieldCheck size={15} className="text-primary" />
          Paciente niega antecedentes patológicos o enfermedades crónicas previas
        </label>
      </div>

      {!niega && (
        <fieldset disabled={readOnly} className="space-y-3 min-w-0 border-0 p-0 m-0">
          {filas.map((fila, index) => (
            <div key={fila.id} className="p-4 rounded-xl border border-border bg-subtle/40 flex flex-col md:flex-row gap-3 items-start">
              {/* Diagnóstico */}
              <div className="flex-1 w-full space-y-1">
                <label htmlFor={`ap-diagnostico-${index}`} className={ESTILO_LABEL}>
                  Patología / Condición
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-muted" />
                  <input
                    id={`ap-diagnostico-${index}`}
                    value={fila.diagnostico}
                    onChange={(e) => actualizarFila(index, { diagnostico: e.target.value })}
                    placeholder="Ej: Hipertensión arterial esencial (I10)..."
                    className={clasesCampo(ESTILO_INPUT, 'pl-9')}
                  />
                </div>
              </div>

              {/* Estado clínico (FHIR clinicalStatus) */}
              <div className="w-full md:w-36 space-y-1">
                <label htmlFor={`ap-estado-${index}`} className={ESTILO_LABEL}>
                  Estado Clínico
                </label>
                <select
                  id={`ap-estado-${index}`}
                  value={fila.estadoClinico}
                  onChange={(e) => actualizarFila(index, { estadoClinico: e.target.value as AntecedentePersonalItem['estadoClinico'] })}
                  className={ESTILO_SELECT}
                >
                  <option value="active">Activo</option>
                  <option value="resolved">Resuelto / Curado</option>
                  <option value="remission">En Remisión</option>
                  <option value="recurrence">Recidiva</option>
                </select>
              </div>

              {/* Verificación (FHIR verificationStatus) */}
              <div className="w-full md:w-36 space-y-1">
                <label htmlFor={`ap-verificacion-${index}`} className={ESTILO_LABEL}>
                  Verificación
                </label>
                <select
                  id={`ap-verificacion-${index}`}
                  value={fila.verificacion}
                  onChange={(e) => actualizarFila(index, { verificacion: e.target.value as AntecedentePersonalItem['verificacion'] })}
                  className={ESTILO_SELECT}
                >
                  <option value="confirmed">Confirmado</option>
                  <option value="provisional">Provisional</option>
                  <option value="differential">Diferencial</option>
                </select>
              </div>

              {/* Edad de inicio (FHIR onsetAge) */}
              <div className="w-full md:w-24 space-y-1">
                <label htmlFor={`ap-edad-${index}`} className={ESTILO_LABEL}>
                  Edad Inicio
                </label>
                <input
                  id={`ap-edad-${index}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={fila.edadInicio ?? ''}
                  onChange={(e) => actualizarFila(index, { edadInicio: aEntero(e.target.value) })}
                  placeholder="Años"
                  className={clasesCampo(ESTILO_INPUT, 'text-center')}
                />
              </div>

              {!readOnly && filas.length > 1 && (
                <button
                  type="button"
                  aria-label="Eliminar antecedente"
                  onClick={() => eliminarFila(index)}
                  className="mt-5 h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}

          {!readOnly && (
            <button
              type="button"
              onClick={agregarFila}
              className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors w-fit"
            >
              <Plus size={14} /> Registrar otra patología
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
};

/** Antecedentes personales activos de folios anteriores: solo lectura, abierto por defecto. */
function AntecedentesPrevios({ antecedentes }: { antecedentes: AntecedentePrevio[] }) {
  if (antecedentes.length === 0) return null;
  return (
    <details open className="rounded-xl border border-primary/20 bg-primary/5">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold text-primary flex items-center gap-1.5">
        <History size={14} /> Antecedentes previos registrados ({antecedentes.length})
      </summary>
      <ul className="px-3 pb-3 space-y-1.5">
        {antecedentes.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-secondary">
            {a.codigoEstandar && (
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{a.codigoEstandar}</span>
            )}
            <span className="font-semibold text-primary">{a.descripcion}</span>
            {a.categoria !== 'PATOLOGICO' && (
              <span className="text-[10px] text-muted">{CATEGORIA_TEXTO[a.categoria] ?? a.categoria}</span>
            )}
            {a.fechaDiagnosticoAproximada && <span className="text-[10px] text-muted">Dx aprox. {a.fechaDiagnosticoAproximada}</span>}
            {a.numeroFolio !== null && <span className="ml-auto text-[10px] text-muted">Folio #{a.numeroFolio}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default AntecedentesPersonalesModule;
