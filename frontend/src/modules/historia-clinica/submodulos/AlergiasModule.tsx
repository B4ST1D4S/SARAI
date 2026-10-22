import React from 'react';
import { Plus, Trash2, Search, CheckCircle, History, AlertTriangle } from 'lucide-react';
import type { AlergiaItem, AlergiaPrevia, AlergiasData, CategoriaAlergia } from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_INPUT, ESTILO_LABEL, ESTILO_SELECT, clasesCampo } from '../components/common/campos';

export type { AlergiaItem, AlergiaPrevia, AlergiasData };

const nuevoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `alergia-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const alergiaVacia = (): AlergiaItem => ({
  id: nuevoId(),
  sustancia: '',
  categoria: 'medication',
  tipo: 'allergy',
  criticidad: 'low',
  severidad: '',
  manifestacion: '',
});

/** Una fila sin sustancia ni manifestación no cuenta como alergia registrada. */
export const filaEnBlanco = (a: AlergiaItem) => !a.sustancia.trim() && !a.manifestacion.trim();

/** Alergias realmente diligenciadas: lo que debe persistirse y validarse al cierre. */
export const alergiasDiligenciadas = (data: AlergiasData | null | undefined): AlergiaItem[] =>
  (data?.alergias ?? []).filter((a) => !filaEnBlanco(a));

/** Campos que le faltan a una fila iniciada; una fila en blanco no se marca. */
export function camposFaltantesAlergia(a: AlergiaItem | undefined): string[] {
  if (!a || filaEnBlanco(a)) return [];
  const faltantes: string[] = [];
  if (!a.sustancia.trim()) faltantes.push('sustancia');
  if (!a.categoria) faltantes.push('categoría');
  if (!a.tipo) faltantes.push('tipo');
  if (!a.criticidad) faltantes.push('criticidad');
  if (!a.severidad) faltantes.push('severidad');
  return faltantes;
}

/** Ejemplos de sustancia según la categoría FHIR; la sustancia sigue siendo texto libre. */
export const PLACEHOLDER_SUSTANCIA: Record<CategoriaAlergia, string> = {
  medication: 'Ej: Dipirona, Penicilina, Enalapril...',
  food: 'Ej: Maní, Mariscos, Huevo, Leche...',
  environment: 'Ej: Látex, Ácaros, Polen, Níquel...',
  biologic: 'Ej: Picadura de abeja, Veneno, Suero...',
};

/**
 * Solo la criticidad alta se pinta en rojo: si todas las filas lo están, el
 * acento deja de alertar (fatiga de alarma).
 */
const FILA_POR_CRITICIDAD: Record<AlergiaItem['criticidad'], string> = {
  high: 'border-danger/40 bg-danger/5',
  low: 'border-border bg-subtle/40',
  'unable-to-assess': 'border-border bg-subtle/40',
};

const CATEGORIA_PREVIA_TEXTO: Record<AlergiaPrevia['categoria'], string> = {
  MEDICAMENTO: 'Medicamento',
  ALIMENTO: 'Alimento',
  AMBIENTAL: 'Ambiental',
  BIOLOGICO: 'Biológico',
};

export const AlergiasModule: React.FC<SubmoduloProps<AlergiasData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const sinAlergias = Boolean(data.sinAlergiasConocidas);
  // Sin filas guardadas se muestra una fila en blanco derivada (id fijo: no se
  // remonta entre renders); entra al array al editarla.
  const filas = data.alergias?.length ? data.alergias : [{ ...alergiaVacia(), id: 'alergia-inicial' }];
  const previas = data.alergiasPrevias ?? [];
  // NKA contra un historial con alergias activas: inconsistencia que el médico debe verificar.
  const nkaEnConflicto = sinAlergias && previas.length > 0;

  // Toda mutación clona el array y lo emite completo; `data` nunca se modifica.
  const actualizarFila = (index: number, cambios: Partial<AlergiaItem>) =>
    onChange({ alergias: filas.map((fila, i) => (i === index ? { ...fila, ...cambios } : fila)) });

  const agregarFila = () => onChange({ alergias: [...filas, alergiaVacia()] });

  const eliminarFila = (index: number) => onChange({ alergias: filas.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4">
      {nkaEnConflicto && (
        <div
          role="alert"
          data-testid="alerta-nka-conflicto"
          className="flex items-start gap-2.5 p-3 rounded-xl border-2 border-danger/40 bg-danger/10 text-danger"
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold uppercase tracking-wide">Inconsistencia con el historial de alergias</p>
            <p>
              Se marcó «Sin alergias conocidas», pero el paciente tiene {previas.length}{' '}
              {previas.length === 1 ? 'alergia activa registrada' : 'alergias activas registradas'} en folios anteriores:{' '}
              <span className="font-semibold">{previas.map((a) => a.sustanciaAlergeno).join(', ')}</span>. Verifique con el
              paciente antes de firmar el folio.
            </p>
          </div>
        </div>
      )}

      <AlergiasPrevias alergias={previas} />

      {/* Negatividad explícita: No known allergy */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-subtle border border-border">
        <input
          type="checkbox"
          id="sin_alergias"
          checked={sinAlergias}
          onChange={(e) => onChange({ sinAlergiasConocidas: e.target.checked })}
          disabled={readOnly}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
        />
        <label htmlFor="sin_alergias" className="text-xs font-semibold text-secondary flex items-center gap-1.5 cursor-pointer">
          <CheckCircle size={15} className="text-primary" />
          Sin alergias ni intolerancias conocidas reportadas (No known allergy)
        </label>
      </div>

      {!sinAlergias && (
        <fieldset disabled={readOnly} className="space-y-3 min-w-0 border-0 p-0 m-0">
          {filas.map((fila, index) => {
            const faltantes = readOnly ? [] : camposFaltantesAlergia(fila);
            const esCritica = fila.criticidad === 'high';
            return (
              <div key={fila.id} className="space-y-1.5">
                <div
                  data-criticidad={fila.criticidad}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 items-start transition-colors ${FILA_POR_CRITICIDAD[fila.criticidad]}`}
                >
                  {/* Sustancia / Alérgeno */}
                  <div className="flex-1 w-full space-y-1">
                    <label htmlFor={`alergia-sustancia-${index}`} className={ESTILO_LABEL}>
                      Alérgeno / Sustancia
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-3 text-muted" />
                      <input
                        id={`alergia-sustancia-${index}`}
                        value={fila.sustancia}
                        onChange={(e) => actualizarFila(index, { sustancia: e.target.value })}
                        aria-invalid={faltantes.includes('sustancia') || undefined}
                        placeholder={PLACEHOLDER_SUSTANCIA[fila.categoria]}
                        className={clasesCampo(ESTILO_INPUT, 'pl-9')}
                      />
                    </div>
                  </div>

                  {/* Categoría (FHIR AllergyIntolerance.category) */}
                  <div className="w-full md:w-36 space-y-1">
                    <label htmlFor={`alergia-categoria-${index}`} className={ESTILO_LABEL}>
                      Categoría <span className="text-danger">*</span>
                    </label>
                    <select
                      id={`alergia-categoria-${index}`}
                      value={fila.categoria}
                      onChange={(e) => actualizarFila(index, { categoria: e.target.value as CategoriaAlergia })}
                      required
                      className={ESTILO_SELECT}
                    >
                      <option value="medication">Medicamento</option>
                      <option value="food">Alimento</option>
                      <option value="environment">Ambiental</option>
                      <option value="biologic">Biológico</option>
                    </select>
                  </div>

                  {/* Tipo */}
                  <div className="w-full md:w-36 space-y-1">
                    <label htmlFor={`alergia-tipo-${index}`} className={ESTILO_LABEL}>
                      Tipo <span className="text-danger">*</span>
                    </label>
                    <select
                      id={`alergia-tipo-${index}`}
                      value={fila.tipo}
                      onChange={(e) => actualizarFila(index, { tipo: e.target.value as AlergiaItem['tipo'] })}
                      required
                      className={ESTILO_SELECT}
                    >
                      <option value="allergy">Alergia</option>
                      <option value="intolerance">Intolerancia</option>
                    </select>
                  </div>

                  {/* Criticidad */}
                  <div className="w-full md:w-36 space-y-1">
                    <label htmlFor={`alergia-criticidad-${index}`} className={ESTILO_LABEL}>
                      Criticidad <span className="text-danger">*</span>
                    </label>
                    <select
                      id={`alergia-criticidad-${index}`}
                      value={fila.criticidad}
                      onChange={(e) => actualizarFila(index, { criticidad: e.target.value as AlergiaItem['criticidad'] })}
                      required
                      className={clasesCampo(ESTILO_SELECT, 'font-semibold', esCritica && '!text-danger !border-danger')}
                    >
                      <option value="high">Alta (Severa)</option>
                      <option value="low">Baja / Leve</option>
                      <option value="unable-to-assess">No evaluada</option>
                    </select>
                  </div>

                  {/* Severidad de la reacción: obligatoria en pantalla; una fila sin ella se conserva y se señala */}
                  <div className="w-full md:w-36 space-y-1">
                    <label htmlFor={`alergia-severidad-${index}`} className={ESTILO_LABEL}>
                      Severidad <span className="text-danger">*</span>
                    </label>
                    <select
                      id={`alergia-severidad-${index}`}
                      value={fila.severidad}
                      onChange={(e) => actualizarFila(index, { severidad: e.target.value as AlergiaItem['severidad'] })}
                      required
                      aria-invalid={faltantes.includes('severidad') || undefined}
                      className={clasesCampo(
                        ESTILO_SELECT,
                        fila.severidad === 'SEVERA' && 'font-semibold !text-danger',
                        faltantes.includes('severidad') && '!border-warning',
                      )}
                    >
                      <option value="">Seleccione...</option>
                      <option value="LEVE">Leve</option>
                      <option value="MODERADA">Moderada</option>
                      <option value="SEVERA">Severa / anafilaxia</option>
                    </select>
                  </div>

                  {/* Manifestación */}
                  <div className="flex-1 w-full space-y-1">
                    <label htmlFor={`alergia-manifestacion-${index}`} className={ESTILO_LABEL}>
                      Reacción / Síntoma
                    </label>
                    <input
                      id={`alergia-manifestacion-${index}`}
                      value={fila.manifestacion}
                      onChange={(e) => actualizarFila(index, { manifestacion: e.target.value })}
                      placeholder="Ej: Shock anafiláctico, Edema de glotis..."
                      className={ESTILO_INPUT}
                    />
                  </div>

                  {!readOnly && filas.length > 1 && (
                    <button
                      type="button"
                      aria-label="Eliminar alérgeno"
                      onClick={() => eliminarFila(index)}
                      className="mt-5 h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {faltantes.length > 0 && (
                  <p role="status" data-testid={`alergia-incompleta-${index}`} className="text-[11px] text-warning px-1">
                    Fila incompleta: falta {faltantes.join(', ')}.
                  </p>
                )}
              </div>
            );
          })}

          {!readOnly && (
            <button
              type="button"
              onClick={agregarFila}
              className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors w-fit"
            >
              <Plus size={14} /> Adicionar alérgeno
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
};

/** Alergias activas de folios anteriores: solo lectura, abierto por defecto. */
function AlergiasPrevias({ alergias }: { alergias: AlergiaPrevia[] }) {
  if (alergias.length === 0) return null;
  return (
    <details open className="rounded-xl border border-warning/30 bg-warning/5">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold text-warning flex items-center gap-1.5">
        <History size={14} /> Alergias previas registradas ({alergias.length})
      </summary>
      <ul className="px-3 pb-3 space-y-1.5">
        {alergias.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-secondary">
            <span className="font-semibold text-primary">{a.sustanciaAlergeno}</span>
            <span className="text-[10px] text-muted">
              {CATEGORIA_PREVIA_TEXTO[a.categoria] ?? a.categoria} · {a.tipo === 'INTOLERANCIA' ? 'Intolerancia' : 'Alergia'}
            </span>
            {a.criticidad === 'ALTA' && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-danger/10 text-danger">Criticidad alta</span>
            )}
            {a.manifestacion && <span className="text-[11px] text-muted">— {a.manifestacion}</span>}
            {a.numeroFolio !== null && <span className="ml-auto text-[10px] text-muted">Folio #{a.numeroFolio}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default AlergiasModule;
