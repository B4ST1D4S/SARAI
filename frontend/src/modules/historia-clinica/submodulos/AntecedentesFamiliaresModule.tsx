import React from 'react';
import { Plus, Trash2, Search, CheckCircle } from 'lucide-react';
import type {
  AntecedenteFamiliarItem,
  AntecedentesFamiliaresData,
  ParentescoFamiliar,
} from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_INPUT, ESTILO_LABEL, ESTILO_SELECT, clasesCampo } from '../components/common/campos';

export type { AntecedenteFamiliarItem, AntecedentesFamiliaresData };

const nuevoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `familiar-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const antecedenteFamiliarVacio = (): AntecedenteFamiliarItem => ({
  id: nuevoId(),
  parentesco: 'MTH',
  condicion: '',
  fallecido: false,
});

/** Antecedentes realmente diligenciados: lo que debe persistirse y validarse al cierre. */
export const antecedentesFamiliaresDiligenciados = (data: AntecedentesFamiliaresData | null | undefined) =>
  (data?.antecedentesFamiliares ?? []).filter((a) => a.condicion.trim() !== '');

/** '' del input → undefined (sin dato). */
const aEntero = (texto: string): number | undefined => (texto.trim() === '' ? undefined : Number.parseInt(texto, 10));

/** Parentesco con códigos HL7 v3 RoleCode. */
const PARENTESCOS: { valor: ParentescoFamiliar; texto: string }[] = [
  { valor: 'MTH', texto: 'Madre (MTH)' },
  { valor: 'FTH', texto: 'Padre (FTH)' },
  { valor: 'BRO', texto: 'Hermano (BRO)' },
  { valor: 'SIS', texto: 'Hermana (SIS)' },
  { valor: 'GRMTH', texto: 'Abuela (GRMTH)' },
  { valor: 'GRFTH', texto: 'Abuelo (GRFTH)' },
  { valor: 'AUNT', texto: 'Tía (AUNT)' },
  { valor: 'UNC', texto: 'Tío (UNC)' },
];

export const AntecedentesFamiliaresModule: React.FC<SubmoduloProps<AntecedentesFamiliaresData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const sinFamiliares = Boolean(data.sinAntecedentesFamiliares);
  // Sin filas guardadas se muestra una fila en blanco derivada (id fijo); entra al array al editarla.
  const filas = data.antecedentesFamiliares?.length
    ? data.antecedentesFamiliares
    : [{ ...antecedenteFamiliarVacio(), id: 'familiar-inicial' }];

  // Toda mutación clona el array y lo emite completo; `data` nunca se modifica.
  const actualizarFila = (index: number, cambios: Partial<AntecedenteFamiliarItem>) =>
    onChange({ antecedentesFamiliares: filas.map((f, i) => (i === index ? { ...f, ...cambios } : f)) });
  const agregarFila = () => onChange({ antecedentesFamiliares: [...filas, antecedenteFamiliarVacio()] });
  const eliminarFila = (index: number) => onChange({ antecedentesFamiliares: filas.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4">
      {/* Negatividad explícita */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-subtle border border-border">
        <input
          type="checkbox"
          id="sin_antecedentes_fam"
          checked={sinFamiliares}
          onChange={(e) => onChange({ sinAntecedentesFamiliares: e.target.checked })}
          disabled={readOnly}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
        />
        <label htmlFor="sin_antecedentes_fam" className="text-xs font-semibold text-secondary flex items-center gap-1.5 cursor-pointer">
          <CheckCircle size={15} className="text-primary" />
          Sin antecedentes patológicos familiares de relevancia conocidos
        </label>
      </div>

      {!sinFamiliares && (
        <fieldset disabled={readOnly} className="space-y-3 min-w-0 border-0 p-0 m-0">
          {filas.map((fila, index) => (
            <div key={fila.id} className="p-4 rounded-xl border border-border bg-subtle/40 flex flex-col md:flex-row gap-3 items-start">
              {/* Parentesco */}
              <div className="w-full md:w-44 space-y-1">
                <label htmlFor={`af-parentesco-${index}`} className={ESTILO_LABEL}>
                  Parentesco
                </label>
                <select
                  id={`af-parentesco-${index}`}
                  value={fila.parentesco}
                  onChange={(e) => actualizarFila(index, { parentesco: e.target.value as ParentescoFamiliar })}
                  className={ESTILO_SELECT}
                >
                  {PARENTESCOS.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.texto}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condición / Enfermedad */}
              <div className="flex-1 w-full space-y-1">
                <label htmlFor={`af-condicion-${index}`} className={ESTILO_LABEL}>
                  Patología / Cáncer / Trastorno
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-muted" />
                  <input
                    id={`af-condicion-${index}`}
                    value={fila.condicion}
                    onChange={(e) => actualizarFila(index, { condicion: e.target.value })}
                    placeholder="Ej: Diabetes Mellitus tipo 2, Cáncer gástrico..."
                    className={clasesCampo(ESTILO_INPUT, 'pl-9')}
                  />
                </div>
              </div>

              {/* Edad aproximada de diagnóstico */}
              <div className="w-full md:w-28 space-y-1">
                <label htmlFor={`af-edad-${index}`} className={ESTILO_LABEL}>
                  Edad Diagnóstico
                </label>
                <input
                  id={`af-edad-${index}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={fila.edadDiagnostico ?? ''}
                  onChange={(e) => actualizarFila(index, { edadDiagnostico: aEntero(e.target.value) })}
                  placeholder="Años"
                  className={clasesCampo(ESTILO_INPUT, 'text-center')}
                />
              </div>

              {/* Estado vital */}
              <div className="w-full md:w-28 md:pt-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`af-fallecido-${index}`}
                  checked={fila.fallecido}
                  onChange={(e) => actualizarFila(index, { fallecido: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor={`af-fallecido-${index}`} className="text-xs text-secondary cursor-pointer">
                  Fallecido
                </label>
              </div>

              {!readOnly && filas.length > 1 && (
                <button
                  type="button"
                  aria-label="Eliminar antecedente familiar"
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
              <Plus size={14} /> Registrar otro familiar
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
};

export default AntecedentesFamiliaresModule;
